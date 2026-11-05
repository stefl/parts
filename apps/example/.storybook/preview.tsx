import type { Preview } from "@storybook/react-vite";
import { partsGate } from "../../../packages/parts/storybook/hook";
import { parts } from "../src/parts/manifest";
import "../src/styles.css";
import "./preview.css";

// Stories are light unless one wraps itself in `.dark`; without `.light`
// on the root a machine set to dark mode would turn every story dark.
document.documentElement.classList.add("light");

const preview: Preview = {
  parameters: {
    a11y: { test: "error" },
    backgrounds: { disable: true },
  },
  // The rendered parts gate. Runs after render and play, per story, in the
  // vitest browser run only; inert in the Storybook dev UI.
  afterEach: partsGate({ parts }),
};

export default preview;
