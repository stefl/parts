import type { Box, Contract, PartDefinition } from "../registry/types";

// Builds Box trees from a nested literal so a contract test reads like the
// layout it describes. Ids are assigned in preorder, as the real box walk
// does, so the first box is 0 and a child's id exceeds its parent's.

export type BoxSpec = Readonly<{
  part?: string | null;
  /** [x, y, w, h] */
  rect: readonly [number, number, number, number];
  borderBottom?: number;
  attrs?: Readonly<Record<string, string>>;
  hasLayoutClasses?: boolean;
  clips?: boolean;
  cuts?: boolean;
  ch?: number;
  baseline?: number;
  textTop?: number;
  children?: readonly BoxSpec[];
}>;

export function box(spec: BoxSpec): BoxSpec {
  return spec;
}

/** Flatten one or more root specs into Boxes with preorder ids. */
export function build(...roots: readonly BoxSpec[]): Box[] {
  const out: Box[] = [];
  const walk = (spec: BoxSpec, parentId: number | null): void => {
    const id = out.length;
    const [x, y, w, h] = spec.rect;
    out.push({
      id,
      part: spec.part ?? null,
      parentId,
      rect: { x, y, w, h },
      borderBottom: spec.borderBottom ?? 0,
      attrs: spec.attrs ?? {},
      hasLayoutClasses: spec.hasLayoutClasses ?? false,
      ...(spec.clips === true ? { clips: true as const } : {}),
      ...(spec.cuts === true ? { cuts: true as const } : {}),
      ...(spec.ch === undefined ? {} : { ch: spec.ch }),
      ...(spec.baseline === undefined ? {} : { baseline: spec.baseline }),
      ...(spec.textTop === undefined ? {} : { textTop: spec.textTop }),
    });
    for (const child of spec.children ?? []) walk(child, id);
  };
  for (const root of roots) walk(root, null);
  return out;
}

/** A one-off part definition carrying the given contracts. */
export function part(name: string, ...contracts: Contract[]): PartDefinition {
  return {
    name,
    purpose: "test part",
    level: 0,
    within: [],
    contains: [],
    contracts,
  };
}
