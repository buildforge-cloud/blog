// What tests/analytics.spec.mjs counts as analytics in a built file, checked
// without a build (blog#17). Run with `npm test`.
//
// The spec must fail on the dead PostHog snippet and on any tracker that comes
// back. It must not fail on a post that names PostHog in its text, because
// this blog writes about the tools its apps use.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tracker, trackersIn } from "./analytics.mjs";

const page = body =>
  `<!doctype html><html><head></head><body>${body}</body></html>`;

// The shape blog#17 found: Astro printed the snippet as a string inside the
// script, so the browser ran nothing, and the key still shipped on every page.
test("a tracker in an inline script is found, even as a dead string", () => {
  const html = page(
    `<script>{'!function(t,e){window.posthog=e}' + "posthog.init('phc_abc')"}</script>`
  );
  assert.equal(trackersIn("index.html", html).length, 1, "the snippet");
});

test("a PostHog project key alone is found", () => {
  const html = page(`<script>init('phc_abc')</script>`);
  assert.equal(trackersIn("index.html", html).length, 1);
});

test("the name is found in any letter case", () => {
  const html = page(`<script>window.PostHog = {}</script>`);
  assert.equal(trackersIn("index.html", html).length, 1);
});

// The boundary: the same word, in prose and in a script.
test("a post may name PostHog in its text and link to it", () => {
  const html = page(
    `<p>I set up PostHog.</p><a href="https://posthog.com/docs">PostHog docs</a>` +
      `<pre><code>&lt;script src="https://eu-assets.i.posthog.com/a.js"&gt;</code></pre>`
  );
  assert.deepEqual(trackersIn("posts/a/index.html", html), []);
});

// PostLayout writes the post's title into JSON-LD, which is data, not code.
test("a post's JSON-LD may name PostHog", () => {
  const html = page(
    `<script type="application/ld+json">{"headline":"Why PostHog saw nothing"}</script>`
  );
  assert.deepEqual(trackersIn("posts/a/index.html", html), []);
});

test("a tracker loaded from outside is found", () => {
  const cases = [
    `<script async src="https://eu-assets.i.posthog.com/static/array.js"></script>`,
    `<img src="https://eu.i.posthog.com/e/?pixel=1" alt="">`,
    `<link rel="preconnect" href="https://eu.i.posthog.com">`,
  ];
  for (const body of cases) {
    assert.ok(trackersIn("index.html", page(body)).length > 0, body);
  }
});

test("a JavaScript file is code from end to end", () => {
  const js = `import{a}from"./x.js";a.posthog=1;`;
  assert.equal(trackersIn("_astro/client.js", js).length, 1);
  assert.deepEqual(
    trackersIn("_astro/client.js", `import{a}from"./x.js";`),
    []
  );
});

// A Content-Security-Policy that allows a tracker's hosts is a door left open.
test("nginx.conf names no tracker", () => {
  const conf = readFileSync(new URL("../nginx.conf", import.meta.url), "utf8");
  const lines = conf.split("\n").filter(line => tracker.test(line));
  assert.deepEqual(lines, [], "nginx.conf still names a tracker");
});
