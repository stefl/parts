// Browser-side box walk for the rendered parts gate. Turns a story's DOM
// into the flat Box list the pure audit reads.
import { DEFAULT_ATTRIBUTE, type PartsOptions } from "../config";
import type { Box } from "../registry/types";
import { defaultLayout, LAYOUT_TOKEN } from "./layout-detector";

export { LAYOUT_TOKEN };

/** A story's own frame: the dark variant's backdrop, a decorator's padded
 * `main`, a gallery's grid. The story file draws it and the app never does,
 * so its layout is not app layout and leaves the unclassified count. Only
 * the frame itself steps out: the walk still descends into it, so everything
 * the component renders inside still counts. The source check refuses the
 * marker in app source, so a real screen's wrapper cannot hide behind it. */
export const STORY_FRAME_ATTR = "data-story-frame";

/** True when a computed colour string is fully transparent. Chrome prints
 * `rgba(0, 0, 0, 0)`, `transparent` or `color(srgb r g b / 0)`. */
function isTransparent(colour: string): boolean {
  const c = colour.trim().toLowerCase();
  if (c === "transparent") return true;
  if (/\/\s*0(?:\.0+)?\s*%?\)$/.test(c)) return true;
  const rgba = /^rgba\(([^)]*)\)$/.exec(c);
  if (rgba?.[1] !== undefined) {
    const parts = rgba[1].split(",");
    return parts.length === 4 && Number.parseFloat(parts[3] ?? "1") === 0;
  }
  return false;
}

function borderBottomOf(style: CSSStyleDeclaration): number {
  // A rule is a bottom border alone. An element drawing a border on the
  // other three sides (an outline Button, an open popover) is a box, and
  // reporting its bottom edge would make rule-spans read it as a rule

  const others = [
    style.borderTopWidth,
    style.borderLeftWidth,
    style.borderRightWidth,
  ];
  if (others.some((w) => Number.parseFloat(w) > 0)) return 0;
  if (
    style.borderBottomStyle === "none" ||
    style.borderBottomStyle === "hidden"
  )
    return 0;
  if (isTransparent(style.borderBottomColor)) return 0;
  const w = Number.parseFloat(style.borderBottomWidth);
  return Number.isFinite(w) ? w : 0;
}

/** Whether the element clips what overflows it, on either axis. */
function clips(style: CSSStyleDeclaration): boolean {
  return [style.overflowX, style.overflowY].some(
    (o) => o !== "" && o !== "visible",
  );
}

/** Whether a clipping element hides some of its content across: its
 * content is wider than its box. A box of 1px or less is text for screen
 * readers only (`sr-only`), drawn nowhere, so it cuts nothing a person
 * sees. */
function cuts(el: Element, style: CSSStyleDeclaration): boolean {
  if (el.clientWidth <= 1 || el.clientHeight <= 1) return false;
  return clips(style) && el.scrollWidth > el.clientWidth + 1;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

let chContext: CanvasRenderingContext2D | null | undefined;

/** The width of `1ch` in this element's font: the "0" glyph's advance, as
 * CSS defines the unit. Measured on every call, never cached: a web font
 * that swaps in keeps the same font string, so a cached width would hold
 * the fallback's. Undefined where the browser gives no 2D canvas. */
function chOf(style: CSSStyleDeclaration): number | undefined {
  chContext ??= document.createElement("canvas").getContext("2d");
  if (chContext === null) return undefined;
  // From the longhands when the shorthand is "", as `canvasFont` reads them:
  // on a part that carries `tabular-nums` the canvas otherwise measured its
  // own 10px default.
  chContext.font = style.font === "" ? canvasFont(style) : style.font;
  return round2(chContext.measureText("0").width);
}

/** The font string a canvas reads. Built from the longhands because Chrome
 * prints the `font` shorthand as "" once a longhand it cannot express is set
 * (`tabular-nums`, which every count carries). */
function canvasFont(style: CSSStyleDeclaration): string {
  return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
}

/** Whether `node`'s text is drawn where a person sees it: no box between it
 * and `root` (inclusive) is hidden or 1px or less (`sr-only`), which would
 * leave text that measures but is never seen. A `display: contents` wrapper
 * draws no box of its own, so only its visibility counts. */
function textShows(node: Text, root: Element): boolean {
  for (let el = node.parentElement; el !== null; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (style.visibility !== "visible") return false;
    if (style.display === "contents") {
      if (el === root) return true;
      continue;
    }
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return false;
    if (el === root) return true;
  }
  return true;
}

/** The first line of the first visible text inside `el`: the page y of its
 * top and of its alphabetic baseline (the bottom of that line's text box
 * less its font's descent, so text in two sizes on one baseline measures the
 * same). The top lets the contract group text by the line it is on, not by
 * an element that wraps over several. Undefined where there is no such text
 * or the browser cannot measure it (jsdom has no layout). The `baselines`
 * contract reads it. */
function firstLineOf(
  el: Element,
): { textTop: number; baseline: number } | undefined {
  const range = document.createRange();
  if (typeof range.getClientRects !== "function") return undefined;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
    const text = n as Text;
    if (text.data.trim() === "" || text.parentElement === null) continue;
    range.selectNodeContents(text);
    const rect = range.getClientRects()[0];
    if (rect === undefined || rect.width <= 1 || rect.height <= 1) continue;
    if (!textShows(text, el)) continue;
    chContext ??= document.createElement("canvas").getContext("2d");
    if (chContext === null) return undefined;
    chContext.font = canvasFont(getComputedStyle(text.parentElement));
    const descent = chContext.measureText(text.data).fontBoundingBoxDescent;
    return {
      textTop: round2(rect.top),
      baseline: round2(rect.bottom - descent),
    };
  }
  return undefined;
}

function optionalCh(ch: number | undefined): { ch?: number } {
  return ch === undefined || ch === 0 ? {} : { ch };
}

/** The element's `data-*` facts other than its part, keyed without the
 * prefix. */
function dataAttrs(el: Element, attribute: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const a of Array.from(el.attributes)) {
    if (a.name.startsWith("data-") && a.name !== attribute) {
      attrs[a.name.slice(5)] = a.value;
    }
  }
  return attrs;
}

/** The optional facts a box carries only when they hold: clipping, a
 * declared part's text and `ch`, and, for a part's child, its baseline.
 * Baselines are compared among a part's children only, so only they pay
 * for the text walk. */
function optionalFacts(
  el: Element,
  style: CSSStyleDeclaration,
  part: string | null,
  parentIsPart: boolean,
): Partial<Box> {
  const line = parentIsPart ? firstLineOf(el) : undefined;
  return {
    ...(clips(style) ? { clips: true as const } : {}),
    ...(cuts(el, style) ? { cuts: true as const } : {}),
    ...(part === null
      ? {}
      : {
          text: (el.textContent ?? "").trim().slice(0, 40),
          ...optionalCh(chOf(style)),
        }),
    ...line,
  };
}

/** Preorder walk of `root`'s subtree (root included). Elements that are not
 * rendered are left out: `display: none` drops the whole subtree; a box with
 * no width and no height (such as `display: contents`) is skipped but its
 * children are still walked and re-parented to the nearest kept ancestor.
 * `options` names the part attribute and the layout detector (config.ts). */
export function collectBoxes(root: Element, options: PartsOptions = {}): Box[] {
  const attribute = options.attribute ?? DEFAULT_ATTRIBUTE;
  const layout = options.layout ?? defaultLayout;
  const laysOut = (el: Element, style: CSSStyleDeclaration): boolean =>
    !el.hasAttribute(STORY_FRAME_ATTR) && layout(el, style);
  const out: Box[] = [];

  const visit = (el: Element, parentId: number | null): void => {
    const style = getComputedStyle(el);
    if (style.display === "none") return;
    const r = el.getBoundingClientRect();
    let nextParent = parentId;
    if (r.width !== 0 || r.height !== 0) {
      const id = out.length;
      const part = el.getAttribute(attribute);
      const parentIsPart =
        parentId !== null && (out[parentId]?.part ?? null) !== null;
      const box: Box = {
        id,
        part,
        parentId,
        rect: {
          x: round2(r.x),
          y: round2(r.y),
          w: round2(r.width),
          h: round2(r.height),
        },
        borderBottom: borderBottomOf(style),
        attrs: dataAttrs(el, attribute),
        hasLayoutClasses: laysOut(el, style),
        ...optionalFacts(el, style, part, parentIsPart),
      };
      out.push(box);
      nextParent = id;
    }
    for (const child of Array.from(el.children)) visit(child, nextParent);
  };

  visit(root, null);
  return out;
}
