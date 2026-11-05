import { createPart } from "../../../../packages/parts/part";
import type { PartName } from "./manifest";

// Every JSX form is checked, not only the helper: `<div data-part="bogus" />`
// fails to compile.
declare module "react" {
  interface HTMLAttributes<T> {
    "data-part"?: PartName;
  }
}

/** A hand-built element declares what it is: `<div {...part("row.meta")}>`. */
export const part = createPart<PartName>();
