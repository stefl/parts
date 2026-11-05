import { definePart } from "./define";

export default definePart({
  name: "prose",
  purpose: "Words read as sentences, held to the reading measure.",
  level: 1,
  within: [],
  contains: [],
  // A paragraph that ran the full width of a page was the first thing a
  // reader noticed and the last thing a gate did.
  contracts: [{ kind: "within-measure" }],
  style: {
    copy: "block max-w-measure wrap-break-word text-copy",
  },
});
