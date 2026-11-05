import { definePart } from "./define";

export default definePart({
  name: "bar",
  purpose:
    "A strip that holds a screen's tabs and controls and draws one rule under all of them.",
  level: 0,
  within: [],
  contains: ["tabs", "control"],
  contracts: [
    // The rule runs under everything in the bar. A rule drawn on the tab
    // list alone stops short of the control beside it, which is the bug
    // this whole pattern began with.
    { kind: "rule-spans" },
    // One 32px line and its 1px rule, with or without a control in it.
    { kind: "height-in", values: [33] },
  ],
});
