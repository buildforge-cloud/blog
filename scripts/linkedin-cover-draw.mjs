// drawCover(headline): the LinkedIn Article cover as a PNG, with the
// headline in its "Title" text. scripts/linkedin-cover.mjs writes it to
// docs/linkedin/<slug>-cover.png; tests/linkedin-cover.test.mjs reads it.

import { readFileSync } from "node:fs";
import satori from "satori";
import sharp from "sharp";
import { titledPng } from "./png-title.mjs";

// Paths from this file, so it runs from any folder.
const repo = new URL("../", import.meta.url);

const font = weight =>
  readFileSync(
    new URL(`src/assets/fonts/space-grotesk-${weight}-normal.ttf`, repo)
  );

const INK = "#141a22";
const PAPER = "#f5f2ea";
const div = (style, children) => ({
  type: "div",
  props: { style: { display: "flex", ...style }, children },
});

// The cover of `headline`, a PNG with the headline in its "Title" text.
// The OG image's layout at 1.6 times its 1200 x 630.
export async function drawCover(headline) {
  const svg = await satori(
    div(
      {
        background: PAPER,
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        color: INK,
      },
      [
        div({
          position: "absolute",
          top: "-1px",
          right: "-1px",
          // satori 0.26 sized every box with its padding and border inside
          // it; 0.63 adds them outside, like a browser.
          boxSizing: "border-box",
          border: `6px solid ${INK}`,
          background: "#efeade",
          margin: "64px",
          width: "88%",
          height: "80%",
        }),
        div(
          {
            // Positioned, so it is painted after the shadow above it:
            // satori 0.63 paints a positioned box after the boxes in
            // normal flow, like a browser (blog#145).
            position: "relative",
            boxSizing: "border-box",
            border: `6px solid ${INK}`,
            background: PAPER,
            margin: "52px",
            width: "88%",
            height: "80%",
            padding: "56px",
            flexDirection: "column",
            justifyContent: "space-between",
          },
          [
            div({ fontSize: 148, fontWeight: 700, lineHeight: 1.05 }, headline),
            div(
              {
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 60,
                borderTop: "8px solid #e8542a",
                paddingTop: "28px",
              },
              [
                div({}, "by Stefan M. Gulbrandsen"),
                div({ fontWeight: 700 }, "blog.buildforge.cloud"),
              ]
            ),
          ]
        ),
      ]
    ),
    {
      width: 1920,
      height: 1080,
      fonts: [
        {
          name: "Space Grotesk",
          data: font(500),
          weight: 500,
          style: "normal",
        },
        {
          name: "Space Grotesk",
          data: font(700),
          weight: 700,
          style: "normal",
        },
      ],
    }
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return titledPng(png, headline);
}
