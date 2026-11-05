import { definePart } from "./define";

export default definePart({
  name: "list.group-label",
  purpose: "Names a group of rows and lines up with the row titles below it.",
  level: 1,
  within: ["list"],
  contains: [],
  contracts: [
    // A label on a different left edge from the titles gives one list two
    // edges, and the eye reads two lists.
    { kind: "aligns-left", with: "row.title", scope: "list" },
  ],
  style: {
    label: "px-3 pt-3 pb-1",
  },
});
