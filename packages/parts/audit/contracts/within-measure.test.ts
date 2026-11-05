import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = { prose: part("prose", { kind: "within-measure" }) };
const prose = (w: number, ch?: number) =>
  build(box({ part: "prose", rect: [0, 0, w, 40], ...(ch ? { ch } : {}) }));

describe("within-measure", () => {
  it("catches prose wider than 64ch, as the ticket page's description was", () => {
    const found = audit(prose(1100, 8), parts);
    expect(found).toHaveLength(1);
    expect(found[0]?.message).toMatch(/about 138 characters/);
  });

  it("passes prose on the measure, and exactly at it", () => {
    expect(audit(prose(400, 8), parts)).toEqual([]);
    expect(audit(prose(512, 8), parts)).toEqual([]);
  });

  it("leaves a box with no measured ch alone rather than guessing", () => {
    expect(audit(prose(1100), parts)).toEqual([]);
  });

  it("honours a part's own measure", () => {
    const narrow = {
      prose: part("prose", { kind: "within-measure", chars: 40 }),
    };
    expect(audit(prose(400, 8), narrow)).toHaveLength(1);
  });
});
