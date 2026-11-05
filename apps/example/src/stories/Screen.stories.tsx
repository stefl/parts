import type { Meta, StoryObj } from "@storybook/react-vite";
import { storyFrame } from "@/lib/story-frame";
import { Band, Heading } from "@/ui/band";
import { Bar, Tabs } from "@/ui/bar";
import { Button } from "@/ui/button";
import { GroupLabel, List, Row } from "@/ui/list";

const tabs = [
  { label: "Open", count: 3 },
  { label: "Paused", count: 1 },
  { label: "Done" },
];

const board = (
  <div className="flex flex-col gap-6" data-part="band">
    <Bar
      tabs={<Tabs tabs={tabs} current="Open" />}
      control={
        <Button size="dense" variant="ghost">
          Display
        </Button>
      }
    />
    <Band>
      <Heading inset>Housekeeping</Heading>
      <List>
        <GroupLabel count={2}>Today</GroupLabel>
        <Row title="Rename the export job" meta="Open · 2h ago" selected />
        <Row title="Tidy the settings page" meta="Open · yesterday" />
        <GroupLabel count={1}>Later</GroupLabel>
        <Row title="Move the archive to its own route" meta="Paused · 3d ago" />
      </List>
    </Band>
  </div>
);

const meta = {
  title: "Screen",
  decorators: [storyFrame("w-[720px] p-6")],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Board: Story = { render: () => board };

export const BoardDark: Story = {
  decorators: [storyFrame("dark bg-bg p-6")],
  render: () => board,
};
