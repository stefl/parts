// How the box walk decides that an element lays itself out. Two detectors
// ship; a project picks one in its options (config.ts) or writes its own.
import type { LayoutDetector } from "../config";

/** One class token that does its own layout: optional variant prefixes
 * (`@lg:`, `hover:`), then a margin, padding, gap or space utility. Any
 * value counts; the question is "does this element lay itself out", not
 * whether the value is on scale. Shared by the browser box walk and the
 * source check (check/undeclared-layout.ts), so both read one definition. */
export const LAYOUT_TOKEN =
  /^(?:[^\s:]+:)*-?(?:[mp][xytrblse]?|gap(?:-[xy])?|space-[xy])-/;

/** Reads the element's own class list for a token the pattern matches. The
 * default: it is cheap, it matches the source check exactly, and it names
 * the element that chose the layout rather than one that inherited it. For
 * a utility-class codebase (Tailwind and the like). */
export function classNameLayout(
  pattern: RegExp = LAYOUT_TOKEN,
): LayoutDetector {
  return (el) => {
    const cls = el.getAttribute("class");
    if (cls === null) return false;
    return cls.split(/\s+/).some((t) => t !== "" && pattern.test(t));
  };
}

const px = (v: string): number => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/** Reads the computed style: a non-zero margin, padding or gap on any side.
 * For a codebase that styles with CSS modules, styled-components or plain
 * stylesheets, where the class list says nothing about layout. Costs one
 * getComputedStyle per element, which the walk already pays. The source
 * check has no equivalent for this detector, since it reads class names. */
export function computedStyleLayout(): LayoutDetector {
  return (_el, s) =>
    [
      s.marginTop,
      s.marginRight,
      s.marginBottom,
      s.marginLeft,
      s.paddingTop,
      s.paddingRight,
      s.paddingBottom,
      s.paddingLeft,
      s.rowGap,
      s.columnGap,
    ].some((v) => px(v) !== 0);
}

export const defaultLayout: LayoutDetector = classNameLayout();
