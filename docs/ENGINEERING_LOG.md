# Engineering log

What changed in this repo and why, newest first. `CLAUDE.md` holds the rules
that stand; this file holds the evidence behind them.

## 2026-10-31 — blog#68, #69, #70: three December posts, and a posts test

**What.** Three posts, one a week after the 8 Dec post, each dated 07:00
UTC so the 07:05 run publishes it (blog#9):

- `passing-tests-skipped-most-of-the-file.md`, 15 December: ps·db's text
  tests stripped `/* */` before `//`, so the `/*` in a `//` comment on
  App.tsx line 122 hid lines 122 to 1206 (1,085 of 1,423) from 5 test files.
- `coding-agents-weekly-usage-limit.md`, 22 December: the 7-day usage
  limit, the idle morning of 26 Oct, and the override that ends at the
  reset, set only on Stefan's yes. It merged 17 minutes after that reset.
- `search-youtube-comments-desktop.md`, 29 December: Comment Finder 1.9.1.
  Desktop search stopped at about 60 because the extension asked a hidden
  panel's comment list for more; also 1.9.0's next and previous buttons.

Two departures from the issues, both from the sources. blog#68 named the
file `passing-tests-read-half-the-file`, but the tests read 338 of 1,423
lines, about a quarter, so the slug says "skipped most of the file". And it
said 4 tests; ps-db#624 and #626 changed 5 test files (2 sharing one
reader, then 3 more). The private repos are named in this log only, never
in a post. `strategy/STRATEGY.md` Now names the three dates; its old note on
the steps done before blog#58 went, to stay at 80 lines. The blog-post
skill lists Comment Finder as safe to link, and no longer says a planned
post's OG image is built early (blog#66). `changes.d/66.md` is folded into
CLAUDE.md.

**Checks.** `tests/posts.test.mjs` (in `npm test`) replaces the scratch
checkers of blog#46 and #58: the December dates, `draft` and `featured`
false, the product as each product post's first link, no em dash in any
post or page, no link to a buildforge-cloud repo but `blog`, and Now naming
blog#68 to #70 within 80 lines. Red first: `no post with slug
passing-tests-skipped-most-of-the-file` and `Now does not name blog#68`.
The three that passed at once were broken on purpose, one at a time, and
each mutant failed only its own test: an em dash in a post and in a page, a
link to a private repo, an 81st line, a date an hour late, `draft: true`,
another link before the product's, and `blog#690` for `blog#69`.

## 2026-10-26 — blog#66: a planned post's share image waits for its date

**Why.** `/posts/ai-written-tests-mutation-testing/index.png` answered 200
on the live site and showed the title of the post planned for 24 Nov.
`getStaticPaths()` in `src/pages/posts/[...slug]/index.png.ts` kept every
post with `!data.draft && !data.ogImage`, and did not look at the date.

**What.** The route now keeps `postFilter(post) && !post.data.ogImage`, the
same filter the post pages, lists and RSS use. `postFilter` already drops
drafts. In `npm run dev` it shows every post, so the images still show
there.

**Checks.** `tests/og-image-date.spec.mjs` reads `dist/`: each non-draft
post without an `ogImage` must have an `index.png` if and only if it has an
`index.html`. It reads `dist/` and not the clock, so the build's own time
decides. Before the fix it failed with `ai-written-tests-mutation-testing:
its page is not built yet, but its share image is`. After it, the build
made 10 post images for the 10 post pages, and the 7 planned posts (27 Oct
to 8 Dec) had none. With one live post's `index.png` deleted from `dist/`,
it failed with `starting-this-blog: its page is built, but its share image
is not`. It reads only the top folder of `src/content/posts/`, so another
test fails if a subfolder appears there (seen red with an empty one).

## 2026-10-26 — blog#64: the fonts come from the repo

**Why.** `astro.config.ts` loaded its three fonts with
`fontProviders.google()`, so every build fetched them. On 2026-10-08 and on
2026-10-26 (run 40345255516, after blog#63) that fetch failed with `fetch
failed` in `CachedFontFetcher.fetch`, the deploy stopped, and the merged
change waited for the next 07:05 UTC build.

**What.** The font list moved to `fonts.config.mjs`, so a test can import
it, and every family uses `fontProviders.local()`. The 28 files in
`src/assets/fonts/` (14 faces, a `.woff` and a `.ttf` each) are the files
the live site served from Google that day, read from its `@font-face`
rules. Each family's OFL licence is beside them. IBM Plex Sans lists its
italics first, as Google did: Astro sizes the fallback font from the first
face, and with normal first the fallback's `size-adjust` changed from
99.5961% to 101.1663%.

**Checks.** Astro's Google provider asks a third host first:
`fonts.google.com/metadata/fonts`. With no network at all (`unshare -rn`),
the old config failed with `getaddrinfo EAI_AGAIN fonts.google.com`, then
`Cannot find the font path` at `/og.png`. The new one built with no network
(loopback only: the OG route fetches its font from Astro's own local
server). Against the old build, every `@font-face` and `:root` rule on `/`
and on a post is the same once the hashes are taken out, every font file has
the same bytes, the OG images have the same bytes, and the screenshots in
`docs/plan/mockup/blog-64/` are the same bytes. `ci.yml` now points the
three hosts at 0.0.0.0 before `npm run build`.
`tests/fonts.test.mjs` failed first with `Space Grotesk uses the "google"
provider; want "local"`; the CI pin failed first on the missing step.
Mutations each failed one test: a wrong file name, a dropped weight, one
family back on Google, a host left out of the step, `/tmp/hosts` for
`/etc/hosts`, the step removed.

**Review fixes.** A text pin cannot tell a working hosts line from a
commented one, so the step now runs `getent ahosts` on each host and fails
on any address but 0.0.0.0. Run with `bash -e` under a fake `/etc/hosts`
(`unshare -rm`), the step passed as written and failed with the line
commented out. The IPv4 line alone is enough: with it, `getent ahosts`
gave no IPv6 address and Node's `fetch` got `ECONNREFUSED` on all three
hosts. The face test no longer sorts, so it pins Plex Sans's italic-first
order; a new test pins a `.woff` then a `.ttf` per face.
`.prettierignore` lists `fonts.config.mjs`, so `format:check` reads it. A
typo in the font config is still caught without types: Astro validates its
config on load (`! Unrecognized key: "cssVarible"`).

## 2026-10-26 — blog#62: the front page opens on the newest post

**What.** `hello-world.md` ("Starting this blog", 7 Aug) had
`featured: true`, so the front page's Featured slot put it above every newer
post. It is now `featured: false`, like every other post. No post is
featured, so `index.astro` drops the Featured section by itself, and Recent
Posts comes first, newest on top. The post's page, slug and text are
unchanged, and it is still in `/posts/` and `/archives/`.

This was the smaller of the two fixes the issue named. The other, putting
the newest post in the Featured slot, would change `index.astro` and keep a
section heading that says nothing a list sorted by date does not say.

**Checks.** `tests/front-page.spec.mjs` (in `npm run test:pages`) compares
the first post link on `/` with the first on `/posts/`, which is newest
first. Red before the fix: `Received: "/posts/starting-this-blog/"`,
expected the Vedlikeholdsloggen 1.2 post. Its second test, that
`/archives/` still links the old post, passed at once, so it was broken on
purpose: with the post set to `draft: true` it failed (`Expected: 1,
Received: 0`). Screenshots at 390 px: `docs/plan/mockup/blog-62/`.

## 2026-10-24 — blog#58, #59, #60: three scheduled posts, and who picks topics

**What.** Three posts, one a week, each dated 07:00 UTC so the 07:05 run
publishes it (blog#9):

- `ai-written-tests-mutation-testing.md`, 24 November: ps·db's first
  mutation run (a false 100 of 100, then 2,080 survivors), and the tests
  for the three functions that cut survivors to 1, 0 and 34.
- `keep-visitor-input-out-of-logs-and-sentry.md`, 1 December: the rule
  that a visitor's search stays private, made in four layers (the 422
  answer, uvicorn's access log, nginx's access log, Sentry's events).
- `copied-text-rebuilt-in-our-own-words.md`, 8 December: Vedlikeholdsloggen
  texts too close to a source, the word and model checks that measured it,
  and the rewrite.

Facts come from the apps' and the starter's private PRs, issues and review
threads, and ps·db's own log; the posts name none of them. The third post
names no source and quotes no source text: it says only "a Norwegian
source". Its real-name list lives in the scratch checker, not in this repo.
`strategy/STRATEGY.md`: open question 3 is answered in Measure (the
executive proposes 3 topics a month, Stefan says yes to each, decision
2124), and Now names the three go-live dates.

**Checks.** The same kind of scratch checker as blog#46 (not committed),
now with two new rules: post 2 holds no real search (only `search=...`),
and post 3 names none of the app's sources by name or site and has no «»
quote. Bad samples failed every rule by name. A second checker read the
strategy file: red on the old one (9 failures), green after.

## 2026-10-23 — blog#53: the blog-post skill's identity follows decision 1245

**What.** The skill's identity block said "not traffic, not audience growth",
"Audience: nobody specific" and "Not selling anything". Decision 1245 says the
blog's main job is to get the products seen while it reads as a person wrote
it, and Stefan said yes to it in decision 1977. The block now names the four
products with their links, says who searches for a post, and lists blog#30's
format rules under "How a post gets seen". "Not selling" became "no sales
pitch and no calls to action, but the product is named and linked". Kept: not
a tutorial, honest about struggles, no numbered series, first person. The
Gemini prompt, step 1's questions, two structural tells (topic words in a
heading, the last paragraph) and the safe-link list now agree with it.
`CLAUDE.md` "What a post is for" points at the skill, and `changes.d/52.md` is
folded into it.

**Checks.** `tests/blog-post-skill.test.mjs` went red on 6 of 7 tests before
the edit (the old lines, no "products seen", em dashes, the Gemini prompt,
`CLAUDE.md`'s "until Stefan picks"). The seventh, the kept rules, passed
first; changing "Not a tutorial" made it fail. `STRATEGY.md` is left alone:
its Now 2 is this issue, and blog#54 cites Now 3 by number.

## 2026-10-23 — blog#52: new titles for the 4 old posts, slugs kept

**What.** Stefan's yes to blog#30's proposal (decision 1977). The 4 posts
from August and September get a `title` and `description` in the words a
searcher types: the product or tool and the problem. Slugs, file names and
`pubDatetime` stay, so no URL changed. *I can't tell if any of it worked*
opens with an update note that its Change of Address claim was wrong, linking
`how-ps-db-got-indexed-by-google`. *268 copies* links ps·db at its first
mention. Each post's closing twist line is gone. No other body line changed.

**Checks.** A scratch checker (not committed) compares each post with
`origin/main`: slug and date kept, title and description changed, product
words present, no em or en dash, the twist lines gone, and every removed or
added body line on an allow list. It failed 33 rules on the old text. A
planted `49 MB` → `48 MB` failed it on that line. The built sitemap lists the
same 29 URLs as the live one. The headings, the mid-post "That one sat with
me for a while." and `STRATEGY.md`'s Now 1 were left alone: the issue's list
does not touch them, and blog#53 and #54 cite Now 2 and Now 3 by number.

## 2026-10-22 — blog#50: strategy draft

**What.** `strategy/STRATEGY.md`, 78 lines, with no status line: the merge
after Stefan's yes is the approval (the issue's rule, changed 2026-10-22).
The six headings the issue names, in its order, each with a `Source:` note.
"Now" holds work not yet done: the 4 retitles and the skill text after his
yes to blog#28's proposal, and the PageSpeed numbers for the 3 Nov post.
Every claim comes from `CLAUDE.md`, `README.md`, `about.md`, the blog-post
skill, this log and the issues and PRs it names. Four gaps went to "Open
questions", not into the text: the skill's "not traffic" against decision
1245, which number means "seen", what comes after the 17 November post, and
whether app users are readers too.

**Checks.** A scratch checker (not committed) asserts the issue's rules: at
most 80 lines, no status line, the six headings in order, a `Source:` note
in each, three steps under "Now" that are neither done work nor a bare
decision, no em or en dash. A bad sample failed 10 rules by name; the length
rule passed at 80 lines and failed at 81. The first draft failed the review
rules: a status line, a step for posts already merged, and a step that only
repeated an open question.

## 2026-10-21 — blog#48: shared_checks 1.7.0 → 1.7.1

**What.** `python3 scripts/shared_checks.py update shared_checks 1.7.1`, one
run (1.7.0 hands over to the new copy, which wrote the pin again). 1.7.1
(buildforge-starter#186, from #184) changes only the adopt note at the top of
the file, which now names `shared_checks 1.7.1` and `secrets 1.3.0`, and its
`__version__`. The file stays 100755 and the lock keeps `"executable": true`.
The starter's README adds nothing for `shared_checks` beyond `update`; its new
text is about the `secrets` workflow, which blog does not pin.

**Evidence.** The starter's tests at `shared_checks-v1.7.1` (the five files
that name `shared_checks`) ran on blog's file, in the extracted tree with every
file `git add`ed. 1.7.0 from `main`: 40 failed, 719 passed. Most of the 40 fail
only because the old bytes are not the starter's pinned bytes. The one that
tests the release itself is
`test_the_adopt_commands_name_the_releases_the_lock_pins[the pin tool's adopt
note]`, which printed the old note with `ref=shared_checks-v1.7.0` and
`update secrets 1.2.0`. 1.7.1: 759 passed, 19 skipped (about 6 minutes per
run). `npm test`: 32 pass, the same names as on `main`. With `__version__` set
to `"1.7.2"` by hand, only `every shared part is the release its pin names`
failed (`REFUSING: scripts/shared_checks.py is not the release its pin
names`). With the file restored, it passed.

## 2026-10-20 — blog#46: post on keeping the Actions token from pull request code

**What.** `src/content/posts/github-actions-token-fork-pr.md`, dated 17
November 07:00 UTC, one week after the 10 November post. It tells how the
starter's secret scan first dropped the token from the scanner's step, why
that was not enough (`$GITHUB_ENV`, `$GITHUB_PATH`), and the two fixes:
the token only in steps before any checkout code, and `python3 -I` in every
step that holds it. Facts come from the starter's two private PRs, their
issue and log entries, its README section on the scan, its workflow, and
the two ps·db PRs whose reviews found the gaps. The post names and links
none of them: the starter is private, so it is not linked either. Public
links only: ps·db, GitHub's docs, actions/checkout, Python's and bash's
manuals.

**Checks.** The same kind of scratch checker as blog#42 (not committed), 11
rules: no em or en dash, no second person, `draft: false`, the go-live date,
the slug, a real tag, a title of at most 60 characters with `GITHUB_TOKEN`
and "fork" in it and "secrets" in the description, no stock phrase, no
internal detail (runner labels, repo and PR numbers), ps·db linked at its
first mention, and every number found in the sources. Two bad samples failed
every rule by name; the link rule needed the second one, because the first
sample linked ps·db later in the text. The review of the PR then added
lines the post must not hold, each seen red on the old draft first: a claim
that every project runs the scan, and a pull request reaching the `since`
step (its `if:` skips pull requests).

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
