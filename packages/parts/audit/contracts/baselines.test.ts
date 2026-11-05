import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = { "row.title": part("row.title", { kind: "baselines" }) };

// A sidebar row as first found: the label and the "·" and count
// are centred boxes on one 28px line, but the label's inline flex box sat on
// its textless dot's bottom edge, so the name's baseline fell 1px below the
// count's. Box centres agree; only the baselines tell.
const projectRow = (nameBaseline: number) =>
  build(
    box({
      part: "row.title",
      rect: [0, 0, 180, 28],
      children: [
        box({ rect: [0, 6, 120, 16], baseline: nameBaseline }),
        box({ rect: [124, 6, 4, 16], baseline: 18 }),
        box({ rect: [132, 6, 8, 16], baseline: 18 }),
      ],
    }),
  );

describe("baselines", () => {
  it("catches a name 1px below the count beside it", () => {
    const v = audit(projectRow(19), parts);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ kind: "baselines", boxIds: [0, 1, 2, 3] });
    expect(v[0]?.message).toContain("1px");
  });

  it("passes text on one baseline", () => {
    expect(audit(projectRow(18), parts)).toEqual([]);
  });

  it("passes a half-pixel rounding difference", () => {
    expect(audit(projectRow(18.5), parts)).toEqual([]);
  });

  it("leaves out a boxed child: a chip centres by its box", () => {
    const withChip = build(
      box({
        part: "row.title",
        rect: [0, 0, 180, 28],
        children: [
          box({ rect: [0, 6, 120, 16], baseline: 18 }),
          box({ part: "chip", rect: [124, 4, 40, 20], baseline: 17 }),
        ],
      }),
    );
    expect(audit(withChip, parts)).toEqual([]);
  });

  it("leaves out a plain wrapper round one chip", () => {
    const wrapped = build(
      box({
        part: "row.title",
        rect: [0, 0, 180, 28],
        children: [
          box({ rect: [0, 6, 120, 16], baseline: 18 }),
          box({
            rect: [124, 4, 40, 20],
            baseline: 17,
            children: [
              box({ part: "chip", rect: [124, 4, 40, 20], baseline: 17 }),
            ],
          }),
        ],
      }),
    );
    expect(audit(wrapped, parts)).toEqual([]);
  });

  it("keeps a wrapper whose own words lead its chip", () => {
    const labelled = build(
      box({
        part: "row.title",
        rect: [0, 0, 220, 28],
        children: [
          box({ rect: [0, 6, 120, 16], baseline: 18 }),
          box({
            rect: [124, 4, 90, 20],
            baseline: 19,
            children: [
              box({ part: "chip", rect: [170, 4, 40, 20], baseline: 17 }),
            ],
          }),
        ],
      }),
    );
    expect(audit(labelled, parts)).toHaveLength(1);
  });

  it("leaves out a chip's anchor while its popover is open", () => {
    const open = build(
      box({
        part: "row.title",
        rect: [0, 0, 180, 28],
        children: [
          box({ rect: [0, 6, 120, 16], baseline: 18 }),
          box({
            rect: [124, 4, 40, 20],
            baseline: 17,
            children: [
              box({ part: "chip", rect: [124, 4, 40, 20], baseline: 17 }),
              box({ part: "popover", rect: [124, 30, 200, 80] }),
            ],
          }),
        ],
      }),
    );
    expect(audit(open, parts)).toEqual([]);
  });

  it("holds no baseline in a top-aligned run", () => {
    const columns = build(
      box({
        part: "row.title",
        rect: [0, 0, 400, 200],
        attrs: { align: "start" },
        children: [
          box({ rect: [0, 0, 120, 200], baseline: 18 }),
          box({ rect: [150, 0, 250, 200], baseline: 20 }),
        ],
      }),
    );
    expect(audit(columns, parts)).toEqual([]);
  });

  it("leaves out children with no text", () => {
    const withDot = build(
      box({
        part: "row.title",
        rect: [0, 0, 180, 28],
        children: [
          box({ rect: [0, 10, 8, 8] }),
          box({ rect: [12, 6, 120, 16], baseline: 18 }),
        ],
      }),
    );
    expect(audit(withDot, parts)).toEqual([]);
  });

  it("compares baselines within a line, not with a line under it", () => {
    const stacked = build(
      box({
        part: "row.title",
        rect: [0, 0, 180, 40],
        children: [
          box({ rect: [0, 0, 120, 20], baseline: 15 }),
          box({ rect: [0, 20, 120, 16], baseline: 32 }),
        ],
      }),
    );
    expect(audit(stacked, parts)).toEqual([]);
  });

  it("groups by the first text line, not a span that wrapped (ArchiveHit)", () => {
    // A highlighted title split into spans: the first span wraps, so its box
    // spans both lines, and a mark sits on the second line beside it.
    const wrapped = build(
      box({
        part: "row.title",
        rect: [0, 0, 180, 40],
        children: [
          box({ rect: [0, 0, 180, 40], textTop: 2, baseline: 15 }),
          box({ rect: [40, 20, 30, 20], textTop: 22, baseline: 35 }),
        ],
      }),
    );
    expect(audit(wrapped, parts)).toEqual([]);
  });

  it("honours a contract's own tolerance", () => {
    const loose = {
      "row.title": part("row.title", { kind: "baselines", tolerance: 2 }),
    };
    expect(audit(projectRow(19), loose)).toEqual([]);
  });
});
