import { describe, expect, it } from "vitest";
import { part } from "../audit/test-helpers";
import type { Box } from "../registry/types";
import { evaluateSkipped, evaluateStory, readAllow, storyKey } from "./gate";
import { baselinePathFor, stableStringify } from "./sidecar";

// Pure tests for the rendered gate's decision half.
// The browser hook only collects boxes and calls evaluateStory, so these
// pin the ratchet without a browser.

const box = (over: Partial<Box> = {}): Box => ({
  id: 1,
  part: "control",
  parentId: null,
  rect: { x: 0, y: 0, w: 80, h: 40 },
  borderBottom: 0,
  attrs: {},
  hasLayoutClasses: false,
  ...over,
});

// The canary story's measured shape: one control 40px tall.
const canary = [box()];
const clean = [box({ rect: { x: 0, y: 0, w: 80, h: 32 } })];
const zero = { violations: 0, unclassified: 0 };
// A control on the three-step height ladder, as a real registry would say.
const parts = {
  control: part("control", { kind: "height-in", values: [24, 28, 32] }),
};
const base = { parts, update: false } as const;

describe("evaluateStory", () => {
  it("fails a missing sidecar entry and says none is recorded", () => {
    const r = evaluateStory({ ...base, boxes: clean, entry: undefined });
    expect(r.error).toContain("no baseline recorded");
  });

  it("fails above baseline, listing violations and both numbers", () => {
    const r = evaluateStory({ ...base, boxes: canary, entry: zero });
    expect(r.measured).toEqual({ violations: 1, unclassified: 0 });
    expect(r.error).toContain("measured violations=1");
    expect(r.error).toContain("baseline violations=0");
    expect(r.error).toContain("control height-in");
    expect(r.error).toContain("parts:update workflow");
    expect(r.error).toContain("parameters.parts.allow");
    expect(r.error).toContain("must be violations=0 unclassified=0");
  });

  it("passes at or below baseline", () => {
    expect(
      evaluateStory({ ...base, boxes: clean, entry: zero }).error,
    ).toBeUndefined();
    expect(
      evaluateStory({
        ...base,
        boxes: clean,
        entry: { violations: 3, unclassified: 0 },
      }).error,
    ).toBeUndefined();
  });

  it("errors on the canary without the allow and passes with it", () => {
    expect(
      evaluateStory({ ...base, boxes: canary, entry: zero }).error,
    ).toBeDefined();
    expect(
      evaluateStory({
        ...base,
        boxes: canary,
        entry: zero,
        allow: { "control:height-in": "the planted canary" },
      }).error,
    ).toBeUndefined();
  });

  it("filters only the allowed part:kind", () => {
    const r = evaluateStory({
      ...base,
      boxes: canary,
      entry: zero,
      allow: { "chip:height-in": "a different part" },
    });
    expect(r.error).toBeDefined();
  });

  describe("update mode", () => {
    const update = { ...base, update: true } as const;

    it("writes a new entry at zero", () => {
      const r = evaluateStory({ ...update, boxes: clean, entry: undefined });
      expect(r.write).toEqual(zero);
      expect(r.error).toBeUndefined();
    });

    it("refuses a new entry above zero and says how to reach zero", () => {
      const r = evaluateStory({ ...update, boxes: canary, entry: undefined });
      expect(r.write).toBeUndefined();
      expect(r.error).toContain("measured violations=1");
      expect(r.error).toContain("must be violations=0 unclassified=0");
      expect(r.error).toContain('"part:kind"');
    });

    it("records a new story at zero once its violation is allowed with a reason", () => {
      const r = evaluateStory({
        ...update,
        boxes: canary,
        entry: undefined,
        allow: { "control:height-in": "the planted canary" },
      });
      expect(r.write).toEqual(zero);
      expect(r.error).toBeUndefined();
    });

    it("lowers an existing entry", () => {
      const r = evaluateStory({
        ...update,
        boxes: clean,
        entry: { violations: 4, unclassified: 0 },
      });
      expect(r.write).toEqual(zero);
      expect(r.error).toBeUndefined();
    });

    it("never raises an entry and still fails when measured is above it", () => {
      const r = evaluateStory({ ...update, boxes: canary, entry: zero });
      expect(r.write).toBeUndefined();
      expect(r.error).toContain("measured violations=1");
    });

    it("writes nothing when nothing changed", () => {
      const r = evaluateStory({ ...update, boxes: clean, entry: zero });
      expect(r.write).toBeUndefined();
      expect(r.error).toBeUndefined();
    });
  });
});

describe("readAllow", () => {
  it("takes a record of part:kind to a written reason", () => {
    const r = readAllow({ "row.title:baselines": "the planted drift" });
    expect([...r.allow]).toEqual(["row.title:baselines"]);
    expect(r.problems).toEqual([]);
  });

  it("refuses the old bare array, an empty reason and a malformed key", () => {
    expect(readAllow(["control:height-in"]).problems[0]).toContain(
      'must be { "part:kind": "<reason>" }',
    );
    expect(readAllow({ "control:height-in": " " }).problems[0]).toContain(
      "has no reason",
    );
    expect(readAllow({ control: "why" }).problems[0]).toContain(
      'is not "part:kind"',
    );
  });

  it("fails the story when an allow has no reason, even at zero", () => {
    const r = evaluateStory({
      ...base,
      boxes: canary,
      entry: zero,
      allow: { "control:height-in": "" },
    });
    expect(r.error).toContain("has no reason");
  });
});

describe("evaluateSkipped", () => {
  it("records a skipped story as zeros in record mode", () => {
    expect(evaluateSkipped(undefined, true)).toEqual({ write: zero });
  });

  it("writes nothing in compare mode, so a skipped story passes", () => {
    expect(evaluateSkipped(undefined, false)).toEqual({});
  });

  it("leaves an existing entry alone", () => {
    expect(evaluateSkipped(zero, true)).toEqual({});
  });
});

describe("storyKey", () => {
  it("takes the id after the double dash", () => {
    expect(storyKey("test-partsgatecanary--planted-violation")).toBe(
      "planted-violation",
    );
  });
  it("keeps an id with no double dash whole", () => {
    expect(storyKey("plain")).toBe("plain");
  });
});

describe("sidecar helpers", () => {
  it("baselinePathFor swaps the extension for .parts.json beside the file", () => {
    expect(baselinePathFor("/root", "src/ui/Button.stories.tsx")).toBe(
      "/root/src/ui/Button.stories.parts.json",
    );
    expect(baselinePathFor("/root", "/abs/a.stories.ts")).toBe(
      "/abs/a.stories.parts.json",
    );
  });

  it("stableStringify sorts keys at every level and ends with a newline", () => {
    const out = stableStringify({ b: { z: 1, a: 2 }, a: 0 });
    expect(out).toBe(
      '{\n  "a": 0,\n  "b": {\n    "a": 2,\n    "z": 1\n  }\n}\n',
    );
  });
});
