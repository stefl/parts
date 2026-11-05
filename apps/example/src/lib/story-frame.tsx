import type { Decorator } from "@storybook/react-vite";
import { STORY_FRAME_ATTR } from "../../../../packages/parts/walk/collect-boxes";

/** A frame the story draws and the app never does: a width, a dark ground,
 * a padded main. Its own layout classes leave the unclassified count; what
 * renders inside it still counts. */
export function storyFrame(className: string): Decorator {
  return (Story) => (
    <div className={className} {...{ [STORY_FRAME_ATTR]: "" }}>
      <Story />
    </div>
  );
}
