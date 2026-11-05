import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { compare } from "./diff-upstream.ts";

function folder(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "diff-upstream-"));
  for (const [f, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    writeFileSync(path.join(dir, f), text);
  }
  return dir;
}

describe("diff-upstream compare", () => {
  it("reports changed, upstream-only and local-only files, sorted", () => {
    const local = folder({
      "audit/audit.ts": "a",
      "walk/collect-boxes.ts": "mine",
      "part.ts": "same",
    });
    const upstream = folder({
      "audit/audit.ts": "a",
      "walk/collect-boxes.ts": "theirs",
      "walk/layout-detector.ts": "new",
    });
    expect(compare(local, upstream)).toEqual([
      { file: "part.ts", state: "only local" },
      { file: "walk/collect-boxes.ts", state: "changed" },
      { file: "walk/layout-detector.ts", state: "only upstream" },
    ]);
  });

  it("reports nothing for two identical folders", () => {
    const a = folder({ "x.ts": "1", "y/z.ts": "2" });
    const b = folder({ "x.ts": "1", "y/z.ts": "2" });
    expect(compare(a, b)).toEqual([]);
  });
});
