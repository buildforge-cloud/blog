// What a LinkedIn draft in docs/linkedin/ must be (blog#104).
// tests/linkedin.test.mjs checks it and runs it on each draft. Nothing posts a
// draft: Stefan edits it and posts it himself.
//
// A draft is the post's text as it is pasted: one paragraph per line, and
// its file is named after the post's slug.

import { parse } from "yaml";
import { pngTitle } from "../scripts/png-title.mjs";

// An Article's headline: its first line after "# ", without a CRLF's \r;
// undefined when the first line is not a "# " headline.
export const headlineOf = text => text.split(/\r?\n/)[0].match(/^# (.+)$/)?.[1];

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

// A number as written in digits: 7.2, 2,800 and 11,999 are one each; the
// sign of -2.7 is not part of it. A number in words ("ten") is not read.
const numbersIn = text => text.match(/\d+(?:[.,]\d+)*/g) ?? [];

// 1,000 and 1000 are the same number.
const sameNumber = number => number.replace(/,/g, "");

// Text as LinkedIn shows it: a Markdown link's text without its address.
const shown = text => text.replace(/\[([^\]]*)\]\([^)\s]*\)/g, "$1");

// A sentence ends at . ! or ?, after any closing quote or bracket, before a
// space or the end. 7.2 and 11,999 end none, and neither do e.g., i.e., vs.
const END = /(?<!\b(?:e\.g|i\.e|vs))[.!?]["')\]]*(?=\s|$)/g;
const sentencesOf = text => {
  const sentences = [];
  let start = 0;
  for (const end of text.matchAll(END)) {
    const stop = end.index + end[0].length;
    sentences.push(text.slice(start, stop).trim());
    start = stop;
  }
  return sentences;
};

// Text as one line, as LinkedIn shows it.
const flat = text => shown(text).replace(/\s+/g, " ").trim();

// The hook and the AI line (blog#107's review): the first paragraph shows
// whole before "see more" on a phone, about 140 characters, and the short
// line after it says AI wrote the text and Stefan edited it.
function hookProblems(paragraphs) {
  const problems = [];
  const [hook = "", line = ""] = paragraphs.map(flat);
  if (hook.length > 140)
    problems.push(`its hook is ${hook.length} characters, not 140 or fewer`);
  if (!/\bAI\b/.test(line) || !/\bedited\b/.test(line))
    problems.push('its second paragraph does not say "AI" and "edited"');
  else if (line.length > 40)
    problems.push(`its AI line is ${line.length} characters, not 40 or fewer`);
  return problems;
}

// The setup's in-house words (blog#109's list): a reader with no knowledge
// of the setup cannot follow them (Stefan, decision 4424). A whole word,
// singular or plural, in any letter case; "Touches" only with its capital,
// since "touches" is plain English. Read as LinkedIn shows the text, so a
// link's address is not read, and a hyphen joins words ("co-worker").
export const IN_HOUSE = [
  "executive",
  "worker",
  "board",
  "card",
  "slot",
  "hook",
  "worktree",
  "Touches",
  "agent-orchestrator",
  "agent-os",
  "agent-memory",
];
function inHouseProblems(text) {
  const words = IN_HOUSE.filter(word =>
    new RegExp(
      `(?<![\\p{L}\\p{N}-])${word}s?(?![\\p{L}\\p{N}-])`,
      word === "Touches" ? "u" : "iu"
    ).test(shown(text))
  );
  return words.map(word => `an in-house word: "${word}"`);
}

// A day with its month ("7 July", "November 18", "24 Sept") or an ISO date:
// the journey is told in stages, not by the day of one incident (decision
// 4425). A month alone ("in July") is not a date.
// A month's whole name or its short form, so "18 Decisions" is no date.
// Before its day, "May" is left out: "May 7 agents run?" is no date.
const MONTHS =
  "January|February|March|April|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec";
const MONTH = `(?:May|${MONTHS})`;
const MONTH_FIRST = `(?:${MONTHS})`;
const DATE = new RegExp(
  `\\b(?:\\d{1,2}(?:st|nd|rd|th)? ${MONTH}|${MONTH_FIRST} \\d{1,2}(?:st|nd|rd|th)?|\\d{4}-\\d{2}-\\d{2})\\b`,
  "g"
);

// A few overall numbers at most (blog#109): 5 different ones.
const MAX_NUMBERS = 5;

// The `## ` sub-heads of a Markdown text.
const subHeadsOf = text => [...text.matchAll(/^## (.+)$/gm)].map(([, h]) => h);

// What the research in blog#107's PR found for an Article read on a phone:
// LinkedIn's search title shows 60 characters, and its preview the first
// 140 to 160; a hook that shows whole before "see more", then a short AI
// line; a sub-head every 200 to 300 words; paragraphs of 2 or 3 sentences;
// 1,000 to 2,500 words; a closing question. Every number must be in the
// post, so the Article states no number the post does not, but it is new
// writing: 5 of the post's sentences at most, and none of its sub-heads.
// It reads with no knowledge of the setup and tells a journey, not single
// deliveries (blog#109): no in-house word, no day-and-month date, and 5
// different numbers at most. A CRLF file needs no change: headlineOf drops
// the \r, and the rest reads \r as space.
export function articleProblems(text, post) {
  const problems = [];
  const lines = text.split("\n");
  const headline = headlineOf(text);
  if (headline === undefined)
    problems.push('its first line is not a "# " headline');
  else if (headline.length > 60)
    problems.push(
      `its headline is ${headline.length} characters, not 60 or fewer`
    );
  const words = wordsIn(text);
  if (words < 1000 || words > 2500)
    problems.push(`${words} words, not 1,000 to 2,500`);
  // A paragraph is a block between blank lines after the headline's line,
  // without its heading lines; each list item ("- ", "* " or "1. ") is its
  // own, without its marker.
  const paragraphs = lines
    .slice(1)
    .join("\n")
    .split(/\n\s*\n/)
    .map(block => block.replace(/^#{1,6} .*$/gm, ""))
    .flatMap(block => block.split(/\n(?=(?:\d+\.|-|\*) )/))
    .map(block => block.trim().replace(/^(?:\d+\.|-|\*) /, ""))
    .filter(Boolean);
  problems.push(...hookProblems(paragraphs));
  const preview = shown(lines.slice(1).join(" "))
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
  for (const paragraph of paragraphs) {
    const count = sentencesOf(paragraph).length;
    if (count > 3)
      problems.push(
        `a paragraph of ${count} sentences, not 3 or fewer: ${paragraph.slice(0, 40)}`
      );
  }
  if (!(paragraphs.at(-1) ?? "").endsWith("?"))
    problems.push("its last paragraph is not a question");
  // Written for LinkedIn, not cut from the post (Stefan, decision 4408): 5 of
  // the post's sentences at most, word for word, and none of its sub-heads.
  const source = flat(post);
  const copied = paragraphs
    .flatMap(paragraph => sentencesOf(flat(paragraph)))
    .filter(sentence => source.includes(sentence)).length;
  if (copied > 5)
    problems.push(
      `${copied} sentences word for word from the post, not 5 or fewer`
    );
  const postHeads = new Set(subHeadsOf(post).map(h => h.toLowerCase()));
  for (const head of subHeadsOf(text))
    if (postHeads.has(head.toLowerCase()))
      problems.push(`a sub-head from the post: "${head}"`);
  // A number in a link's address is no claim, in the post or the Article.
  const known = new Set(numbersIn(shown(post)).map(sameNumber));
  const named = new Set();
  for (const number of numbersIn(shown(text))) {
    const key = sameNumber(number);
    if (known.has(key) || named.has(key)) continue;
    named.add(key);
    problems.push(`${number} is not in the post`);
  }
  const different = new Set(numbersIn(shown(text)).map(sameNumber)).size;
  if (different > MAX_NUMBERS)
    problems.push(`${different} numbers, not ${MAX_NUMBERS} or fewer`);
  for (const [date] of shown(text).matchAll(DATE))
    problems.push(`a date: "${date}"`);
  problems.push(...inHouseProblems(text));
  for (const [, target] of text.matchAll(/\]\(([^)\s]*)\)/g))
    if (!/^https?:\/\//.test(target))
      problems.push(`a relative link: ${target}`);
  if (text.includes("—")) problems.push("an em dash");
  return problems;
}

// The share text posted with an Article: a few lines (LinkedIn Help), so 80
// words at most, and no URL, because LinkedIn attaches the Article itself.
// Like the Article, a hook and then a short AI line; 3 hashtags at most.
export function shareProblems(text) {
  const problems = [];
  const words = wordsIn(text);
  if (words > 80) problems.push(`${words} words, not 80 or fewer`);
  if (/https?:\/\//.test(text))
    problems.push("a URL: LinkedIn attaches the Article");
  const paragraphs = text.split(/\r?\n\s*\r?\n/).filter(p => p.trim());
  problems.push(...hookProblems(paragraphs));
  const tags = hashtagsIn(text);
  if (tags > 3) problems.push(`${tags} hashtags, not 3 or fewer`);
  problems.push(...inHouseProblems(text));
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

// LinkedIn Help: a cover is best at 1920 x 1080 pixels, and is cropped to
// 16:9. It must also show the Article's headline: one drawn for an older
// headline fails.
export function coverProblems(bytes, headline) {
  const size = pngSize(bytes);
  if (!size) return ["not a PNG"];
  const problems = [];
  const { width, height } = size;
  if (width !== 1920 || height !== 1080)
    problems.push(`${width} x ${height}, not 1920 x 1080`);
  const title = pngTitle(bytes);
  if (title === null)
    problems.push("no title: draw it with scripts/linkedin-cover.mjs");
  else if (title !== headline)
    problems.push(`drawn for "${title}", not "${headline}": draw it again`);
  return problems;
}
