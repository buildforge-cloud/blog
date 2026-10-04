# Engineering log

What changed in this repo and why, newest first. `CLAUDE.md` holds the rules
that stand; this file holds the evidence behind them.

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
