import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = {
  mark: part("mark", { kind: "centred-in", within: "row" }),
  row: part("row"),
};

const rowWith = (markY: number) =>
  build(
    box({
      part: "row",
      rect: [0, 0, 300, 40],
      children: [box({ part: "mark", rect: [10, markY, 10, 10] })],
    }),
  );

describe("centred-in", () => {
  it("catches a mark that sits below its row's centre line", () => {
    const v = audit(rowWith(4), parts);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ kind: "centred-in", boxIds: [1, 0] });
    expect(v[0]?.message).toContain("9px");
    expect(v[0]?.message).toContain("20px");
  });

  it("passes a centred mark and a 1px near-miss", () => {
    expect(audit(rowWith(15), parts)).toEqual([]);
    expect(audit(rowWith(16), parts)).toEqual([]);
  });

  it("skips a mark that declares it sits in a text line", () => {
    const inLine = build(
      box({
        part: "row",
        rect: [0, 0, 300, 40],
        children: [
          box({
            part: "mark",
            rect: [10, 30, 10, 10],
            attrs: { inline: "true" },
          }),
        ],
      }),
    );
    expect(audit(inLine, parts)).toEqual([]);
  });

  it("passes when there is no such ancestor", () => {
    const lone = build(box({ part: "mark", rect: [0, 0, 10, 10] }));
    expect(audit(lone, parts)).toEqual([]);
  });
});
