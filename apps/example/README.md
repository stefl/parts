# apps/example

A small Storybook that runs the parts gate on itself. It is the worked example the adoption guide points at, and the proof that the pattern holds outside the codebase it came from.

## What is in it

**A registry of thirteen parts** in `src/parts/`: `row`, `row.title`, `row.meta`, `list`, `list.group-label`, `bar`, `band`, `heading`, `prose`, `control`, `card`, `empty` and `field`. Each file says what the part is for and what its rendered box promises. `manifest.ts` is generated.

**Eleven primitives** in `src/ui/` that declare their part: an open list with group labels and rows, a bar with tabs and a control under one rule, a band with its heading, prose on the measure, a button on the 24/28/32 ladder, a field, a card, an empty state.

**Ten story files** in `src/stories/`, each with a sidecar `*.stories.parts.json` recorded on CI's Chromium.

## The decisions behind the look

Type is Schibsted Grotesk with JetBrains Mono for anything you might copy, both self-hosted. Colour is one dark anchor hue and one accent, in OKLCH, with every neutral derived from the anchor; light and dark both ship. Spacing is on a 4px scale; a row is 44px for one line and 60 for two; a control is 24, 28 or 32. Lists are open, with no box and no lines between rows. An empty state is one line. One solid button per screen.

## Commands

```bash
bun run storybook          # the dev UI, with the gate inert
bun run test               # every story in Chromium, with the gate (needs: bunx playwright install chromium)
bun run gen:parts          # regenerate src/parts/manifest.ts
bun run check:parts        # the static checks
```

Sidecars are recorded on CI, never on a laptop: dispatch the `parts-update` workflow on your branch, download the artifact, extract it at the repo root and commit.
