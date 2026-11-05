import { definePart } from "./define";

export default definePart({
  name: "heading",
  purpose:
    "Words that introduce what follows, so they sit nearer to it than to what came before.",
  level: 1,
  within: [],
  contains: [],
  contracts: [
    { kind: "closer-below" },
    // A band's heading sits on the title edge of the list under it, like a
    // group label does. A heading with no band around it is untouched.
    { kind: "aligns-left", with: "row.title", scope: "band" },
  ],
});
