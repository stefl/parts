import { describe, expect, it } from "vitest";
import type { PartDefinition } from "../registry/types";
import { buildContext } from "./context";
import { checkGrammar } from "./grammar";
import { box, build } from "./test-helpers";

const def = (
  name: string,
  over: Partial<PartDefinition> = {},
): PartDefinition => ({
  name,
  purpose: "test part",
  level: 0,
  within: [],
  contains: [],
  contracts: [],
  ...over,
});

const r = [0, 0, 10, 10] as const;

function run(
  boxes: ReturnType<typeof build>,
  id: number,
  parts: Record<string, PartDefinition>,
) {
  const b = boxes[id]!;
  return checkGrammar(buildContext(boxes), b, parts[b.part!]!, parts);
}

describe("within", () => {
  const parts = {
    cell: def("cell", { within: ["row"] }),
    row: def("row"),
    card: def("card"),
  };
  it("flags a part whose nearest part ancestor is not listed", () => {
    const boxes = build(
      box({
        part: "card",
        rect: r,
        children: [box({ part: "cell", rect: r })],
      }),
    );
    expect(run(boxes, 1, parts)).toEqual([
      expect.objectContaining({
        part: "cell",
        kind: "within",
        boxIds: [1, 0],
      }),
    ]);
  });
  it("passes a listed parent, an unparted gap, and no part ancestor", () => {
    const ok = build(
      box({
        part: "row",
        rect: r,
        children: [
          box({ rect: r, children: [box({ part: "cell", rect: r })] }),
        ],
      }),
    );
    expect(run(ok, 2, parts)).toEqual([]);
    expect(run(build(box({ part: "cell", rect: r })), 0, parts)).toEqual([]);
  });
  it("uses only the nearest part ancestor", () => {
    const boxes = build(
      box({
        part: "row",
        rect: r,
        children: [
          box({
            part: "card",
            rect: r,
            children: [box({ part: "cell", rect: r })],
          }),
        ],
      }),
    );
    expect(run(boxes, 2, parts)).toHaveLength(1);
  });
});

describe("contains", () => {
  const parts = {
    list: def("list", { contains: ["row", "tabs"] }),
    row: def("row"),
    chip: def("chip"),
  };
  it("flags a nearest-part descendant that is not listed", () => {
    const boxes = build(
      box({
        part: "list",
        rect: r,
        children: [
          box({ rect: r, children: [box({ part: "chip", rect: r })] }),
        ],
      }),
    );
    expect(run(boxes, 0, parts)).toEqual([
      expect.objectContaining({
        part: "list",
        kind: "contains",
        boxIds: [0, 2],
      }),
    ]);
  });
  it("passes listed parts, ignores what is below them, and skips empty lists", () => {
    const boxes = build(
      box({
        part: "list",
        rect: r,
        children: [
          box({
            part: "row",
            rect: r,
            children: [box({ part: "chip", rect: r })],
          }),
        ],
      }),
    );
    expect(run(boxes, 0, parts)).toEqual([]);
    expect(run(boxes, 1, parts)).toEqual([]);
  });
});

describe("level", () => {
  const parts = {
    one: def("one", { level: 1 }),
    ok: def("ok", { level: 1, contains: ["declared"] }),
    two: def("two", { level: 2 }),
    declared: def("declared", { level: 2 }),
    low: def("low", { level: 2 }),
    zero: def("zero", { level: 0 }),
  };
  it("flags a deeper level that is not declared", () => {
    const boxes = build(
      box({
        part: "one",
        rect: r,
        children: [box({ part: "two", rect: r })],
      }),
    );
    expect(run(boxes, 0, parts).map((v) => v.kind)).toEqual(["level"]);
  });
  it("passes a declared part, an equal or lower level, level 0 and unregistered", () => {
    const declared = build(
      box({
        part: "ok",
        rect: r,
        children: [box({ part: "declared", rect: r })],
      }),
    );
    expect(run(declared, 0, parts)).toEqual([]);
    const lower = build(
      box({ part: "low", rect: r, children: [box({ part: "one", rect: r })] }),
    );
    expect(run(lower, 0, parts)).toEqual([]);
    const chrome = build(
      box({
        part: "zero",
        rect: r,
        children: [box({ part: "two", rect: r })],
      }),
    );
    expect(run(chrome, 0, parts)).toEqual([]);
    const unknown = build(
      box({
        part: "one",
        rect: r,
        children: [box({ part: "mystery", rect: r })],
      }),
    );
    expect(run(unknown, 0, parts)).toEqual([]);
  });
  it("passes an equal-level child", () => {
    const boxes = build(
      box({
        part: "one",
        rect: r,
        children: [box({ part: "one", rect: r })],
      }),
    );
    expect(run(boxes, 0, parts)).toEqual([]);
  });
  it("catches a level-3 child undeclared in a level-2 parent", () => {
    const deep = { ...parts, three: def("three", { level: 3 }) };
    const boxes = build(
      box({
        part: "two",
        rect: r,
        children: [box({ part: "three", rect: r })],
      }),
    );
    expect(run(boxes, 0, deep).map((v) => v.kind)).toEqual(["level"]);
  });
  it("reports only the contains fault when contains is non-empty", () => {
    const both = {
      one: def("one", { level: 1, contains: ["declared"] }),
      two: def("two", { level: 2 }),
      declared: def("declared", { level: 2 }),
    };
    const boxes = build(
      box({
        part: "one",
        rect: r,
        children: [box({ part: "two", rect: r })],
      }),
    );
    expect(run(boxes, 0, both).map((v) => v.kind)).toEqual(["contains"]);
  });
});
