import { defineConfig } from "vitest/config";

// Node-side unit tests: the pure engine, the registry helpers, the check
// scripts. Browser-rendered tests (the example app's stories and the gate)
// live in apps/example and run through @storybook/addon-vitest there.
export default defineConfig({
  test: {
    include: ["scripts/**/*.test.ts", "packages/**/*.test.{ts,tsx}"],
  },
});
