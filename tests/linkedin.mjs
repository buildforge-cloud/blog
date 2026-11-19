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
  // A hashtag starts a word and has a letter in it: blog#104, #104 and a
  // URL's #anchor are not one.
  const tags = (text.match(/(?<![\p{L}\p{N}/])#[\p{L}\p{N}_]+/gu) ?? []).filter(
    tag => /\p{L}/u.test(tag)
  );
  if (tags.length > 3) problems.push(`${tags.length} hashtags, not 3 or fewer`);
  if (text.includes("—")) problems.push("an em dash");
  return problems;
}
