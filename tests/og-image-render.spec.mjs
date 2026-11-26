// Each share image draws its card over the card's offset shadow, where the
// paper design has it, with the title in ink at the top of the card
// (blog#145).
//
// satori 0.63 paints like a browser, where 0.26 did not: a box with
// `position: absolute` or an `opacity` under 1 is painted after the boxes in
// normal flow. The shadow is both, so it covered the card, and the title
// showed through it at 10%, with no ink pixel left. 0.63 also sizes a box
// like a browser, with its border outside its width, and gives a <p> a
// browser's 1em margin, which put the last line of a four-line title below
// its box's clip edge. All of it passed the build and every other check, so
// this reads the built PNGs themselves.
//
// It reads `dist/` directly. Run: `npm run build && npm run test:pages`.

import { test, expect } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

// The card's inside, clear of both boxes' borders (the shadow's left border
// runs at x 97-101 and its bottom one at y 546-550 when it is painted on
// top), so only text can be ink here.
const AREA = { x0: 110, x1: 1100, y0: 75, y1: 535 };
// Ink is #141a22. Anti-aliased edges are lighter, so a glyph's core or a
// border is counted, and text seen through the shadow at 10% is not.
const INK = 0x50;
// On satori 0.26, down the column x 600 the shadow's top border starts at
// y 39 and the card's at y 63.
const COLUMN = 600;
const CARD_TOP = 63;
// The title's first line starts 36 px under the card's inner top edge (y 87)
// on satori 0.26. Pushed down by a <p>'s margin it started at y 174, and a
// four-line title lost its last line.
const TITLE_TOP_MAX = 140;

// The site image and each post's, one folder deep. A post in a subfolder of
// src/content/posts would have its image deeper and be missed, but
// tests/og-image-date.spec.mjs fails while any such post exists.
const images = () => {
  const posts = existsSync("dist/posts")
    ? readdirSync("dist/posts")
        .map(slug => path.join("dist/posts", slug, "index.png"))
        .filter(existsSync)
    : [];
  return { site: "dist/og.png", posts };
};

const pixels = file =>
  sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const isInk = ({ data, info }, x, y) => {
  const i = (y * info.width + x) * info.channels;
  return data[i] <= INK && data[i + 1] <= INK && data[i + 2] <= INK;
};

// The rows of AREA that hold an ink pixel, top to bottom.
const inkRows = image => {
  const rows = [];
  for (let y = AREA.y0; y < AREA.y1; y++) {
    for (let x = AREA.x0; x < AREA.x1; x++) {
      if (isInk(image, x, y)) {
        rows.push(y);
        break;
      }
    }
  }
  return rows;
};

// Where the last ink run above AREA starts, down COLUMN: the card's top
// border, when the card is drawn over its shadow.
const cardTop = image => {
  let top;
  for (let y = 1; y < AREA.y0; y++)
    if (isInk(image, COLUMN, y) && !isInk(image, COLUMN, y - 1)) top = y;
  return top;
};

test("there are share images to check", () => {
  const { site, posts } = images();
  expect(existsSync(site), "no dist/og.png: run `npm run build`").toBe(true);
  expect(posts.length, "no dist/posts/*/index.png was built").toBeGreaterThan(
    0
  );
});

test("each share image draws its text in ink, over the card's shadow", async () => {
  const { site, posts } = images();
  for (const file of [site, ...posts]) {
    expect(
      inkRows(await pixels(file)).length,
      `${file}: no ink in the card, so its shadow is painted over it`
    ).toBeGreaterThan(0);
  }
});

test("each share image has its card's top edge where the paper design has it", async () => {
  const { site, posts } = images();
  for (const file of [site, ...posts]) {
    const top = cardTop(await pixels(file));
    expect(
      top !== undefined && Math.abs(top - CARD_TOP) <= 1,
      `${file}: the card's top edge is at y ${top}, not ${CARD_TOP}`
    ).toBe(true);
  }
});

test("each post's share image starts its title at the top of the card", async () => {
  for (const file of images().posts) {
    const rows = inkRows(await pixels(file));
    expect(rows.length, `${file}: no ink in the card`).toBeGreaterThan(0);
    expect(
      rows[0],
      `${file}: the title starts at y ${rows[0]}, so a long one loses its last line`
    ).toBeLessThanOrEqual(TITLE_TOP_MAX);
  }
});
