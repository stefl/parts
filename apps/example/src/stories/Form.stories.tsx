import type { Meta, StoryObj } from "@storybook/react-vite";
import { storyFrame } from "@/lib/story-frame";
import { Band, Heading } from "@/ui/band";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";

const meta = {
  title: "Form",
  decorators: [storyFrame("w-[480px] p-6")],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every control on the form is 32px: the fields and the buttons beside
 * them. One solid button per screen. */
export const OneHeight: Story = {
  render: () => (
    <Band>
      <Heading>New project</Heading>
      <Field id="name" label="Name" placeholder="Housekeeping" />
      <Field id="prefix" label="Ref prefix" placeholder="HK" />
      <div className="flex gap-2" data-part="control">
        <Button variant="solid">Create</Button>
        <Button>Cancel</Button>
      </div>
    </Band>
  ),
};

/** The three control heights, each in the place it belongs: 24 inside a
 * title line, 28 in a dense row, 32 everywhere else. */
export const Ladder: Story = {
  render: () => (
    <div className="flex items-end gap-2" data-part="control">
      <Button size="small" variant="ghost">
        Copy
      </Button>
      <Button size="dense">Open</Button>
      <Button size="regular">Save</Button>
    </div>
  ),
};
