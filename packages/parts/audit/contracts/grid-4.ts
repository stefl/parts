import { DEFAULT_TOLERANCE, type ContractCheck } from "../context";

// Spec table: a row's height is a multiple of 4, within tolerance. The
// remainder can sit just under 4 (e.g. 39.9), so both ends are tested.
export const check: ContractCheck<"grid-4"> = (_ctx, box, contract) => {
  const tol = contract.tolerance ?? DEFAULT_TOLERANCE;
  const rem = ((box.rect.h % 4) + 4) % 4;
  if (rem <= tol || 4 - rem <= tol) return [];
  return [
    {
      part: box.part ?? "",
      kind: "grid-4",
      boxIds: [box.id],
      message: `height ${box.rect.h}px is not a multiple of 4`,
    },
  ];
};
