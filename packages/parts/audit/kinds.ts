import type { ContractKind } from "../registry/types";
import type { ContractCheck } from "./context";
import { check as alignsLeft } from "./contracts/aligns-left";
import { check as baselines } from "./contracts/baselines";
import { check as centredIn } from "./contracts/centred-in";
import { check as centres } from "./contracts/centres";
import { check as clearOf } from "./contracts/clear-of";
import { check as closerBelow } from "./contracts/closer-below";
import { check as gapsOnScale } from "./contracts/gaps-on-scale";
import { check as grid4 } from "./contracts/grid-4";
import { check as heightIn } from "./contracts/height-in";
import { check as noCut } from "./contracts/no-cut";
import { check as noOverflow } from "./contracts/no-overflow";
import { check as ruleSpans } from "./contracts/rule-spans";
import { check as uniformHeight } from "./contracts/uniform-height";
import { check as withinMeasure } from "./contracts/within-measure";

// kind-names.ts lists the same kinds without the checkers; add a new kind there too.
// Hand-written. Keep entries alphabetical and let the type force
// completeness: a new ContractKind without an entry fails type-check.
export const CHECKS: { readonly [K in ContractKind]: ContractCheck<K> } = {
  "aligns-left": alignsLeft,
  baselines,
  "centred-in": centredIn,
  centres,
  "clear-of": clearOf,
  "closer-below": closerBelow,
  "gaps-on-scale": gapsOnScale,
  "grid-4": grid4,
  "height-in": heightIn,
  "no-cut": noCut,
  "no-overflow": noOverflow,
  "rule-spans": ruleSpans,
  "uniform-height": uniformHeight,
  "within-measure": withinMeasure,
};
