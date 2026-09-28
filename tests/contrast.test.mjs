// The arithmetic behind tests/contrast.spec.mjs, checked without a browser.
//
// The spec reads colours off the rendered pages; this file checks what it does
// with them. The oracles are the ratios blog#6 measured by hand against the
// shipped tokens, so the check and the hand measurement cannot quietly drift
// apart. Run with `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { contrast, floorFor, hex, paint, triage } from "./contrast.mjs";

test("the ratios match blog#6's hand measurements of the shipped tokens", () => {
  const pairs = [
    ["ink on paper", "#141a22", "#f5f2ea", 15.64],
    ["muted ink on paper", "#556170", "#f5f2ea", 5.64],
    ["ember on paper", "#c2410c", "#f5f2ea", 4.63],
    ["ember hover on paper", "#7c2d12", "#f5f2ea", 8.38],
    ["ink on the code panel", "#141a22", "#fffefb", 17.34],
    ["white on ember-fill", "#ffffff", "#e8542a", 3.66],
  ];
  for (const [name, fg, bg, want] of pairs) {
    const got = contrast(hex(fg), hex(bg));
    assert.equal(got.toFixed(2), want.toFixed(2), `${name}: ${got}:1`);
  }
});

// WCAG's "large text" is 18pt, or 14pt bold. In CSS pixels that is 24px, or
// 18.67px at weight 700 and up. Each boundary is checked from both sides.
test("large text needs 3:1 and everything else 4.5:1", () => {
  const cases = [
    [16, 400, 4.5],
    [23.9, 400, 4.5],
    [24, 400, 3],
    [18.6, 700, 4.5],
    [18.67, 700, 3],
    [20, 600, 4.5],
    [20, 700, 3],
  ];
  for (const [size, weight, want] of cases) {
    assert.equal(floorFor(size, weight), want, `${size}px at ${weight}`);
  }
});

const near = (got, want, what) =>
  assert.ok(
    got.every((c, i) => Math.abs(c - want[i]) < 0.01),
    `${what}: got [${got.map(c => c.toFixed(2))}], want [${want}]`
  );

// Layers run from <html> down to the element that holds the text.
const layer = (background, opacity = 1) => ({ background, opacity });
const clear = [0, 0, 0, 0];
const paper = hex("#f5f2ea");
const ink = hex("#141a22");

test("with nothing painted, the text sits on the browser's white canvas", () => {
  const { ground } = paint([layer(clear), layer(clear)], ink);
  near(ground, [255, 255, 255], "ground");
});

test("a see-through layer is blended over what is behind it", () => {
  const hairline = [20, 26, 34, 0.14];
  const { ground, text } = paint([layer(paper), layer(hairline)], ink);
  near(
    ground,
    [0.14 * 20 + 0.86 * 245, 0.14 * 26 + 0.86 * 242, 0.14 * 34 + 0.86 * 234],
    "ground"
  );
  near(text, [20, 26, 34], "opaque text");
});

// `opacity` fades an element and everything in it as one picture, so it acts
// on the text and on the element's own background together. typography.css
// puts figcaptions at opacity 0.75, which a token check cannot see.
test("opacity fades the text toward what is behind the element", () => {
  const caption = paint([layer(paper), layer(clear, 0.75)], ink);
  near(caption.ground, [245, 242, 234], "caption ground");
  near(
    caption.text,
    [0.75 * 20 + 0.25 * 245, 0.75 * 26 + 0.25 * 242, 0.75 * 34 + 0.25 * 234],
    "caption text"
  );

  const black = [0, 0, 0, 1];
  const card = paint([layer(black), layer([255, 255, 255, 1], 0.5)], black);
  near(card.ground, [127.5, 127.5, 127.5], "half-faded white card on black");
  near(card.text, [0, 0, 0], "black text in that card");
});

test("a see-through text colour is blended over the ground", () => {
  const { text } = paint([layer(clear)], [0, 0, 0, 0.5]);
  near(text, [127.5, 127.5, 127.5], "half-black text on white");
});

// A failure recorded in the spec's `known` list, rather than fixed.
const titles = {
  text: "#ca5b2d",
  ground: "#f5f2ea",
  on: /^\/posts\/[a-z]/,
  what: "adjacent post titles",
};
const titleRun = { text: "#ca5b2d", ground: "#f5f2ea", line: "3.72:1 title" };

test("a recorded failure passes only on the pages it is recorded for", () => {
  assert.deepEqual(triage("/posts/a/", [titleRun], [titles]), {
    unknown: [],
    stale: [],
  });
  assert.deepEqual(triage("/about/", [titleRun], [titles]).unknown, [
    titleRun.line,
  ]);
});

test("a failure that is not recorded is reported", () => {
  const other = { text: "#858686", ground: "#f5f2ea", line: "3.27:1 other" };
  assert.deepEqual(triage("/posts/a/", [titleRun, other], [titles]), {
    unknown: [other.line],
    stale: [],
  });
});

test("a recorded failure that is gone is reported, so the record cannot outlive it", () => {
  assert.deepEqual(triage("/posts/a/", [], [titles]).stale, [
    "adjacent post titles",
  ]);
  assert.deepEqual(triage("/about/", [], [titles]).stale, []);
});
