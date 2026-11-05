// Runs every static check over a project, from one config. A project wraps
// this in a small script (`scripts/check-parts.ts`) and adds it to its gate:
//
//   import { runChecks } from "<your copy>/check/run";
//   const problems = await runChecks({ root, registryDir, sourceDirs, ... });
//   if (problems.length) { problems.forEach((p) => console.error(p)); process.exit(1); }
//
// The checks, each failing with a plain line:
//   1. The generated manifest is fresh.
//   2. No index.ts in the registry folder: a barrel is where parallel
//      branches clash.
//   3. Every literal part name in source (stories and tests excluded) is a
//      registered part.
//   4. Every within/contains/with/scope/of reference in the registry names a
//      registered part.
//   5. Every story export has an entry in its sidecar, so a new story cannot
//      skip the rendered gate.
//   6. parameters.parts.allow is written { "part:kind": "<reason>" }.
//   7. Optional (`requireZero`): every sidecar entry is zero violations,
//      zero unclassified, for a project that has swept every story there.
//   8. Optional (`undeclaredLayout`): no JSX tag in source lays itself out
//      without declaring a part.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { ZERO_HINT } from "../gate/gate";
import { generate } from "../registry/manifest";
import type { PartDefinition } from "../registry/types";
import {
  danglingReferences,
  findPartNames,
  missingKeys,
  nonZeroEntries,
  type SidecarEntry,
  storyKeys,
  unknownNames,
  unreasonedAllows,
} from "./names";
import {
  findUndeclaredLayout,
  type UndeclaredLayoutOptions,
} from "./undeclared-layout";

export type CheckConfig = Readonly<{
  /** Absolute path the other paths are relative to. */
  root: string;
  /** The folder of part files, with its generated manifest.ts. */
  registryDir: string;
  /** The registry as loaded: name to definition. */
  parts: Readonly<Record<string, PartDefinition>>;
  /** Folders whose .tsx files are checked for part names and layout. */
  sourceDirs: readonly string[];
  /** The part attribute (config.ts). */
  attribute?: string;
  /** Names a registry may reference without defining (ARIA words). */
  ariaNames?: ReadonlySet<string>;
  /** Files (relative to a source dir) the name and layout checks skip
   * beyond stories and tests: fixtures, mocks, generated code. */
  exempt?: (relative: string) => boolean;
  /** Fail a sidecar entry above zero (check 7). */
  requireZero?: boolean;
  /** Run the undeclared-layout source check (check 8) with these options. */
  undeclaredLayout?: UndeclaredLayoutOptions;
}>;

function* walk(dir: string, ext: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") yield* walk(full, ext);
    } else if (entry.name.endsWith(ext)) {
      yield full;
    }
  }
}

const isStory = (f: string): boolean => /\.stories\.tsx?$/.test(f);
const isTest = (f: string): boolean => /\.test\.tsx?$/.test(f);

type Sidecar = Record<string, SidecarEntry> | null;

function readSidecar(storyFile: string): { path: string; sidecar: Sidecar } {
  const sidecarPath = storyFile.replace(/\.tsx$/, ".parts.json");
  const sidecar = existsSync(sidecarPath)
    ? (JSON.parse(readFileSync(sidecarPath, "utf8")) as Record<
        string,
        SidecarEntry
      >)
    : null;
  return { path: sidecarPath, sidecar };
}

/** Checks 5 to 7 on one stories file. */
function checkStory(
  config: CheckConfig,
  shown: string,
  file: string,
  source: string,
): string[] {
  const problems: string[] = [];
  const { path: sidecarPath, sidecar } = readSidecar(file);
  for (const key of missingKeys(storyKeys(source), sidecar)) {
    problems.push(
      `${shown}: story "${key}" has no entry in ${path.basename(sidecarPath)}; record it with the parts:update workflow`,
    );
  }
  for (const line of unreasonedAllows(source)) {
    problems.push(
      `${shown}:${line}: parameters.parts.allow needs a written reason per violation: { "part:kind": "<why it is an exception>" }`,
    );
  }
  if (config.requireZero && sidecar !== null) {
    for (const entry of nonZeroEntries(sidecar)) {
      problems.push(`${shown}: story ${entry}; ${ZERO_HINT}`);
    }
  }
  return problems;
}

/** Checks 3 and 8 on one source file. */
function checkSource(
  config: CheckConfig,
  shown: string,
  source: string,
  known: readonly string[],
): string[] {
  const attribute = config.attribute ?? "data-part";
  const problems: string[] = [];
  for (const use of unknownNames(findPartNames(source, attribute), known)) {
    problems.push(
      `${shown}:${use.line}: "${use.name}" is not a registered part`,
    );
  }
  if (config.undeclaredLayout !== undefined) {
    for (const f of findUndeclaredLayout(source, {
      attribute,
      ...config.undeclaredLayout,
    })) {
      problems.push(`${shown}:${f.line}: ${f.message}`);
    }
  }
  return problems;
}

/** Checks 1 and 2 on the registry folder. */
async function checkRegistry(config: CheckConfig): Promise<string[]> {
  const problems: string[] = [];
  const registryDir = path.resolve(config.root, config.registryDir);
  const manifestFile = path.join(registryDir, "manifest.ts");
  const want = await generate(registryDir);
  const have = existsSync(manifestFile)
    ? readFileSync(manifestFile, "utf8")
    : "";
  if (want !== have) {
    problems.push(
      `${path.relative(config.root, manifestFile)} is stale; regenerate it (bun <your copy>/registry/manifest.ts ${config.registryDir})`,
    );
  }
  if (existsSync(path.join(registryDir, "index.ts"))) {
    problems.push(
      `${config.registryDir}/index.ts exists; barrels are not allowed here (they make branches clash)`,
    );
  }
  return problems;
}

export async function runChecks(config: CheckConfig): Promise<string[]> {
  const known = Object.keys(config.parts);
  const problems: string[] = await checkRegistry(config);
  for (const dir of config.sourceDirs) {
    const abs = path.resolve(config.root, dir);
    for (const file of walk(abs, ".tsx")) {
      const relative = path.relative(abs, file);
      const shown = `${dir}/${relative}`;
      const source = readFileSync(file, "utf8");
      if (isStory(file)) {
        problems.push(...checkStory(config, shown, file, source));
      } else if (!isTest(file) && !config.exempt?.(relative)) {
        problems.push(...checkSource(config, shown, source, known));
      }
    }
  }
  problems.push(
    ...danglingReferences(Object.values(config.parts), known, config.ariaNames),
  );
  return problems;
}
