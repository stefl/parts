// The parts registry's shared shapes. A part is
// what a rendered element IS, declared as `data-part="<name>"`; its entry
// here says what it is for, which level it sits at, where it may live and
// what contracts its rendered box must keep.
//
// Part names are plain strings here; the typed `PartName` union comes from
// the generated manifest (`manifest.ts`), and a test holds every `with`,
// `scope`, `within` and `contains` reference to a registered name. This file
// is deliberately the only one both the registry and the audit import.

/** How much a part asks of the eye: 0 chrome and layout, 1 what you decide
 * with, 2 context read on request, 3 everything else. */
export type PartLevel = 0 | 1 | 2 | 3;

export type ContractKind =
  | "rule-spans"
  | "aligns-left"
  | "centres"
  | "baselines"
  | "height-in"
  | "gaps-on-scale"
  | "grid-4"
  | "uniform-height"
  | "closer-below"
  | "centred-in"
  | "clear-of"
  | "no-overflow"
  | "no-cut"
  | "within-measure";

/** A guard on a contract: the engine applies it only to a box whose
 * `data-<attr>` equals `value` and skips it elsewhere. The stacked list's
 * step rules carry `{ attr: "shape", value: "stacked" }` so a `Table` row,
 * which also declares `row`, is not held to them (spec
 * 2026-10-29-no-undeclared-layout-design, decision 2). */
/** `not`: the contract applies where the attribute is absent or differs,
 * so a rule for every plain list can step aside for the stacked one.
 * `value` may list several: the guard matches when the attribute is any of
 * them, so the plain list's rule can step aside for the stacked list and the
 * checklist both. */
export type Guard = Readonly<{
  attr: string;
  value: string | readonly string[];
  not?: true;
}>;

/** One rule a part's rendered box keeps. Every field is data so the pure
 * engine can evaluate it with no code in the part file. Pixel tolerances
 * default to 1 where omitted (sub-pixel layout rounds either way). Any
 * variant may carry `when` (a `Guard`). */
export type Contract = ContractBody & Readonly<{ when?: Guard }>;

type ContractBody =
  /** On a bar: any descendant that draws a bottom rule is the bar itself or
   * is as wide as the bar. */
  | Readonly<{ kind: "rule-spans"; tolerance?: number }>
  /** This part's left edge equals the left edge of the first `with` part
   * inside the nearest `scope` ancestor. With `outside`, a `with` part
   * inside an `outside` part does not count, and when the nearest `scope`
   * holds none that counts, the next `scope` out is tried: a transcript
   * turn's speaker line starts on its section's heading, not on a heading
   * in some message's markdown (ruled 2026-11-03). */
  | Readonly<{
      kind: "aligns-left";
      with: string;
      scope: string;
      outside?: string;
      tolerance?: number;
    }>
  /** A run with `data-align="center"`: its children's vertical centres
   * agree. */
  | Readonly<{ kind: "centres"; tolerance?: number }>
  /** The words on one line of this part sit on one baseline: among its
   * children that hold text, those on the same line (overlapping
   * vertically) have glyph baselines within `tolerance` (default 0.5) of
   * each other. Centred boxes can still hold text 1-2px apart: a project's
   * name sat below the "· N" count beside it because its label was an
   * inline flex box opening on a textless dot (ruled 2026-11-01). */
  | Readonly<{ kind: "baselines"; tolerance?: number }>
  /** The rendered height is one of these. */
  | Readonly<{
      kind: "height-in";
      values: readonly number[];
      tolerance?: number;
    }>
  /** Gaps between consecutive children are steps of the scale. */
  | Readonly<{
      kind: "gaps-on-scale";
      scale?: readonly number[];
      tolerance?: number;
    }>
  /** The height is a multiple of 4. */
  | Readonly<{ kind: "grid-4"; tolerance?: number }>
  /** Among this part's `of` descendants there are at most `max` (default 2)
   * distinct heights. */
  | Readonly<{
      kind: "uniform-height";
      of: string;
      max?: number;
      tolerance?: number;
    }>
  /** The gap to the next sibling is smaller than the gap to the previous
   * one: a heading belongs to what follows it. */
  | Readonly<{ kind: "closer-below" }>
  /** This part's vertical centre equals the centre of its nearest `within`
   * ancestor: a mark sits on its row's centre line, whatever the row
   * holds (Stef, 2026-10-28, "these blocked icons are out of alignment with
   * the text"). */
  | Readonly<{ kind: "centred-in"; within: string; tolerance?: number }>
  /** Any `of` part beside this one (sharing some of its vertical span,
   * neither inside the other) starts at least `min` px clear of its edge: a
   * card keeps a gap from the queue rows next to it, so a selected row's
   * fill never runs up to the card (Stef, 2026-10-28, the Loose ends
   * review). Parts stacked above or below are not beside it. */
  | Readonly<{ kind: "clear-of"; of: string; min: number; tolerance?: number }>
  /** Nothing inside this part draws past its left or right edge, unless a
   * box between them clips it: a truncating line under a session's title
   * that never truncated drew across the Ref, Agent and Age columns (Stef,
   * 2026-10-31). */
  | Readonly<{ kind: "no-overflow"; tolerance?: number }>
  /** Nothing in this part (itself included) clips its own content short:
   * a box that hides what overflows it holds all of it. Text is cut by the
   * code on a whole word, never again by CSS at a character (Stef,
   * 2026-10-31, "As recommended", the ref chip's "replaces the de…" at
   * 640px). */
  | Readonly<{ kind: "no-cut" }>
  /** This part is no wider than `chars` (default 64) of its own font's
   * `ch`: a line of prose stays on the reading measure. A description once
   * ran the full width of the page and no gate saw it (ruled 2026-11-01). */
  | Readonly<{ kind: "within-measure"; chars?: number; tolerance?: number }>;

export type PartDefinition = Readonly<{
  /** Dotted, lowercase: `row.title`, `list.group-label`. */
  name: string;
  /** One sentence, for the sheet and for the reviewer. */
  purpose: string;
  level: PartLevel;
  /** Part names this may live inside (rung 3; recorded now). */
  within: readonly string[];
  /** Part names this may hold (rung 3; recorded now). */
  contains: readonly string[];
  contracts: readonly Contract[];
  /** The classes a primitive draws this part
   * with, one literal Tailwind string per variant, kept in the part's own
   * file so the registry is the source of truth. Literal so Tailwind's
   * scanner and check:taste both read them. Absent while a part has no
   * primitive of its own. */
  style?: Readonly<Record<string, string>>;
}>;

/** One rendered element, as the box walk reports it. `part` is null for an
 * element with no `data-part` of its own; such an element with layout
 * classes counts as unclassified. Ids are the walk's preorder index, so a
 * child always has a larger id than its parent. */
export type Box = Readonly<{
  id: number;
  part: string | null;
  parentId: number | null;
  rect: Readonly<{ x: number; y: number; w: number; h: number }>;
  /** Computed bottom border width in px (0 when none or invisible). */
  borderBottom: number;
  /** The element's other `data-*` facts the audit reads (`align`, ...). */
  attrs: Readonly<Record<string, string>>;
  /** The layout detector (config.ts) says the element lays itself out: by
   * default, its own class list carries a margin, padding, gap or space
   * utility. */
  hasLayoutClasses: boolean;
  /** The element clips what overflows it (`overflow` other than visible on
   * either axis), so a descendant past its edges is not drawn there.
   * Present only when true. */
  clips?: true;
  /** The element clips and its content is wider than it (`scrollWidth`
   * past `clientWidth`), so something is hidden at its edge. Present only
   * when true. */
  cuts?: true;
  /** The width of `1ch` (the "0" glyph) in the element's own font, in px.
   * Recorded on declared parts only; absent where it was not measured, and
   * `within-measure` then has nothing to judge. */
  ch?: number;
  /** The page y of the alphabetic baseline of the first line of the first
   * visible text inside this element. Recorded on the children of declared
   * parts only; absent where there was no text to measure, and `baselines`
   * then leaves the box out. */
  baseline?: number;
  /** The page y of the top of that same first text line, recorded with
   * `baseline`; `baselines` groups children into lines by it, since an
   * element that wraps spans several lines. */
  textTop?: number;
  /** Short text for messages; optional. */
  text?: string;
}>;

/** The grammar is not a contract a part
 * lists; it is read from every definition's `within`, `contains` and
 * `level` and checked for all registered parts. */
export type GrammarKind = "within" | "contains" | "level";

export type Violation = Readonly<{
  part: string;
  kind: ContractKind | GrammarKind;
  /** The boxes involved, the offending one first. */
  boxIds: readonly number[];
  /** Plain words with the measured numbers. */
  message: string;
}>;
