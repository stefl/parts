import { DEFAULT_TOLERANCE, type ContractCheck } from "../context";

// Spec table: a bottom rule inside a bar is the bar's or spans the bar. A
// shorter rule is the "bar rule that stops short" screen Stef flagged.
export const check: ContractCheck<"rule-spans"> = (ctx, box, contract) => {
  const tol = contract.tolerance ?? DEFAULT_TOLERANCE;
  const out = [];
  for (const d of ctx.descendantsOf(box.id)) {
    if (d.borderBottom <= 0) continue;
    // A nested bar owns its own rules; only count ones whose closest bar is this.
    if (ctx.nearestAncestor(d.id, box.part ?? "")?.id !== box.id) continue;
    // The nested bar's own bottom border is its rule, not a short rule of ours.
    if (d.part === box.part) continue;
    if (Math.abs(d.rect.w - box.rect.w) > tol) {
      out.push({
        part: box.part ?? "",
        kind: "rule-spans" as const,
        boxIds: [d.id, box.id],
        message: `bottom rule is ${d.rect.w}px wide inside a ${box.rect.w}px bar`,
      });
    }
  }
  return out;
};
