// The posts in src/content/posts/ keep the blog's standing rules, and the
// queued posts keep their dates (`QUEUED`, from the 8 Dec post on). Run with
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

// The queued posts, oldest first, each at 07:00 UTC so the 07:05 scheduled
// deploy publishes it (blog#9), with the issue STRATEGY.md's Now names it
// by. A post leaves this list when it is live and Now drops it.
const QUEUED = [
  [
    "copied-text-rebuilt-in-our-own-words",
    "2026-12-08T07:00:00.000Z",
    "blog#60",
  ],
  [
    "passing-tests-skipped-most-of-the-file",
    "2026-12-15T07:00:00.000Z",
    "blog#68",
  ],
  ["coding-agents-weekly-usage-limit", "2026-12-22T07:00:00.000Z", "blog#69"],
  ["search-youtube-comments-desktop", "2026-12-29T07:00:00.000Z", "blog#70"],
  [
    "split-a-large-file-in-five-safe-steps",
    "2027-01-05T07:00:00.000Z",
    "blog#72",
  ],
  [
    "17-downloads-a-plan-before-more-code",
    "2027-01-12T07:00:00.000Z",
    "blog#73",
  ],
  [
    "google-stopped-showing-our-site-in-a-day",
    "2027-01-19T07:00:00.000Z",
    "blog#75",
  ],
];

const WEEK = 7 * 24 * 60 * 60 * 1000;

test("each queued post keeps its date", () => {
  for (const [slug, when] of QUEUED) {
    const { data } = bySlug(slug);
    assert.equal(new Date(data.pubDatetime).toISOString(), when, slug);
  }
});

// One a week at most (STRATEGY.md "Not doing"): a skipped week is fine.
test("each queued post is pinned a week or more after the one before", () => {
  for (let i = 1; i < QUEUED.length; i++) {
    const gap = Date.parse(QUEUED[i][1]) - Date.parse(QUEUED[i - 1][1]);
    assert.ok(gap >= WEEK, `${QUEUED[i][0]}: ${gap / 86400000} days`);
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
    ["google-stopped-showing-our-site-in-a-day", "ps-db.cloud"],
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
  // The steps only: the section's `Source:` note names issues too.
  const now = strategy
    .slice(start, strategy.indexOf("\n## ", start + 1))
    .split("\nSource:")[0];
  for (const [, , issue] of QUEUED)
    assert.match(now, new RegExp(`${issue}\\b`), `Now does not name ${issue}`);
});

test("STRATEGY.md stays at 80 lines or fewer", () => {
  const lines = strategy.trimEnd().split("\n").length;
  assert.ok(lines <= 80, `STRATEGY.md has ${lines} lines`);
});
