---
name: parts-sweep
description: Use when asked to sweep a set of screens for layout that reads wrong, to run a design review of stories, to bring a story file's parts sidecar to zero, or to turn review findings into contracts. Runs the judged loop behind the parts gate: capture about five screens with their boxes drawn, number the findings, get a ruling on each, and turn accepted findings into fixes or contracts. Nothing in it is automatic; a finding is a suggestion until a person accepts it.
---

# Parts sweep: the judged review loop

The rendered gate catches what a contract describes and nothing else. New rules come from here: a cold read of real screens, in part vocabulary, ruled on one finding at a time. This skill runs that loop for one batch. It works in any repository that has copied `packages/parts` and has a registry, a ledger and Storybook stories.

## What you need before you start

- The project's registry folder (one file per part) and its generated manifest.
- The project's ledger of rulings (`LEDGER.md` or wherever the project keeps it). If there is none, start one from `templates/LEDGER.md`.
- The capture script, copied from `templates/parts-review.ts` and pointed at the project's Storybook and registry.
- A person who will rule. Where a standing instruction says to work unattended, take the default you would recommend, write it down as the default taken, and carry on; never present a default as their ruling.

## The loop, one batch

**1. Pick about five screens.** A batch is one area: a board and its peek, a settings page and its panels, a form and its states. Fewer than three screens finds little that generalises; more than seven and the rulings blur. Prefer screens whose sidecars still carry undeclared boxes or violations: the sidecar numbers are the queue. Record the batch's stories and the reason for the grouping.

**2. Capture.** By hand, never in CI:

```bash
bun scripts/parts-review.ts --file src/stories/List.stories.tsx
bun scripts/parts-review.ts --stories list--grouped,bar--tabs-with-control
```

The script starts a Storybook on a private port (or uses `--port` of a running one), and for each story writes `<out>/<story-id>/light-1280.png`, `dark-1280.png`, `light-640.png` and `parts.json`, the rendered part tree from the same box walk the gate uses. The Storybook is killed by PID at the end. A folder that already has files is refused; use a fresh `--out` or `--force`.

**3. Dispatch the cold reviewer.** Use the prompt in `design-reviewer.md` beside this file, as a sub-agent where the environment has one and otherwise as a fresh session. The brief carries only the capture folder path, today's date, and the paths of the registry, the ledger and the type sheet if the project has one. Nothing about why the screens exist or what has been said about them. Judgement runs on the most capable model available.

**4. Write the note.** From `templates/design-review-note.md`, into the project's research folder, named `<date>-design-review-<slug>.md`: the reviewer's findings verbatim and numbered, the "Judged fine" and "Could not judge" lists, screenshots linked. A rerun on the same day gets a `-2` suffix. A note is never edited after the ruling; a later batch gets a later note.

**5. Drop what has already been ruled.** Before presenting: strike any finding that repeats a ledger entry (it is not new; apply the rule instead), any finding that is a story's fixture data (titles, names, casing), any finding on a fixed-width story at 640 (identical captures; list it under "Could not judge"), and any box in `parts.json` that no screenshot shows. Say in the note which you struck and why.

**6. Present one batch, numbered.** Translate each finding into plain words for someone who has not seen the screens, one line each:

```
N. <story> | <part path> | <what reads wrong> | <rule, or "no rule yet"> | recommend: accept / reject, and why in a few words
```

Mark the batch as the reviewer's findings, unverified by you, unless you have checked one yourself. Ask once for a ruling on every line; a yes/no per number is enough. Where the person rules "as recommended", your recommendations are the rulings, and the note says so.

**7. On accept, per finding, in this order.**

- Fix the screen first. The gate fails a story above its recorded numbers, and record mode only ever lowers a count, so a new contract that the screen still breaks leaves the gate red. When the fix cannot land now, allow the known defect in the story (`parameters.parts.allow: { "part:kind": "<reason>" }`; the reason is required) and open a work item for the fix.
- Where the finding is geometric, add the contract to the part's file (or add a part, then regenerate the manifest), with a unit test in the contract's own file: one shape it catches, one near-miss it passes.
- Append a ledger entry: a dated heading, the source (which screen, what was seen), the rule in one or two sentences, who ruled and their words, and where it is enforced.
- Where the finding is a matter of taste rather than a rule of this project, record it in the project's taste record too, if one exists.
- Re-record the sidecars on CI (the `parts-update` workflow), commit what comes back.

**8. On reject,** move the finding to "Judged fine" in the note with the person's words and the date. No code, no ledger entry. The next reviewer's brief includes the note, so it is not raised again.

**9. Hand off.** Contract and screen changes go through the normal pull request path and CI. This skill merges nothing by itself.

## What a batch report says

Bottom line first: how many findings, how many accepted, what became a contract and what became a fix. Then the numbered list with the ruling beside each. Then what the sidecars read before and after. Then what CI covered that you did not run locally. Every finding glossed, every reference expanded; the reader was not in the room.

## Conventions

- Captures are not committed; the research folder's capture subfolders are gitignored and the note links them by path. Embed at most one or two PNGs a finding needs.
- Calibrate first. The first batch in a new project runs on screens someone has already ruled on, so the reviewer's findings can be compared with the rulings and its brief tightened before it is trusted on new screens.
- A sweep that finds nothing is a result. Write the note with an empty findings list and a full "Judged fine".
- Never let a contract land without its ruling. The engine is only as good as the rulings behind it, and a contract nobody asked for is a rule nobody will defend.
