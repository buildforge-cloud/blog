// The posts in src/content/posts/ keep the blog's standing rules, and the
// queued posts keep their dates (blog#68 to #70, #72, #73). Run with
// `npm test`.
//
// A scheduled post's date is only seen on the morning it should go live
// (CLAUDE.md "To schedule a post"), and a production build shows no page for
// it before then, so a wrong date or a draft flag stays silent until that day.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";

const POSTS = new URL("../src/content/posts/", import.meta.url);
const PAGES = new URL("../src/content/pages/", import.meta.url);

// { data, body } of a Markdown file with YAML front matter, LF or CRLF.
const read = url => {
  const text = readFileSync(url, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  assert.ok(match, `${url.pathname}: no front matter`);
  return { data: parse(match[1]), body: match[2] };
};

// The files the content collections build: content.config.ts's glob,
// `**/[^_]*.{md,mdx}`, takes subfolders too and skips only a file whose own
// name starts with `_`.
const markdownIn = dir =>
  readdirSync(dir, { recursive: true })
    .filter(path => /(?:^|\/)[^_/][^/]*\.mdx?$/.test(path))
    .map(name => ({ name, ...read(new URL(name, dir)) }));

let postCache;
const posts = () => (postCache ??= markdownIn(POSTS));

const bySlug = slug => {
  const post = posts().find(p => p.data.slug === slug);
  assert.ok(post, `no post with slug ${slug} in src/content/posts/`);
  return post;
};

// The queued posts, each a week after the one before it, from the 8 Dec
// post, at 07:00 UTC, so the 07:05 scheduled deploy publishes it (blog#9).
// December: blog#68 to #70. January: blog#72, #73.
const QUEUED = [
  ["copied-text-rebuilt-in-our-own-words", "2026-12-08T07:00:00.000Z"],
  ["passing-tests-skipped-most-of-the-file", "2026-12-15T07:00:00.000Z"],
  ["coding-agents-weekly-usage-limit", "2026-12-22T07:00:00.000Z"],
  ["search-youtube-comments-desktop", "2026-12-29T07:00:00.000Z"],
  ["split-a-large-file-in-five-safe-steps", "2027-01-05T07:00:00.000Z"],
  ["17-downloads-a-plan-before-more-code", "2027-01-12T07:00:00.000Z"],
];

const WEEK = 7 * 24 * 60 * 60 * 1000;

test("each queued post keeps its date", () => {
  for (const [slug, when] of QUEUED) {
    const { data } = bySlug(slug);
    assert.equal(new Date(data.pubDatetime).toISOString(), when, slug);
  }
});

test("each queued post is pinned a week after the one before", () => {
  for (let i = 1; i < QUEUED.length; i++) {
    const gap = Date.parse(QUEUED[i][1]) - Date.parse(QUEUED[i - 1][1]);
    assert.equal(gap, WEEK, `${QUEUED[i][0]}: ${gap / 86400000} days`);
  }
});

test("each queued post is published and not featured", () => {
  for (const [slug] of QUEUED) {
    const { data } = bySlug(slug);
    assert.equal(data.draft, false, `${slug}: draft must be false`);
    assert.equal(data.featured, false, `${slug}: featured must be false`);
  }
});

// The first link in the body, as Markdown writes it: [text](url), not an
// image's ![alt](src).
const firstLink = body => body.match(/(?<!!)\[[^\]]*\]\(([^)\s]+)\)/)?.[1];

// A relative link is on the blog itself.
const hostOf = link => new URL(link, "https://blog.buildforge.cloud").host;

test("a product post links its product first", () => {
  for (const [slug, product] of [
    ["passing-tests-skipped-most-of-the-file", "ps-db.cloud"],
    ["search-youtube-comments-desktop", "commentfinder.buildforge.no"],
    ["split-a-large-file-in-five-safe-steps", "ps-db.cloud"],
    [
      "17-downloads-a-plan-before-more-code",
      "vedlikeholdsloggen.buildforge.no",
    ],
  ]) {
    const link = firstLink(bySlug(slug).body);
    assert.equal(
      link && hostOf(link),
      product,
      `${slug}: first link is ${link}, not ${product}`
    );
  }
});

test("no post or page has an em dash", () => {
  for (const { name, data, body } of [...posts(), ...markdownIn(PAGES)]) {
    const text = `${data.title}\n${data.description ?? ""}\n${body}`;
    assert.ok(!text.includes("—"), `${name}: an em dash`);
  }
});

test("no post links to a private repo", () => {
  // blog is the org's only public repo (CLAUDE.md); a link to any other one
  // is a 404 for a reader. A repo starts under Hysas and moves to the org,
  // so its old address redirects there. GitHub ignores the case of both.
  const orgLink = /github\.com\/(buildforge-cloud|hysas)\/([\w.-]+)/gi;
  for (const { name, body } of posts()) {
    for (const [, owner, repo] of body.matchAll(orgLink))
      assert.equal(
        repo.toLowerCase(),
        "blog",
        `${name}: links to ${owner}/${repo}`
      );
  }
});

const strategy = readFileSync(
  new URL("../strategy/STRATEGY.md", import.meta.url),
  "utf8"
);

test("STRATEGY.md's Now names the queued posts", () => {
  const start = strategy.indexOf("\n## Now");
  assert.notEqual(start, -1, "no ## Now section");
  const now = strategy.slice(start, strategy.indexOf("\n## ", start + 1));
  for (const issue of ["blog#68", "blog#69", "blog#70", "blog#72", "blog#73"])
    assert.match(now, new RegExp(`${issue}\\b`), `Now does not name ${issue}`);
});

test("STRATEGY.md stays at 80 lines or fewer", () => {
  const lines = strategy.trimEnd().split("\n").length;
  assert.ok(lines <= 80, `STRATEGY.md has ${lines} lines`);
});
