import { DEFAULT_TOLERANCE, type ContractCheck } from "../context";

// Spec table: controls and chips take one of a few measured heights.
export const check: ContractCheck<"height-in"> = (_ctx, box, contract) => {
  const tol = contract.tolerance ?? DEFAULT_TOLERANCE;
  if (contract.values.some((v) => Math.abs(box.rect.h - v) <= tol)) return [];
  return [
    {
      part: box.part ?? "",
      kind: "height-in",
      boxIds: [box.id],
      message: `height is ${box.rect.h}px, expected one of ${contract.values.join(", ")}`,
    },
  ];
};
