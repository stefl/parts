import { definePart } from "./define";

export default definePart({
  name: "row.title",
  purpose: "The words that name a row; the first thing the eye reads.",
  level: 1,
  within: ["row"],
  contains: [],
  contracts: [
    // Nothing in the title draws past it: a line under a title that never
    // truncated once ran across the columns to its right.
    { kind: "no-overflow" },
    // The title's words and a count beside them share a baseline; a
    // centred inline-flex box can still hold text a pixel or two apart.
    { kind: "baselines" },
  ],
});
