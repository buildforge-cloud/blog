// The posts in src/content/posts/ keep the blog's standing rules, and the
// queued posts keep their dates (`QUEUED`, from the 24 Nov post on). Run with
// `npm test`.
//
// A scheduled post's date is only seen on the morning it should go live
// (CLAUDE.md "To schedule a post"), and a production build shows no page for
// it before then, so a wrong date or a draft flag stays silent until that day.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";
import { PRODUCTS, retiredIn } from "./products.mjs";

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
// blog#106 moved the journey post (blog#104) to 24 Nov and every other one
// a week later.
const QUEUED = [
  ["building-an-ai-agent-team", "2026-11-24T07:00:00.000Z", "blog#104"],
  ["ai-written-tests-mutation-testing", "2026-12-01T07:00:00.000Z", "blog#58"],
  [
    "keep-visitor-input-out-of-logs-and-sentry",
    "2026-12-08T07:00:00.000Z",
    "blog#59",
  ],
  [
    "copied-text-rebuilt-in-our-own-words",
    "2026-12-15T07:00:00.000Z",
    "blog#60",
  ],
  [
    "passing-tests-skipped-most-of-the-file",
    "2026-12-22T07:00:00.000Z",
    "blog#68",
  ],
  ["coding-agents-weekly-usage-limit", "2026-12-29T07:00:00.000Z", "blog#69"],
  ["search-youtube-comments-desktop", "2027-01-05T07:00:00.000Z", "blog#70"],
  [
    "split-a-large-file-in-five-safe-steps",
    "2027-01-12T07:00:00.000Z",
    "blog#72",
  ],
  [
    "17-downloads-a-plan-before-more-code",
    "2027-01-19T07:00:00.000Z",
    "blog#73",
  ],
  [
    "google-stopped-showing-our-site-in-a-day",
    "2027-01-26T07:00:00.000Z",
    "blog#75",
  ],
  [
    "secret-scanner-skipped-files-that-looked-like-archives",
    "2027-02-02T07:00:00.000Z",
    "blog#92",
  ],
  [
    "nightly-database-backups-write-only-ssh-key",
    "2027-02-09T07:00:00.000Z",
    "blog#93",
  ],
  [
    "skredda-what-it-does-and-one-lesson",
    "2027-02-16T07:00:00.000Z",
    "blog#81",
  ],
  [
    "iso-pathfinder-buddy-why-we-built-it",
    "2027-02-23T07:00:00.000Z",
    "blog#82",
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
    [
      "secret-scanner-skipped-files-that-looked-like-archives",
      "iso.buildforge.no",
    ],
    ["iso-pathfinder-buddy-why-we-built-it", "iso.buildforge.no"],
    ["skredda-what-it-does-and-one-lesson", "skredda.no"],
  ]) {
    const link = firstLink(bySlug(slug).body);
    assert.equal(
      link && hostOf(link),
      product,
      `${slug}: first link is ${link}, not ${product}`
    );
  }
});

// Stefan's card 4497 (blog#81): the Skredda post ends with one next step,
// "try Skredda at skredda.no", and leaves out a line of his that he gave as
// context, not as text for the post.
test("the Skredda post ends by asking you to try it", () => {
  const { body } = bySlug("skredda-what-it-does-and-one-lesson");
  const last = body
    .trim()
    .split(/\n\s*\n/)
    .at(-1)
    .replace(/\s+/g, " ");
  assert.match(last, /\btry Skredda\b/i, `last paragraph: ${last}`);
  assert.match(last, /\]\(https:\/\/skredda\.no\/?\)/, `no link: ${last}`);
  assert.doesNotMatch(body, /\btrial\b/i, "the line card 4497 cut is back");
});

// A post that says in its first three lines that AI wrote it and that Stefan
// edited it (blog#104). The lines are the body's first three non-empty ones,
// as the file wraps them, so a later edit can't push it further down.
test("a post that says AI wrote it says so in its first three lines", () => {
  for (const slug of ["building-an-ai-agent-team"]) {
    const top = bySlug(slug)
      .body.split("\n")
      .filter(line => line.trim())
      .slice(0, 3)
      .join(" ");
    assert.match(top, /\bAI\b/, `${slug}: no "AI" in its first three lines`);
    assert.match(top, /\bedited\b/, `${slug}: no "edited" in them`);
  }
});

test("no post or page has an em dash", () => {
  for (const { name, data, body } of [...posts(), ...markdownIn(PAGES)]) {
    const text = `${data.title}\n${data.description ?? ""}\n${body}`;
    assert.ok(!text.includes("—"), `${name}: an em dash`);
  }
});

// The products STRATEGY.md's Goal names, each at its public page
// (`tests/products.mjs`). The blog-post skill's link list is read only when a
// post is written, so the About page can go stale unseen (blog#1, blog#79).
// The name must be the link's own text.
test("the About page links each public product", () => {
  const { body } = read(new URL("about.md", PAGES));
  for (const [name, url] of PRODUCTS)
    assert.ok(
      body.includes(`[${name}](${url})`),
      `about.md: no link to ${name} at ${url}`
    );
});

// A product's old name or old host (`RETIRED` in `tests/products.mjs`). The
// ISO app was renamed, and left a copy under its old name on Lovable, after
// two queued posts had linked it there (blog#147).
test("no post, page or STRATEGY.md uses a retired product name or host", () => {
  for (const { name, data, body } of [...posts(), ...markdownIn(PAGES)]) {
    const text = `${data.title}\n${data.description ?? ""}\n${body}`;
    assert.deepEqual(retiredIn(text), [], name);
  }
  assert.deepEqual(retiredIn(strategy), [], "strategy/STRATEGY.md");
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

// A section's numbered steps ("1. ..."), each with its indented
// continuation lines, as one string. Its intro line and its `Source:` note
// name issues too, so they are left out: a step must name each one.
const stepsOf = section => {
  const steps = [];
  let open = false;
  for (const line of section.split("\n")) {
    if (/^\d+\.\s/.test(line)) steps.push(line);
    else if (open && /^\s+\S/.test(line)) steps.push(line.trim());
    else {
      open = false;
      continue;
    }
    open = true;
  }
  return steps.join("\n");
};

test("STRATEGY.md's Now names the queued posts", () => {
  const start = strategy.indexOf("\n## Now");
  assert.notEqual(start, -1, "no ## Now section");
  const now = stepsOf(
    strategy.slice(start, strategy.indexOf("\n## ", start + 1))
  );
  for (const [, , issue] of QUEUED)
    assert.match(now, new RegExp(`${issue}\\b`), `Now does not name ${issue}`);
});

test("STRATEGY.md stays at 80 lines or fewer", () => {
  const lines = strategy.trimEnd().split("\n").length;
  assert.ok(lines <= 80, `STRATEGY.md has ${lines} lines`);
});
