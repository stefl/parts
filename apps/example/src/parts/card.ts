import { definePart } from "./define";

export default definePart({
  name: "card",
  purpose: "One thing shown in full, beside the list that names it.",
  level: 1,
  within: [],
  contains: ["heading", "prose", "row.meta", "control"],
  // A card keeps one column gap, 32px, from the rows beside it, so a
  // selected row's fill never runs up to the card's edge.
  contracts: [{ kind: "clear-of", of: "row", min: 32 }],
});
