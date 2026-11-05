import { definePart } from "./define";

export default definePart({
  name: "row.meta",
  purpose:
    "Quiet context on a row or a card, such as a time or an owner, read only when wanted.",
  level: 2,
  within: ["row", "card"],
  contains: [],
  contracts: [
    // A row's quiet second line starts on its title's edge, not under a
    // glyph or time before the title: a second line that steps in reads as
    // an entry of its own.
    {
      kind: "aligns-left",
      with: "row.title",
      scope: "row",
      when: { attr: "row-sub", value: "true" },
    },
  ],
});
