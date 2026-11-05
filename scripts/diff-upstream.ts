// Compares your copy of the parts code with the pattern repository at a
// pinned commit, and prints the files that differ. Copy this file beside your
// copy and keep `parts.upstream.json` next to it:
//
//   { "repo": "stefl/parts", "path": "packages/parts", "commit": "<sha>", "local": "src/parts" }
//
//   bun scripts/diff-upstream.ts            files that differ from the pinned commit
//   bun scripts/diff-upstream.ts --at main  ... from another ref: what upstream has that you do not
//   bun scripts/diff-upstream.ts --show walk/collect-boxes.ts   one file's unified diff
//   bun scripts/diff-upstream.ts --pin <sha>   record a new pinned commit once you have taken what you want
//
// Upstream is fetched with giget into a temporary folder, so nothing is
// installed and your copy is never touched.
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

type Upstream = Readonly<{
  repo: string;
  path: string;
  commit: string;
  /** Your copy, relative to the repository root (the folder above scripts/). */
  local: string;
}>;

const here = import.meta.dirname;
const root = path.resolve(here, "..");
const pinFile = path.join(here, "parts.upstream.json");

function readPin(): Upstream {
  if (!existsSync(pinFile)) {
    throw new Error(
      `${path.relative(root, pinFile)} is missing; write { "repo", "path", "commit", "local" } there`,
    );
  }
  return JSON.parse(readFileSync(pinFile, "utf8")) as Upstream;
}

function* walk(dir: string, base = dir): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full, base);
    else yield path.relative(base, full);
  }
}

/** Fetches `repo/path` at `ref` into a fresh temporary folder. */
export function fetchUpstream(up: Upstream, ref: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), "parts-upstream-"));
  const source = `gh:${up.repo}/${up.path}#${ref}`;
  const r = spawnSync("bunx", ["giget", source, dir, "--force"], {
    encoding: "utf8",
  });
  if (r.status !== 0) {
    // Nothing of a failed fetch is worth keeping, and the caller never sees
    // the folder to clean it up.
    rmSync(dir, { recursive: true, force: true });
    throw new Error(`giget ${source} failed:\n${r.stderr || r.stdout}`);
  }
  return dir;
}

export type Difference = Readonly<{
  file: string;
  state: "changed" | "only upstream" | "only local";
}>;

/** Every file that differs between the two folders, by content. */
export function compare(localDir: string, upstreamDir: string): Difference[] {
  const local = new Set(walk(localDir));
  const upstream = new Set(walk(upstreamDir));
  const out: Difference[] = [];
  for (const f of [...new Set([...local, ...upstream])].toSorted()) {
    if (!local.has(f)) out.push({ file: f, state: "only upstream" });
    else if (!upstream.has(f)) out.push({ file: f, state: "only local" });
    else if (
      !readFileSync(path.join(localDir, f)).equals(
        readFileSync(path.join(upstreamDir, f)),
      )
    )
      out.push({ file: f, state: "changed" });
  }
  return out;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

if (import.meta.main) {
  const up = readPin();
  const pin = arg("pin");
  if (pin !== undefined) {
    writeFileSync(
      pinFile,
      `${JSON.stringify({ ...up, commit: pin }, null, 2)}\n`,
    );
    console.log(`pinned ${up.repo}/${up.path} at ${pin}`);
    process.exit(0);
  }
  const ref = arg("at") ?? up.commit;
  const localDir = path.resolve(root, up.local);
  const upstreamDir = fetchUpstream(up, ref);
  try {
    const show = arg("show");
    if (show !== undefined) {
      // -N treats a file that exists on one side only as empty, so an added
      // or deleted file shows as a whole-file diff instead of an error.
      const r = spawnSync(
        "diff",
        ["-u", "-N", path.join(upstreamDir, show), path.join(localDir, show)],
        { encoding: "utf8" },
      );
      process.stdout.write(r.stdout);
      if (r.status === 2) {
        process.stderr.write(r.stderr);
        process.exitCode = 2;
      }
    } else if (compare(localDir, upstreamDir).length === 0) {
      console.log(`${up.local} matches ${up.repo}/${up.path} at ${ref}`);
    } else {
      const diffs = compare(localDir, upstreamDir);
      console.log(`${up.local} against ${up.repo}/${up.path} at ${ref}:`);
      for (const d of diffs) console.log(`  ${d.state.padEnd(13)} ${d.file}`);
      console.log(
        `\n${diffs.length} file(s) differ. --show <file> prints one; --pin <sha> records a new pinned commit.`,
      );
    }
  } finally {
    rmSync(upstreamDir, { recursive: true, force: true });
  }
}
