import type { ContractCheck } from "../context";

// Spec table: a heading sits closer to what follows than to what precedes.
// First or last sibling means nothing to compare, so no violation. A sibling
// that overlaps the heading vertically sits beside it in a horizontal run
// (lead | heading | aside), not above or below it, so it counts as absent
//
export const check: ContractCheck<"closer-below"> = (ctx, box) => {
  const sibs = ctx.siblingsOf(box.id);
  const at = sibs.findIndex((s) => s.id === box.id);
  const top = box.rect.y;
  const bottom = box.rect.y + box.rect.h;
  const before = sibs[at - 1];
  const after = sibs[at + 1];
  const prev =
    before && before.rect.y + before.rect.h <= top ? before : undefined;
  const next = after && after.rect.y >= bottom ? after : undefined;
  if (at < 0 || !prev || !next) return [];
  const gapBelow = next.rect.y - (box.rect.y + box.rect.h);
  const gapAbove = box.rect.y - (prev.rect.y + prev.rect.h);
  if (gapBelow < gapAbove) return [];
  return [
    {
      part: box.part ?? "",
      kind: "closer-below",
      boxIds: [box.id, prev.id, next.id],
      message: `gap below is ${gapBelow}px, not smaller than the ${gapAbove}px above`,
    },
  ];
};
