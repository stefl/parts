import { DEFAULT_TOLERANCE, type ContractCheck } from "../context";

// A mark sits on the centre line of the row it belongs to, whatever else the
// row holds (ruled 2026-10-28). An inline-flex glyph once dropped about
// 4px below its row's text because it sat on the baseline; this contract is
// what would have caught it. With no `within` ancestor there is nothing to
// centre against, so the part passes.
export const check: ContractCheck<"centred-in"> = (ctx, box, contract) => {
  // A mark inside a text line is centred with its line, not its row; the row
  // rule is for the mark column (coordinator ruling, 2026-10-28).
  if (box.attrs.inline === "true") return [];
  const outer = ctx.nearestAncestor(box.id, contract.within);
  if (outer === undefined) return [];
  const tol = contract.tolerance ?? DEFAULT_TOLERANCE;
  const mine = box.rect.y + box.rect.h / 2;
  const theirs = outer.rect.y + outer.rect.h / 2;
  if (Math.abs(mine - theirs) <= tol) return [];
  return [
    {
      part: box.part ?? "",
      kind: "centred-in" as const,
      boxIds: [box.id, outer.id],
      message: `vertical centre ${mine}px is not the centre of its ${contract.within} (${theirs}px)`,
    },
  ];
};
