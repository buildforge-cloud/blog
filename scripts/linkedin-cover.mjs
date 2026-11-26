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
// It draws with drawCover() from linkedin-cover-draw.mjs, which
// tests/linkedin-cover.test.mjs calls too. This file has no run-as-script
// guard: one comparing process.argv[1] with import.meta.url skipped the run
// when the path held a symlink (blog#145).

import { readFileSync, writeFileSync } from "node:fs";
import { drawCover } from "./linkedin-cover-draw.mjs";

// Paths from this file, so it runs from any folder.
const repo = new URL("../", import.meta.url);

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
