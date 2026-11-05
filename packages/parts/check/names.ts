// Static checks over source and sidecars, each a pure function over text so
// it can be unit tested. run.ts wires them to a folder.
import { storyKey } from "../gate/gate";
import type { PartDefinition } from "../registry/types";

export type NameUse = Readonly<{ line: number; name: string }>;

const escape = (s: string): string =>
  s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/** Every literal part name in a source file, with its line: the attribute
 * form (`data-part="row"`, `data-part={"row"}`) and the helper form
 * (`part("row")`). Dynamic names (a variable, a template) are not matched;
 * that errs towards missing. */
export function findPartNames(
  source: string,
  attribute = "data-part",
): NameUse[] {
  const attr = new RegExp(
    String.raw`${escape(attribute)}\s*=\s*(?:"([^"]+)"|'([^']+)'|\{\s*"([^"]+)"\s*\})`,
    "g",
  );
  const call = /\bpart\(\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;
  const found: NameUse[] = [];
  for (const re of [attr, call]) {
    for (const m of source.matchAll(re)) {
      const name = m[1] ?? m[2] ?? m[3];
      if (name === undefined) continue;
      const line = source.slice(0, m.index).split("\n").length;
      found.push({ line, name });
    }
  }
  return found.toSorted((a, b) => a.line - b.line);
}

export function unknownNames(
  uses: readonly NameUse[],
  known: readonly string[],
): NameUse[] {
  const set = new Set(known);
  return uses.filter((u) => !set.has(u.name));
}

/** The part names one contract points at, with the field each sits in. */
function contractReferences(
  contract: PartDefinition["contracts"][number],
): [string, string][] {
  switch (contract.kind) {
    case "aligns-left":
      return [
        ["with", contract.with],
        ["scope", contract.scope],
        ...(contract.outside === undefined
          ? []
          : [["outside", contract.outside] as [string, string]]),
      ];
    case "centred-in":
      return [["within", contract.within]];
    case "uniform-height":
    case "clear-of":
      return [["of", contract.of]];
    default:
      return [];
  }
}

/** Every part name the registry mentions in within/contains/with/scope/of
 * that is not registered and not one of the ARIA words a registry allows. */
export function danglingReferences(
  defs: readonly PartDefinition[],
  known: readonly string[],
  ariaNames: ReadonlySet<string> = new Set(),
): string[] {
  const set = new Set(known);
  const problems: string[] = [];
  for (const def of defs) {
    const refs: [string, string][] = [
      ...def.within.map((r): [string, string] => ["within", r]),
      ...def.contains.map((r): [string, string] => ["contains", r]),
      ...def.contracts.flatMap(contractReferences),
    ];
    for (const [field, ref] of refs) {
      if (!set.has(ref) && !ariaNames.has(ref)) {
        problems.push(
          `${def.name}: ${field} names "${ref}", which is not a registered part`,
        );
      }
    }
  }
  return problems;
}

/** `UuidKey` becomes `uuid-key`, the way Storybook builds the id suffix. */
export function kebab(exportName: string): string {
  return exportName
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replaceAll(/([a-zA-Z])([0-9])/g, "$1 $2")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

const STORY_EXPORT = /^export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*[:=]/gm;

/** Sidecar keys for the story exports in a stories file: `export const
 * Name = ...` or `export const Name: Story`. Lowercase exports (helpers)
 * and types are not stories. */
export function storyKeys(source: string): string[] {
  const keys: string[] = [];
  for (const m of source.matchAll(STORY_EXPORT)) {
    keys.push(storyKey(`story--${kebab(m[1] as string)}`));
  }
  return keys;
}

/** Story keys with no entry in the sidecar (null when there is no file). */
export function missingKeys(
  keys: readonly string[],
  sidecar: Readonly<Record<string, unknown>> | null,
): string[] {
  return keys.filter((k) => sidecar === null || !(k in sidecar));
}

export type SidecarEntry = Readonly<{
  violations?: unknown;
  unclassified?: unknown;
}>;

/** Sidecar entries that are not exactly zero violations, zero unclassified,
 * as `"key" records violations=N unclassified=M`. A project that has swept
 * every story to zero turns this on so a non-zero entry cannot land
 * unnoticed; a project mid-sweep leaves it off. */
export function nonZeroEntries(
  sidecar: Readonly<Record<string, SidecarEntry>>,
): string[] {
  return Object.entries(sidecar)
    .filter(([, e]) => e.violations !== 0 || e.unclassified !== 0)
    .map(
      ([key, e]) =>
        `"${key}" records violations=${String(e.violations)} unclassified=${String(e.unclassified)}`,
    );
}

const ALLOW_ARRAY = /\bparts\s*:\s*\{[^}]*?\ballow\s*:\s*\[/g;
// A "part:kind" key in any quote style given a value with no word in it
// (empty or only spaces), the same test readAllow applies at run time.
const EMPTY_REASON =
  /(["'`])[a-z][\w.-]*:[a-z][\w-]*\1\s*:\s*(["'`])[^\w"'`\n]*\2/g;

/** Lines in a stories file whose parts.allow has no written reason: the
 * bare array form, or a "part:kind" key given an empty string. */
export function unreasonedAllows(source: string): number[] {
  const lines: number[] = [];
  for (const re of [ALLOW_ARRAY, EMPTY_REASON]) {
    for (const m of source.matchAll(re)) {
      lines.push(source.slice(0, m.index).split("\n").length);
    }
  }
  return lines.toSorted((a, b) => a - b);
}
