// @vitest-environment jsdom
// What jsdom can give the box walk: it has no layout, so every
// rect is stubbed to a fixed size here, and the test asserts only what the
// walk decides from styles, attributes and class names, not geometry.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { collectBoxes, LAYOUT_TOKEN } from "./collect-boxes";

let host: HTMLDivElement;

beforeEach(() => {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    top: 0,
    left: 0,
    right: 100,
    bottom: 20,
    toJSON: () => ({}),
  });
  host = document.createElement("div");
  document.body.append(host);
});

afterEach(() => {
  vi.restoreAllMocks();
  host.remove();
});

const render = (html: string) => {
  host.innerHTML = html;
  return collectBoxes(host);
};

describe("collectBoxes borderBottom", () => {
  it("reports 0 for a fully bordered box", () => {
    const boxes = render(
      '<div style="border: 1px solid rgb(0, 0, 0)" data-part="row"></div>',
    );
    expect(boxes.find((b) => b.part === "row")?.borderBottom).toBe(0);
  });

  it("reports the width of a bottom-only rule", () => {
    const boxes = render(
      '<div style="border-bottom: 2px solid rgb(0, 0, 0)" data-part="row"></div>',
    );
    expect(boxes.find((b) => b.part === "row")?.borderBottom).toBe(2);
  });
});

describe("collectBoxes visibility", () => {
  it("drops a display:none subtree", () => {
    const boxes = render(
      '<div style="display: none"><span data-part="row"></span></div><p data-part="stack"></p>',
    );
    expect(boxes.map((b) => b.part)).toEqual([null, "stack"]);
  });
});

describe("collectBoxes story frame", () => {
  it("leaves a story's frame out of the layout count, not its contents", () => {
    const boxes = render(
      '<main class="px-6 py-6" data-story-frame=""><div class="flex gap-2"></div></main>',
    );
    // The host, the frame, the component inside it.
    expect(boxes.map((b) => b.hasLayoutClasses)).toEqual([false, false, true]);
  });
});

describe("LAYOUT_TOKEN", () => {
  it("matches variant-prefixed and negative layout utilities", () => {
    expect(LAYOUT_TOKEN.test("@lg:pt-1")).toBe(true);
    expect(LAYOUT_TOKEN.test("-ml-1")).toBe(true);
    expect(LAYOUT_TOKEN.test("gap-x-2")).toBe(true);
    expect(LAYOUT_TOKEN.test("pl-traffic-lights")).toBe(true);
  });

  it("does not match unrelated utilities", () => {
    expect(LAYOUT_TOKEN.test("text-copy")).toBe(false);
    expect(LAYOUT_TOKEN.test("flex")).toBe(false);
  });
});
