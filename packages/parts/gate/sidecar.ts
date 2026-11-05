// Pure sidecar helpers for the rendered gate. Kept apart from
// commands.ts so the jsdom unit project can import them without touching the
// node-only fs and vitest/node modules that file loads.
import path from "node:path";

/** One story's recorded counts. Keyed by story export name in the sidecar. */
export type PartsBaselineEntry = { violations: number; unclassified: number };
export type PartsBaseline = Record<string, PartsBaselineEntry>;

/** Button.stories.tsx becomes Button.stories.parts.json beside it. Storybook
 * reports the story path relative to the project root, so resolve against it. */
export function baselinePathFor(root: string, storyFilePath: string): string {
  const abs = path.resolve(root, storyFilePath);
  const dir = path.dirname(abs);
  const base = path.basename(abs).replace(/\.tsx?$/, "");
  return path.join(dir, `${base}.parts.json`);
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v !== null && typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>).toSorted(
      ([a], [b]) => a.localeCompare(b, "en"),
    );
    return Object.fromEntries(entries.map(([k, val]) => [k, sortKeys(val)]));
  }
  return v;
}

/** Sorted keys at every level so the file diffs cleanly and never clashes on
 * insertion order. */
export function stableStringify(value: unknown): string {
  return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
}
