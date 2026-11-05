// Browser-side wrapper over the node commands in commands.ts. The
// vitest import only resolves inside a vitest browser run, so it is loaded
// lazily; in the Storybook dev UI the import fails and every call is a no-op.
import type { PartsBaseline } from "./commands";

export type { PartsBaseline, PartsBaselineEntry } from "./commands";

type Commands = typeof import("vitest/browser").commands;

let cached: Promise<Commands | null> | undefined;

function load(): Promise<Commands | null> {
  cached ??= import("vitest/browser").then(
    (m) => m.commands,
    () => null,
  );
  return cached;
}

/** The sidecar for a story file (default: the file under test), or null when none exists or we are outside
 * a vitest run. */
export async function readBaseline(
  storyFilePath?: string,
): Promise<PartsBaseline | null> {
  const commands = await load();
  if (commands === null || typeof commands.readPartsBaseline !== "function") {
    return null;
  }
  return commands.readPartsBaseline(storyFilePath);
}

export async function writeBaseline(
  json: PartsBaseline,
  storyFilePath?: string,
): Promise<void> {
  const commands = await load();
  if (commands === null || typeof commands.writePartsBaseline !== "function") {
    return;
  }
  await commands.writePartsBaseline(json, storyFilePath);
}

/** True only inside a vitest browser run with the parts commands registered.
 * The Storybook dev UI and any other host answer false, so the gate hook can
 * tell "no sidecar yet" (null baseline) from "not a gated run". */
export async function gateAvailable(): Promise<boolean> {
  const commands = await load();
  return commands !== null && typeof commands.readPartsBaseline === "function";
}
