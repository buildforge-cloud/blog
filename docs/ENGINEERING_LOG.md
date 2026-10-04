# Engineering log

What changed in this repo and why, newest first. `CLAUDE.md` holds the rules
that stand; this file holds the evidence behind them.

## 2026-10-04 — blog#21: the security headers on every page, with a CSP that fits

**Why.** Live pages had no CSP, no Referrer-Policy and no HSTS. nginx drops a
level's `add_header` lines in any block that sets one of its own, and 4 blocks
did: `/_astro/`, `/pagefind/`, images and `\.html$`. Every page went through
the last one.

**nginx: a `map`, not an `include`.** Two `map`s at the top of `nginx.conf`
pick `Cache-Control` and `Pragma` by `$uri`, and only the `server` level calls
`add_header`. The locations keep `expires` and their logging. The `.html`
location had nothing left, so it is gone. This needs no second file, so the
`Dockerfile` is unchanged, and no block can drop a header by forgetting an
`include`. The cost: a cache rule's path is written twice, in the map and in
its location. `map` must sit at `http` level, which a `conf.d` file is.

- `tests/check_nginx_headers.py` is buildforge-starter's check, pinned at
  1.0.0. `tests/nginx-headers.test.mjs` runs it in `npm test`. Before the fix
  it named the 4 blocks; after it, 0.
- `tests/test_nginx.py` asks for the 3 headers on `/`, `/posts/x/`,
  `/_astro/x.css`, `/pagefind/x.js`, `/x.png`, `/robots.txt` and a 404. Before
  the fix: 18 misses (6 paths × 3 headers; only `robots.txt` had them).
- The cache headers are as before: `/_astro/` and images
  `max-age=31536000, public, immutable`, `/pagefind/` `max-age=86400, public`,
  pages `no-cache, must-revalidate` and `Pragma: no-cache`, `robots.txt` none,
  and a 404 none. Those tests passed before the fix, so each was seen to fail
  on a broken copy of `nginx.conf`: one map line cut, or the map's default
  changed. Each break failed only its own test.

**The inline scripts.** The built site had 6 kinds of inline script that run,
not the issue's 5. `Layout.astro:118` was the PostHog snippet blog#17 removed.
Astro had inlined 3 more by itself (`Header`, `Main`, `BackButton`): it puts a
bundled `<script>` under 4 KB into the page. The other 3 were `is:inline`:
`BackToTopButton`, `Comments` (`define:vars`) and the post page's script. The
JSON-LD blocks are data, which a CSP does not block. The only outside origin
the code calls is `giscus.app`.

- `astro.config.ts` sets `vite.build.assetsInlineLimit` so a `.js` file is
  never inlined. Small stylesheets and images keep Vite's rule.
- The 3 `is:inline` scripts are bundled modules now. A module runs once per
  visit, so each one does its work on `astro:page-load`, which a full load and
  a client-side link both fire. The post page's script moved to
  `src/pages/posts/[...slug]/_scripts/post.js` as it was, as plain JS, so
  `astro check` does not type it. Only its start-up changed, and 2 `window`
  globals became module variables.

⚠️ **Found: a post reached from another post had no comments.**
`define:vars` makes Astro print the script without its `data-astro-rerun`, and
Astro 7 runs a script without it once per visit. So after a link from one post
to the next, the giscus loader did not run. The new check found it with no CSP
at all, on the code before this change. It is fixed by the move to
`astro:page-load`.

**The CSP.** Two additions, each found by a failed check:

- `'wasm-unsafe-eval'` in `script-src`: Pagefind compiles WebAssembly. It
  allows no JavaScript `eval`. ⚠️ Chromium reports this block only as a
  console line, with no `securitypolicyviolation` event, so the check reads the
  console too. And Pagefind searches in a worker, which takes the CSP of its
  own script's answer, so the check adds the CSP to every answer, as nginx
  does, not only to pages.
- `https://giscus.app` in `style-src`: giscus loads `default.css`. Only the
  run on a real nginx found this, because CI blocks giscus.app.

The PostHog hosts the issue names were already gone (blog#17).

**The browser check.** `tests/csp.spec.mjs` opens every page in the sitemap
and the 404 page under the CSP, and fails on any violation. It also checks
that search finds a post, and that a post's scripts work: the progress bar,
the heading links, the copy buttons, the giscus loader and back-to-top. It
does so on a full load, after links home → post → post, after Back, and on a
tag page afterwards (which must get none of them). In CI it runs on
`astro preview` with the CSP added from `nginx.conf`. With `NGINX_RIG=1`,
`tests/serve_dist.py` serves `dist/` on a real nginx, and giscus loads for
real. Result on 2026-10-04: 112 passed (desktop and 390 px), and no nginx was
left running. Playwright stops its server with SIGKILL by default, which would
leave nginx serving, so the config asks for SIGTERM.

## 2026-10-04 — blog#19: adopt the starter's shared parts (psi, css_tokens, nginx_rig)

**What.** Three parts of buildforge-starter, each pinned byte for byte in
`scripts/shared-checks.lock` by the pin tool `scripts/shared_checks.py`
(shared_checks 1.1.0, the first version with `--into`):

- `tools/psi.py` (psi 1.0.0): PageSpeed Insights medians, measured on
  Google's servers, never on this busy host. Run by hand; nothing in CI.
- `tests/css_tokens.py` (css_tokens 1.0.0): every `var()` names a defined
  token. `tests/css-tokens.test.mjs` runs it over the 3 stylesheets and the
  29 `.astro` files as one cascade.
- `tests/nginx_rig.py` (nginx_rig 1.0.0): a real nginx with no docker.
  `tests/test_nginx.py` serves the real `nginx.conf` over a stub site.

`tests/shared-checks.test.mjs` runs the pin tool in `npm test`, so a hand edit
to a part fails CI.

**css_tokens.** Alone it found 3 misses, all in `src/styles/theme.css`:
`--font-space-grotesk`, `--font-ibm-plex-sans` and `--font-ibm-plex-mono`.
Astro's font API sets them from `astro.config.ts` (`cssVariable`), outside any
CSS, so the test names them with `--defined`. Then 0 misses.

⚠️ **It sees only part of an `.astro` file** (found in the PR's self-review).
The part reads any file not named `.html` as plain CSS, and plain CSS drops
quoted text. So a `var()` in a `style="..."` or `class="..."` value is never
read, and a Tailwind `-(--name)` class has no `var(` to read at all.
`<style>` blocks and backtick strings are read. On 2026-10-04 every `var()` in
an `.astro` file sat in one of those (`src/pages/search.astro`'s `<style>`,
`BackToTopButton.astro`'s template string), so nothing is hidden today. The
one `-(--name)` class, `top-(--file-name-offset)`, names a token set inline by
`src/utils/transformers/fileName.js`. A wider read belongs in
buildforge-starter's part.

**nginx.** The test checks that `/` and `/posts/x/` answer
`no-cache, must-revalidate`, that `/_astro/x.css` is immutable, that an unknown
path is a 404 with `404.html`, that `/.env` is a 403, and that `/robots.txt`
carries the CSP. Each was seen to fail: six scratch copies of `nginx.conf`,
each with one piece cut, each failed only the test written for that piece.

⚠️ **`/_astro/` sends two `Cache-Control` headers**: `expires 1y` sends
`max-age=31536000`, and the block's `add_header` sends `public, immutable`.
A client that reads one header sees only `max-age`. The first draft of the
test did that and failed on the real config. It now joins all of them, as a
browser does. Live, Cloudflare joins them into one.

**Not asserted: the CSP on pages.** buildforge-starter's
`check_nginx_headers` 1.0.0 names the 4 blocks that drop the server's
`Strict-Transport-Security`, `Referrer-Policy` and `Content-Security-Policy`:
`location ^~ /_astro/`, `location ^~ /pagefind/`, the image block, and
`location ~* \.html$`. Live `/` still carries neither the CSP nor the
`Referrer-Policy` (`curl`, 2026-10-04). Fixing that is its own issue: a CSP
that reaches the pages for the first time needs a live check of giscus, and
blog#17 found inline scripts the CSP as written would block.

**Found in a shared part, not fixed here.** `nginx_rig.serve` leaves nginx's
stderr pipe open, so a run prints one `ResourceWarning: unclosed file`. The
part is pinned, so the fix belongs in buildforge-starter.

## 2026-09-29 — blog#17: remove the PostHog snippet that never ran

**Decision.** The blog has no analytics. Stefan chose this on the board
(decision 386). buildforge.cloud dropped PostHog on 2026-09-11 so it needs no
cookie banner, and the blog now matches it. Search Console still gives the
blog's search numbers.

**Why the snippet never ran.** `src/layouts/Layout.astro` held it as a
`{'...' + "..."}` expression inside `<script is:inline>`. Astro prints an
expression there as text. The built page held `<script>{'!function(t,e){…`, so
the browser read a block with a string in it and did nothing. PostHog had 0
events from `blog.buildforge.cloud` in 365 days (measured 2026-09-29, in the
issue). The project key still shipped on every page.

**What was removed.**

- The snippet and its comment in `src/layouts/Layout.astro`.
- `https://eu.i.posthog.com` and `https://eu-assets.i.posthog.com` from the
  `script-src` and `connect-src` of the CSP in `nginx.conf`.
- The Analytics text in `CLAUDE.md` and `README.md`, now true.

A grep for `posthog` and `phc_` found nothing else: no env var, no preconnect,
no package, and no post that names it.

**The check.** `tests/analytics.spec.mjs` walks `dist/` and fails when a built
page's scripts, `src` URLs or `<link>` tags, or any built `.js` file, name
PostHog or hold a `phc_` key. On the code before this change it failed on all
24 pages. Prose and JSON-LD are not checked, on purpose: this blog writes about
the tools its apps use, and a post about this very issue would name PostHog.
The rule is in `tests/analytics.mjs`, and `tests/analytics.test.mjs` checks it
without a build, including that `nginx.conf` names no tracker. Seven mutations
of the rule each failed the test written for them.

**Found on the way, not fixed: the CSP never reaches a page.** `nginx.conf`
sets its security headers with `add_header` at `server` level. nginx drops
those in any `location` that has its own `add_header`, and the `.html` location
has one (`Cache-Control`). So pages get no CSP and no `Referrer-Policy`.
Measured 2026-09-29 with `curl -sI`: `https://blog.buildforge.cloud/` has
neither header; `/robots.txt`, whose location has no `add_header`, has both.
Whoever fixes this must also change the CSP itself: its `script-src` has no
`'unsafe-inline'`, and the built pages carry inline scripts (Astro's own
modules, giscus, and two `data-astro-rerun` blocks), so a CSP that reached the
pages as written would block them.
