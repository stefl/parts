import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = { chip: part("chip", { kind: "no-cut" }) };

// A 200px chip holding its glyph and a title span that clips.
const chipWith = (title: Parameters<typeof box>[0]) =>
  build(
    box({
      part: "chip",
      rect: [0, 0, 200, 24],
      children: [box({ rect: [6, 5, 14, 14] }), title],
    }),
  );

describe("no-cut", () => {
  it("catches a title the chip's CSS cuts at a character", () => {
    const v = audit(
      chipWith(box({ rect: [26, 4, 168, 16], clips: true, cuts: true })),
      parts,
    );
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ kind: "no-cut", boxIds: [0, 2] });
  });

  it("passes a title cut on a word that fits its box", () => {
    expect(
      audit(chipWith(box({ rect: [26, 4, 140, 16], clips: true })), parts),
    ).toEqual([]);
  });

  it("catches the part's own box when it hides its content", () => {
    const own = build(
      box({ part: "chip", rect: [0, 0, 200, 24], clips: true, cuts: true }),
    );
    expect(audit(own, parts)).toMatchObject([{ boxIds: [0] }]);
  });

  it("steps aside where the guard says so (a chip that fades)", () => {
    const fades = {
      chip: part("chip", {
        kind: "no-cut",
        when: { attr: "fade", value: "true", not: true },
      }),
    };
    const boxes = build(
      box({
        part: "chip",
        rect: [0, 0, 200, 24],
        attrs: { fade: "true" },
        children: [box({ rect: [26, 4, 168, 16], clips: true, cuts: true })],
      }),
    );
    expect(audit(boxes, fades)).toEqual([]);
  });
});
