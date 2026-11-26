// Draws the cover of a LinkedIn Article (blog#107) at the size LinkedIn
// Help names, 1920 x 1080, in the design of the post's own OG image
// (src/pages/posts/[...slug]/index.png.ts): paper, an ink frame, the
// headline in Space Grotesk. A text card: no photo, no picture of people.
//
// Run it after a change to the Article's headline:
//   node scripts/linkedin-cover.mjs <slug>
// It reads the "# " first line of docs/linkedin/<slug>-article.md and writes
// docs/linkedin/<slug>-cover.png, with the headline in the PNG's "Title"
// text. tests/linkedin.test.mjs checks the size and that the title is the
// Article's headline, so a cover left from an older headline fails.
// tests/linkedin-cover.test.mjs draws one with drawCover() and reads it.

import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
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

// Run as a script, it draws docs/linkedin/<slug>-cover.png.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const slug = process.argv[2];
  if (!slug) throw new Error("usage: node scripts/linkedin-cover.mjs <slug>");
  const linkedin = name => new URL(`docs/linkedin/${slug}-${name}`, repo);
  const article = readFileSync(linkedin("article.md"), "utf8");
  // As tests/linkedin.mjs's headlineOf reads it: a CRLF's \r is not kept.
  const headline = article.split(/\r?\n/)[0].match(/^# (.+)$/)?.[1];
  if (!headline) throw new Error(`${slug}-article.md: no "# " headline`);
  const out = linkedin("cover.png");
  writeFileSync(out, await drawCover(headline));
  process.stdout.write(`${out.pathname}\n`);
}
