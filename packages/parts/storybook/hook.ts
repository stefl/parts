// The rendered gate as a Storybook `afterEach`. Install it in preview.tsx:
//
//   import { partsGate } from "<your copy>/storybook/hook";
//   const preview: Preview = { ..., afterEach: partsGate({ parts }) };
//
// It runs after render and play, per story, inside the vitest browser run
// only: gateAvailable() is false in the Storybook dev UI, so the hook is
// inert there. Story parameters:
//   parameters.parts.skip = true    skip the story (needs a reason in a
//     comment beside it; for stories that render only into portals).
//   parameters.parts.allow = { "part:kind": "<reason>" }   leave those
//     out of the count; each needs a written reason.
// PARTS_UPDATE=1 (through the vitest define, see define.ts) records the
// measured numbers, down only once recorded. A new story's entry is recorded
// only at zero, so a story that measures above zero fails until it is fixed
// or its violation allowed.
import type { PartsOptions } from "../config";
import { gateAvailable, readBaseline, writeBaseline } from "../gate/baseline";
import { evaluateSkipped, evaluateStory, storyKey } from "../gate/gate";
import { markGateRan } from "../gate/gate-ran";
import type { PartDefinition } from "../registry/types";
import { collectBoxes } from "../walk/collect-boxes";

/** The slice of Storybook's story context the hook reads, so this file has
 * no dependency on a Storybook package. */
export type StoryContextLike = Readonly<{
  id: string;
  parameters: Readonly<Record<string, unknown>>;
  canvasElement: HTMLElement;
}>;

export type PartsGateOptions = PartsOptions &
  Readonly<{
    /** The registry: part name to definition, from the generated manifest. */
    parts: Readonly<Record<string, PartDefinition>>;
  }>;

type GateParameters = { skip?: boolean; allow?: unknown } | undefined;

function updateMode(): boolean {
  return typeof PARTS_UPDATE_MODE !== "undefined" && PARTS_UPDATE_MODE;
}

export function partsGate(
  options: PartsGateOptions,
): (context: StoryContextLike) => Promise<void> {
  return async (context) => {
    const gate = context.parameters.parts as GateParameters;
    // A skipped story still counts as the hook having run: the per-file
    // check only asks whether the hook fired at all. The static check wants
    // a sidecar key for every story, so record mode writes zeros for it;
    // compare mode just passes it.
    if (gate?.skip === true) {
      if (updateMode() && (await gateAvailable())) {
        const recorded = (await readBaseline()) ?? {};
        const key = storyKey(context.id);
        const skipped = evaluateSkipped(recorded[key], true);
        if (skipped.write !== undefined) {
          await writeBaseline({ ...recorded, [key]: skipped.write });
        }
      }
      markGateRan();
      return;
    }
    if (!(await gateAvailable())) {
      // Under vitest a missing command channel would make every story pass
      // unchecked (the gate must prove it ran), so fail loudly.
      // PARTS_UPDATE_MODE is a vitest `define` that exists (true or false)
      // in every run of the storybook project and nowhere else, which is a
      // sturdier test than import.meta.env.VITEST. The Storybook dev UI
      // keeps the silent no-op.
      if (typeof PARTS_UPDATE_MODE !== "undefined") {
        throw new Error("parts gate: vitest/browser commands unavailable");
      }
      return;
    }
    // The walk reads `ch` from the font a box draws in; measured while a
    // web font is still loading, the fallback's "0" is narrower than the
    // face the box was laid out in, so a paragraph at exactly the measure
    // read as over it on a file's first story.
    await document.fonts.ready;
    const baseline = (await readBaseline()) ?? {};
    const key = storyKey(context.id);
    const result = evaluateStory({
      boxes: collectBoxes(context.canvasElement, options),
      parts: options.parts,
      allow: gate?.allow,
      entry: baseline[key],
      update: updateMode(),
    });
    if (result.write !== undefined) {
      await writeBaseline({ ...baseline, [key]: result.write });
    }
    markGateRan();
    if (result.error !== undefined) throw new Error(result.error);
  };
}
