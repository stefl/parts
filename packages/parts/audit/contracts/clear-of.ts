import type { Box } from "../../registry/types";
import { DEFAULT_TOLERANCE, type ContractCheck } from "../context";

// A part keeps clear of the `of` parts beside it (from a design review of
// 2026-10-28): a card on the right of a two-column screen
// starts at least `min` px past the right edge of any queue row next to it,
// so a selected row's fill never runs up to the card. "Beside" means the two
// share some vertical span and neither holds the other; a row stacked above
// or below the card (the phone layout) is not beside it. The first contract
// kind that reads a sibling's box rather than the part's own or its family's.
export const check: ContractCheck<"clear-of"> = (ctx, box, contract) => {
  const tol = contract.tolerance ?? DEFAULT_TOLERANCE;
  const mine = ctx.descendantsOf(box.id);
  const inside = new Set(mine.map((b) => b.id));
  const top = box.rect.y;
  const bottom = box.rect.y + box.rect.h;
  let worst: { other: Box; clearance: number } | undefined;
  for (const other of ctx.boxes) {
    if (other.part !== contract.of || other.id === box.id) continue;
    if (inside.has(other.id) || holds(ctx, other, box.id)) continue;
    const oTop = other.rect.y;
    const oBottom = other.rect.y + other.rect.h;
    if (oBottom <= top || oTop >= bottom) continue;
    // Positive when the two are apart, negative when they overlap across.
    const clearance = Math.max(
      box.rect.x - (other.rect.x + other.rect.w),
      other.rect.x - (box.rect.x + box.rect.w),
    );
    if (worst === undefined || clearance < worst.clearance)
      worst = { other, clearance };
  }
  if (worst === undefined || worst.clearance >= contract.min - tol) return [];
  return [
    {
      part: box.part ?? "",
      kind: "clear-of" as const,
      boxIds: [box.id, worst.other.id],
      message: `${worst.clearance}px clear of the ${contract.of} beside it, not the ${contract.min}px it keeps`,
    },
  ];
};

/** Whether `other` is a strict ancestor of the box with `id`. */
function holds(
  ctx: Parameters<ContractCheck>[0],
  other: Box,
  id: number,
): boolean {
  return ctx.descendantsOf(other.id).some((b) => b.id === id);
}
