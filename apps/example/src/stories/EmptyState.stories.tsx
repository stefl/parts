import type { Meta, StoryObj } from "@storybook/react-vite";
import { storyFrame } from "@/lib/story-frame";
import { Band, Heading } from "@/ui/band";
import { EmptyState } from "@/ui/empty-state";
import { GroupLabel, List } from "@/ui/list";

const meta = {
  title: "EmptyState",
  decorators: [storyFrame("w-[560px] p-6")],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** One quiet line, where the first row would have been. */
export const UnderHeading: Story = {
  render: () => (
    <Band>
      <Heading inset>Paused</Heading>
      <List>
        <EmptyState
          title="Nothing paused"
          description="A row lands here when you pause it from its card."
        />
      </List>
    </Band>
  ),
};

export const InGroup: Story = {
  render: () => (
    <List>
      <GroupLabel>Later</GroupLabel>
      <EmptyState title="Nothing for later yet" />
    </List>
  ),
};
