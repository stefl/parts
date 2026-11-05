import type { Meta, StoryObj } from "@storybook/react-vite";
import { storyFrame } from "@/lib/story-frame";
import { Prose } from "@/ui/prose";

const meta = {
  title: "Prose",
  decorators: [storyFrame("w-[960px] p-6")],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** However wide the page, a paragraph stops at 64 characters of its own
 * font. */
export const OnTheMeasure: Story = {
  render: () => (
    <Prose>
      A line of running text is easiest to read at around sixty characters. Past
      that the eye loses its place on the way back to the left edge, and the
      paragraph starts to feel like work. The measure holds it there whatever
      the width of the page around it.
    </Prose>
  ),
};
