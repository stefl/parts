import { DEFAULT_TOLERANCE, type ContractCheck } from "../context";

// Spec table: a list's rows come in at most two heights. A height within
// `tolerance` of a height already seen joins that group, so sub-pixel noise
// does not count as a variant but a real 1px step does once tolerance is
// tighter than that.
export const check: ContractCheck<"uniform-height"> = (ctx, box, contract) => {
  const max = contract.max ?? 2;
  const tol = contract.tolerance ?? DEFAULT_TOLERANCE;
  const items = ctx.descendantsOf(box.id).filter((d) => d.part === contract.of);
  const heights: number[] = [];
  for (const d of items) {
    if (!heights.some((h) => Math.abs(h - d.rect.h) <= tol)) {
      heights.push(d.rect.h);
    }
  }
  heights.sort((a, b) => a - b);
  if (heights.length <= max) return [];
  return [
    {
      part: box.part ?? "",
      kind: "uniform-height",
      boxIds: [box.id, ...items.map((d) => d.id)],
      message: `${contract.of} has ${heights.length} distinct heights (${heights.join(", ")}px), at most ${max} allowed`,
    },
  ];
};
