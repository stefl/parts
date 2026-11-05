// The static half of the gate for this app: unknown part names, dangling
// registry references, a stale manifest, a story with no sidecar entry, an
// allow with no reason, undeclared layout in source. `bun run check:parts`.
import path from "node:path";
import { runChecks } from "../../../packages/parts/check/run";
import { parts } from "../src/parts/manifest";

const root = path.resolve(import.meta.dirname, "..");

const problems = await runChecks({
  root,
  registryDir: "src/parts",
  parts,
  sourceDirs: ["src"],
  // Words ARIA already names, which a registry may reference without
  // defining: the bar contains a tablist.
  ariaNames: new Set(["tabs"]),
  requireZero: true,
  undeclaredLayout: {
    // Primitives whose root element carries the part attribute, so a
    // className on them lands on a declared box.
    primitives: new Set([
      "Band",
      "Bar",
      "Button",
      "Card",
      "EmptyState",
      "Field",
      "GroupLabel",
      "Heading",
      "List",
      "Prose",
      "Row",
    ]),
  },
});

if (problems.length > 0) {
  for (const p of problems) console.error(p);
  process.exit(1);
}
console.log(`parts ok: ${Object.keys(parts).length} registered`);
