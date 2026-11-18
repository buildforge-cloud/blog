// The LinkedIn drafts in docs/linkedin/ keep the rules blog#104 set, and each
// one belongs to a post. Run with `npm test`. tests/linkedin.mjs holds the
// rules.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { linkedinProblems, postUrl, wordsIn } from "./linkedin.mjs";

const SLUG = "a-post";
const A_URL = "https://blog.buildforge.cloud/posts/a-post/";

// A draft of `total` words: a 3-word opening, filler, the tags, the URL.
const draft = (
  total,
  { opening = "AI wrote this.", tags = ["#ai"], end = A_URL } = {}
) => {
  const filler = Array(total - 3 - tags.length - 1).fill("word");
  return [opening, filler.join(" "), tags.join(" "), end].join("\n\n") + "\n";
};

test("a draft that keeps every rule has no problems", () => {
  assert.deepEqual(linkedinProblems(draft(150), SLUG), []);
});

test("120 words is in, 119 is out", () => {
  assert.deepEqual(linkedinProblems(draft(120), SLUG), []);
  assert.deepEqual(linkedinProblems(draft(119), SLUG), [
    "119 words, not 120 to 200",
  ]);
});

test("200 words is in, 201 is out", () => {
  assert.deepEqual(linkedinProblems(draft(200), SLUG), []);
  assert.deepEqual(linkedinProblems(draft(201), SLUG), [
    "201 words, not 120 to 200",
  ]);
});

test("the URL and a hashtag are one word each, a lone dot is none", () => {
  assert.equal(wordsIn(`AI · wrote it\n#ai ${A_URL}\n`), 5);
});

test("3 hashtags are in, 4 are out, and blog#104 is not one", () => {
  const three = ["#ai", "#claudecode", "#agents"];
  assert.deepEqual(linkedinProblems(draft(150, { tags: three }), SLUG), []);
  assert.deepEqual(
    linkedinProblems(draft(150, { tags: [...three, "#devops"] }), SLUG),
    ["4 hashtags, not 3 or fewer"]
  );
  const issue = draft(150, { opening: "AI wrote blog#104.", tags: three });
  assert.deepEqual(linkedinProblems(issue, SLUG), []);
});

test("the first paragraph must say AI", () => {
  const late = draft(150, { opening: "I wrote nothing." });
  assert.deepEqual(linkedinProblems(late.replace("word", "AI"), SLUG), [
    'its first paragraph does not say "AI"',
  ]);
});

test("the last line must be this post's URL", () => {
  assert.equal(postUrl(SLUG), A_URL);
  const other = draft(150, { end: postUrl("another-post") });
  assert.deepEqual(linkedinProblems(other, SLUG), [
    `its last line is not ${A_URL}`,
  ]);
  const after = draft(149) + "\nThanks.\n";
  assert.deepEqual(linkedinProblems(after, SLUG), [
    `its last line is not ${A_URL}`,
  ]);
});

test("an empty draft lists its problems and does not throw", () => {
  assert.deepEqual(linkedinProblems("", SLUG), [
    "0 words, not 120 to 200",
    'its first paragraph does not say "AI"',
    `its last line is not ${A_URL}`,
  ]);
});

test("an em dash is a problem", () => {
  const dash = draft(150, { opening: "AI wrote this — mostly." });
  assert.deepEqual(linkedinProblems(dash, SLUG), ["an em dash"]);
});

// The real drafts. A listed one must exist, so the check can't pass on an
// empty folder.
const DRAFTS = new URL("../docs/linkedin/", import.meta.url);
const POSTS = new URL("../src/content/posts/", import.meta.url);
const REQUIRED = ["building-an-ai-agent-team"];

const slugs = readdirSync(POSTS, { recursive: true })
  .filter(path => /\.mdx?$/.test(path))
  .map(path => readFileSync(new URL(path, POSTS), "utf8"))
  .map(text => text.match(/^slug:\s*(\S+)\s*$/m)?.[1]);

test("each LinkedIn draft belongs to a post and keeps the rules", () => {
  assert.ok(existsSync(DRAFTS), "no docs/linkedin/ folder");
  const files = readdirSync(DRAFTS).filter(name => name.endsWith(".md"));
  for (const slug of REQUIRED)
    assert.ok(files.includes(`${slug}.md`), `no docs/linkedin/${slug}.md`);
  for (const name of files) {
    const slug = name.replace(/\.md$/, "");
    assert.ok(slugs.includes(slug), `${name}: no post with slug ${slug}`);
    const text = readFileSync(new URL(name, DRAFTS), "utf8");
    assert.deepEqual(linkedinProblems(text, slug), [], name);
  }
});
