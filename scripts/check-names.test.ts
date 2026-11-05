import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { findHits } from "./check-names.ts";

function repo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "check-names-"));
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, text);
  }
  return root;
}

describe("check:names", () => {
  it("catches the origin project's name, a ticket and a decision record in copied code", () => {
    const root = repo({
      "packages/parts/a.ts": "// carried from fibers\n",
      "packages/parts/b.ts": "// ENG-730 asked for this\n",
      ".agents/skills/x/SKILL.md": "See ADR-0123.\n",
    });
    const hits = findHits(root);
    expect(hits.map((h) => `${h.file}:${h.line}`).toSorted()).toEqual([
      ".agents/skills/x/SKILL.md:1",
      "packages/parts/a.ts:1",
      "packages/parts/b.ts:1",
    ]);
  });

  it("leaves the README and the repo's own decision records alone", () => {
    const root = repo({
      "README.md": "Parts began in fibers.\n",
      "docs/adr/0001-x.md": "ADR-0001 cites ENG-730.\n",
      "packages/parts/a.ts": "// a plain sentence saying why\n",
    });
    expect(findHits(root)).toEqual([]);
  });

  it("skips binary-looking files and a missing copied path", () => {
    const root = repo({
      "packages/parts/image.png": "fibers",
    });
    expect(findHits(root)).toEqual([]);
  });
});
