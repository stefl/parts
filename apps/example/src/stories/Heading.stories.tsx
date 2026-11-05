import type { Meta, StoryObj } from "@storybook/react-vite";
import { storyFrame } from "@/lib/story-frame";
import { Band, Heading } from "@/ui/band";
import { Prose } from "@/ui/prose";

const meta = {
  title: "Heading",
  decorators: [storyFrame("w-[640px] p-6")],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A heading belongs to what follows it: nearer the paragraph below than
 * anything above. */
export const AboveProse: Story = {
  decorators: [storyFrame("flex flex-col gap-8")],
  render: () => (
    <>
      <Prose>
        The paragraph before. It ends here, and the heading below sits well
        clear of it.
      </Prose>
      <Band>
        <Heading>What the export does</Heading>
        <Prose>
          It writes every record to a file you choose, one line each, in the
          order they were made. Nothing is sent anywhere; the file stays on your
          disk until you move it.
        </Prose>
      </Band>
    </>
  ),
};
