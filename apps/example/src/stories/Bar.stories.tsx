import type { Meta, StoryObj } from "@storybook/react-vite";
import { storyFrame } from "@/lib/story-frame";
import { Bar, Tabs } from "@/ui/bar";
import { Button } from "@/ui/button";

const tabs = [
  { label: "Open", count: 12 },
  { label: "Paused", count: 3 },
  { label: "Done" },
];

const meta = {
  title: "Bar",
  decorators: [storyFrame("w-[640px] p-6")],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The rule runs under the control as well as the tabs. */
export const TabsWithControl: Story = {
  render: () => (
    <Bar
      tabs={<Tabs tabs={tabs} current="Open" />}
      control={
        <Button size="dense" variant="ghost">
          Display
        </Button>
      }
    />
  ),
};

export const TabsAlone: Story = {
  render: () => <Bar tabs={<Tabs tabs={tabs} current="Paused" />} />,
};
