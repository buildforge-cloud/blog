# Engineering log

What changed in this repo and why, newest first. `CLAUDE.md` holds the rules
that stand; this file holds the evidence behind them.

## 2026-10-20 — blog#42, #43, #44: three scheduled posts

**What.** Three posts, one a week, each dated 07:00 UTC so the 07:05 run
publishes it (blog#9):

- `vedlikeholdsloggen-fact-check-gate.md`, 27 October: the source-check
  ledger that fails CI for a text with no clean AI check, and the finding
  that a heading must be read with its paragraph.
- `ps-db-phone-speed-two-rounds.md`, 3 November: two rounds of phone speed
  work, with PageSpeed and the agent's phone setup before and after.
- `ps-db-pages-survive-chrome-translate.md`, 10 November: the crash under
  Chrome's page translation, and why the known fix was not enough.

Facts come from each app's private PRs, their issues and review threads, and
the Vedlikeholdsloggen rule file on its source check. The posts name none of
them. Before the first post, the last three posts were read for marketing
lines (listed in the PR).

⚠️ **Round two of the speed work has no PageSpeed "after" yet.** It went live
on the evening of 19 October, and the app's own follow-up runs PageSpeed on
22 October. The post says it was written before that run. If the numbers are
in before 3 November, they can go into the post.

**Checks.** The same kind of scratch checker as blog#27 (not committed), 10
rules, now with a required-link rule for the App Store page. A bad sample
failed all 10 by name. The number rule read the source PRs and issues; its
first run on the speed post failed two LCP figures that were only in an
issue comment, so the issues joined the sources.

## 2026-10-20 — blog#27: post on the Vedlikeholdsloggen 1.2 launch

**What.** `src/content/posts/vedlikeholdsloggen-1-2-history-per-thing.md`,
dated 2026-10-19, the day 1.2 went live in the App Store (the issue's
comment). Facts come from the app's private issues on the equipment list,
the Hjemmet tab, history per thing and the task-linking fix, and from its
store listing. The post names none of them. Each claim about 1.2 was
matched by hand to the 1.2.0 release note or the store description.

**Checks.** The same kind of scratch checker as blog#28 and blog#35 (not
committed), 9 rules: no em or en dash, no second person, the product linked
at its first mention, `draft: false`, the go-live date, a real tag, no stock
phrase, no internal detail, and every number in the prose found in the
sources. A bad sample failed all 9 by name. Its first link rule passed
nothing: the window after the first mention was 3 characters shorter than
the link, so it was widened before the post passed.

## 2026-10-20 — blog#39: shared_checks 1.6.0 → 1.7.0

**What.** `python3 scripts/shared_checks.py update shared_checks 1.7.0`, run
twice. 1.7.0 (buildforge-starter#176) has two changes. An `update` of
shared_checks hands over to the new copy, so the new copy writes the pin.
The pin also refuses an executable file whose lock has no `executable`. 1.6.0
cannot hand over, so the starter's adopt note says to run `update` once more.
Here the second run changed nothing: 1.6.0 already copies the mode, and 1.7.0
adds no lock field. Every file this repo pins is 100644 with no flag, or
100755 with the flag, so the new refusal flags nothing. No step beyond
`update` applies. From 1.7.0 on, one run is enough.

⚠️ blog#37's entry below says a bump from 1.6.0 needs one run. For 1.7.0 that
happened to be true, but only because 1.7.0 adds no lock field. The starter's
rule is: a copy before 1.7.0 cannot hand over, so run `update` twice.

**Evidence.** The starter's tests at `shared_checks-v1.7.0` (the same five
files as blog#37) ran on blog's file, in the extracted tree with every file
`git add`ed. 1.6.0 from `main`: 40 failed, 710 passed, among them
`test_an_executable_file_whose_pin_does_not_say_so_fails_the_pin`
(`assert (1, 1, False) == (0, 1, True)`). 1.7.0: 750 passed, 19 skipped.
`npm test`: 32 pass, the same names as on `main`. With `"executable": true`
taken out of the lock, `every shared part is the release its pin names`
failed (`REFUSING: scripts/shared_checks.py is executable, and its pin does
not say so`). With the lock restored, it passed.

## 2026-10-20 — blog#37: shared_checks 1.5.0 → 1.6.0

**What.** `python3 scripts/shared_checks.py update shared_checks 1.6.0`, run
twice. 1.6.0 (buildforge-starter#166) pins `secrets.yml` and
`.githooks/pre-commit` as releases, reads a version from a
`# __version__ = "x.y.z"` comment line, and copies each release's executable
bit. A pin marked `executable` now fails when the file lost the bit. This
repo has no `secrets.yml`, no hook and no `check_secrets.py`, so no step
beyond `update` applies.

⚠️ **The first `update` is run by the old tool**, so it took the new bytes
but not the release's mode: the file stayed 100644 and the lock had no
`executable`. The second run, by 1.6.0 itself, made it 100755 and wrote
`"executable": true`, as the starter's own lock has it. A later bump from
1.6.0 on needs one run.

**Evidence.** The starter's tests at `shared_checks-v1.6.0` (the same five
files as blog#33) ran on blog's file, in the extracted tree with every file
`git add`ed. 1.5.0 from `main`: 36 failed, 638 passed, among them
`test_a_file_that_cannot_hold_python_declares_its_version_in_a_comment`
(the old copy refuses `secrets.yml` and `pre-commit`: no version it can
read). 1.6.0: 674 passed, 19 skipped. `npm test`: 32 pass, the same names as on
`main`. With the executable bit taken off, `every shared part is the release
its pin names` failed (`scripts/shared_checks.py is not the release its pin
names`); with it back, it passed.

## 2026-10-15 — blog#35: post on how fast agent setups change

**What.** `src/content/posts/how-fast-agent-setups-change.md`, from the
board's Market card issue and its plan's "Market signals" (both private, so
the post names neither). Every number is quoted from those two, with its
week. The voice and format check (decision 1245) is in the PR, as for
blog#28; the older posts are not rewritten.

**Numbers.** The same kind of scratch checker as blog#28 (not committed):
11 rules, among them "every number in the prose is in the source text". A
bad sample failed all 11 by name. Its first number rule missed `999k`,
because a digit run followed by a letter never matched; it now allows a `k`
or `M` after the number and caught it. Each number was also matched by hand
to its table row and week.

**Phone width.** Two tables, of 5 and 6 columns (the model table has weeks as
columns, so its "Other" and "No trailer" rows make each week add to 100): at
390 px each is 358 px wide and the page has no side scroll (`scrollWidth`
390), measured on the built page.

**Playwright's browser.** The main checkout still has no `@playwright/test`,
and `chromium_headless_shell-1243` was gone from the cache again. With
`PLAYWRIGHT_SKIP_BROWSER_GC=1` on `playwright install --only-shell chromium`
it was fetched, and `chromium-1248` and both other shells stayed (listed
before and after). blog#28's run without the flag deleted them.

## 2026-10-15 — blog#33: shared_checks 1.4.0 → 1.5.0

**What.** `python3 scripts/shared_checks.py update shared_checks 1.5.0`,
nothing else. 1.5.0 (buildforge-starter#153) changes only the adopt note and
two messages: a private repo's `docs` and `scan` jobs now run on
`home-light`, and a starter-made repo must also update
`tests/_runner_switch.py` and its readers. This public repo has neither job
nor those tests, so no step beyond `update` applies.

**Evidence.** The starter's tests at `shared_checks-v1.5.0` (the same five
files as blog#29) ran on blog's file, in the extracted tree with every file
`git add`ed. 1.4.0 from `main`: 28 failed, 585 passed, among them
`test_the_adopt_note_names_the_runner_the_scan_takes_in_a_private_repo`
(`('home-light', None)`: no "Since 1.5.0" sentence). 1.5.0: 613 passed, 19
skipped. With the files only `git init`ed and not added, 3
`test_claude_rules.py` cases fail on both copies (rule patterns and the docs
check find no tracked file); that is the harness, not the part. `npm test`:
32 pass, the same names as on `main`. A hand edit of `__version__` failed
`every shared part is the release its pin names`; the restore passed it.

## 2026-10-15 — blog#29, blog#31: shared_checks 1.1.0 → 1.4.0, psi 1.1.0 → 1.2.0

**What.** `python3 scripts/shared_checks.py update shared_checks 1.4.0` and
`update psi 1.2.0`, nothing else: no page, CSS or app file changed.
shared_checks 1.2.0 to 1.4.0 move a private repo's `secrets.yml` and
`docs-checks.yml` jobs to the `home` runner, keep a Dependabot branch off
`home`, and refuse a `dependabot.yml` that renames Dependabot's branch. This
public repo has neither workflow and no `dependabot.yml`, so no step beyond
`update` applies. psi 1.2.0 (buildforge-starter#113) fails a run only on
performance; another category with no score is named and prints `-`. The
README's psi lines say so.

**Evidence.** No blog suite runs either part's own tests. So the starter
at each tag was extracted to a scratch folder, and its tests ran with the
blog's file in place, in a venv with pytest and pyyaml. shared_checks
(`tests/test_secrets.py`, `test_workflow_ceilings.py`, `test_log_entries.py`,
`test_claude_rules.py`, `test_targets.py` at `shared_checks-v1.4.0`): 1.1.0
from `main`, 31 failed, 480 passed (among them
`test_the_pin_refuses_a_dependabot_yml_that_renames_dependabots_branch`);
1.4.0, 511 passed, 15 skipped. psi (`parts/tests/test_psi.py` at
`psi-v1.2.0`): 1.1.0, 6 failed, 44 passed (`mobile run @ m1: failed, no
accessibility score`); 1.2.0, 50 passed. `npm test`: 32 pass, the same names
as on `main`. A one-byte hand edit to each new file failed `every shared part
is the release its pin names`; the restore passed it.

## 2026-10-14 — blog#28: post on how ps·db got indexed, and a voice check

**What.** `src/content/posts/how-ps-db-got-indexed-by-google.md`, from
ps-db#205's comments and the 2026-10-14 re-measure (ps-db#448). Before it,
the voice and format check that Stefan asked for (decision 1245): its answers
and a change proposal for the older posts are in the PR, and the older posts
are not rewritten. The post is written the changed way: a title in the words
a searcher uses, the product linked at first mention and at one game page,
plain short sentences, and no closing twist line.

**Numbers.** Every number in the post was matched by hand to its line and
date in the sources. A scratch checker (not committed) also failed the post
on any number absent from the source text. Its first version passed a
made-up `73`, because `73b` in a commit hash matched; it now skips URLs and
digits joined to letters, and then failed the bad sample on all 10 rules.

**Older facts that changed.** The newest sample is 124 of 300 (41%) on
2026-10-14; the issue's "37%" is the 2026-09-30 figure, which the post gives
in its list. The 2026-08-08 post said Change of Address was the signal Google
wanted; ps-db#205 found on 2026-08-09 that the old domain was at 0 indexed
too, and the new post says that it was wrong.

## 2026-10-08 — blog#25: psi 1.0.1 → 1.1.0

**What.** `python3 scripts/shared_checks.py update psi 1.1.0`, nothing else:
no page, CSS or app file changed. psi 1.1.0 (buildforge-starter#112) signs in
with `PSI_API_KEY` when it is set, with no `google-auth`, and masks the key in
all it prints or saves. `--category` adds accessibility, best-practices and
seo scores beside performance. The README's psi lines say both.

**Evidence.** Nothing in this repo's suites runs psi; its tests live in the
starter. So the starter's `parts/tests/test_psi.py` at tag `psi-v1.1.0` ran
against this repo's file, with the starter's parts venv. On psi 1.0.1 from
`main`: 15 failed, 30 passed (`AssertionError: a token was fetched with
PSI_API_KEY set`, `unrecognized arguments: --category`). On the bumped
`tools/psi.py`: 45 passed. `npm test`: 32 pass, the same names as on `main`.
A one-constant hand edit to the new `tools/psi.py` failed `every shared part
is the release its pin names`; the restore passed it.

## 2026-10-04 — blog#23: nginx_rig 1.1.0's serve-dir replaces tests/serve_dist.py

**What.** Three shared parts moved up with the pin tool: nginx_rig 1.0.0 →
1.1.0, css_tokens 1.0.0 → 1.1.0 and psi 1.0.0 → 1.0.1. `tests/serve_dist.py`
(blog#21) is gone. buildforge-starter#109 built the same thing once, as
nginx_rig's `serve_dir()` and `serve-dir` command, and fixed two faults the
copy here still had: a signal during nginx's start could leave nginx running,
and a path with a space failed `nginx -t`.

- `tests/test_nginx.py` serves its stub site with `nginx_rig.serve_dir()`. On
  1.0.0 it failed (`module 'nginx_rig' has no attribute 'serve_dir'`); on
  1.1.0 the same 8 tests pass. With the hidden-file `deny` cut from
  `nginx.conf`, only `test_a_hidden_file_is_refused` failed.
- `NGINX_RIG=1 npm run test:pages` runs
  `python3 tests/nginx_rig.py serve-dir nginx.conf dist --port 4177` as
  Playwright's server, still stopped with SIGTERM. Result: 112 passed, 0
  skipped, the same count as blog#21's run, and no rig nginx left after it.
  CI still serves the build with `astro preview` and adds the CSP itself.
- css_tokens 1.1.0 reads an `.astro` file's `<style>` blocks, `style="..."`
  attributes and `class` values, Tailwind's `-(--name)` among them. It passes
  on this repo with no new `--defined`. A `var(--no-such-token)` put in a
  footer `style` attribute, and then a `p-(--no-such-token)` class, each
  failed `npm test`. ⚠️ It no longer reads `<script>` blocks, which 1.0.0
  read as CSS: BackToTopButton's `var(--accent)` in a backtick string is now
  unchecked. `--accent` is defined, so nothing is hidden today.

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
