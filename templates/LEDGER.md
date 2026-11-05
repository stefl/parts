# Taste ledger

The rulings a screen in this project follows, dated and append-only. A later ruling supersedes an earlier one by a new entry that names it, never by editing it. Each entry quotes the person who ruled, states the rule taken, and points at where it is enforced: a contract in the parts registry where the rule is geometric, a test or a check where it is not, and "not yet enforced" where it is a convention only.

Before any UI work, read this ledger and the registry. Before a sweep batch is presented, read it again: a finding that repeats a ruling is not new, and a finding that contradicts one is wrong unless the batch says why the ruling no longer fits.

The eight entries below are the starter set, carried from the first codebase this pattern ran in. Each was raised by a cold review and accepted; keep the ones that fit this project, strike the ones that do not with a dated entry saying so, and add your own underneath.

## Starter: a screen spends one solid button

Source: a checklist screen where every row's action was filled, so the eye had nowhere to land.

Rule: one solid (filled) control per screen, on the one action that matters now. On a checklist only the next unfinished row's action is filled; the rest are outlined. A recommended answer is outlined, never filled: a fill means the person's own choice.

Enforced in: not a contract (the engine reads geometry, not fill). A check that counts solid controls per story is the natural home.

## Starter: an empty state is one line

Source: empty states drawn as dashed boxes with an icon and centred text, which read as a place to drop something.

Rule: what is not there yet is said in one quiet line, where the first row would have started: the thing that is missing, then in the same sentence what fills it. No box, no icon, no centring.

Enforced in: the `empty` part, `height-in [20]` (one line of 14/20 and nothing else).

## Starter: no fill inside a fill

Source: a callout with its own tinted fill sitting on a panel that already had one, and a bordered list inside a bordered card.

Rule: one fill level per card or panel. A callout on a panel draws no fill of its own; a list is open (space, not lines, and a neutral rounded hover that meets no edge). Bordered groups belong to settings screens.

Enforced in: convention. A `card` holds `prose`, `heading`, `row.meta` and `control`; it does not hold a second `card`.

## Starter: a second line starts on its title's edge

Source: a row whose quiet second line ("tests green") sat under the clock glyph before the title, so it read as an entry of its own.

Rule: a row's second line starts where its title starts, not under a leading glyph or time. The same holds for a page header's quiet line under its title, and for the turns of a thread under their section heading.

Enforced in: `row.meta`, `aligns-left with row.title scope row` where the line says `data-row-sub="true"`.

## Starter: a popover paints above everything

Source: a popover that opened under the rows around it, so its lower half was hidden.

Rule: a popover always paints above the page, never under neighbouring rows or a sticky bar. Its stacking context is the page's, not its anchor's.

Enforced in: not yet a contract; a visual check in the review loop.

## Starter: a copy control sits outside its value

Source: a command block whose text ran under its Copy button, and a ref chip that wrapped to make room for the copy glyph beside it.

Rule: a control that copies a value sits outside the track of that value, so the value never breaks or hides to make room for it. Text in a command block stops short of its Copy button.

Enforced in: `no-overflow` on the value's part catches the text running under the control; the placement itself is convention.

## Starter: CSS never cuts text a second time

Source: a chip whose title the code had already cut on a word, then CSS cut again at a character at 640px ("replaces the de…").

Rule: text is cut once, by the code, on a whole word. CSS never truncates it again at a character. Where a box must clip, it clips nothing a person needs to read.

Enforced in: `no-cut` on the parts that carry cut text (a chip, a title).

## Starter: one full-width frame per list view

Source: a sidebar whose list views each drew their own frame at a different width, so the title in the top bar moved between views.

Rule: every list view in a pane uses the same full-width frame, so nothing above it moves when the view changes. The divider between a list and its detail runs the full height of the pane.

Enforced in: convention; `uniform-height` and `aligns-left` hold the rows inside the frame, the frame itself is a review item.
