# packages/parts

The code an adopter copies. Everything in this folder stands on its own: it names no other project, and the reason for each rule is a sentence in the file that enforces it.

```bash
bunx giget gh:stefl/parts/packages/parts src/parts
```

## What is here

| Folder       | What it holds                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| `audit/`     | The pure engine: `audit(boxes, parts)`, fourteen contract kinds, the nesting grammar, with their tests |
| `registry/`  | `types.ts`, `definePart`, and the manifest generator                                                   |
| `walk/`      | `collectBoxes`: the one piece of DOM code, with the two layout detectors                               |
| `gate/`      | `evaluateStory`, the sidecar read and write, the ratchet                                               |
| `storybook/` | The `afterEach` hook, the vitest `define`, the per-file guard                                          |
| `check/`     | Static checks over source and sidecars, and `runChecks` to wire them                                   |
| `config.ts`  | The two configuration points                                                                           |
| `part.ts`    | `createPart`: the helper a hand-built element uses to declare its part                                 |

## The two configuration points

**The attribute.** `data-part` by default. Zag and Ark UI already use that attribute for styling, so a project on one of them picks another (`data-ui`, `data-role`). Pass it as `attribute` to `partsGate`, `collectBoxes`, `createPart` and `runChecks`.

**The layout detector.** How the walk decides that an element lays itself out. `classNameLayout()` (the default) reads the class list for a margin, padding, gap or space utility, and pairs with the source check in `check/undeclared-layout.ts`. `computedStyleLayout()` reads the computed style, for a codebase whose class names say nothing about layout. Pass one as `layout`.

## What you add beside it

Your registry: a folder of part files, each `export default definePart({...})`, and the `manifest.ts` the generator writes there. Your `part.ts`: `createPart<PartName>()` with the `declare module "react"` block that types the attribute. Your sidecars, beside each stories file. The adoption guide at the repository root walks through each.

## Changing it

It is your code. Edit a contract, add a kind (`audit/contracts/<kind>.ts`, `registry/types.ts`, `audit/kinds.ts`, `audit/kind-names.ts`), or delete what you do not use. `scripts/diff-upstream.ts` in the pattern repository compares your copy with a commit you name, so you can see what changed upstream and take what you want.
