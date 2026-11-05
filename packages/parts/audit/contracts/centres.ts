import { DEFAULT_TOLERANCE, type ContractCheck } from "../context";
import type { Box } from "../../registry/types";

// Spec table: only a run that asks for centring (data-align="center") is
// held to it; other runs may align to the top or baseline on purpose.
// A run that declares wrapping (data-wrap="true") has several lines and each
// line centres on its own, so its children are grouped into lines by
// overlapping vertical extent first. A non-wrapping run is one line, so a
// badly displaced child cannot be excused as a second line.
export function lines(kids: readonly Box[]): Box[][] {
  const sorted = [...kids].toSorted((a, b) => a.rect.y - b.rect.y);
  const out: Box[][] = [];
  let bottom = Number.NEGATIVE_INFINITY;
  for (const k of sorted) {
    const last = out.at(-1);
    if (last !== undefined && k.rect.y < bottom) {
      last.push(k);
      bottom = Math.max(bottom, k.rect.y + k.rect.h);
    } else {
      out.push([k]);
      bottom = k.rect.y + k.rect.h;
    }
  }
  return out;
}

export const check: ContractCheck<"centres"> = (ctx, box, contract) => {
  if (box.attrs.align !== "center") return [];
  const tol = contract.tolerance ?? DEFAULT_TOLERANCE;
  const out = [];
  const kids = ctx.childrenOf(box.id);
  const groups = box.attrs.wrap === "true" ? lines(kids) : [[...kids]];
  for (const line of groups) {
    if (line.length < 2) continue;
    const mids = line.map((k) => k.rect.y + k.rect.h / 2);
    const spread = Math.max(...mids) - Math.min(...mids);
    if (spread <= tol) continue;
    out.push({
      part: box.part ?? "",
      kind: "centres" as const,
      boxIds: [box.id, ...line.map((k) => k.id)],
      message: `children's vertical centres spread over ${spread}px (${mids.join(", ")})`,
    });
  }
  return out;
};
