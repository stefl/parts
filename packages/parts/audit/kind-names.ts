import type { ContractKind } from "../registry/types";

// The names of every contract kind, with none of the checkers behind them.
// definePart needs only the names to refuse a typo, and the primitives import
// the manifest at runtime, so reading the names from kinds.ts (which imports
// every checker) pulled the audit engine into the web bundle. This file
// stays free of that.
//
// The object form is the exhaustiveness guard: `satisfies` fails type-check
// on a kind that is missing here and on a name that is not a ContractKind,
// the same completeness kinds.ts gets from its mapped type.
const NAMES = {
  "aligns-left": true,
  baselines: true,
  "centred-in": true,
  centres: true,
  "clear-of": true,
  "closer-below": true,
  "gaps-on-scale": true,
  "grid-4": true,
  "height-in": true,
  "no-cut": true,
  "no-overflow": true,
  "rule-spans": true,
  "uniform-height": true,
  "within-measure": true,
} as const satisfies Record<ContractKind, true>;

export const KIND_NAMES: readonly ContractKind[] = Object.keys(
  NAMES,
) as ContractKind[];
