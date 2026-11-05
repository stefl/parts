# Adopting Parts

How to copy Parts into your repository and own it. It assumes you already have the two things that do most of the work: a Storybook with a story per screen, and a set of primitives (your Button, your Row) that your UI is built from. Parts adds a measure on top of those.

A part is a named piece of a screen (a row title, a group label) that your code marks with an attribute. The registry says what each part promises about its own box. The gate is the CI check that measures each story's rendered layout against the registry and fails on a new violation.

The whole path, from an empty folder to a green gate, took the example app in this repository one afternoon and two CI runs. Most of that was the registry and the stories, which are yours to write anyway.

Parts assumes Storybook 9 or later with its Vitest addon, Vitest 3 or later with the Playwright browser provider, React (the `part()` helper types a React attribute; the engine itself is framework-free), and Bun or another runner for the scripts. The example app in `apps/example` is the worked copy of every step below.

## 1. Copy the code in

```bash
bunx giget gh:stefl/parts/packages/parts src/parts/engine
bunx giget gh:stefl/parts/templates templates/parts
cp templates/parts/parts-review.ts scripts/parts-review.ts
```

Pick any folder; the paths below assume `src/parts/engine` for the engine and `src/parts` for your registry beside it. The third line copies the capture script, which draws each part's box onto a screenshot of a story; step 10 uses it. The engine has no dependencies of its own beyond Vitest's browser types. Commit it as yours: there is no package to update, only a diff to read (step 9).

## 2. Start the registry

A registry is one file per part, each a `definePart({...})`, and a generated `manifest.ts`. Begin with the dozen in `apps/example/src/parts` and delete what your product does not have. Two helper files re-export the engine's `types` and `definePart` so your part files import from beside themselves:

```ts
// src/parts/define.ts
export { definePart } from "./engine/registry/define";
// src/parts/types.ts
export type { Box, Contract, PartDefinition } from "./engine/registry/types";
```

Then generate the manifest, and add the command to your scripts:

```bash
bun src/parts/engine/registry/manifest.ts src/parts
```

A part exists only with a contract (a rule about its own box, such as a height or an alignment) or a grammar rule (a rule about which parts may sit inside which) attached. Twelve is a good start. I'd keep the count low: in my experience a registry of fifty turns into a classification scheme that drifts away from the screens.

## 3. Type the attribute

```ts
// src/parts/part.ts
import { createPart } from "./engine/part";
import type { PartName } from "./manifest";

declare module "react" {
  interface HTMLAttributes<T> {
    "data-part"?: PartName;
  }
}

export const part = createPart<PartName>();
```

Now `<div data-part="bogus" />` fails to compile, and a hand-built element declares itself with `<div {...part("row.meta")}>`. A primitive (your Button, your Row) declares its own part inside.

## 4. Wire the hook

Three lines in three files. In `.storybook/preview.tsx`:

```ts
import { partsGate } from "../src/parts/engine/storybook/hook";
import { parts } from "../src/parts/manifest";

const preview: Preview = {
  // ...
  afterEach: partsGate({ parts }),
};
```

In the Storybook project's Vitest config:

```ts
import {
  readPartsBaseline,
  writePartsBaseline,
} from "./src/parts/engine/gate/commands.ts";
import { partsUpdateDefine } from "./src/parts/engine/storybook/define.ts";

export default defineConfig({
  plugins: [storybookTest({ configDir: ".storybook" })],
  define: partsUpdateDefine(),
  test: {
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      commands: { readPartsBaseline, writePartsBaseline },
    },
    setupFiles: [".storybook/vitest.setup.ts"],
  },
});
```

And in that setup file:

```ts
import { afterAll } from "vitest";
import { requireGateRan } from "../src/parts/engine/storybook/setup";

afterAll(requireGateRan);
```

The hook is inert in the Storybook dev UI. Under Vitest it runs after every story's render and play, and the setup file's guard fails any story file where it never fired.

Add a canary story: one planted violation, allowed with a reason. `apps/example/src/stories/PartsGateCanary.stories.tsx` is the whole file. It is how you know the hook is wired.

## 5. Record baselines on CI first

A sidecar is a small JSON file beside each story file that records that story's measured counts; those counts are the baseline the gate compares against. Sidecars record what CI's Chromium measures, not a laptop's: fonts, scrollbars and sub-pixel rounding all differ, so I'd expect a baseline recorded on a laptop to fail on CI, and the other way round.

Copy `.github/workflows/parts-update.yml` from this repository, change the two `working-directory` lines to your Storybook project, and land it on your default branch: GitHub only dispatches a `workflow_dispatch` workflow from there, which cost the example app a separate pull request to learn.

Then, on your branch:

```bash
gh workflow run parts-update.yml --ref <branch>
gh run download <run-id> -n parts-sidecars -D /tmp/sidecars
tar -xf /tmp/sidecars/parts-sidecars.tar
```

Commit the `*.stories.parts.json` files that appear beside your stories. The workflow runs the gate with recording on, so it writes sidecars rather than checking against them. Record mode writes a new story's entry only at zero; a story that measures above zero fails with its violations listed, and you fix it or allow it (step 8) before it gets an entry. I'd expect the first run to find something; the example app's did.

## 6. Add the static checks

```ts
// scripts/check-parts.ts
import { runChecks } from "../src/parts/engine/check/run";
import { parts } from "../src/parts/manifest";

const problems = await runChecks({
  root: import.meta.dirname + "/..",
  registryDir: "src/parts",
  parts,
  sourceDirs: ["src"],
  ariaNames: new Set(["tabs"]),
  requireZero: true,
  undeclaredLayout: { primitives: new Set(["Button", "Row", "Stack"]) },
});
if (problems.length > 0) {
  for (const p of problems) console.error(p);
  process.exit(1);
}
```

Add it to your gate. It fails a stale manifest, an unknown part name in source, and a registry reference to a part that does not exist. It also fails a story with no sidecar entry, an allow with no reason, and a sidecar entry above zero (`requireZero`, once you are there).

With `undeclaredLayout` on, it fails a JSX tag that lays itself out without declaring a part; list your primitives there so a className on them is not flagged. I'd turn `requireZero` on only once every story is at zero. Until then the ratchet (the rule that a story's recorded count may fall but not rise) should hold the line on its own.

## 7. The two configuration points

**The attribute.** `data-part` by default. If your UI library already uses it (Zag and Ark UI do, for styling), choose another and pass it everywhere the engine reads the DOM or your source: `partsGate({ parts, attribute: "data-ui" })`, `createPart<PartName>("data-ui")`, `runChecks({ attribute: "data-ui", ... })`, and `SETTINGS.attribute` in `scripts/parts-review.ts`, the capture script you copied in step 1.

**The layout detector.** How the walk (the pass over the rendered DOM that collects every element's box) decides that an element lays itself out, which is what the unclassified count counts. The default, `classNameLayout()`, reads the class list for a margin, padding, gap or space utility, and pairs with the undeclared-layout source check. For a codebase whose class names carry no layout (CSS modules, styled-components), pass `layout: computedStyleLayout()` to `partsGate`; it reads the computed style instead. The source check has no equivalent for that detector, so leave `undeclaredLayout` off and rely on the rendered count.

## 8. When the gate goes red

A story fails with its measured numbers, its recorded numbers, and up to twenty violations, each naming the part, the contract and the pixels:

```
Rendered parts gate: measured violations=1 unclassified=0; baseline violations=0 unclassified=0.
  list.group-label aligns-left: left edge is 24px but the first row.title starts at 36px (off by 12px)
```

Three ways out. I'd try them in this order, but the choice is yours on each story:

1. **Fix the screen.** Usually the message says what: two edges differ by a padding that was meant as an inset, a control is 30px tall, a gap is 20. The example app's first run was all of these.

2. **Change the contract.** When the rule does not fit your product, edit the part file. It is your registry. Write the reason as a sentence beside the change, and if the project keeps a ledger (a file of past rulings on contracts; step 10 describes it), add an entry.

3. **Allow it, with a reason.** `parameters: { parts: { allow: { "control:height-in": "the segmented control is 24px by design; ruled 2026-11-05" } } }` on the story. The reason is required, and the static check fails an empty one. An allow is something the review loop (step 10) can come back to.

An `unclassified` count above the baseline means an element with layout classes and no part. Give it a part, or move its layout onto an element that has one. A story's own frame (a width wrapper, a dark backdrop) is marked `data-story-frame=""` and steps out of the count; `apps/example/src/lib/story-frame.tsx` is the helper.

I'd leave the sidecars to record mode rather than editing them by hand: re-record on CI and commit what comes back. Record mode only ever lowers a count, so the file stays a measurement.

## 9. Staying current

Copy `scripts/diff-upstream.ts` beside your copy, with `parts.upstream.json` next to it:

```json
{
  "repo": "stefl/parts",
  "path": "packages/parts",
  "commit": "<the sha you copied>",
  "local": "src/parts/engine"
}
```

Then:

```bash
bun scripts/diff-upstream.ts              # files that differ from the pinned commit (your own edits)
bun scripts/diff-upstream.ts --at main    # what upstream has that you do not
bun scripts/diff-upstream.ts --show walk/collect-boxes.ts
bun scripts/diff-upstream.ts --pin <sha>  # once you have taken what you want
```

`CHANGELOG.md` in this repository lists each new idea with how to take it into a copy. Take the ones you want; a copy that diverges is the point of a copy.

## 10. If you already have your own glue

A codebase that already has a box walk, a gate or a Storybook hook of its own can take the engine folder by folder: `audit/`, `registry/` and `walk/` each stand alone, and giget fetches a folder at a time.

```bash
bunx giget gh:stefl/parts/packages/parts/audit src/parts/engine/audit
bunx giget gh:stefl/parts/packages/parts/registry src/parts/engine/registry
bunx giget gh:stefl/parts/packages/parts/walk src/parts/engine/walk
```

The walk's own test needs jsdom; delete it if that package's tests run in node. Point your existing `types` and `definePart` imports at `engine/registry`, and your layout-token import at `engine/walk/layout-detector`. The diff script then lists the folders you did not take as "only upstream", which is accurate and can be ignored. The codebase the pattern came from took it this way; the eight steps it needed by hand are in this repository's changelog.

## 11. Grow the registry through review

In my experience new contracts come from looking, not from the engine. The playbook for a review round is `.agents/skills/parts-sweep/SKILL.md` in this repository, a plain markdown file of steps written so a person or an AI agent can follow it.

About five screens a batch, captured with their boxes drawn by `scripts/parts-review.ts`. A reviewer reads them cold, with the prompt beside the skill, and numbers the findings. A person rules on each, and an accepted finding becomes a fix or a contract with a ledger entry. `templates/LEDGER.md` seeds the ledger with eight rulings from the codebase I first ran this on; keep what fits.

The loop has no automatic step: the engine holds what has been ruled, and the review is where rulings come from. Everything above is the path as I ran it on the example app and on the codebase the pattern came from. Which contracts you keep, how strict the gate is and how often you review are yours to decide.
