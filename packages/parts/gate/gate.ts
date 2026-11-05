// The decision half of the rendered gate: given the
// measured boxes and the story's recorded baseline, say whether the story
// passes and what to record. Pure so it can be unit tested without a browser;
// the preview hook only collects, calls this, and throws or writes.
import { audit, countUnclassified } from "../audit/audit";
import type { Box, PartDefinition, Violation } from "../registry/types";
import type { PartsBaselineEntry } from "./sidecar";

export type GateInput = Readonly<{
  boxes: readonly Box[];
  parts: Readonly<Record<string, PartDefinition>>;
  /** parameters.parts.allow: `{ "part:kind": "<reason>" }`, the
   * violations to leave out of the count, each with why. Typed
   * loosely because story parameters are untyped; readAllow checks it. */
  allow?: unknown;
  /** The recorded numbers for this story, or undefined when none yet. */
  entry: PartsBaselineEntry | undefined;
  /** PARTS_UPDATE=1. */
  update: boolean;
}>;

export type GateResult = Readonly<{
  violations: readonly Violation[];
  measured: PartsBaselineEntry;
  /** Set when the story fails the gate. */
  error?: string;
  /** Set when the sidecar entry should be (re)written. */
  write?: PartsBaselineEntry;
}>;

const MAX_LISTED = 20;

/** What to do when a story's numbers are not zero. */
export const ZERO_HINT =
  "a story's entry must be violations=0 unclassified=0: give each unclassified box its part " +
  '(data-part="..." or a primitive that declares one), fix each violation, or, for a violation that cannot be fixed yet, ' +
  'add parameters.parts.allow: { "part:kind": "<why it is an exception>" } to the story';

/**
 * Reads parameters.parts.allow. The only form is a record of "part:kind"
 * to a written reason; the older bare array, an empty reason or a key that
 * is not "part:kind" is a problem, so an exception cannot land unexplained.
 */
export function readAllow(raw: unknown): {
  allow: Set<string>;
  problems: string[];
} {
  const allow = new Set<string>();
  const problems: string[] = [];
  if (raw === undefined) return { allow, problems };
  if (Array.isArray(raw) || raw === null || typeof raw !== "object") {
    problems.push(
      'parameters.parts.allow must be { "part:kind": "<reason>" }, one written reason per allowed violation',
    );
    return { allow, problems };
  }
  for (const [key, reason] of Object.entries(raw)) {
    if (!/^[a-z][\w.-]*:[a-z][\w-]*$/.test(key)) {
      problems.push(`parameters.parts.allow key "${key}" is not "part:kind"`);
    } else if (typeof reason !== "string" || !/\w/.test(reason)) {
      problems.push(
        `parameters.parts.allow["${key}"] has no reason: write why this violation is an exception`,
      );
    } else {
      allow.add(key);
    }
  }
  return { allow, problems };
}

export function evaluateStory(input: GateInput): GateResult {
  const { allow, problems } = readAllow(input.allow);
  const violations = audit(input.boxes, input.parts).filter(
    (v) => !allow.has(`${v.part}:${v.kind}`),
  );
  const measured: PartsBaselineEntry = {
    violations: violations.length,
    unclassified: countUnclassified(input.boxes, input.parts),
  };
  const { entry } = input;

  const failureMessage = (): string => {
    const listed = violations
      .slice(0, MAX_LISTED)
      .map((v) => `  ${v.part} ${v.kind}: ${v.message}`);
    const more =
      violations.length > MAX_LISTED
        ? [`  ... and ${violations.length - MAX_LISTED} more`]
        : [];
    const base =
      entry === undefined
        ? "no baseline recorded for this story"
        : `baseline violations=${entry.violations} unclassified=${entry.unclassified}`;
    // The hook cannot learn its own story file path, so the hint names the
    // placeholder as an instruction rather than printing a bare "<story file>".
    return [
      `Rendered parts gate: measured violations=${measured.violations} unclassified=${measured.unclassified}; ${base}.`,
      ...listed,
      ...more,
      ...(measured.violations > 0 || measured.unclassified > 0
        ? [ZERO_HINT]
        : []),
      "then record on CI with the parts:update workflow, or locally with PARTS_UPDATE=1 vitest run <path to this story file>",
    ].join("\n");
  };

  if (problems.length > 0) {
    return {
      violations,
      measured,
      error: ["Rendered parts gate:", ...problems].join("\n"),
    };
  }

  const isZero = measured.violations === 0 && measured.unclassified === 0;

  const exceeds =
    entry !== undefined &&
    (measured.violations > entry.violations ||
      measured.unclassified > entry.unclassified);

  if (input.update) {
    // A new entry holds zero: recording a new story "as
    // measured" let one land with a non-zero baseline that only a careful
    // reviewer would notice, so a story that measures above zero gets no
    // entry and fails until it is fixed or its violations are allowed.
    if (entry === undefined && !isZero) {
      return { violations, measured, error: failureMessage() };
    }
    // Down only once an entry exists: a ratchet that PARTS_UPDATE can raise
    // would not be one.
    const next: PartsBaselineEntry =
      entry === undefined
        ? measured
        : {
            violations: Math.min(entry.violations, measured.violations),
            unclassified: Math.min(entry.unclassified, measured.unclassified),
          };
    const changed =
      entry === undefined ||
      next.violations !== entry.violations ||
      next.unclassified !== entry.unclassified;
    // A story that now exceeds a recorded entry still fails in update mode,
    // otherwise parts:update would hide a regression behind a green run.
    return {
      violations,
      measured,
      ...(changed ? { write: next } : {}),
      ...(exceeds ? { error: failureMessage() } : {}),
    };
  }

  if (entry !== undefined && !exceeds) return { violations, measured };
  return { violations, measured, error: failureMessage() };
}

/**
 * A story with `parameters.parts.skip` renders nothing the gate can measure,
 * but the static check wants every story to have a sidecar key, so in
 * record mode a skipped story is written as zero violations, zero
 * unclassified. In compare mode nothing is written and the story passes.
 */
export function evaluateSkipped(
  entry: PartsBaselineEntry | undefined,
  update: boolean,
): { write?: PartsBaselineEntry } {
  if (!update || entry !== undefined) return {};
  return { write: { violations: 0, unclassified: 0 } };
}

/** Sidecar key for a story: the part of the id after "--" (the kebab-cased
 * export name). Storybook gives the hook no export name under the vitest
 * runner, only this id, and kebab-casing is stable per export. */
export function storyKey(storyId: string): string {
  const i = storyId.indexOf("--");
  return i === -1 ? storyId : storyId.slice(i + 2);
}
