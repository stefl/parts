import { definePart } from "./define";

export default definePart({
  name: "row",
  purpose:
    "One thing in a list: its title, a quiet line, and the controls that act on it.",
  level: 1,
  within: ["list"],
  contains: ["row.title", "row.meta", "control"],
  contracts: [
    // Half a pixel: the default 1 would let a 41px row pass.
    { kind: "grid-4", tolerance: 0.5 },
    // One line of 14/20 on 12px of padding is 44; a quiet 13/16 line under
    // it adds 16, so a two-line row is 60. A row of any other height is
    // drawing something it should not.
    { kind: "height-in", values: [44, 60], tolerance: 0.5 },
  ],
  // The row's own padding; the title cell carries none of its own.
  style: {
    row: "px-3 py-3",
  },
});
