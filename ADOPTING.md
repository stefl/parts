# Adopting Parts

How to copy Parts into your repository and own it. This is a stub: the full guide lands with the adoption phase, once the engine and the example app are in this repository.

## What the guide will cover

**Copying the code in.** One command pulls `packages/parts` into a folder you choose, with no package to install:

```bash
bunx giget gh:stefl/parts/packages/parts src/parts
```

**Wiring the hook.** An `afterEach` in your Storybook `preview.tsx`, and one `define` in your Vitest browser config so the hook knows whether it is comparing or recording.

**Recording baselines on CI first.** Sidecars record what CI's Chromium measures, not a laptop's, so the first recording is a workflow run.

**Growing the registry.** Start with about a dozen parts and add one only when a contract or a grammar rule goes with it.

**The two configuration points.** The attribute name (default `data-part`) and the test for "does this element lay itself out" (a class-name pattern, or computed padding, margin and gap).

**When the gate goes red.** Reading a violation, deciding between a fix, a new contract and an allowed exception, and re-recording.

**Staying current.** `scripts/diff-upstream.ts` compares your copy with this repository at a pinned commit and lists the files that differ.
