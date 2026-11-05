import { describe, expect, it } from "vitest";
import { buildContext } from "./context";
import { box, build } from "./test-helpers";

const r = [0, 0, 10, 10] as const;

// The nearest-part lookups the grammar checks stand on.
describe("nearestPartAncestor", () => {
  const boxes = build(
    box({
      part: "list",
      rect: r,
      children: [
        box({
          rect: r,
          children: [box({ part: "row", rect: r })],
        }),
      ],
    }),
  );
  it("skips unparted boxes to the closest part", () => {
    expect(buildContext(boxes).nearestPartAncestor(2)?.id).toBe(0);
  });
  it("is undefined when no part is above", () => {
    expect(buildContext(boxes).nearestPartAncestor(0)).toBeUndefined();
  });
});

describe("nearestPartDescendants", () => {
  const boxes = build(
    box({
      part: "list",
      rect: r,
      children: [
        box({
          rect: r,
          children: [
            box({
              part: "row",
              rect: r,
              children: [box({ part: "chip", rect: r })],
            }),
          ],
        }),
        box({ part: "bar", rect: r }),
      ],
    }),
  );
  it("returns the first part on each branch, in id order, not those below it", () => {
    const ids = buildContext(boxes)
      .nearestPartDescendants(0)
      .map((b) => b.part);
    expect(ids).toEqual(["row", "bar"]);
  });
  it("is empty for a leaf", () => {
    expect(buildContext(boxes).nearestPartDescendants(4)).toEqual([]);
  });
});
