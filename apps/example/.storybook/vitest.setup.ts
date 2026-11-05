// The addon applies the preview annotations (decorators, parameters, the
// gate hook) by itself; this file adds the one guard the gate needs: the
// hook must fire at least once per story file, or every story in it would
// pass unchecked.
import { afterAll } from "vitest";
import { requireGateRan } from "../../../packages/parts/storybook/setup";

afterAll(requireGateRan);
