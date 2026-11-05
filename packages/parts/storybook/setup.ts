// For the vitest setup file of the Storybook browser project:
//
//   import { afterAll } from "vitest";
//   import { requireGateRan } from "<your copy>/storybook/setup";
//   afterAll(requireGateRan);
//
// The gate hook must fire at least once per story file; if it silently
// stopped being wired in, every story would pass unchecked. A canary story
// with a planted, allowed violation relies on this.
import { gateRunCount } from "../gate/gate-ran";

export function requireGateRan(): void {
  if (gateRunCount() === 0) {
    throw new Error("parts gate: the afterEach hook never ran in this file");
  }
}
