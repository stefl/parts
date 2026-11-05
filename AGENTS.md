# Parts: onboarding for agents

Parts is a rendered layout gate that adopters copy into their own repository. This repo holds the pattern: the code they copy (`packages/parts`), an example app that runs the gate on itself (`apps/example`), the review process as skills and templates, and the adoption guide. Read `README.md` first for the idea, then `docs/adr/README.md` for the decisions.

## Two commands

`bun fmt` writes. `bun check` judges: type-check, tests, lint, format and the repo's own `check:*` scripts. A PR is green when `bun run check` passes on CI; that is the only gate. Locally, run only the test files for the files you changed, by path (`bunx vitest run <path>`), and leave the whole suite to CI.

## Rules that are easy to get wrong

- **Copied code names nothing outside itself.** Nothing under `packages/parts`, `.agents`, `templates` or in `scripts/diff-upstream.ts` may contain the word fibers, a ticket reference such as `ENG-123`, or an `ADR-NNNN`. Write the reason for a rule as a plain sentence in the file. `bun run check:names` enforces this; the README may credit the origin.
- **Two things are configurable, with these defaults:** the attribute name (`data-part`) and the layout test (a class-name pattern; computed padding, margin and gap is the alternative). Do not hard-code either in new code.
- **Sidecars are recorded on CI's Chromium, never on a laptop.** Use the `parts:update` workflow and commit what it produces.
- **Decisions are ADRs** in `docs/adr/`, numbered with `fibers mint ADR "<title>"`, recorded with `fibers decide` once ruled. A record is never rewritten.
- **Conventional commits.** CI lints the PR title, which becomes main's commit subject on squash-merge.
- **No npm package.** The copy-in shape is ADR-0001; do not add a publish step.

## The board

This repo is bound to the fibers workspace `parts` (refs `PAR-n`). Before substantive work: `fibers work ls`, then `fibers claim <ref> --note "..."`. Log progress as things land, `log blocked --blocked-on human` when you need a ruling, and `release --status done` only when the PR is on main.

## Layout

```
packages/parts/     what an adopter copies (engine, registry helpers, walk, gate, storybook hook, checks)
apps/example/       Storybook 10 app with a starter registry; the gate runs on it in CI
.agents/skills/     the sweep playbook and review skills, written for any repo
templates/          capture script, batch-review doc, ledger with the starter rulings
scripts/            this repo's own checks, and diff-upstream.ts for adopters
docs/adr/           decision records
```
