// The helper a hand-built element uses to declare what it is. A primitive
// (Button, Row) declares its own part; everything else spreads `part(...)`.
import { DEFAULT_ATTRIBUTE } from "./config";

/** Builds a `part()` for one attribute name and one set of part names. A
 * project calls this once, with its `PartName` union from the generated
 * manifest, so an unknown name fails to compile:
 *
 *   export const part = createPart<PartName>();
 *
 * To have every JSX form checked too, not only the helper, the project adds
 * beside it:
 *
 *   declare module "react" {
 *     interface HTMLAttributes<T> { "data-part"?: PartName }
 *   }
 *
 * `extra` adds sibling `data-*` facts the contracts read, such as a run's
 * `align` or a row's `compact`. */
export function createPart<Name extends string>(
  attribute: string = DEFAULT_ATTRIBUTE,
): (
  name: Name,
  extra?: Readonly<Record<string, string>>,
) => Readonly<Record<string, string>> {
  return (name, extra) => {
    const attrs: Record<string, string> = { [attribute]: name };
    for (const [key, value] of Object.entries(extra ?? {})) {
      attrs[`data-${key}`] = value;
    }
    return attrs;
  };
}

/** The untyped default, for a project that has not generated its manifest
 * yet. Prefer `createPart<PartName>()` once it has. */
export const part = createPart<string>();
