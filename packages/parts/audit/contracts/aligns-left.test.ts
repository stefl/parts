import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = {
  "list.group-label": part("list.group-label", {
    kind: "aligns-left",
    with: "row.title",
    scope: "list",
  }),
};

const list = (labelX: number) =>
  build(
    box({
      part: "list",
      rect: [0, 0, 400, 200],
      children: [
        box({ part: "list.group-label", rect: [labelX, 0, 100, 20] }),
        box({
          part: "row",
          rect: [0, 20, 400, 40],
          children: [box({ part: "row.title", rect: [24, 25, 100, 20] })],
        }),
        box({
          part: "row",
          rect: [0, 60, 400, 40],
          children: [box({ part: "row.title", rect: [90, 65, 100, 20] })],
        }),
      ],
    }),
  );

describe("aligns-left", () => {
  it("catches a label that is off the first row title", () => {
    const v = audit(list(16), parts);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ kind: "aligns-left", boxIds: [1, 3] });
  });

  it("passes within a pixel, comparing only the first title", () => {
    expect(audit(list(24.8), parts)).toEqual([]);
  });

  it("does nothing without a scope ancestor or a with part", () => {
    const orphan = build(
      box({ part: "list.group-label", rect: [0, 0, 100, 20] }),
    );
    expect(audit(orphan, parts)).toEqual([]);
    const noTitle = build(
      box({
        part: "list",
        rect: [0, 0, 400, 50],
        children: [box({ part: "list.group-label", rect: [5, 0, 100, 20] })],
      }),
    );
    expect(audit(noTitle, parts)).toEqual([]);
  });
});

// The registered `run`: inside a card, a run that wraps (a line of its own)
// starts where the card's state line starts (from a design review of
// 2026-10-30).
const registry = {
  run: part("run", {
    kind: "aligns-left",
    with: "row.meta",
    scope: "card",
    tolerance: 1,
    when: { attr: "wrap", value: "true" },
  }),
};

/** A card whose state line starts at x=32, with a run in a tray below. */
const card = (runX: number, attrs: Readonly<Record<string, string>>) =>
  build(
    box({
      part: "card",
      rect: [0, 0, 600, 300],
      children: [
        box({ part: "row.meta", rect: [32, 20, 120, 20] }),
        box({
          rect: [20, 200, 560, 80],
          children: [box({ part: "run", rect: [runX, 216, 400, 32], attrs })],
        }),
      ],
    }),
  );

describe("aligns-left on a run within a card", () => {
  it("catches the tray's answer keys 4px right of the text column", () => {
    const v = audit(card(36, { wrap: "true", align: "center" }), registry);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ part: "run", kind: "aligns-left" });
  });

  it("passes a wrapping run on the column, within a pixel", () => {
    expect(audit(card(32.8, { wrap: "true" }), registry)).toEqual([]);
  });

  it("leaves a run that does not wrap where it sits, inside a line", () => {
    expect(audit(card(90, { wrap: "false" }), registry)).toEqual([]);
  });

  it("does nothing to a run outside a card", () => {
    const loose = build(
      box({ part: "run", rect: [90, 0, 400, 32], attrs: { wrap: "true" } }),
    );
    expect(audit(loose, registry)).toEqual([]);
  });
});
