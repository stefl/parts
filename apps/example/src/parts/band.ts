import { definePart } from "./define";

export default definePart({
  name: "band",
  purpose: "A section of a page: a heading and what it introduces.",
  level: 0,
  within: [],
  contains: ["heading", "list", "prose", "card", "empty", "bar", "control"],
  contracts: [
    // Inside a band, things sit 8, 16 or 24px apart. 32px is the step
    // between bands, so a gap of 32 inside one makes its parts read as
    // bands of their own.
    { kind: "gaps-on-scale", scale: [8, 16, 24], tolerance: 0.5 },
  ],
});
