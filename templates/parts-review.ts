// Capture screens for the judged design review. By hand, never in CI.
//
// Copy this file into your project's scripts folder and set the three paths
// in SETTINGS below. Run with bun:
//
//   bun scripts/parts-review.ts --stories <id,id,...> | --file <path/to/X.stories.tsx>
//                               [--limit N] [--port 6111] [--out <dir>] [--force]
//
// For each story it writes <out>/<story-id>/{light-1280.png, dark-1280.png,
// light-640.png, parts.json}. parts.json is the rendered part tree (part,
// level from the registry, rect, text, children), built by the same box walk
// the gate uses, bundled and injected into the page, so the reviewer and the
// gate see one tree and a change to the walk reaches both.
//
// A story that wraps itself in .dark (or .light) cannot be flipped from
// outside, so it is theme-locked: parts.json says so and only that theme's
// PNGs are written.
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { parts } from "../src/parts/manifest";
import type { Box } from "../src/parts/types";

// ---------------------------------------------------------------------------
// SETTINGS: the three things that differ between projects.
const SETTINGS = {
  /** The folder holding .storybook/, where `storybook dev` runs. */
  storybookCwd: path.resolve(import.meta.dirname, ".."),
  /** The copied box walk, bundled into the page at capture time. */
  collectBoxes: path.resolve(
    import.meta.dirname,
    "../../../packages/parts/walk/collect-boxes.ts",
  ),
  /** Where capture folders go, as <date>-design-review-<slug>. */
  researchDir: path.resolve(import.meta.dirname, "../docs/research"),
  /** The part attribute, if the project changed it. */
  attribute: "data-part",
};
// ---------------------------------------------------------------------------

type Page = {
  goto: (url: string) => Promise<unknown>;
  waitForFunction: (fn: string, o: { timeout: number }) => Promise<unknown>;
  waitForTimeout: (ms: number) => Promise<void>;
  evaluate: (
    fn: string | ((d: boolean) => void),
    arg?: boolean,
  ) => Promise<unknown>;
  screenshot: (o: { path: string; fullPage: boolean }) => Promise<unknown>;
  setViewportSize: (s: { width: number; height: number }) => Promise<void>;
  close: () => Promise<void>;
};
type Browser = {
  newPage: (o: {
    viewport: { width: number; height: number };
  }) => Promise<Page>;
  close: () => Promise<void>;
};

/** `UuidKey` becomes `uuid-key`, the way Storybook builds a story id's
 * suffix; the same conversion the static check uses for sidecar keys. */
export function kebab(exportName: string): string {
  return exportName
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replaceAll(/([a-zA-Z])([0-9])/g, "$1 $2")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

/** Storybook's own id rule: lowercase, runs of anything else become one dash. */
export function sanitize(s: string): string {
  return s
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function balancedObject(source: string, from: number): string | undefined {
  const open = source.indexOf("{", from);
  if (open === -1) return undefined;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}" && --depth === 0)
      return source.slice(open, i + 1);
  }
  return undefined;
}

/** The title in the default export's meta object, and only there. */
export function metaTitle(source: string): string | undefined {
  const d = /export\s+default\s+(\{|(\w+))/.exec(source);
  if (d === null) return undefined;
  let obj: string | undefined;
  if (d[1] === "{") {
    obj = balancedObject(source, d.index + d[0].length - 1);
  } else {
    const decl = new RegExp(
      `(?:const|let|var)\\s+${d[2]}\\b[^=]*=\\s*\\{`,
    ).exec(source);
    if (decl !== null) obj = balancedObject(source, decl.index);
  }
  if (obj === undefined) return undefined;
  let depth = 0;
  let flat = "";
  for (const ch of obj) {
    if (ch === "{" || ch === "[") depth++;
    flat += depth > 1 ? " " : ch;
    if (ch === "}" || ch === "]") depth--;
  }
  return /\btitle:\s*["'`]([^"'`]+)["'`]/.exec(flat)?.[1];
}

/** Story ids for one stories file: title kebab + "--" + export kebab. */
export function storyIdsFromSource(source: string): {
  title: string;
  ids: string[];
} {
  const title = metaTitle(source);
  if (title === undefined) throw new Error("no title in the default export");
  const titleId = sanitize(title);
  const ids: string[] = [];
  for (const m of source.matchAll(/^export const (\w+)\b/gm)) {
    const name = m[1];
    if (name === undefined) continue;
    ids.push(`${titleId}--${kebab(name)}`);
  }
  return { title, ids };
}

const flat = (s: string): string => s.replaceAll("-", "");

/** Asked-for ids Storybook's index does not have, each with the ids it may
 * have meant, so a wrong id fails at once instead of timing out per story. */
export function unknownIds(
  asked: readonly string[],
  known: readonly string[],
): { id: string; hints: string[] }[] {
  const have = new Set(known);
  return asked
    .filter((id) => !have.has(id))
    .map((id) => {
      const same = known.filter((k) => flat(k) === flat(id));
      if (same.length > 0) return { id, hints: same };
      const title = flat(id.split("--")[0] ?? id);
      return {
        id,
        hints: known.filter((k) => flat(k.split("--")[0] ?? k) === title),
      };
    });
}

export function freshDir(base: string, taken: (p: string) => boolean): string {
  if (!taken(base)) return base;
  for (let n = 2; ; n++) if (!taken(`${base}-${n}`)) return `${base}-${n}`;
}

export type PartNode = {
  part: string;
  level: number | null;
  rect: { x: number; y: number; w: number; h: number };
  text: string;
  attrs?: Record<string, string>;
  children: PartNode[];
};

/** Nest a flat box list by parentId. Only boxes with a part appear; a part
 * whose parent has none moves up to the nearest ancestor that has one. */
export function nestBoxes(
  boxes: readonly Box[],
  levelOf: (part: string) => number | null,
): PartNode[] {
  const byId = new Map(boxes.map((b) => [b.id, b]));
  const nodes = new Map<number, PartNode>();
  const roots: PartNode[] = [];
  const nearestPartAncestor = (b: Box): number | null => {
    let p = b.parentId;
    while (p !== null) {
      const pb = byId.get(p);
      if (pb === undefined) return null;
      if (pb.part !== null) return pb.id;
      p = pb.parentId;
    }
    return null;
  };
  for (const b of boxes) {
    if (b.part === null) continue;
    const node: PartNode = {
      part: b.part,
      level: levelOf(b.part),
      rect: { ...b.rect },
      text: b.text ?? "",
      ...(Object.keys(b.attrs).length > 0 ? { attrs: { ...b.attrs } } : {}),
      children: [],
    };
    nodes.set(b.id, node);
    const anc = nearestPartAncestor(b);
    const parent = anc === null ? undefined : nodes.get(anc);
    (parent === undefined ? roots : parent.children).push(node);
  }
  return roots;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function waitFor(url: string, ms: number): Promise<void> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`timed out waiting for ${url}`);
}

/** Playwright by path: it is a dependency of the Storybook project, found
 * under bun's isolated store or a plain node_modules. */
async function loadPlaywright(): Promise<{
  chromium: { launch: () => Promise<Browser> };
}> {
  const candidates = [
    path.join(SETTINGS.storybookCwd, "node_modules/playwright/index.mjs"),
  ];
  for (const root of [
    SETTINGS.storybookCwd,
    path.resolve(SETTINGS.storybookCwd, "../.."),
  ]) {
    const store = path.join(root, "node_modules/.bun");
    if (existsSync(store)) {
      const hit = readdirSync(store).find((d) => /^playwright@\d/.test(d));
      if (hit !== undefined)
        candidates.push(
          path.join(store, hit, "node_modules/playwright/index.mjs"),
        );
    }
  }
  const found = candidates.find((c) => existsSync(c));
  if (found === undefined)
    throw new Error(
      "playwright not found; install it in the Storybook project",
    );
  return (await import(found)) as {
    chromium: { launch: () => Promise<Browser> };
  };
}

/** The gate's walk as page source: the module bundled with its imports, the
 * trailing `export { … }` dropped, returning the function. */
async function walkSource(): Promise<string> {
  const built = await Bun.build({
    entrypoints: [SETTINGS.collectBoxes],
    target: "browser",
    format: "esm",
  });
  if (!built.success || built.outputs[0] === undefined)
    throw new Error(`collect-boxes: bundle failed: ${built.logs.join("; ")}`);
  const js = await built.outputs[0].text();
  const tail = /^export\s*\{[^}]*\};?\s*$/m;
  if (!tail.test(js)) throw new Error("collect-boxes: no exports to strip");
  return `${js.replace(tail, "")}\nreturn collectBoxes;`;
}

const levelOf = (p: string): number | null => parts[p]?.level ?? null;

async function captureStory(
  page: Page,
  url: string,
  id: string,
  dir: string,
  walk: string,
): Promise<number | null> {
  await page.goto(url);
  // Storybook's own signal: the preview sets currentRender.phase to finished
  // once render and play are done, or errored/aborted when they fail.
  await page.waitForFunction(
    `["finished","errored","aborted"].includes(window.__STORYBOOK_PREVIEW__?.currentRender?.phase) || document.body.classList.contains("sb-show-errordisplay")`,
    { timeout: 30_000 },
  );
  const renderError = await page.evaluate(
    `document.body.classList.contains("sb-show-errordisplay")`,
  );
  if (renderError === true) {
    console.error(`${id}: failed to render (Storybook error display)`);
    return null;
  }
  await page.waitForTimeout(800);
  const locked = (await page.evaluate(
    `(() => { const el = document.querySelector("#storybook-root .dark, #storybook-root .light"); return el === null ? null : el.classList.contains("dark") ? "dark" : "light"; })()`,
  )) as "dark" | "light" | null;
  // After the flip, wait out the colour transitions: a screenshot taken at
  // once holds controls half-way between the themes.
  const setDark = async (on: boolean) => {
    await page.evaluate((d: boolean) => {
      document.documentElement.classList.toggle("dark", d);
      document.documentElement.classList.toggle("light", !d);
    }, on);
    await page.waitForTimeout(400);
  };
  await setDark(locked === "dark");
  if (locked !== null)
    console.log(
      `${id}: theme-locked (${locked}): the other theme's captures skipped`,
    );
  await page.screenshot({
    path: path.join(dir, `${locked ?? "light"}-1280.png`),
    fullPage: true,
  });
  const boxes = (await page.evaluate(
    `(() => { const collectBoxes = (() => { ${walk} })(); return collectBoxes(document.querySelector("#storybook-root"), { attribute: ${JSON.stringify(SETTINGS.attribute)} }); })()`,
  )) as Box[];
  writeFileSync(
    path.join(dir, "parts.json"),
    `${JSON.stringify({ themeLocked: locked, tree: nestBoxes(boxes, levelOf) }, null, 2)}\n`,
  );
  if (locked === null) {
    await setDark(true);
    await page.screenshot({
      path: path.join(dir, "dark-1280.png"),
      fullPage: true,
    });
    await setDark(false);
  }
  await page.setViewportSize({ width: 640, height: 800 });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(dir, `${locked ?? "light"}-640.png`),
    fullPage: true,
  });
  return boxes.length;
}

function prepareOut(slug: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const outArg = arg("out");
  const out =
    outArg === undefined
      ? freshDir(
          path.join(SETTINGS.researchDir, `${date}-design-review-${slug}`),
          existsSync,
        )
      : path.resolve(outArg);
  if (existsSync(out) && readdirSync(out).length > 0) {
    if (!process.argv.includes("--force"))
      throw new Error(
        `${out} already has files. Pass --out <fresh dir>, or --force to wipe it.`,
      );
    rmSync(out, { recursive: true });
  }
  return out;
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.length <= 2) {
    console.log(
      readFileSync(import.meta.filename, "utf8")
        .split("\n")
        .slice(0, 18)
        .join("\n"),
    );
    return;
  }
  let ids: string[];
  let slug: string;
  const file = arg("file");
  const stories = arg("stories");
  if (file !== undefined) {
    const { title, ids: all } = storyIdsFromSource(
      readFileSync(path.resolve(file), "utf8"),
    );
    const limit = Number(arg("limit") ?? all.length);
    ids = all.slice(0, limit);
    slug = sanitize(title.split("/").pop() ?? title);
  } else if (stories !== undefined) {
    ids = stories
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    slug = (ids[0] ?? "screen").split("--")[0] ?? "screen";
  } else {
    throw new Error("give --stories or --file (see --help)");
  }
  if (ids.length === 0) throw new Error("no story ids");
  const out = prepareOut(slug);

  const portArg = arg("port");
  const port = Number(portArg ?? 6111);
  let sb: ReturnType<typeof spawn> | undefined;
  if (portArg === undefined) {
    sb = spawn(
      "bunx",
      ["storybook", "dev", "-p", String(port), "--ci", "--no-open"],
      {
        cwd: SETTINGS.storybookCwd,
        stdio: "ignore",
      },
    );
    console.log(`storybook started, pid ${sb.pid}`);
  }
  const base = `http://localhost:${port}`;
  try {
    await waitFor(`${base}/iframe.html`, 180_000);
    const index = (await (await fetch(`${base}/index.json`)).json()) as {
      entries: Record<string, { type: string }>;
    };
    const known = Object.entries(index.entries)
      .filter(([, e]) => e.type === "story")
      .map(([k]) => k);
    const missing = unknownIds(ids, known);
    if (missing.length > 0)
      throw new Error(
        missing
          .map(
            ({ id, hints }) =>
              `no story ${id}${hints.length > 0 ? `; did you mean ${hints.join(", ")}?` : ""}`,
          )
          .join("\n"),
      );
    const pw = await loadPlaywright();
    const browser = await pw.chromium.launch();
    const walk = await walkSource();
    for (const id of ids) {
      const dir = path.join(out, id);
      mkdirSync(dir, { recursive: true });
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      });
      const n = await captureStory(
        page,
        `${base}/iframe.html?id=${id}&viewMode=story`,
        id,
        dir,
        walk,
      );
      await page.close();
      if (n === null) process.exitCode = 1;
      else console.log(`captured ${id} (${n} boxes)`);
    }
    await browser.close();
    console.log(`written to ${out}`);
  } finally {
    if (sb?.pid !== undefined) {
      process.kill(sb.pid);
      console.log(`storybook pid ${sb.pid} killed`);
    }
  }
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
