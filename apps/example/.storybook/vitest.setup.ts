import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/react-vite";
import { afterAll, beforeAll } from "vitest";
import { requireGateRan } from "../../../packages/parts/storybook/setup";
import previewAnnotations from "./preview";

const project = setProjectAnnotations([
  a11yAddonAnnotations,
  previewAnnotations,
]);

beforeAll(project.beforeAll);

// The gate hook must fire at least once per story file, or every story in
// it would pass unchecked.
afterAll(requireGateRan);
