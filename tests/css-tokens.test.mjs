// Every `var()` in the site's CSS names a token something defines (blog#19).
//
// A `var(--name)` that nothing defines makes its whole declaration invalid,
// and nothing warns: no console line, no build error. `tests/css_tokens.py`
// is buildforge-starter's shared part (pinned in `scripts/shared-checks.lock`,
// never edited here); it reads the stylesheets and every `.astro` file as one
// cascade. Run with `npm test`.
//
// ⚠️ It reads an `.astro` file as plain CSS, so it skips quoted text: a
// `var()` in a `style="..."` or `class="..."` value is not seen, and nor is a
// Tailwind `top-(--name)` class, which has no `var(` at all. It does see a
// `<style>` block and a backtick string, which is where every `var()` in an
// `.astro` file sat on 2026-10-04.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

// Astro's font API sets these from `astro.config.ts` (`cssVariable`), outside
// any CSS this check reads.
const setByAstro = [
  "--font-space-grotesk",
  "--font-ibm-plex-sans",
  "--font-ibm-plex-mono",
];

const files = (dir, suffix, recursive) =>
  readdirSync(new URL(dir, new URL("../", import.meta.url)), { recursive })
    .filter(name => name.endsWith(suffix))
    .map(name => `${dir}${name}`)
    .sort();

test("every var() in the stylesheets and .astro files names a defined token", () => {
  const paths = [
    ...files("src/styles/", ".css", false),
    ...files("src/", ".astro", true),
  ];
  const defined = setByAstro.map(name => `--defined=${name}`);
  const run = spawnSync(
    "python3",
    ["tests/css_tokens.py", ...paths, ...defined],
    { cwd: root, encoding: "utf8" }
  );
  assert.equal(
    run.status,
    0,
    `css_tokens.py exited ${run.status}:\n${run.stdout}${run.stderr}`
  );
});
