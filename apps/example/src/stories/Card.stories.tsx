import type { Meta, StoryObj } from "@storybook/react-vite";
import { storyFrame } from "@/lib/story-frame";
import { Heading } from "@/ui/band";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { List, Row } from "@/ui/list";
import { Prose } from "@/ui/prose";
import { part } from "@/parts/part";

const meta = {
  title: "Card",
  decorators: [storyFrame("w-[880px] p-6")],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The card keeps one column gap, 32px, from the rows beside it, so a
 * selected row's fill never meets its edge. */
export const BesideList: Story = {
  decorators: [storyFrame("grid grid-cols-[320px_1fr] gap-8")],
  render: () => (
    <>
      <List>
        <Row title="Rename the export job" meta="Open · 2h ago" selected />
        <Row title="Tidy the settings page" meta="Open · yesterday" />
        <Row title="Move the archive" meta="Paused · 3d ago" />
      </List>
      <Card>
        <Heading>Rename the export job</Heading>
        <div className="text-meta text-ink-3" {...part("row.meta")}>
          Open · under Housekeeping · 2h ago
        </div>
        <Prose>
          The job is still called nightly-dump in the scheduler and export in
          the UI. One name, in both places, and the log lines will match the
          screen.
        </Prose>
        <div className="flex gap-2" {...part("control")}>
          <Button variant="solid">Take it</Button>
          <Button>Later</Button>
        </div>
      </Card>
    </>
  ),
};
