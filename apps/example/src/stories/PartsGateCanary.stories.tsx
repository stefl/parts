import type { Meta, StoryObj } from "@storybook/react-vite";

// This story exists only to prove the gate hook fires: it plants one certain
// violation, a control 40px tall where only 24, 28 or 32 is allowed, and
// allows it with a reason so the sidecar records zero. Remove the allow and
// the story fails; remove the hook and the afterAll in vitest.setup.ts fails
// this file, since the hook's counter stays at zero.
const meta = {
  title: "PartsGateCanary",
  parameters: {
    parts: {
      allow: {
        "control:height-in":
          "the planted violation that proves the hook fires; the allow is the escape hatch under test",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlantedViolation: Story = {
  render: () => <div data-part="control" style={{ height: 40, width: 80 }} />,
};
