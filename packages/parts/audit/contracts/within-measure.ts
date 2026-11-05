import { DEFAULT_TOLERANCE, type ContractCheck } from "../context";

// A line of prose is no wider than the reading measure, 64ch of its own
// font. The rule had lived in a design sheet and in
// `max-w-measure` by hand, so a description that left the class off ran the
// width of the page and nothing caught it (ruled 2026-11-01). The
// walk records `ch` on each declared part; a box with none is not judged.
export const check: ContractCheck<"within-measure"> = (_ctx, box, contract) => {
  if (box.ch === undefined) return [];
  const chars = contract.chars ?? 64;
  const tol = contract.tolerance ?? DEFAULT_TOLERANCE;
  if (box.rect.w <= chars * box.ch + tol) return [];
  return [
    {
      part: box.part ?? "",
      kind: "within-measure",
      boxIds: [box.id],
      message: `width ${box.rect.w}px is about ${Math.round(box.rect.w / box.ch)} characters, past the ${chars}ch measure`,
    },
  ];
};
