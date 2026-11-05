import type { Box, Contract, ContractKind, Violation } from "../registry/types";

// The read-only view of one rendered tree that every contract check gets
// Checks never touch the DOM or each other;
// they ask this for relatives and return violations.

/** The contract variant for one kind, so a check sees only its own fields. */
export type ContractOfKind<K extends ContractKind = ContractKind> = Extract<
  Contract,
  { kind: K }
>;

export type AuditContext = Readonly<{
  /** Every box, in id (preorder) order. */
  boxes: readonly Box[];
  byId: (id: number) => Box | undefined;
  /** Direct children, in id order. */
  childrenOf: (id: number) => readonly Box[];
  /** All descendants (not the box itself), in id order. */
  descendantsOf: (id: number) => readonly Box[];
  /** Nearest strict ancestor whose part is `part`, or undefined. */
  nearestAncestor: (id: number, part: string) => Box | undefined;
  /** Nearest strict ancestor that has any part, or undefined. */
  nearestPartAncestor: (id: number) => Box | undefined;
  /** Nearest-part descendants: walking down, the first box with a part on
   * each path, not going deeper. In id order. */
  nearestPartDescendants: (id: number) => readonly Box[];
  /** Boxes sharing this box's parent, itself included, in id order. For a
   * root box these are the other roots. */
  siblingsOf: (id: number) => readonly Box[];
}>;

export type ContractCheck<K extends ContractKind = ContractKind> = (
  ctx: AuditContext,
  box: Box,
  contract: ContractOfKind<K>,
) => readonly Violation[];

/** Sub-pixel layout rounds either way, so a missing tolerance means 1px. */
export const DEFAULT_TOLERANCE = 1;

export function buildContext(boxes: readonly Box[]): AuditContext {
  const sorted = [...boxes].toSorted((a, b) => a.id - b.id);
  const map = new Map<number, Box>();
  const kids = new Map<number | null, Box[]>();
  for (const b of sorted) {
    map.set(b.id, b);
    const list = kids.get(b.parentId);
    if (list) list.push(b);
    else kids.set(b.parentId, [b]);
  }
  const childrenOf = (id: number): readonly Box[] => kids.get(id) ?? [];
  const descendantsOf = (id: number): readonly Box[] => {
    const out: Box[] = [];
    const stack = [...childrenOf(id)].toReversed();
    while (stack.length > 0) {
      const next = stack.pop() as Box;
      out.push(next);
      stack.push(...childrenOf(next.id).toReversed());
    }
    return out.toSorted((a, b) => a.id - b.id);
  };
  const nearestAncestor = (id: number, part: string): Box | undefined => {
    let cur = map.get(id);
    // Bounded by the box count so malformed parent cycles cannot hang.
    for (let i = 0; cur && cur.parentId !== null && i <= sorted.length; i++) {
      cur = map.get(cur.parentId);
      if (cur && cur.part === part) return cur;
    }
    return undefined;
  };
  const nearestPartAncestor = (id: number): Box | undefined => {
    let cur = map.get(id);
    for (let i = 0; cur && cur.parentId !== null && i <= sorted.length; i++) {
      cur = map.get(cur.parentId);
      if (cur && cur.part !== null) return cur;
    }
    return undefined;
  };
  const nearestPartDescendants = (id: number): readonly Box[] => {
    const out: Box[] = [];
    const stack = [...childrenOf(id)].toReversed();
    while (stack.length > 0) {
      const next = stack.pop() as Box;
      if (next.part !== null) out.push(next);
      else stack.push(...childrenOf(next.id).toReversed());
    }
    return out.toSorted((a, b) => a.id - b.id);
  };
  const siblingsOf = (id: number): readonly Box[] => {
    const self = map.get(id);
    return self ? (kids.get(self.parentId) ?? []) : [];
  };
  return {
    boxes: sorted,
    byId: (id) => map.get(id),
    childrenOf,
    descendantsOf,
    nearestAncestor,
    nearestPartAncestor,
    nearestPartDescendants,
    siblingsOf,
  };
}
