// definePart validates a registry entry when its file is first imported, so a
// typo in a name or a contract kind fails the moment anything loads the
// manifest, not later in the audit.
import { KIND_NAMES } from "../audit/kind-names";
import type { PartDefinition } from "./types";

const NAME = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/;

/** Every kind the engine knows. Read from kind-names.ts, not kinds.ts, so the
 * registry does not drag the checkers into the app bundle. */
const KINDS: ReadonlySet<string> = new Set(KIND_NAMES);

/** Words ARIA already names: a part may list them in
 * `contains` without a registry entry of their own. Exported once so the
 * check script and the registry test read the same list. */
export const ARIA_NAMES: ReadonlySet<string> = new Set(["tabs"]);

export function definePart(def: PartDefinition): PartDefinition {
  if (!NAME.test(def.name)) {
    throw new Error(
      `Part name "${def.name}" is not dotted lowercase (for example "row.title" or "list.group-label").`,
    );
  }
  if (def.purpose.trim() === "") {
    throw new Error(
      `Part "${def.name}" needs a purpose in one plain sentence.`,
    );
  }
  for (const contract of def.contracts) {
    if (!KINDS.has(contract.kind)) {
      throw new Error(
        `Part "${def.name}" has an unknown contract kind "${String(contract.kind)}".`,
      );
    }
    if (contract.kind === "height-in" && contract.values.length === 0) {
      throw new Error(
        `Part "${def.name}" has a height-in contract with no heights listed.`,
      );
    }
  }
  return def;
}
