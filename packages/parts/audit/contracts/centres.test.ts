import { describe, expect, it } from "vitest";
import { audit } from "../audit";
import { box, build, part } from "../test-helpers";

const parts = { run: part("run", { kind: "centres" }) };

const run = (align: string | undefined, secondY: number, wrap?: string) =>
  build(
    box({
      part: "run",
      rect: [0, 0, 300, 40],
      attrs: {
        ...(align ? { align } : {}),
        ...(wrap ? { wrap } : {}),
      },
      children: [
        box({ rect: [0, 10, 20, 20] }),
        box({ rect: [30, secondY, 20, 20] }),
      ],
    }),
  );

describe("centres", () => {
  it("catches children whose centres differ by more than the tolerance", () => {
    const v = audit(run("center", 16), parts);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ kind: "centres", boxIds: [0, 1, 2] });
  });

  it("passes a 1px spread", () => {
    expect(audit(run("center", 11), parts)).toEqual([]);
  });

  it("compares centres within a line, not across wrapped lines", () => {
    const wrapped = build(
      box({
        part: "run",
        rect: [0, 0, 300, 80],
        attrs: { align: "center", wrap: "true" },
        children: [
          box({ rect: [0, 0, 20, 20] }),
          box({ rect: [30, 0, 20, 20] }),
          box({ rect: [0, 40, 20, 20] }),
          box({ rect: [30, 40, 20, 20] }),
        ],
      }),
    );
    expect(audit(wrapped, parts)).toEqual([]);
  });

  it("still catches a misaligned child on the second line", () => {
    const wrapped = build(
      box({
        part: "run",
        rect: [0, 0, 300, 80],
        attrs: { align: "center", wrap: "true" },
        children: [
          box({ rect: [0, 0, 20, 20] }),
          box({ rect: [0, 40, 20, 20] }),
          box({ rect: [30, 46, 20, 20] }),
        ],
      }),
    );
    const v = audit(wrapped, parts);
    expect(v).toHaveLength(1);
    expect(v[0]?.boxIds).toEqual([0, 2, 3]);
  });

  it("catches a badly displaced child in a non-wrapping run", () => {
    // Two 20px children at y=10 and y=30 do not overlap vertically, which
    // would read as two lines if the run were allowed to wrap.
    const v = audit(run("center", 30, "false"), parts);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ kind: "centres", boxIds: [0, 1, 2] });
  });

  it("passes the two-line layout only when the run declares wrapping", () => {
    expect(audit(run("center", 30, "true"), parts)).toEqual([]);
    expect(audit(run("center", 30), parts)).toHaveLength(1);
  });

  it("ignores a run that did not ask for centring", () => {
    expect(audit(run(undefined, 16), parts)).toEqual([]);
    expect(audit(run("start", 16), parts)).toEqual([]);
  });
});
