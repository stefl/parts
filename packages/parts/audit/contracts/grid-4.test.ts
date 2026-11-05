import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = { row: part("row", { kind: "grid-4", tolerance: 0.5 }) };
const row = (h: number) => build(box({ part: "row", rect: [0, 0, 400, h] }));

describe("grid-4", () => {
  it("catches a height off the 4px grid", () => {
    expect(audit(row(42), parts)).toHaveLength(1);
  });

  it("passes multiples of 4, including just under the next one", () => {
    expect(audit(row(40), parts)).toEqual([]);
    expect(audit(row(39.6), parts)).toEqual([]);
    expect(audit(row(40.4), parts)).toEqual([]);
  });
});
