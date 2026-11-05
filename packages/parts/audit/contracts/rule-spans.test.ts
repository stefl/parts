import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = { bar: part("bar", { kind: "rule-spans" }) };

describe("rule-spans", () => {
  it("catches a bottom rule shorter than the bar", () => {
    const boxes = build(
      box({
        part: "bar",
        rect: [0, 0, 400, 40],
        children: [box({ rect: [16, 0, 300, 40], borderBottom: 1 })],
      }),
    );
    const v = audit(boxes, parts);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      kind: "rule-spans",
      part: "bar",
      boxIds: [1, 0],
    });
  });

  it("passes a rule within a pixel of the bar's width", () => {
    const boxes = build(
      box({
        part: "bar",
        rect: [0, 0, 400, 40],
        children: [box({ rect: [0, 0, 399.5, 40], borderBottom: 1 })],
      }),
    );
    expect(audit(boxes, parts)).toEqual([]);
  });

  it("ignores a short rule that belongs to a nested bar", () => {
    const boxes = build(
      box({
        part: "bar",
        rect: [0, 0, 400, 40],
        children: [
          box({
            part: "bar",
            rect: [0, 0, 200, 40],
            children: [box({ rect: [0, 0, 200, 40], borderBottom: 1 })],
          }),
        ],
      }),
    );
    expect(audit(boxes, parts)).toEqual([]);
  });

  it("does not report a nested bar's own bottom border as a short rule", () => {
    const boxes = build(
      box({
        part: "bar",
        rect: [0, 0, 400, 40],
        children: [
          box({ part: "bar", rect: [0, 0, 200, 40], borderBottom: 1 }),
        ],
      }),
    );
    expect(audit(boxes, parts)).toEqual([]);
  });

  it("still catches a short rule on a plain element inside the bar", () => {
    const boxes = build(
      box({
        part: "bar",
        rect: [0, 0, 400, 40],
        children: [box({ rect: [0, 0, 200, 40], borderBottom: 1 })],
      }),
    );
    expect(audit(boxes, parts)).toHaveLength(1);
  });
});
