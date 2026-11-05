import { DEFAULT_TOLERANCE, type ContractCheck } from "../context";

const DEFAULT_SCALE = [0, 4, 8, 12, 16, 24, 32] as const;

// Spec table: gaps between consecutive children are steps of the spacing
// scale. Overlap gives a negative gap, which is never on the scale.
export const check: ContractCheck<"gaps-on-scale"> = (ctx, box, contract) => {
  const tol = contract.tolerance ?? DEFAULT_TOLERANCE;
  const scale = contract.scale ?? DEFAULT_SCALE;
  const kids = ctx
    .childrenOf(box.id)
    .toSorted((a, b) => a.rect.y - b.rect.y || a.id - b.id);
  const out = [];
  for (let i = 1; i < kids.length; i++) {
    const prev = kids[i - 1];
    const next = kids[i];
    if (!prev || !next) continue;
    const gap = next.rect.y - (prev.rect.y + prev.rect.h);
    if (scale.some((s) => Math.abs(gap - s) <= tol)) continue;
    out.push({
      part: box.part ?? "",
      kind: "gaps-on-scale" as const,
      boxIds: [box.id, prev.id, next.id],
      message: `gap of ${gap}px between children ${prev.id} and ${next.id} is not on the scale ${scale.join("/")}`,
    });
  }
  return out;
};
