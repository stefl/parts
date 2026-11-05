import { definePart } from "./define";

export default definePart({
  name: "field",
  purpose: "A form field: its label over the control it names, one step apart.",
  level: 1,
  within: [],
  contains: ["control"],
  // The label sits 4px over its control and nowhere else, so every field on
  // a form has the same rhythm.
  contracts: [{ kind: "gaps-on-scale", scale: [4], tolerance: 0.5 }],
});
