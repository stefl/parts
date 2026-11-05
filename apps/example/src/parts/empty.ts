import { definePart } from "./define";

export default definePart({
  name: "empty",
  purpose:
    "What is not there yet, said in one quiet line where the content would have started.",
  level: 1,
  within: [],
  contains: [],
  // One line of 14/20 and nothing else: no box, no icon, no centring. A
  // dashed outline reads as a place to drop something.
  contracts: [{ kind: "height-in", values: [20] }],
});
