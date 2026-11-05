# ADR-0001: Adopters copy the code in; Parts is a pattern repo, not a library

- **Status:** Accepted (minted ADR-0001 by `fibers mint`, held by PAR-2)
- **Date:** 2026-11-05
- **Deciders:** Stef, ruling on 2026-11-05 when the repository was created: a public repo in the shadcn shape, no npm package, no npm scope decision now.
- **Board:** D-292, recorded with `fibers decide`, anchored to PAR-1 and to this file; enforced by `scripts/check-names.ts`.

## Context

Parts was built inside one codebase as four layers: an engine (a pure audit over rendered boxes, fourteen contract kinds, a nesting grammar), glue (a box walk, a Storybook hook, a ratchet over per-story sidecars), a registry of parts with their contracts, and a process (a review loop whose accepted findings become fixes or contracts, recorded in a ledger of rulings).

Another codebase wants the same gate. The question is the shape it ships in: an npm package, a git submodule, or code the adopter copies and owns.

## Decision

Adopters copy `packages/parts` into their repository and own it from then on. There is no npm package. A script compares the copy with this repository at a pinned commit and lists the files that differ. The changelog describes each new idea with how to take it, so an adopter picks what to carry across.

## Reasons

1. **Three of the four layers are project-specific.** The registry names that product's parts. The sidecars record that product's stories. The ledger holds that product's rulings. Only the engine and its glue are the same in every adopter, and they are about 1,800 lines.
2. **A release cadence for fourteen small files is cost without benefit.** A package would need a version, a publish step, a changelog of breaking changes and a scope decision, for code that an adopter changes the moment a contract does not fit. Copying moves that cost to zero and leaves the adopter free to edit.
3. **The code is identical either way, so a copy can become a dependency later.** If a stable core emerges after several adopters, the same files can be published without rewriting anyone's copy. The reverse move, from a package back to owned code, is the one that hurts.
4. **One adopter's rules forbid the origin project's name in its tree.** Copied code with no upstream reference satisfies that; a package name would not.

## Alternatives considered

- **An npm package.** Rejected for reasons 1 to 3. It also forces the attribute name and the layout test to be configuration rather than a line the adopter edits.
- **A git submodule or subtree.** Rejected: both tie the adopter to this repository's history and make a local edit a fork to maintain.
- **A package inside each adopter's monorepo, synced by hand.** This is the copy-in shape without the diff script. Accepted in substance; the script is what makes it honest.

## Consequences

- Every file under `packages/parts` must stand alone: no reference to the origin project, its tickets or its decision records. `check:names` fails the build on one.
- The reason for each rule is a plain sentence in the file that enforces it, because the adopter will not have the document it came from.
- `CHANGELOG.md` is organised as ideas in flight, each with how to take it, rather than as versions.
- `scripts/diff-upstream.ts` is part of what an adopter copies.
