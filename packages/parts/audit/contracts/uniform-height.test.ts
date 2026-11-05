import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = { list: part("list", { kind: "uniform-height", of: "row" }) };
const list = (...hs: number[]) =>
  build(
    box({
      part: "list",
      rect: [0, 0, 400, 500],
      children: hs.map((h) => box({ part: "row", rect: [0, 0, 400, h] })),
    }),
  );

describe("uniform-height", () => {
  it("catches three distinct heights and names them", () => {
    const v = audit(list(32, 40, 56), parts);
    expect(v).toHaveLength(1);
    expect(v[0]?.message).toContain("32, 40, 56");
  });

  it("passes two heights, and heights that round together", () => {
    expect(audit(list(32, 40, 32, 40), parts)).toEqual([]);
    expect(audit(list(32, 32.2, 40), parts)).toEqual([]);
  });

  it("honours a tighter tolerance", () => {
    const tight = {
      list: part("list", {
        kind: "uniform-height",
        of: "row",
        tolerance: 0.1,
      }),
    };
    expect(audit(list(32, 32.5, 40), tight)).toHaveLength(1);
  });

  it("only counts the named descendant part", () => {
    const boxes = build(
      box({
        part: "list",
        rect: [0, 0, 400, 500],
        children: [
          box({ part: "row", rect: [0, 0, 400, 32] }),
          box({ part: "other", rect: [0, 0, 400, 50] }),
          box({ part: "other", rect: [0, 0, 400, 60] }),
        ],
      }),
    );
    expect(audit(boxes, parts)).toEqual([]);
  });

  it("honours max", () => {
    const one = {
      list: part("list", { kind: "uniform-height", of: "row", max: 1 }),
    };
    expect(audit(list(32, 40), one)).toHaveLength(1);
  });
});
