import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = { "row.title": part("row.title", { kind: "no-overflow" }) };

// A 300px title cell holding one line under the title.
const cellWith = (line: Parameters<typeof box>[0]) =>
  build(box({ part: "row.title", rect: [100, 0, 300, 64], children: [line] }));

/** A cell holding a clipping box `w` wide with a 900px line inside it. */
const clipped = (w: number) =>
  cellWith(
    box({
      rect: [100, 20, w, 20],
      clips: true,
      children: [box({ rect: [100, 20, 900, 20] })],
    }),
  );

describe("no-overflow", () => {
  it("catches a line that runs past the cell's right edge", () => {
    const v = audit(
      cellWith(
        box({
          rect: [100, 20, 300, 20],
          children: [box({ rect: [100, 20, 900, 20] })],
        }),
      ),
      parts,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ kind: "no-overflow", boxIds: [0, 2] });
    expect(v[0]?.message).toContain("600px");
  });

  it("passes a line that fits and a 1px near-miss", () => {
    expect(audit(cellWith(box({ rect: [100, 20, 300, 20] })), parts)).toEqual(
      [],
    );
    expect(audit(cellWith(box({ rect: [100, 20, 301, 20] })), parts)).toEqual(
      [],
    );
  });

  it("skips text a box between clips, but not the clipping box", () => {
    expect(audit(clipped(300), parts)).toEqual([]);
    expect(audit(clipped(500), parts)).toHaveLength(1);
  });

  it("skips a part that clips its own contents", () => {
    const own = build(
      box({
        part: "row.title",
        rect: [100, 0, 300, 64],
        clips: true,
        children: [box({ rect: [100, 20, 900, 20] })],
      }),
    );
    expect(audit(own, parts)).toEqual([]);
  });
});
