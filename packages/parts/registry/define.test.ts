import { describe, expect, it } from "vitest";
import { definePart } from "./define";
import type { PartDefinition } from "./types";

const good: PartDefinition = {
  name: "x.y-z",
  purpose: "A thing.",
  level: 1,
  within: [],
  contains: [],
  contracts: [],
};

describe("definePart", () => {
  it("accepts a good entry", () => {
    expect(definePart(good)).toBe(good);
  });

  it("rejects a bad name", () => {
    for (const name of ["Row", "row.", "1row", "row title", ""]) {
      expect(() => definePart({ ...good, name })).toThrow(/dotted lowercase/);
    }
  });

  it("rejects an empty purpose", () => {
    expect(() => definePart({ ...good, purpose: " " })).toThrow(/purpose/);
  });

  it("rejects an unknown contract kind", () => {
    const bad = {
      kind: "wobbles",
    } as unknown as PartDefinition["contracts"][number];
    expect(() => definePart({ ...good, contracts: [bad] })).toThrow(
      /unknown contract kind/,
    );
  });

  it("rejects height-in with no heights", () => {
    expect(() =>
      definePart({ ...good, contracts: [{ kind: "height-in", values: [] }] }),
    ).toThrow(/no heights/);
  });
});
