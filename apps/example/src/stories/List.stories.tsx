import type { Meta, StoryObj } from "@storybook/react-vite";
import { storyFrame } from "@/lib/story-frame";
import { Button } from "@/ui/button";
import { GroupLabel, List, Row } from "@/ui/list";

const meta = {
  title: "List",
  decorators: [storyFrame("w-[560px] p-6")],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grouped: Story = {
  render: () => (
    <List>
      <GroupLabel count={2}>Today</GroupLabel>
      <Row title="Rename the export job" meta="Open · 2h ago" />
      <Row title="Tidy the settings page" meta="Open · yesterday" selected />
      <GroupLabel count={1}>Later</GroupLabel>
      <Row title="Move the archive to its own route" meta="Paused · 3d ago" />
    </List>
  ),
};

export const OneLineRows: Story = {
  render: () => (
    <List>
      <Row title="Rename the export job" />
      <Row title="Tidy the settings page" />
      <Row title="Move the archive to its own route" />
    </List>
  ),
};

export const WithActions: Story = {
  render: () => (
    <List>
      <Row
        title="Rename the export job"
        meta="Open · 2h ago"
        action={<Button size="dense">Open</Button>}
      />
      <Row
        title="Tidy the settings page"
        meta="Open · yesterday"
        action={<Button size="dense">Open</Button>}
      />
    </List>
  ),
};

export const Dark: Story = {
  decorators: [storyFrame("dark bg-bg p-6")],
  render: () => (
    <List>
      <GroupLabel count={2}>Today</GroupLabel>
      <Row title="Rename the export job" meta="Open · 2h ago" />
      <Row title="Tidy the settings page" meta="Open · yesterday" selected />
    </List>
  ),
};
