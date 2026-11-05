import type {
  Box,
  Contract,
  PartDefinition,
  Violation,
} from "../registry/types";
import { buildContext, type ContractCheck } from "./context";
import { checkGrammar } from "./grammar";
import { CHECKS } from "./kinds";

/** A guarded contract applies only where the box carries the attribute, or
 * with `not`, where it does not. */
function guardAllows(when: Contract["when"], box: Box): boolean {
  if (!when) return true;
  const actual = box.attrs[when.attr];
  const values: readonly string[] =
    typeof when.value === "string" ? [when.value] : when.value;
  const matches = actual !== undefined && values.includes(actual);
  return when.not ? !matches : matches;
}

/**
 * Run every registered part's contracts over a rendered box tree
 * Pure: boxes in, violations out.
 *
 * A box whose part is not in `parts` is skipped with no violation: it has no
 * definition, so there is no contract to take a kind from. Naming drift is the
 * manifest test's job (every referenced part is registered), not this audit's.
 */
export function audit(
  boxes: readonly Box[],
  parts: Readonly<Record<string, PartDefinition>>,
): readonly Violation[] {
  const ctx = buildContext(boxes);
  const out: Violation[] = [];
  for (const box of ctx.boxes) {
    if (box.part === null) continue;
    const def = Object.hasOwn(parts, box.part) ? parts[box.part] : undefined;
    if (!def) continue;
    for (const contract of def.contracts) {
      if (!guardAllows(contract.when, box)) continue;
      const check = CHECKS[contract.kind] as ContractCheck;
      out.push(...check(ctx, box, contract));
    }
    // The grammar is read from every definition, with or without contracts.
    out.push(...checkGrammar(ctx, box, def, parts));
  }
  return out;
}

/** Elements with layout classes (margin, padding, gap, space) but no
 * registered part: the baseline counts these so new unclassified layout
 * cannot creep in. A part name that is not in `parts` counts as unclassified
 * too, since audit() skips it and nothing else would flag it. */
export function countUnclassified(
  boxes: readonly Box[],
  parts: Readonly<Record<string, PartDefinition>>,
): number {
  return boxes.filter(
    (b) =>
      b.hasLayoutClasses && (b.part === null || !Object.hasOwn(parts, b.part)),
  ).length;
}
