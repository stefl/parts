import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = {
  stack: part("stack", { kind: "gaps-on-scale", tolerance: 0.5 }),
};

const stack = (...ys: number[]) =>
  build(
    box({
      part: "stack",
      rect: [0, 0, 100, 300],
      children: ys.map((y) => box({ rect: [0, y, 100, 20] })),
    }),
  );

describe("gaps-on-scale", () => {
  it("catches a gap between scale steps", () => {
    const v = audit(stack(0, 30, 58), parts); // gaps 10 and 8
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ boxIds: [0, 1, 2] });
  });

  it("passes gaps on the scale, within half a pixel", () => {
    expect(audit(stack(0, 28, 56.4), parts)).toEqual([]); // gaps 8, 8.4
  });

  it("treats overlap as a violation", () => {
    expect(audit(stack(0, 15), parts)).toHaveLength(1); // gap -5
  });

  it("uses a custom scale and sorts children by y", () => {
    const custom = {
      stack: part("stack", { kind: "gaps-on-scale", scale: [10] }),
    };
    expect(audit(stack(0, 30), custom)).toEqual([]);
    expect(audit(stack(30, 0), custom)).toEqual([]);
  });
});
