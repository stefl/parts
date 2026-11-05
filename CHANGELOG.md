# Changelog

Parts is copied, not installed, so this file is not a list of versions. It has two sections.

**Ideas in flight** are changes to the pattern that exist in this repository and may not be in your copy yet. Each one says what it is, why, and how to take it into a copy. Take the ones you want; skip the rest.

**Landed** records, by date, what moved into this repository and when, so a copy can be dated against it.

## Ideas in flight

Nothing yet. The engine is being moved in; the first ideas will follow it.

## Landed

### 2026-11-05

- The process: `.agents/skills/parts-sweep/SKILL.md` (the sweep playbook: about five screens a batch, numbered findings, a Rulings section, accepted findings become fixes or contracts, nothing automatic) with the cold reviewer's prompt beside it; `templates/parts-review.ts` (the capture script, also the example app's own), `templates/design-review-note.md` and `templates/LEDGER.md` with eight starter rulings.
- `apps/example`: a Storybook 10 app that runs the gate on itself. Thirteen parts, eleven primitives, ten story files, every sidecar recorded at zero on CI's Chromium through the `parts-update` workflow. The first recording found three real violations in the example itself (labels and headings whose inset was padding, which sits inside the box the contract reads; a field a band's grammar did not allow; a band nested in a band), which is what the gate is for.
- `packages/parts`: the engine (fourteen contract kinds, the grammar, the context), the registry helpers (`types`, `definePart`, the manifest generator), the box walk with two layout detectors, the gate and sidecar plumbing, the Storybook hook as a function, the vitest define, and the static checks behind `runChecks`. Moved from the first codebase with every reference to it removed; 2,600 source lines and 2,200 test lines. The attribute name and the layout detector are the two configuration points (`config.ts`).
- The repository: tooling, this changelog, the first decision record (adopters copy the code in; Parts is a pattern repo, not a library), the README and a stub of the adoption guide.
