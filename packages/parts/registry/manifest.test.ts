import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  generate,
  partFiles,
  renderContract,
  renderManifest,
} from "./manifest";

describe("manifest generator", () => {
  it("renders sorted imports, the parts map and the PartName union", () => {
    const out = renderManifest([
      { file: "list-group-label.ts", name: "list.group-label" },
      { file: "row.ts", name: "row" },
    ]);
    expect(out).toContain('import listGroupLabel from "./list-group-label";');
    expect(out).toContain('import row from "./row";');
    expect(out).toContain('"list.group-label",\n  "row",');
    expect(out).toContain("export type PartName");
  });

  it("lists part files in file-name order and leaves the helpers out", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "parts-registry-"));
    for (const f of [
      "row.ts",
      "bar.ts",
      "types.ts",
      "manifest.ts",
      "row.test.ts",
    ])
      writeFileSync(path.join(dir, f), "");
    expect(partFiles(dir)).toEqual(["bar.ts", "row.ts"]);
  });

  it("generates from a folder of real part files", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "parts-registry-"));
    writeFileSync(
      path.join(dir, "row.ts"),
      'export default { name: "row", purpose: "x", level: 1, within: [], contains: [], contracts: [] };\n',
    );
    const out = await generate(dir);
    expect(out).toContain('"row",');
    expect(out.startsWith("// Generated")).toBe(true);
  });

  it("prints a contract as kind(args), guards included", () => {
    expect(
      renderContract({
        kind: "height-in",
        values: [24, 28],
        when: { attr: "place", value: ["a", "b"], not: true },
      }),
    ).toBe("height-in(values=[24,28], when=not place:a/b)");
  });
});
