import type { Box } from "../../registry/types";
import { DEFAULT_TOLERANCE, type ContractCheck } from "../context";

// Nothing inside a part draws past its left or right edge (ruled
// 2026-10-31): on one board the line under a title was sized to its text,
// so it never truncated and drew across the three columns to its right. A descendant under a box that clips (the part's own included) is
// not drawn past that box, so it is not checked; the clipping box itself
// still is, since its own edges are what shows. Across only: a row's height
// has its own contracts.
export const check: ContractCheck<"no-overflow"> = (ctx, box, contract) => {
  if (box.clips === true) return [];
  const tol = contract.tolerance ?? DEFAULT_TOLERANCE;
  const left = box.rect.x;
  const right = box.rect.x + box.rect.w;
  let worst: { other: Box; past: number } | undefined;
  const visit = (id: number): void => {
    for (const child of ctx.childrenOf(id)) {
      const past = Math.max(
        left - child.rect.x,
        child.rect.x + child.rect.w - right,
      );
      if (worst === undefined || past > worst.past) {
        worst = { other: child, past };
      }
      if (child.clips !== true) visit(child.id);
    }
  };
  visit(box.id);
  if (worst === undefined || worst.past <= tol) return [];
  return [
    {
      part: box.part ?? "",
      kind: "no-overflow" as const,
      boxIds: [box.id, worst.other.id],
      message: `something inside draws ${Math.round(worst.past * 100) / 100}px past its edge`,
    },
  ];
};
