// Node-side half of the rendered gate's baseline file access. The browser cannot touch the disk, so vitest runs
// these in node when the story hook calls them through `commands`.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  baselinePathFor,
  stableStringify,
  type PartsBaseline,
} from "./sidecar";
import type { BrowserCommand } from "vitest/node";

export type { PartsBaseline, PartsBaselineEntry } from "./sidecar";

declare module "vitest/browser" {
  interface BrowserCommands {
    readPartsBaseline: (
      storyFilePath?: string,
    ) => Promise<PartsBaseline | null>;
    writePartsBaseline: (
      json: PartsBaseline,
      storyFilePath?: string,
    ) => Promise<void>;
  }
}

// In a vitest run Storybook gives the hook no story file path (parameters
// .fileName and importPath are both undefined under the portable-stories
// runner, spiked 2026-10-27), but each stories file IS the test file, so the
// node side defaults to ctx.testPath. Pass a path only to address another file.
// The path is the LAST argument on write: the command channel drops a leading
// undefined, which shifted the json into the path slot.
export const readPartsBaseline: BrowserCommand<[string?]> = (
  ctx,
  storyFilePath,
) => {
  const file = baselinePathFor(
    ctx.project.config.root,
    storyFilePath ?? ctx.testPath ?? "",
  );
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as PartsBaseline;
};

export const writePartsBaseline: BrowserCommand<[PartsBaseline, string?]> = (
  ctx,
  json,
  storyFilePath,
) => {
  writeFileSync(
    baselinePathFor(
      ctx.project.config.root,
      storyFilePath ?? ctx.testPath ?? "",
    ),
    stableStringify(json),
  );
};
