import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = { heading: part("heading", { kind: "closer-below" }) };

// prev ends at 20; heading at headingY (h 20); next at nextY.
const section = (headingY: number, nextY: number) =>
  build(
    box({
      part: "section",
      rect: [0, 0, 400, 400],
      children: [
        box({ rect: [0, 0, 400, 20] }),
        box({ part: "heading", rect: [0, headingY, 400, 20] }),
        box({ rect: [0, nextY, 400, 20] }),
      ],
    }),
  );

describe("closer-below", () => {
  it("catches a heading nearer the block above than the one below", () => {
    const v = audit(section(28, 80), parts); // above 8, below 32
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ boxIds: [2, 1, 3] });
  });

  it("catches equal gaps (10 above, 10 below)", () => {
    expect(audit(section(30, 60), parts)).toHaveLength(1);
  });

  it("passes a heading nearer what follows", () => {
    expect(audit(section(40, 68), parts)).toEqual([]); // above 20, below 8
  });

  it("does nothing when the neighbours sit beside the heading in a row", () => {
    // lead | heading | aside, all at y=0: zero gaps, but no stack to judge.
    const row = build(
      box({
        part: "section",
        rect: [0, 0, 400, 20],
        children: [
          box({ rect: [0, 0, 100, 20] }),
          box({ part: "heading", rect: [100, 0, 200, 20] }),
          box({ rect: [300, 0, 100, 20] }),
        ],
      }),
    );
    expect(audit(row, parts)).toEqual([]);
  });

  it("does nothing for a first or last sibling", () => {
    const first = build(
      box({
        part: "section",
        rect: [0, 0, 400, 100],
        children: [
          box({ part: "heading", rect: [0, 0, 400, 20] }),
          box({ rect: [0, 90, 400, 10] }),
        ],
      }),
    );
    expect(audit(first, parts)).toEqual([]);
  });
});
