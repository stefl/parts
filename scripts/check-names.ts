// The code an adopter copies must stand on its own. It names no other
// project, no ticket and no decision record: those point at documents the
// adopter does not have, and one adopter forbids the origin project's name
// in its tree outright. The WHY of each rule is a plain sentence in the file.
//
// Run as `bun run check:names`; part of `bun run check`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** Folders and files an adopter copies, relative to the repo root. */
export const COPIED_PATHS = [
  "packages",
  ".agents",
  "templates",
  "scripts/diff-upstream.ts",
];

/** Each pattern with the reason it is refused, for the failure message. */
export const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  {
    pattern: /fibers/i,
    why: "names the origin project; one adopter forbids the word in its tree",
  },
  {
    pattern: /\bENG-\d+\b/,
    why: "a ticket in another project's tracker",
  },
  {
    pattern: /\bADR-\d{4}\b/,
    why: "a decision record the adopter does not have; write the reason as a sentence",
  },
];

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".css",
  ".html",
  ".txt",
]);

function* walk(path: string): Generator<string> {
  let info;
  try {
    info = statSync(path);
  } catch {
    return;
  }
  if (info.isFile()) {
    yield path;
    return;
  }
  for (const name of readdirSync(path)) {
    if (name === "node_modules" || name === "storybook-static") continue;
    yield* walk(join(path, name));
  }
}

export type Hit = { file: string; line: number; text: string; why: string };

/** Every forbidden match under the copied paths, as repo-relative hits. */
export function findHits(root: string): Hit[] {
  const hits: Hit[] = [];
  for (const entry of COPIED_PATHS) {
    for (const file of walk(join(root, entry))) {
      const dot = file.lastIndexOf(".");
      if (dot === -1 || !TEXT_EXTENSIONS.has(file.slice(dot))) continue;
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((text, i) => {
        for (const { pattern, why } of FORBIDDEN) {
          if (pattern.test(text)) {
            hits.push({ file: relative(root, file), line: i + 1, text, why });
          }
        }
      });
    }
  }
  return hits;
}

if (import.meta.main) {
  const hits = findHits(process.cwd());
  for (const hit of hits) {
    console.error(
      `${hit.file}:${hit.line}: ${hit.why}\n    ${hit.text.trim()}`,
    );
  }
  if (hits.length > 0) {
    console.error(
      `\ncheck:names: ${hits.length} line(s) in copied code name something an adopter does not have.`,
    );
    process.exit(1);
  }
  console.log("check:names: copied code names nothing outside itself");
}
