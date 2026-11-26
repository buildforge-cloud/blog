// A LinkedIn cover draws its card over the card's offset shadow, with the
// headline in ink, and the card where the committed cover has it (blog#145).
//
// satori 0.63 paints like a browser, where 0.26 did not: a box with
// `position: absolute` is painted after the boxes in normal flow. The
// cover's shadow is one, and it hid the whole headline. 0.63 also sizes a
// box like a browser, with its padding and border outside its width, and
// the card grew over its shadow. The committed cover was drawn on 0.26, so
// only a new one would have shown it: this draws one. Run with `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { drawCover } from "../scripts/linkedin-cover.mjs";

const HEADLINE = "From solo work to a team of AI agents: pros and cons";
// The card's inside, clear of both boxes' borders, above the ember rule.
const AREA = { x0: 200, x1: 1700, y0: 150, y1: 780 };
// Ink is #141a22; a glyph's core and a border are this dark, paper is not.
const INK = 0x50;
// In the committed cover (satori 0.26), down the column x 1000 the shadow's
// top border starts at y 63 and the card's at y 108.
const COLUMN = 1000;
const CARD_TOP = 108;

const pixels = async png =>
  sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
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

const cover = drawCover(HEADLINE).then(pixels);

test("a cover draws its headline in ink, over the card's shadow", async () => {
  const rows = inkRows(await cover);
  assert.ok(
    rows.length > 0,
    "no ink in the card: its shadow is painted over it"
  );
});

test("a cover's card has its top edge where the committed cover has it", async () => {
  const top = cardTop(await cover);
  assert.ok(
    top !== undefined && Math.abs(top - CARD_TOP) <= 1,
    `the card's top edge is at y ${top}, not ${CARD_TOP}: the card is sized or painted otherwise`
  );
});
