// Every story as a browser test, through @storybook/addon-vitest. Stories
// are discovered from .storybook/main.ts.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import {
  readPartsBaseline,
  writePartsBaseline,
} from "../../packages/parts/gate/commands";
import { partsUpdateDefine } from "../../packages/parts/storybook/define";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
  // PARTS_UPDATE=1 turns the gate from compare into record.
  define: partsUpdateDefine(),
  test: {
    name: "example-storybook",
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      // Node-side file access for the sidecars.
      commands: { readPartsBaseline, writePartsBaseline },
    },
    setupFiles: [path.join(dirname, ".storybook/vitest.setup.ts")],
  },
});
