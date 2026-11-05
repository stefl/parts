import { describe, expect, it } from "vitest";
import { definePart } from "../registry/define";
import {
  danglingReferences,
  findPartNames,
  kebab,
  missingKeys,
  nonZeroEntries,
  storyKeys,
  unknownNames,
  unreasonedAllows,
} from "./names";
import { findUndeclaredLayout } from "./undeclared-layout";

describe("findPartNames", () => {
  it("finds attribute, braced and helper forms with their lines", () => {
    const src = [
      '<div data-part="row.title" />',
      "<p",
      "  data-part={'row.meta'}",
      '  {...part("chip")} />',
    ].join("\n");
    expect(findPartNames(src).map((u) => [u.line, u.name])).toEqual([
      [1, "row.title"],
      [4, "chip"],
    ]);
  });

  it("reads a different attribute name when told to", () => {
    expect(findPartNames('<i data-ui="row" />', "data-ui")).toEqual([
      { line: 1, name: "row" },
    ]);
    expect(findPartNames('<i data-ui="row" />')).toEqual([]);
  });

  it("leaves dynamic names and look-alikes alone", () => {
    const src =
      'const a = <i data-part={name} />; const b = depart("x"); const c = data-parts="y";';
    expect(findPartNames(src)).toEqual([]);
  });
});

describe("unknownNames", () => {
  it("reports only names outside the registry", () => {
    const uses = [
      { line: 1, name: "row" },
      { line: 2, name: "rowe" },
    ];
    expect(unknownNames(uses, ["row"])).toEqual([{ line: 2, name: "rowe" }]);
  });
});

describe("danglingReferences", () => {
  const base = { purpose: "x", level: 1 as const, within: [], contains: [] };

  it("catches within, contains, with, scope and of that name nothing", () => {
    const def = definePart({
      ...base,
      name: "a",
      within: ["nope1"],
      contains: ["nope2"],
      contracts: [
        { kind: "aligns-left", with: "nope3", scope: "nope4" },
        { kind: "uniform-height", of: "nope5" },
      ],
    });
    expect(danglingReferences([def], ["a"])).toHaveLength(5);
  });

  it("passes registered names and the ARIA words it is given", () => {
    const def = definePart({
      ...base,
      name: "a",
      within: ["b"],
      contains: ["tabs"],
      contracts: [],
    });
    expect(danglingReferences([def], ["a", "b"], new Set(["tabs"]))).toEqual(
      [],
    );
    expect(danglingReferences([def], ["a", "b"])).toHaveLength(1);
  });
});

describe("story entries", () => {
  const source = [
    "export default meta;",
    "export type Props = {};",
    "export const helper = 1;",
    "export const UuidKey: Story = {};",
    "export const ClaimKey = { render: () => null };",
    "export const Empty2: Story = {};",
  ].join("\n");

  it("takes story exports and skips default, types and lowercase names", () => {
    expect(storyKeys(source)).toEqual(["uuid-key", "claim-key", "empty-2"]);
  });

  it("kebab-cases the way Storybook ids do", () => {
    expect(kebab("UuidKey")).toBe("uuid-key");
    expect(kebab("WithURLBar")).toBe("with-url-bar");
  });

  it("reports keys the sidecar lacks, and all keys when it is missing", () => {
    const keys = storyKeys(source);
    const sidecar = { "uuid-key": { violations: 0, unclassified: 0 } };
    expect(missingKeys(keys, sidecar)).toEqual(["claim-key", "empty-2"]);
    expect(missingKeys(keys, null)).toEqual(keys);
  });
});

describe("zero sidecar entries", () => {
  it("names every entry above zero, and one with a missing number", () => {
    expect(
      nonZeroEntries({
        default: { violations: 0, unclassified: 0 },
        busy: { violations: 2, unclassified: 0 },
        half: { violations: 0 },
      }),
    ).toEqual([
      `"busy" records violations=2 unclassified=0`,
      `"half" records violations=0 unclassified=undefined`,
    ]);
  });
});

describe("parts.allow reasons", () => {
  it("passes the record form with a written reason", () => {
    const src = [
      "parameters: {",
      "  parts: {",
      "    allow: {",
      '      "stack:gaps-on-scale":',
      '        "the sticky strip is pinned over the header",',
      "    },",
      "  },",
      "},",
    ].join("\n");
    expect(unreasonedAllows(src)).toEqual([]);
  });

  it("flags the bare array form and an empty reason, with their lines", () => {
    const src = [
      'parameters: { parts: { allow: ["control:height-in"] } },',
      'parameters: { parts: { allow: { "row.title:baselines": "" } } },',
      'parameters: { parts: { allow: { "control:height-in": "   " } } },',
    ].join("\n");
    expect(unreasonedAllows(src)).toEqual([1, 2, 3]);
  });
});

describe("undeclared layout", () => {
  const primitives = new Set(["Stack", "Row"]);

  it("flags a tag with a layout class and no part", () => {
    expect(
      findUndeclaredLayout(`<div className="grid gap-2 px-3">`).map(
        (f) => f.line,
      ),
    ).toEqual([1]);
  });

  it("accepts the attribute and a part() spread anywhere in the tag", () => {
    expect(
      findUndeclaredLayout(`<div className="gap-2" data-part="row">`),
    ).toEqual([]);
    expect(
      findUndeclaredLayout(
        `<span\n  className="px-3"\n  {...part("row.meta")}\n>`,
      ),
    ).toEqual([]);
    expect(
      findUndeclaredLayout(`<div className="gap-2" data-ui="row">`, {
        attribute: "data-ui",
      }),
    ).toEqual([]);
  });

  it("exempts only the primitives it is given", () => {
    expect(
      findUndeclaredLayout(`<Stack gap={2} className="px-3">`, { primitives }),
    ).toEqual([]);
    expect(
      findUndeclaredLayout(`<Table className="mt-4" rows={rows} />`, {
        primitives,
      }),
    ).toHaveLength(1);
  });

  it("reads layout classes inside cn() and behind variants", () => {
    expect(
      findUndeclaredLayout(
        `<div className={cn("flex", sel && "@lg:ml-auto")}>`,
      ),
    ).toHaveLength(1);
  });

  it("counts a tag once, on the line of its first layout class", () => {
    const source = [
      "<div",
      '  className={cn("flex", "px-3", "gap-2")}',
      ">",
      '<li className="m-0 p-1" />',
    ].join("\n");
    expect(findUndeclaredLayout(source).map((f) => f.line)).toEqual([2, 4]);
  });

  it("leaves non-layout classes, nested JSX props, comments and a marked line alone", () => {
    const source = [
      '<div className="flex text-copy max-w-xl">',
      '<div icon={<Icon className="size-4" />} className="flex">',
      '{/* <div className="p-4"> */}',
      '<div className="p-4"> {/* layout-ok the story frame */}',
    ].join("\n");
    expect(findUndeclaredLayout(source)).toEqual([]);
  });
});
