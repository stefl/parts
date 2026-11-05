import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = {
  control: part("control", { kind: "height-in", values: [28, 32] }),
};
const control = (h: number) =>
  build(box({ part: "control", rect: [0, 0, 80, h] }));

describe("height-in", () => {
  it("catches a height that is none of the values", () => {
    const v = audit(control(36), parts);
    expect(v).toHaveLength(1);
    expect(v[0]?.message).toContain("36");
  });

  it("passes a listed height and one within a pixel", () => {
    expect(audit(control(32), parts)).toEqual([]);
    expect(audit(control(28.9), parts)).toEqual([]);
  });

  it("honours a tighter tolerance", () => {
    const tight = {
      control: part("control", {
        kind: "height-in",
        values: [28],
        tolerance: 0.25,
      }),
    };
    expect(audit(control(28.5), tight)).toHaveLength(1);
  });
});
