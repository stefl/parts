import { definePart } from "./define";

export default definePart({
  name: "control",
  purpose:
    "Something you press, type into or choose: a button, a field, a menu trigger.",
  level: 1,
  within: [],
  contains: [],
  contracts: [
    // Three heights and no others: 24 inside a title line, 28 in a dense
    // row, 32 everywhere else. A 30px button beside a 32px one reads as a
    // mistake even when nobody can say why.
    { kind: "height-in", values: [24, 28, 32] },
    // A form's field is 32, the height of the buttons beside it, so one
    // form carries one control height.
    {
      kind: "height-in",
      values: [32],
      when: { attr: "place", value: "field" },
    },
  ],
  // Button reads its size classes from here, so the registry is the one
  // place a control's height is decided.
  style: {
    small: "h-6 gap-glyph px-1.5 text-meta",
    dense: "h-7 gap-glyph px-2 text-data",
    regular: "h-8 gap-glyph p-control text-data",
  },
});
