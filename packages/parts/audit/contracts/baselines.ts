import type { Box } from "../../registry/types";
import type { ContractCheck } from "../context";
import { lines } from "./centres";

// Centring compares boxes, not the glyphs inside them, so two boxes centred
// on one line can still hold text on different baselines: a project's name
// sat 1-2px below the "· N" count beside it because its label was an inline
// flex box opening on a textless dot, whose bottom edge became the label's
// baseline (ruled 2026-11-01). The walk records each text-bearing
// child's first text line (its top and baseline); children are grouped into
// lines by those first lines overlapping, as `centres` groups a wrapping
// run's boxes, so a line under a title is never held to the title's
// baseline, and neither is a mark beside the second line of a span that
// wrapped.

/** Baselines snap to whole or half pixels, and the drift that prompted this was a
 * whole pixel, so the default sits under it rather than at the usual 1px. */
const BASELINE_TOLERANCE = 0.5;

const round2 = (n: number): number => Math.round(n * 100) / 100;

// Text beside text shares a baseline; a boxed thing (a chip, a key cap, a
// button, a mark, inline code, a tab) sits centred on the line by its box,
// so its inner text is not held to its neighbours' baseline (Stef,
// 2026-11-04, "Baseline, as recommended").
const BOXED = new Set(["chip", "keycap", "control", "mark", "code", "tab"]);

/** The box narrowed to its first text line, where the walk recorded one, so
 * `lines` groups by the line the text starts on. */
function firstLine(k: Box): Box {
  if (k.textTop === undefined || k.baseline === undefined) return k;
  const h = Math.max(k.baseline - k.textTop, 1);
  return { ...k, rect: { ...k.rect, y: k.textTop, h } };
}

export const check: ContractCheck<"baselines"> = (ctx, box, contract) => {
  const tol = contract.tolerance ?? BASELINE_TOLERANCE;
  // A plain wrapper round one boxed part (a ref chip's popover anchor, a
  // table cell's trailing tag) is that boxed thing on the line, as long as
  // its first text is the boxed part's own (no words of its own before it).
  // An open popover or overlay floats off the line, so it does not count.
  const boxed = (k: Box): boolean => {
    if (k.part !== null) return BOXED.has(k.part);
    const kids = ctx
      .childrenOf(k.id)
      .filter((c) => c.part !== "popover" && c.part !== "overlay");
    const only = kids.length === 1 ? kids[0] : undefined;
    return (
      only !== undefined &&
      (only.baseline === undefined || only.baseline === k.baseline) &&
      boxed(only)
    );
  };
  // A top-aligned run (`align="start"`) lays out columns or blocks of
  // different heights, not words on one line, so it holds no baseline.
  if (box.attrs.align === "start") return [];
  // A frame row (`data-place="frame"`: crumbs, Previous, Next, Watch) is a
  // band of controls held to one control height by `height-in`, centred.
  if (box.attrs.place === "frame") return [];
  const texts = ctx
    .childrenOf(box.id)
    .filter((k) => k.baseline !== undefined && !boxed(k))
    .map(firstLine);
  const out = [];
  for (const line of lines(texts)) {
    if (line.length < 2) continue;
    const bases = line.map((k) => k.baseline as number);
    const spread = round2(Math.max(...bases) - Math.min(...bases));
    if (spread <= tol) continue;
    out.push({
      part: box.part ?? "",
      kind: "baselines" as const,
      boxIds: [box.id, ...line.map((k) => k.id)],
      message: `text baselines on one line spread over ${spread}px (${line.map((k) => `${k.part ?? "text"} ${k.baseline}`).join(", ")})`,
    });
  }
  return out;
};
