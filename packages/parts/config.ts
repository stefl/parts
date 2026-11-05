// The two things an adopter configures. Everything else in this folder reads
// its settings from here or takes them as an argument, so a project that
// needs a different attribute name or a different idea of "this element
// lays itself out" changes one place.

import type { LayoutDetector } from "./walk/layout-detector";

export type { LayoutDetector };

export type PartsOptions = Readonly<{
  /** The attribute that carries a part name. `data-part` by default; some
   * UI libraries (Zag, Ark) already use that name for styling, and a project
   * on one of them picks another, such as `data-role` or `data-ui`. */
  attribute?: string;
  /** How the walk decides that an element lays itself out. The default
   * reads the class list for a margin, padding, gap or space utility; the
   * alternative reads the computed style. See walk/layout-detector.ts. */
  layout?: LayoutDetector;
}>;

export const DEFAULT_ATTRIBUTE = "data-part";
