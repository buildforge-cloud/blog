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

import { readFileSync, writeFileSync } from "node:fs";
import satori from "satori";
import sharp from "sharp";
import { titledPng } from "../tests/linkedin.mjs";

const slug = process.argv[2];
if (!slug) throw new Error("usage: node scripts/linkedin-cover.mjs <slug>");

// Paths from this file, so it runs from any folder.
const repo = new URL("../", import.meta.url);
const linkedin = name => new URL(`docs/linkedin/${slug}-${name}`, repo);

const article = readFileSync(linkedin("article.md"), "utf8");
const headline = article.split("\n")[0].match(/^# (.+)$/)?.[1];
if (!headline) throw new Error(`${slug}-article.md: no "# " headline`);

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

// The OG image's layout at 1.6 times its 1200 x 630.
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
        border: `6px solid ${INK}`,
        background: "#efeade",
        margin: "64px",
        width: "88%",
        height: "80%",
      }),
      div(
        {
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
          div({ fontSize: 104, fontWeight: 700, lineHeight: 1.1 }, headline),
          div(
            {
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 44,
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
      { name: "Space Grotesk", data: font(500), weight: 500, style: "normal" },
      { name: "Space Grotesk", data: font(700), weight: 700, style: "normal" },
    ],
  }
);

const png = await sharp(Buffer.from(svg)).png().toBuffer();
const out = linkedin("cover.png");
writeFileSync(out, titledPng(png, headline));
process.stdout.write(`${out.pathname}\n`);
