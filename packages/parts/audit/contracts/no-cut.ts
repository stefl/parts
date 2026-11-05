import type { Box } from "../../registry/types";
import type { ContractCheck } from "../context";

// Nothing in a part is cut short by a box that hides its overflow (Stef,
// 2026-10-31, "As recommended", the parts sweep's fifth batch, rule 4): the
// ref chip cut its title on a word, then CSS cut it again at a character
// ("replaces the de…") in a 640px window. Text is cut by the code, on a
// word, to the width it has. The walk records `cuts` on a box that clips and
// whose content is wider than it; any such box in the part, the part's own
// included, is a fault.
export const check: ContractCheck<"no-cut"> = (ctx, box) => {
  const cut: Box | undefined = [box, ...ctx.descendantsOf(box.id)].find(
    (b) => b.cuts === true,
  );
  if (cut === undefined) return [];
  return [
    {
      part: box.part ?? "",
      kind: "no-cut" as const,
      boxIds: cut.id === box.id ? [box.id] : [box.id, cut.id],
      message: "a box inside hides part of its content at its edge",
    },
  ];
};
