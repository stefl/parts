# Parts

A rendered layout gate for component libraries. Every element on the page says what it is, and a test measures whether it looks like that.

## What the existing checks leave to the eye

The checks a codebase usually already runs each do one job well. Lint reads the source. Type checks read the types. Accessibility checks read the ARIA tree, the structure a screen reader is given. Screenshot tests say when the pixels changed. Some layout bugs sit outside all four.

A tab bar whose underline stops short of the last control. A list whose group labels sit on a different left edge from its rows. A button 30px tall in a row of 28px buttons. Each of those checks reads something other than the rendered boxes, and I think the rendered boxes are where these bugs live.

I hit this in my own codebase after a spacing sweep had moved every margin and padding on to a short list of agreed sizes. Two screens still read wrong, and I had no check that could say why.

## The method

Parts gives the page a vocabulary and checks it against the rendered geometry. Five steps.

**Declare.** A component says what it is with one attribute, `data-part="row.title"`. A registry holds one file per part: its purpose, its level in the page, which parts it may sit inside, which it may contain, and its contracts, the layout promises the Judge step describes. The attribute name is yours to choose, since some UI libraries already use `data-part` for styling.

**Measure.** After each Storybook story renders in a real browser, a hook walks the rendered elements and records each one as a box: its part, its rectangle, its bottom border, and whether it does layout of its own.

**Judge.** A function with no access to the page takes the boxes and the registry and reports violations, so most of it is tested without a browser. Fourteen contract kinds cover the cases I met, and I'd expect them to cover most of the common ones. A rule spans its bar. A label aligns with the titles below it. A control is one of a few agreed heights. Gaps are one of a few agreed sizes. A heading sits closer to what follows than to what precedes it. Text is cut once at most.

Two more checks ride with the contracts. A nesting grammar checks that each part sits where the registry says it may. An element that lays itself out but carries no part is counted as unclassified.

**Ratchet.** Each story file has a small JSON sidecar recording its violation count and its unclassified count. The numbers may only go down. A story that gets worse fails the automated checks on the pull request. A story that improves asks you to re-record.

**Review.** The gate catches what a contract describes and nothing else, so new contracts come from a review loop. The loop I run is: capture the screens with their boxes drawn, number the findings, and have a person rule on each one. An accepted finding becomes a code fix or a new contract. A rejected one is written down so it is not raised again.

## What to expect: one codebase's first five days

I built this inside fibers, a session registry I work on, between 27 October and 5 November 2026.

|                        | Start  | After five days |
| ---------------------- | ------ | --------------- |
| Stories under the gate | 908    | 908             |
| Sidecar files          | 165    | 165             |
| Contract violations    | 1,459  | 0               |
| Unclassified boxes     | 16,095 | 0               |

That took about 40 pull requests. The review loop raised 248 findings. 222 were accepted and became fixes or contracts, and the 26 rejected ones were recorded with the reason.

## What you copy and what you own

Parts is a pattern, not a package. You copy the code into your repository and own it from then on, the way shadcn/ui works.

**You copy** the folder `packages/parts`. It holds the engine that judges the boxes, the fourteen contracts with their tests, and the nesting grammar. It also holds the box walk that records each rendered element, the gate that reads the sidecars, the Storybook hook, and the `part()` helper that writes the attribute for you. The static checks read your source for unknown part names and undeclared layout. About 1,800 lines, with no dependency beyond Storybook and Vitest, which I'd expect a component library to have already.

**You own** everything specific to your product. There are four layers: the engine, the registry of parts, the sidecars, and the ledger of rulings with the review findings behind it. Three of them are yours from the first day, which is why this is a copy and not a library. The reasoning is in the first decision record.

**Staying current.** A small script compares your copy with this repository at a commit you name and lists the files that differ. The changelog describes each new idea with how to take it, so you pick what you want and leave the rest.

## Where to start

The changelog says which of these have landed. On the day this README was written, only the decision records had.

- `ADOPTING.md`: copying the code in, wiring the hook, recording baselines.
- `docs/adr/`: the decisions, with their reasons.
- `CHANGELOG.md`: ideas in flight, each with how to take it.
- `apps/example`: a small Storybook app that runs the gate on itself.

## Status

Early, and moving in phases. The repository was created on 5 November 2026 with this description and the tooling. The engine, the example app, the review process and the adoption guide follow, each as its own pull request, and the changelog says which have landed.

## Origin

Parts began as a set of rules inside [fibers](https://github.com/stefl/fibers). The code here is that code with the project-specific pieces removed and the reason for each rule written as a plain sentence. MIT licence.
