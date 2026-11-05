import { describe, expect, it } from "vitest";
import type { PartDefinition } from "../registry/types";
import { audit, countUnclassified } from "./audit";
import { box, build, part } from "./test-helpers";

const withGrammar = (
  name: string,
  over: Partial<PartDefinition>,
): PartDefinition => ({ ...part(name), ...over });

/** A lane heading at the card's inset over a title that ends late. */
const fieldTree = (attrs: Readonly<Record<string, string>>) =>
  build(
    box({
      part: "list",
      rect: [0, 0, 1000, 200],
      children: [
        box({
          part: "list.group",
          rect: [0, 0, 1000, 200],
          children: [
            box({ part: "list.group-label", rect: [16, 8, 960, 20], attrs }),
            box({
              part: "row",
              rect: [0, 40, 1000, 16],
              children: [box({ part: "row.title", rect: [600, 40, 300, 16] })],
            }),
          ],
        }),
      ],
    }),
  );

// A group label lines up with the first title in its list, unless the list
// says `data-place="field"`, where titles end where their lines start.
const guarded = {
  "list.group-label": part("list.group-label", {
    kind: "aligns-left",
    with: "row.title",
    scope: "list",
    when: { attr: "place", value: "field", not: true },
  }),
};

const labelKinds = (attrs: Readonly<Record<string, string>>) =>
  audit(fieldTree(attrs), guarded)
    .filter((v) => v.part === "list.group-label")
    .map((v) => v.kind);

describe("a guarded aligns-left steps aside where the attribute says so", () => {
  const kinds = labelKinds;

  it("a lane heading in the field holds the inset, since its titles end where their lines start", () => {
    expect(kinds({ place: "field" })).toEqual([]);
  });

  it("anywhere else a group label still lines up with the first title", () => {
    expect(kinds({})).toEqual(["aligns-left"]);
  });
});

describe("audit dispatch", () => {
  const parts = {
    row: part("row", { kind: "grid-4" }, { kind: "height-in", values: [40] }),
    plain: part("plain"),
  };

  it("runs every contract of a registered part", () => {
    const boxes = build(box({ part: "row", rect: [0, 0, 100, 42] }));
    expect(audit(boxes, parts).map((v) => v.kind)).toEqual([
      "grid-4",
      "height-in",
    ]);
  });

  it("returns nothing for a clean tree and for parts without contracts", () => {
    const boxes = build(
      box({
        part: "row",
        rect: [0, 0, 100, 40],
        children: [box({ part: "plain", rect: [0, 0, 10, 7] })],
      }),
    );
    expect(audit(boxes, parts)).toEqual([]);
  });

  it("skips unknown parts and unparted boxes without a violation", () => {
    const boxes = build(
      box({ part: "mystery", rect: [0, 0, 100, 3] }),
      box({ part: "constructor", rect: [0, 0, 100, 3] }),
      box({ rect: [0, 0, 100, 3] }),
    );
    expect(audit(boxes, parts)).toEqual([]);
  });

  it("collects violations from several boxes in id order", () => {
    const boxes = build(
      box({
        part: "row",
        rect: [0, 0, 100, 41],
        children: [box({ part: "row", rect: [0, 0, 100, 43] })],
      }),
    );
    expect(
      audit(boxes, { row: part("row", { kind: "grid-4", tolerance: 0 }) }).map(
        (v) => v.boxIds[0],
      ),
    ).toEqual([0, 1]);
  });
});

describe("audit when guard", () => {
  // Two children 8px apart: off the [0] scale, so the guard alone decides.
  const parts = {
    row: part("row", {
      kind: "gaps-on-scale",
      scale: [0],
      when: { attr: "shape", value: "stacked" },
    }),
  };
  const children = [
    box({ rect: [0, 0, 100, 16] }),
    box({ rect: [0, 24, 100, 16] }),
  ];

  it("skips a guarded contract on a box without the attribute", () => {
    const boxes = build(box({ part: "row", rect: [0, 0, 100, 40], children }));
    expect(audit(boxes, parts)).toEqual([]);
  });

  it("skips a guarded contract on a box whose attribute differs", () => {
    const boxes = build(
      box({
        part: "row",
        rect: [0, 0, 100, 40],
        attrs: { shape: "table" },
        children,
      }),
    );
    expect(audit(boxes, parts)).toEqual([]);
  });

  it("applies a guarded contract on a box carrying the attribute", () => {
    const boxes = build(
      box({
        part: "row",
        rect: [0, 0, 100, 40],
        attrs: { shape: "stacked" },
        children,
      }),
    );
    expect(audit(boxes, parts).map((v) => v.kind)).toEqual(["gaps-on-scale"]);
  });
});

describe("audit when guard with several values", () => {
  // The plain list's one-or-two-heights rule steps aside for the stacked
  // list and the checklist both.
  const parts = {
    list: part("list", {
      kind: "uniform-height",
      of: "row",
      max: 1,
      when: { attr: "shape", value: ["stacked", "checklist"], not: true },
    }),
    row: part("row"),
  };
  const rows = [
    box({ part: "row", rect: [0, 0, 100, 40] }),
    box({ part: "row", rect: [0, 40, 100, 56] }),
  ];
  const listOf = (attrs?: Record<string, string>) =>
    build(
      box({
        part: "list",
        rect: [0, 0, 100, 96],
        ...(attrs === undefined ? {} : { attrs }),
        children: rows,
      }),
    );

  it("applies where the attribute is absent or is none of the values", () => {
    expect(audit(listOf(), parts)).toHaveLength(1);
    expect(audit(listOf({ shape: "table" }), parts)).toHaveLength(1);
  });

  it("steps aside where the attribute is any of the values", () => {
    expect(audit(listOf({ shape: "stacked" }), parts)).toEqual([]);
    expect(audit(listOf({ shape: "checklist" }), parts)).toEqual([]);
  });
});

describe("audit grammar dispatch", () => {
  it("checks the grammar of parts that have no contracts", () => {
    const parts = {
      cell: withGrammar("cell", { within: ["row"] }),
      card: part("card"),
    };
    const boxes = build(
      box({
        part: "card",
        rect: [0, 0, 10, 10],
        children: [box({ part: "cell", rect: [0, 0, 5, 5] })],
      }),
    );
    expect(audit(boxes, parts).map((v) => v.kind)).toEqual(["within"]);
  });

  it("runs contracts before the grammar for the same box", () => {
    const parts = {
      row: withGrammar("row", {
        contracts: [{ kind: "grid-4", tolerance: 0 }],
        contains: ["chip"],
      }),
      other: part("other"),
    };
    const boxes = build(
      box({
        part: "row",
        rect: [0, 0, 10, 3],
        children: [box({ part: "other", rect: [0, 0, 5, 5] })],
      }),
    );
    expect(audit(boxes, parts).map((v) => v.kind)).toEqual([
      "grid-4",
      "contains",
    ]);
  });
});

describe("countUnclassified", () => {
  it("counts only unparted boxes that carry layout classes", () => {
    const boxes = build(
      box({
        part: "row",
        rect: [0, 0, 1, 1],
        hasLayoutClasses: true,
        children: [
          box({ rect: [0, 0, 1, 1], hasLayoutClasses: true }),
          box({ rect: [0, 0, 1, 1] }),
          box({ rect: [0, 0, 1, 1], hasLayoutClasses: true }),
        ],
      }),
    );
    expect(countUnclassified(boxes, { row: part("row") })).toBe(2);
    expect(countUnclassified([], {})).toBe(0);
  });

  it("counts a box whose part name is not registered", () => {
    const boxes = build(
      box({
        part: "row",
        rect: [0, 0, 1, 1],
        hasLayoutClasses: true,
        children: [
          box({ part: "bogus", rect: [0, 0, 1, 1], hasLayoutClasses: true }),
          box({ part: "bogus", rect: [0, 0, 1, 1] }),
        ],
      }),
    );
    expect(countUnclassified(boxes, { row: part("row") })).toBe(1);
  });

  it("a negated guard applies where the attribute is absent and steps aside where it matches", () => {
    const parts = {
      list: part("list", {
        kind: "uniform-height",
        of: "row",
        max: 1,
        when: { attr: "shape", value: "stacked", not: true },
      }),
      row: part("row"),
    };
    const rows = [
      box({ part: "row", rect: [0, 0, 100, 40] }),
      box({ part: "row", rect: [0, 40, 100, 56] }),
    ];
    const plain = build(
      box({ part: "list", rect: [0, 0, 100, 96], children: rows }),
    );
    expect(audit(plain, parts)).toHaveLength(1);
    const stacked = build(
      box({
        part: "list",
        rect: [0, 0, 100, 96],
        attrs: { shape: "stacked" },
        children: rows,
      }),
    );
    expect(audit(stacked, parts)).toEqual([]);
  });
});
