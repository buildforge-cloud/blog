// What a LinkedIn draft in docs/linkedin/ must be (blog#104).
// tests/linkedin.test.mjs checks it and runs it on each draft. Nothing posts a
// draft: Stefan edits it and posts it himself.
//
// A draft is the post's text as it is pasted: one paragraph per line, and
// its file is named after the post's slug.

import { parse } from "yaml";

// A word is a run of non-space characters with a letter or a digit in it, so
// the URL and each hashtag count as one, and a lone "·" or "-" does not.
export const wordsIn = text =>
  text.split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length;

export const postUrl = slug => `https://blog.buildforge.cloud/posts/${slug}/`;

// The slug of a post the build publishes, from its file's path under
// src/content/posts/ and its text; null for a draft, for a file the build
// skips (content.config.ts's glob skips a file whose own name starts with
// `_`), or for one with no front matter. The front matter is read as YAML,
// as the build reads it, so a quoted slug is the same slug.
export function publishedSlug(path, text) {
  if (path.split("/").at(-1).startsWith("_")) return null;
  const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!front) return null;
  const data = parse(front[1]);
  return data.draft === true ? null : data.slug;
}

// A hashtag starts a word and has a letter in it: blog#104, #104 and a URL's
// #anchor are not one.
const hashtagsIn = text =>
  (text.match(/(?<![\p{L}\p{N}/])#[\p{L}\p{N}_]+/gu) ?? []).filter(tag =>
    /\p{L}/u.test(tag)
  ).length;

// Each rule the draft breaks, in plain words; none is [].
export function linkedinProblems(text, slug) {
  const problems = [];
  const lines = text.split("\n").filter(line => line.trim());
  const words = wordsIn(text);
  if (words < 120 || words > 200)
    problems.push(`${words} words, not 120 to 200`);
  if (!/\bAI\b/.test(lines[0]))
    problems.push('its first paragraph does not say "AI"');
  if (lines.at(-1)?.trim() !== postUrl(slug))
    problems.push(`its last line is not ${postUrl(slug)}`);
  const tags = hashtagsIn(text);
  if (tags > 3) problems.push(`${tags} hashtags, not 3 or fewer`);
  if (text.includes("—")) problems.push("an em dash");
  return problems;
}

// The text an Article may take its numbers from: the post's title,
// description and body, without the rest of its front matter (its date
// would let "24" pass).
export function postText(text) {
  const [, front, body] = text.match(
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
  );
  const data = parse(front);
  return `${data.title}\n${data.description}\n${body}`;
}

// A number as written: 7.2, 2,800 and 11,999 are one each; the sign of -2.7
// is not part of it.
const numbersIn = text => text.match(/\d+(?:[.,]\d+)*/g) ?? [];

// A sentence ends at . ! or ?, after any closing quote or bracket, before a
// space or the end. 7.2 and 11,999 end none.
const sentencesIn = text => (text.match(/[.!?]["')\]]*(?=\s|$)/g) ?? []).length;

// What the research in blog#107's PR found for an Article read on a phone:
// LinkedIn's search title shows 60 characters, and its preview the first
// 140 to 160; a sub-head every 200 to 300 words; paragraphs of 2 or 3
// sentences; 1,000 to 2,500 words; a closing question. Every number must be
// in the post, so the Article states nothing the post does not.
export function articleProblems(text, post) {
  const problems = [];
  const lines = text.split("\n");
  const headline = lines[0].match(/^# (.+)$/)?.[1];
  if (headline === undefined)
    problems.push('its first line is not a "# " headline');
  else if (headline.length > 60)
    problems.push(
      `its headline is ${headline.length} characters, not 60 or fewer`
    );
  const words = wordsIn(text);
  if (words < 1000 || words > 2500)
    problems.push(`${words} words, not 1,000 to 2,500`);
  const preview = lines
    .slice(1)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  for (const word of ["AI", "edited"])
    if (!new RegExp(`\\b${word}\\b`).test(preview))
      problems.push(`its first 160 characters do not say "${word}"`);
  for (const part of text.split(/^## /m)) {
    const count = wordsIn(part);
    if (count > 300)
      problems.push(`a section of ${count} words, not 300 or fewer`);
  }
  // A paragraph is a block between blank lines; each list item is its own.
  const paragraphs = text
    .split(/\n\s*\n/)
    .flatMap(block => block.split(/\n(?=- )/))
    .map(block => block.trim())
    .filter(block => block && !block.startsWith("#"));
  for (const paragraph of paragraphs) {
    const count = sentencesIn(paragraph);
    if (count > 3)
      problems.push(
        `a paragraph of ${count} sentences, not 3 or fewer: ${paragraph.slice(0, 40)}`
      );
  }
  if (!(paragraphs.at(-1) ?? "").endsWith("?"))
    problems.push("its last paragraph is not a question");
  const known = new Set(numbersIn(post));
  for (const number of new Set(numbersIn(text)))
    if (!known.has(number)) problems.push(`${number} is not in the post`);
  for (const [, target] of text.matchAll(/\]\(([^)\s]*)\)/g))
    if (!/^https?:\/\//.test(target))
      problems.push(`a relative link: ${target}`);
  if (text.includes("—")) problems.push("an em dash");
  return problems;
}

// The share text posted with an Article: a few lines (LinkedIn Help), so 80
// words at most, and no URL, because LinkedIn attaches the Article itself.
// Like a post's draft, it says "AI" first, with 3 hashtags at most.
export function shareProblems(text) {
  const problems = [];
  const words = wordsIn(text);
  if (words > 80) problems.push(`${words} words, not 80 or fewer`);
  if (/https?:\/\//.test(text))
    problems.push("a URL: LinkedIn attaches the Article");
  const first = text.split("\n").find(line => line.trim());
  if (!/\bAI\b/.test(first))
    problems.push('its first paragraph does not say "AI"');
  const tags = hashtagsIn(text);
  if (tags > 3) problems.push(`${tags} hashtags, not 3 or fewer`);
  if (text.includes("—")) problems.push("an em dash");
  return problems;
}

// A PNG's width and height from its IHDR chunk, the first after the 8-byte
// signature; null for a file that is not a PNG.
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
export function pngSize(bytes) {
  if (bytes.length < 24) return null;
  if (PNG.some((byte, i) => bytes[i] !== byte)) return null;
  if (bytes.toString("latin1", 12, 16) !== "IHDR") return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

// LinkedIn Help: a cover is best at 1920 x 1080 pixels, and is cropped to 16:9.
export function coverProblems(bytes) {
  const size = pngSize(bytes);
  if (!size) return ["not a PNG"];
  const { width, height } = size;
  return width === 1920 && height === 1080
    ? []
    : [`${width} x ${height}, not 1920 x 1080`];
}
