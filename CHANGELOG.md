# Changelog

Parts is copied, not installed, so this file is not a list of versions. It has two sections.

**Ideas in flight** are changes to the pattern that exist in this repository and may not be in your copy yet. Each one says what it is, why, and how to take it into a copy, in this shape:

> ### <date>: <the idea in one line>
>
> **What.** <the change, in a sentence or two>
> **Why.** <the screen or snag that prompted it>
> **To take it.** <the files: `bun scripts/diff-upstream.ts --show <file>` for each, or "copy `<file>` whole", or "edit `<your part file>` to add ...">
> **Status.** in flight | settled on <date> (then it moves to Landed)

Take the ones you want; skip the rest. An idea that every known copy has taken, or that is settled enough that a new copy gets it by default, moves to **Landed**, which records by date what moved into this repository, so a copy can be dated against it with `scripts/diff-upstream.ts --at <date's commit>`.

## Ideas in flight

### 2026-11-05: a project with its own glue takes the engine folder by folder

**What.** `walk/` stands alone (its `LayoutDetector` type moved out of `config.ts`, which now re-exports it), so a project can pull `audit/`, `registry/` and `walk/` without `config.ts`, `gate/`, `storybook/` or `check/`.
**Why.** The first round trip was into the codebase the pattern came from, which already owns a box walk, a gate and a Storybook hook. Pulling the whole folder would have added code it does not run; pulling `walk/` alone left one type import dangling, and giget fetches folders, not files, so `config.ts` had to be copied by hand.
**To take it.** `bun scripts/diff-upstream.ts --show walk/layout-detector.ts` and `--show config.ts`; or, for a partial copy, re-run giget on `walk` and delete your copy of `config.ts`. The eight steps the first partial adoption needed by hand: pull three folders instead of one; delete the walk's jsdom test; copy `config.ts` (now unneeded); re-export `types` and `definePart` from the engine; repoint the package's export map and one script import; add the engine folders to the no-barrel check; move the tests that depend on the project's own registry values beside the registry; copy `scripts/diff-upstream.ts` and write its pin file.
**Status.** in flight.

## Landed


### 2026-11-05

- `ADOPTING.md` complete, `scripts/diff-upstream.ts` (compares a copy with the pattern repository at a pinned commit; `--at`, `--show`, `--pin`), and this changelog's format.
- The process: `.agents/skills/parts-sweep/SKILL.md` (the sweep playbook: about five screens a batch, numbered findings, a Rulings section, accepted findings become fixes or contracts, nothing automatic) with the cold reviewer's prompt beside it; `templates/parts-review.ts` (the capture script, also the example app's own), `templates/design-review-note.md` and `templates/LEDGER.md` with eight starter rulings.
- `apps/example`: a Storybook 10 app that runs the gate on itself. Thirteen parts, eleven primitives, ten story files, every sidecar recorded at zero on CI's Chromium through the `parts-update` workflow. The first recording found three real violations in the example itself (labels and headings whose inset was padding, which sits inside the box the contract reads; a field a band's grammar did not allow; a band nested in a band), which is what the gate is for.
- `packages/parts`: the engine (fourteen contract kinds, the grammar, the context), the registry helpers (`types`, `definePart`, the manifest generator), the box walk with two layout detectors, the gate and sidecar plumbing, the Storybook hook as a function, the vitest define, and the static checks behind `runChecks`. Moved from the first codebase with every reference to it removed; 2,600 source lines and 2,200 test lines. The attribute name and the layout detector are the two configuration points (`config.ts`).
- The repository: tooling, this changelog, the first decision record (adopters copy the code in; Parts is a pattern repo, not a library), the README and a stub of the adoption guide.
