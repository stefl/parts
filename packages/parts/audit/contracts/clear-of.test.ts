import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = {
  card: part("card", { kind: "clear-of", of: "row", min: 32 }),
  row: part("row"),
};

/** A queue of two rows on the left, the card on the right at `cardX`. */
const beside = (cardX: number) =>
  build(
    box({
      part: null,
      rect: [0, 0, 1100, 600],
      children: [
        box({ part: "row", rect: [0, 0, 304, 72] }),
        box({ part: "row", rect: [0, 72, 304, 52] }),
        box({ part: "card", rect: [cardX, 0, 764, 400] }),
      ],
    }),
  );

describe("clear-of", () => {
  it("catches a card whose edge the row's fill runs up to", () => {
    const v = audit(beside(304), parts);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ kind: "clear-of", part: "card" });
    expect(v[0]?.boxIds[0]).toBe(3);
    expect(v[0]?.message).toContain("0px clear");
    expect(v[0]?.message).toContain("32px");
  });

  it("reports the nearest row once, with a negative clearance when they overlap", () => {
    const v = audit(beside(290), parts);
    expect(v).toHaveLength(1);
    expect(v[0]?.message).toContain("-14px clear");
  });

  it("passes the declared gap and a 1px near-miss", () => {
    expect(audit(beside(336), parts)).toEqual([]);
    expect(audit(beside(335), parts)).toEqual([]);
    expect(audit(beside(334), parts)).toHaveLength(1);
  });

  it("ignores rows stacked above or below the card", () => {
    const stacked = build(
      box({
        part: null,
        rect: [0, 0, 358, 900],
        children: [
          box({ part: "card", rect: [0, 0, 358, 400] }),
          box({ part: "row", rect: [0, 432, 358, 72] }),
          box({ part: "row", rect: [0, 504, 358, 52] }),
        ],
      }),
    );
    expect(audit(stacked, parts)).toEqual([]);
  });

  it("ignores rows inside the card and a card inside a row", () => {
    const nested = build(
      box({
        part: "row",
        rect: [0, 0, 1100, 400],
        children: [
          box({
            part: "card",
            rect: [0, 0, 1100, 400],
            children: [box({ part: "row", rect: [8, 8, 300, 40] })],
          }),
        ],
      }),
    );
    expect(audit(nested, parts)).toEqual([]);
  });
});
