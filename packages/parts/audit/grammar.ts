import type {
  Box,
  GrammarKind,
  PartDefinition,
  Violation,
} from "../registry/types";
import type { AuditContext } from "./context";

// The grammar: what may live in what. Unlike a contract,
// the grammar is not listed on a part; it is read from every registered
// part's own `within`, `contains` and `level`, so a new part is checked the
// day it is registered.

const violation = (
  box: Box,
  kind: GrammarKind,
  offender: Box,
  message: string,
): Violation => ({
  part: box.part ?? "",
  kind,
  boxIds: [box.id, offender.id],
  message,
});

function checkWithin(
  ctx: AuditContext,
  box: Box,
  def: PartDefinition,
): readonly Violation[] {
  // A part with no part around it passes, since a story may render it alone.
  if (def.within.length === 0) return [];
  const parent = ctx.nearestPartAncestor(box.id);
  if (!parent?.part || def.within.includes(parent.part)) return [];
  return [
    violation(
      box,
      "within",
      parent,
      `${box.part} sits inside ${parent.part}, but may only live inside ${def.within.join(", ")}`,
    ),
  ];
}

// Names in `contains` that are not registered parts (the ARIA allowlist) are
// never matched by a box, which is fine.
function checkContains(
  box: Box,
  def: PartDefinition,
  inside: readonly Box[],
): readonly Violation[] {
  if (def.contains.length === 0) return [];
  return inside
    .filter((c) => c.part !== null && !def.contains.includes(c.part))
    .map((c) =>
      violation(
        box,
        "contains",
        c,
        `${box.part} holds ${c.part}, but may only hold ${def.contains.join(", ")}`,
      ),
    );
}

// A higher level number inside a level 1 to 3 part must be declared in its
// contains. Level 0 is chrome and exempt; unregistered descendants have no
// level to compare. A non-empty contains already reports every undeclared
// descendant, so it is skipped here to count one fault once.
function checkLevel(
  box: Box,
  def: PartDefinition,
  inside: readonly Box[],
  parts: Readonly<Record<string, PartDefinition>>,
): readonly Violation[] {
  if (def.level < 1 || def.contains.length > 0) return [];
  const out: Violation[] = [];
  for (const c of inside) {
    const childDef =
      c.part !== null && Object.hasOwn(parts, c.part)
        ? parts[c.part]
        : undefined;
    if (!childDef || childDef.level <= def.level) continue;
    out.push(
      violation(
        box,
        "level",
        c,
        `${c.part} (level ${childDef.level}) sits inside ${box.part} (level ${def.level}) without being declared in its contains`,
      ),
    );
  }
  return out;
}

export function checkGrammar(
  ctx: AuditContext,
  box: Box,
  def: PartDefinition,
  parts: Readonly<Record<string, PartDefinition>>,
): readonly Violation[] {
  const inside = ctx.nearestPartDescendants(box.id);
  return [
    ...checkWithin(ctx, box, def),
    ...checkContains(box, def, inside),
    ...checkLevel(box, def, inside, parts),
  ];
}
