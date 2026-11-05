import { definePart } from "./define";

export default definePart({
  name: "list",
  purpose:
    "A column of rows, optionally with group labels between them, that reads as one list.",
  level: 0,
  within: [],
  contains: ["list.group-label", "row", "empty"],
  contracts: [
    // Rows come in one or two heights (one line, two lines). A third height
    // means a row is drawing something else.
    { kind: "uniform-height", of: "row", max: 2 },
  ],
});
