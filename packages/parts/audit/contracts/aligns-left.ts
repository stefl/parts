import type { Box } from "../../registry/types";
import {
  type AuditContext,
  type ContractCheck,
  DEFAULT_TOLERANCE,
} from "../context";

// Spec table: a group label lines up with the first row title in its list.
// With no scope ancestor or no `with` part there is nothing to compare, so
// no violation (a missing part is the manifest tests' job, not this one's).
export const check: ContractCheck<"aligns-left"> = (ctx, box, contract) => {
  const tol = contract.tolerance ?? DEFAULT_TOLERANCE;
  const target = targetOf(ctx, box, contract);
  if (!target) return [];
  const off = Math.abs(box.rect.x - target.rect.x);
  if (off <= tol) return [];
  return [
    {
      part: box.part ?? "",
      kind: "aligns-left",
      boxIds: [box.id, target.id],
      message: `left edge is ${box.rect.x}px but the first ${contract.with} starts at ${target.rect.x}px (off by ${off}px)`,
    },
  ];
};

/** The first `with` part in the nearest `scope` ancestor. With `outside`,
 * one inside an `outside` part within that scope is skipped (a heading in
 * a message's markdown), and the search widens to the next `scope` out
 * until one holds a `with` part that counts (ruled 2026-11-03). */
function targetOf(
  ctx: AuditContext,
  box: Box,
  contract: Readonly<{ with: string; scope: string; outside?: string }>,
): Box | undefined {
  const { outside } = contract;
  let scope = ctx.nearestAncestor(box.id, contract.scope);
  while (scope) {
    const within = scope;
    const found = ctx
      .descendantsOf(within.id)
      .find(
        (d) =>
          d.part === contract.with &&
          (outside === undefined || !insideOf(ctx, d, outside, within)),
      );
    if (found || outside === undefined) return found;
    scope = ctx.nearestAncestor(within.id, contract.scope);
  }
  return undefined;
}

/** Whether `box` sits inside an `outside` part that is itself inside
 * `scope`. */
function insideOf(
  ctx: AuditContext,
  box: Box,
  outside: string,
  scope: Box,
): boolean {
  let cur = box.parentId === null ? undefined : ctx.byId(box.parentId);
  while (cur && cur.id !== scope.id) {
    if (cur.part === outside) return true;
    cur = cur.parentId === null ? undefined : ctx.byId(cur.parentId);
  }
  return false;
}
