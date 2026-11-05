# Changelog

Parts is copied, not installed, so this file is not a list of versions. It has two sections.

**Ideas in flight** are changes to the pattern that exist in this repository and may not be in your copy yet. Each one says what it is, why, and how to take it into a copy. Take the ones you want; skip the rest.

**Landed** records, by date, what moved into this repository and when, so a copy can be dated against it.

## Ideas in flight

Nothing yet. The engine is being moved in; the first ideas will follow it.

## Landed

### 2026-11-05

- `packages/parts`: the engine (fourteen contract kinds, the grammar, the context), the registry helpers (`types`, `definePart`, the manifest generator), the box walk with two layout detectors, the gate and sidecar plumbing, the Storybook hook as a function, the vitest define, and the static checks behind `runChecks`. Moved from the first codebase with every reference to it removed; 2,600 source lines and 2,200 test lines. The attribute name and the layout detector are the two configuration points (`config.ts`).
- The repository: tooling, this changelog, the first decision record (adopters copy the code in; Parts is a pattern repo, not a library), the README and a stub of the adoption guide.
