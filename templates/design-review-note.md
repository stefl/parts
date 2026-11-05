# Design review: <screen or area>

- **Date:** <YYYY-MM-DD>
- **Stories:** <story ids, comma separated>
- **Captures:** <folder, relative to the repo root> (not committed)
- **Reviewer:** cold pass, <agent or person>
- **Work item:** <ref, if the sweep is tracked>
- **Reach:** <how many screens the parts under review appear in>

## Findings

<The reviewer's ranked list, verbatim, numbered from 1. One line each:
`N. <story id> | <part path, e.g. band > heading> | <what reads wrong, one sentence>. <rule it breaks, or "no rule yet">. (<proposed contract, when geometric>)`
Link the screenshot that shows it where one helps.>

## Judged fine

<The reviewer's list of what it looked at and accepted, so the next run does not raise it again. Rejected findings move here after the ruling, with the words of the person who rejected them and the date.>

## Could not judge

<Verbatim: states, motion, hover, real data volume, a fixed-width story at 640, a box in the part tree that no screenshot shows.>

## Rulings

<One line per finding, in order: `N. accepted` or `N. rejected: "<their words>"`. Then what each accepted finding became: a fix (the PR or commit), a contract (the part file and kind), a ledger entry (its heading), or a work item when the fix cannot land now. Nothing here is automatic; a finding is a suggestion until a person accepts it.>
