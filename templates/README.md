# Templates

Files an adopter copies beside `packages/parts` and makes their own. None of them is imported by the engine; each is a starting point for the process around it.

| File                    | Copy it to                                     | What it is                                                                                                     |
| ----------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `parts-review.ts`       | `scripts/parts-review.ts`                      | The capture script: screenshots and the rendered part tree for a set of stories, for the cold reviewer to read |
| `design-review-note.md` | `docs/research/<date>-design-review-<slug>.md` | The batch note: findings numbered, judged fine, could not judge, and the rulings                               |
| `LEDGER.md`             | `LEDGER.md` (or your design folder)            | The ledger of rulings, seeded with eight general ones to keep or strike                                        |

The playbook that uses them is `.agents/skills/parts-sweep/SKILL.md`, with the cold reviewer's prompt beside it.
