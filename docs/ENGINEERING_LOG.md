# Engineering log

What changed in this repo and why, newest first. `CLAUDE.md` holds the rules
that stand; this file holds the evidence behind them.

## 2026-11-07 — blog#79: About names Vedlikeholdsloggen, and the note from blog#77

**What.** `about.md` lists Vedlikeholdsloggen with the other products.
`tests/posts.test.mjs` now pins the link to each product STRATEGY.md's Goal
names. Before the page edit it failed with `about.md: no link to
Vedlikeholdsloggen`. Breaking each of the other three links in turn failed the
same test, naming that product. `changes.d/77.md` is folded into `CLAUDE.md`.

**Still stale, outside this issue's scope.** `README.md:43` and the docstring at
`tests/test_nginx.py:7` still say Ubuntu's nginx 1.24.

## 2026-11-07 — blog#77: nginx_rig 1.1.1

**What.** `python3 scripts/shared_checks.py update nginx_rig 1.1.1`: the part
and its pin, nothing else of the rig. The release's README section at tag
`nginx_rig-v1.1.1` names no step beyond `update`.

**Why it matters here.** apt's candidate on this host, `1.26.3-3+deb13u9`, has
left upstream: its `nginx` package answers 404. Run on an empty cache
(2026-11-07), 1.1.0 stops with `CalledProcessError` (`apt-get download`, exit
100), and leaves only `nginx-common_1.26.3-3+deb13u9_all.deb` behind. 1.1.1
says `apt's candidate would not download, trying nginx 1.26.3-3+deb13u7`, then
fetches both packages at that version. `tests/test_nginx.py` passes on that
binary, under a throwaway `HOME`, so the real `nginx.conf` was served by it.

**A filled cache hides this.** `~/.cache/nginx_rig` already holds a `root`, so
every rig run returns from `fetch()` before the changed code. It also holds that
same stray `nginx-common` file, which the next real fetch deletes. So the runs
below show the bump broke nothing, and only the empty-cache run shows the fix.

**Measured, before and after the bump, on the same worktree:** 52 node tests, 8
`test_nginx` tests with `NGINX_RIG=1`, and 158 pages with `NGINX_RIG=1`. All
passed, none skipped, and the test names match. The pin tool refuses the 1.1.0
file under the 1.1.1 lock. No rig process was left.

**A stale fact, not fixed in this PR.** `CLAUDE.md` says the rig's nginx is 1.24.
It is 1.26.3 here. `changes.d/77.md` carries the correction.

## 2026-10-31 — blog#75: a post on Google's 26 Oct drop of ps·db

**What.** One post, 19 January at 07:00 UTC, a week after the 12 Jan post:
`google-stopped-showing-our-site-in-a-day.md`. Its facts come from ps-db#655's
write-up, `docs/search-drop-2026-10-26.md` (PR #656), and fix 1, ps-db#657
(PR #658). The spine: I blamed the 17:17 deploy (#598), but pages Google
last crawled on 11 and 16 Oct fell in the same hour, so Google had judged the
whole site. And the likeliest things it counted were built on purpose,
among them the retitling that the 14 Oct post called a win. The write-up's
seven causes keep their "how sure" words. The four checks sit beside the
suspects they settle, not in the write-up's order.

**Voice check** (the issue's first step). Read the last three posts (29 Dec,
5 Jan, 12 Jan) and the 1.2 post (blog#40). Lines that read as marketing or
filler, quoted and left as they are: "It needs no API key and no account,
and it sends nothing anywhere." (29 Dec, store-listing register); "Moving the
code turned out to be the part that was easiest to prove." (5 Jan, restates
its heading); "A comparison that can't fail proves nothing." and "A test can
stay green because it is right, or because it is reading a file the code
just left." (5 Jan, composed lines); "This post is what I knew that day, and
the plan that came out of it." and "17 is a small number, and it still said
something clear once it was split." (12 Jan, throat-clearing and summing
up). The new post has none of those shapes.

Departures, all from the sources or the repo's rules. The issue's Touches
named the post and this log. The repo's rules add `tests/posts.test.mjs`
(the post in `QUEUED` and in the product-first test) and STRATEGY.md:
still 80 lines, with Now 3 holding the three January posts, Now 4 both
"add the reading" steps, and the first Users line widened to "or back in it
(blog#28, #75)". "Down 99%" in the title is #655's own "about 99%". No
internal detail: no ps-db issue numbers, paths, run ids, property names or
people but the author, and vendors only as "the firewall in front of the
site" and "ps·db's own analytics". ps·db's real game titles carry an em dash,
so the post says the title "ended in" its last words. Nothing records the
four checks' results (ps-db, its log, #655, #484), so the post says the
write-up has none and claims neither way. Each Google quote was matched
against its live page, and every link answered 200, on 31 Oct.

**Checks.** Red first: `no post with slug
google-stopped-showing-our-site-in-a-day in src/content/posts/` and `Now
does not name blog#75`. Plants in a scratch copy: 18 Jan and 09:00 dates
failed the date test; `draft: true` and `featured: true` the published
test; a link before ps·db's the product-first test; an em dash its test.
Now without blog#75 passed, since the Now test read the whole section and
its `Source:` note names blog#75 too. The test now reads Now's steps only,
and the same plant fails it. With the post dated 30 Oct, `npm run build`
made its page and OG image, and `npm run test:pages` passed 152 (2 giscus
tests skipped), the new post among them at desktop and 390 px. With the
real date the build leaves out both.

**Review fixes** (`code-review medium`, 10 findings). The post linked the
14 Oct post beside a figure (15 to 116 impressions) that post never gave;
it now quotes that post's own figure (position 40.1 to 16.2) and gives the
other to the 14 Oct check. The title said "overnight" for a fall inside one
hour; it says "in one hour", at 77 characters, and the description is 157.
"8 in the 5 days after" read against the post's 4-day windows; the line now
gives no window. The Now test's cut at `Source:` let a note renamed
`Sources:` or an intro line name the issue: plants of both passed. It now
reads only numbered steps and their indented continuation lines; both
plants fail it, a step wrapped onto a second line passes, and deleting the
continuation clause fails that case. The memory fragment described the leak
filter's private list in this public repo, so it is gone. Not changed: the
14 Oct post gets no update line yet, since the retitling is a suspect, not
a proven cause, and the link would point at a post not live until 19 Jan
(a follow-up on 19 Jan decides it). Metro 2039 is a real ps·db page.

## 2026-10-31 — blog#72, #73: two January posts

**What.** Two posts, a week apart after the 29 Dec post, at 07:00 UTC:

- `split-a-large-file-in-five-safe-steps.md`, 5 January: ps-db#634 to #642
  (PRs #635 to #643) took `routers/games.py` from 3,265 to 682 lines in
  five steps, then #647 to #650 (PRs #651 to #654) four more files. The
  spine is the guards that read a file by name and went blind after a move
  (PR #635, #643, #653), not the moves, which were byte-identical each time.
- `17-downloads-a-plan-before-more-code.md`, 12 January: vedlikeholdsloggen
  #261 and its `docs/brukere.md` (PR #262). 17 first-time downloads against
  300+, the 1 Oct funnel, the unread channels, the three steps.

Departures, both from the sources. blog#72's file name said "an 800-line
file", but the file was 3,265 lines and 800 is the limit, so the slug is
`split-a-large-file-in-five-safe-steps`. And three of blog#73's draft
headers mapped onto `brukere.md`'s own sections, the report tell the skill
names, so they were renamed as moments. The "code kept coming" wrong turn
comes from the 1.2 post's own dates (Hjemmet merged 3 and 5 Oct, after the
1 Oct funnel reading). blog#73's post was written before the 1 Dec reading,
and says so; Now 4 asks to add that reading before 12 Jan. STRATEGY.md's
Now went from six numbered items to an intro line and four items (three
December posts to an item), to fit both posts and blog#73's reader (indie
app makers) within 80 lines: the file is at 80 now, with no margin. `changes.d/68.md` is folded into
CLAUDE.md, with the list renamed `QUEUED`.

**Checks.** `tests/posts.test.mjs`: `DECEMBER` became `QUEUED` with both
posts, plus a test that each pin is 7 days or more after the one before.
Red first: `no post with slug split-a-large-file-in-five-safe-steps` and
`Now does not name blog#72`. The gap test passed at once, so it was broken
on purpose in a scratch copy: 12 Jan pinned as 13 Jan failed it (and the
date test). A post dated 6 Jan, a store link before the product's, and
`draft: true` each failed only their own test. A production build leaves
both posts out (future dates); a scratch build with past dates rendered
both, with their OG images.

**Review fixes** (`code-review medium`, 9 findings, all fixed). The gap
test was first written as exactly 7 days; a skipped week would then fail
it, while STRATEGY.md only says one a week at most, so it is now 7 or
more (a declared loosening: the exact date pins still hold). Plants: a
6-day gap fails it, a 14-day gap passes it. The Now test read a hand list
of issues; it now takes each issue from `QUEUED`, so it checks blog#60
too: Now without blog#60 fails it, and the old list would have passed.
The 12 Jan post said "No answer yet" and "is on 1 December" for dates that
are past by 12 Jan; it now says what was known on 31 October. Its title
said "No downloads" over 17; it says "Almost no downloads". Its decision
rule named impressions and judged shares; it now reads the shares first,
then the impressions count. The 5 Jan post said each step was "approved on
the first review" beside the gaps its reviews found; it now says the
workers' own reviews found them, and the executive approved each on its
first look.

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

**Review fixes** (`code-review medium`). The test now reads what the
content collections build: subfolders too, never a file whose own name
starts with `_`, and CRLF front matter. The repo check ignores case and
covers the `Hysas` owner. The first link skips images, and the product is
matched by host, not by prefix. Each fix has a scenario run on the old test
and the new: an em dash in `2027/x.md` (old: passed), a `_notes.md` with no
front matter and a CRLF post (old: 5 tests failed), links to `Hysas/ps-db`
and `Buildforge-Cloud/ps-db` (old: passed), an image before the product
link (old: failed), `ps-db.cloud.example.com` (old: passed). All seven are
right on the new test. The 22 Dec description said work stops at 90%; it
now says merges and Low work stop, and "morning", as the body does.

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

## CI gets the test browser without apt-get (#85)

`npx playwright install --with-deps chromium` in `ci.yml` runs apt-get, and a
dead apt mirror hung it 3 times on 2026-11-11 (decision 3428). The 3rd time,
run 43039293425, the job's 8-minute bound cancelled it, which held blog#84.

Picked the cache over the Playwright container. The container would run the
whole job in it, and the font-block step needs `sudo` and the runner's own
`/etc/hosts`, so that step would change. It is also a large image to pull
from another outside server on every run.

The first cut cached the browser and ran `--with-deps` on a miss. Its own
CI runs (43059194648, 43059782082) both missed and both hung in apt-get the
same day: `Temporary failure resolving 'azure.archive.ubuntu.com'`. The new
3-minute bound stopped the step with "has timed out after 3 minutes". So a
cache that apt-get must seed is never seeded while apt is down.

Now apt-get is out of the normal path. `ci.yml` reads the runner image
(`$ImageOS`, such as `ubuntu24`) and the `@playwright/test` version from
`package-lock.json`, and restores `~/.cache/ms-playwright` with
`actions/cache/restore` keyed on both. On a miss, `npx playwright install
chromium` downloads only the browser, from Playwright's own CDN. Then
`scripts/browser-libs.mjs` runs `ldd` on Chromium's binaries and runs
`playwright install-deps` (apt-get) only if a library is missing, or if it
could check nothing. The `ubuntu-latest` image ships Chrome, so the libraries
are normally there. `actions/cache/save` saves on a miss, after the page
tests pass, so only a browser that ran is cached.

Each of these steps has `timeout-minutes: 3`, so a hang names its step. The
restore and the save have `continue-on-error`: a stalled restore falls through
to the download, and a failed save does not fail the run. The save is a step,
not `actions/cache`'s post-job step, because a post step cannot take a bound.
`${{ env.ImageOS }}` would not work: the `env` context holds only the
workflow's own variables, so the image is read in a shell step.

A pull request's cache is visible only to that pull request. Before this,
every cache in the repo sat under `refs/pull/N/merge`, so each new PR started
cold. `ci.yml` now also runs on a push to `main`: its cache is visible to every
PR. GitHub evicts a cache nobody has read for 7 days; a PR that restores
`main`'s cache keeps it alive. `tests/workflows.test.mjs` pins the workflow
and `tests/browser-libs.test.mjs` the library check.

Measured on PR #86, run 43060909101. Attempt 1 missed: the browser download
took 9 s, the check printed "11 of 11 browser binaries checked: no library
missing.", and the cache was saved as `playwright-ubuntu24-1.63.0`. Attempt 2
restored it, skipped the download, ran no apt-get, and the job took 1m27s.
The save key is written out in full, not read from the restore's outputs: a
restore that timed out sets none.

## 2026-11-11 — the critical astro hole, and the high ones under it (#83)

The first weekly package scan (agent-orchestrator `alerts.py`, decision 3415)
found 41 open Dependabot alerts here: 1 critical, 16 high. The critical is
GHSA-26w7-cxv4-gfx2, remote code execution through astro's AVIF image
optimisation, fixed in astro 7.2.8. The worker's token gets HTTP 403 on the
Dependabot alerts API, so `npm audit` (the same GHSA advisories) was the
measure here.

`npm audit`, before → after: critical 1 → 0, high 9 → 0, moderate 10 → 11,
low 1 → 1. `npm audit --audit-level=critical` exited 1, and now exits 0. The
extra moderate is astro itself: its critical is gone, and two of its
advisories are left (below).

What changed in the lockfile:

- astro 7.2.0 → 7.2.9, `@astrojs/mdx` 7.0.5 → 7.0.8,
  `@astrojs/markdown-remark` 7.2.2 → 7.2.4. All three are inside major 7.
- brace-expansion, devalue, fast-uri, js-yaml, sharp, source-map-js, svgo, vite
  and zod went to their fixed patch or minor versions with
  `npm update <names>`.

Why not the newest astro (7.4.10): from 7.2.10 on, astro wants
`@astrojs/markdown-remark` ^7.3, and every `@astrojs/mdx` 7.x pins 7.2.x. So
astro 7.3.3, which clears its last moderate (GHSA-98hj-9722-w3j8, XSS in
JSX/MDX script and style content) and low (GHSA-mpr7-6m5w-76rw, CSS injection
in View Transitions), needs `@astrojs/mdx` 8. The issue allows a major update
only where the critical needs one, and the critical does not. For the same
reason, `npm audit fix` (without `--force`) stopped with ERESOLVE while
astro's range was `^`: it reached for astro 7.4.10. The self-review flagged
that `^7.2.9` keeps that trap, so astro is now pinned to exactly `7.2.9`, and
`npm audit fix --dry-run` resolves again (it shows astro as needing `--force`).

The built site: compared `dist/` before and after. With the content hashes in
asset names normalised, every HTML page is the same. The CSS gained `-webkit-`
prefixes (user-select, backdrop-filter, appearance, mask), which only Safari
reads. The JS changed in astro's ClientRouter (it now re-creates `<video>`
and `<audio>` on navigation) and in minifier output. Full-page Chromium shots
of a post and of /search/ are pixel-identical; the post's are in
`docs/plan/mockup/blog-83/`.

A side effect: the lockfile now has the two `@emnapi/*` entries that CLAUDE.md
says made `npm ci` refuse it, and `npm ci --dry-run` passed under npm 11.20.
That is a dry run on one npm, so CLAUDE.md's `npm install` advice stands until
a real `npm ci` (and npm 10) is tried.

New test: `tests/packages.test.mjs` (in `npm test`) holds each fixed
advisory's vulnerable range and fails when any locked copy, nested ones
included, is in it. It went red on the old lockfile for all ten packages. Four
mutations (range start, range end, prerelease order, nested copies) each
failed the test meant for them. A fifth test holds the astro pin while
`@astrojs/mdx` is on major 7; it went red on `^7.2.9`, and a mutation of its
cap failed it too.

## 2026-11-12 — #87: shared_checks 1.7.2

**What.** `python3 scripts/shared_checks.py update shared_checks 1.7.2`: the
pin tool and its pin, nothing else. Between the tags `shared_checks-v1.7.1` and
`-v1.7.2` the file changes only in its docstring (the adoption commands now
name check_secrets 2.0.0, secret_rules 1.0.0 and `--fetch`) and its
`__version__`. The README section at `shared_checks-v1.7.2` names no step
beyond `update` for a repo like this one.

**The gitleaks steps do not apply here.** 1.7.2 came with check_secrets 2.0.0,
where gitleaks does the scan, and the issue's comment lists five steps for it
(take `secret_rules`, `--fetch` gitleaks, and so on). blog pins no
`check_secrets`, `secret_rules`, `secrets` or `pre-commit`: its lock holds only
shared_checks, check_nginx_headers, css_tokens, nginx_rig and psi. So none of
the five was done, and no file was rescanned.

**A floor on the pin.** `tests/shared-checks.test.mjs` now also fails when a
part is pinned below the release `FLOORS` names. Today that is only
shared_checks, at 1.7.2. Before the bump it failed with `scripts/shared_checks.py
is pinned at 1.7.1, below its floor 1.7.2`. Versions compare as numbers: a
text compare passes `1.7.1` against `1.7.2` as it should, but fails `1.10.0`
against `1.7.2`, and the test's own case caught that mutation.

**Measured on a copy of the tree, with the main checkout's packages:** `node
--test tests/*.test.mjs`, 86 tests pass on `main` and 88 on the branch. The
names match, plus the two new tests. `python3 scripts/shared_checks.py` says
`OK: shared_checks 1.7.2, check_nginx_headers 1.0.0, css_tokens 1.1.0,
nginx_rig 1.1.1, psi 1.2.0`.

## 2026-11-12 — #89: shared_checks 1.7.5

**What.** `python3 scripts/shared_checks.py update shared_checks 1.7.5`: the
pin tool and its pin, nothing else. Between `shared_checks-v1.7.2` and `-v1.7.5`
the file changes in its docstring (the adoption commands now name
check_secrets 2.1.1 and secret_rules 1.1.0, and a move names every part a
scanner release brings) and its `__version__`. The floor in
`tests/shared-checks.test.mjs` moved from 1.7.2 to 1.7.5 first, and went red
with `scripts/shared_checks.py is pinned at 1.7.2, below its floor 1.7.5`.

**The release steps do not apply here.** The starter's README at
`shared_checks-v1.7.3`, `-v1.7.4` and `-v1.7.5` names one step beyond
`update shared_checks`: take the matching check_secrets (2.0.1, 2.1.0, 2.1.1),
secret_rules (1.0.1, 1.1.0) and secrets 2.0.0. All three releases are fixes to
that gitleaks scanner. blog pins none of those parts: its lock holds
shared_checks, check_nginx_headers, css_tokens, nginx_rig and psi, and the
repo has no `secrets.yml` or pre-commit hook. So no step was done, and no file
was rescanned.

**Measured on a copy of the tree, with the main checkout's packages:** `node
--test tests/*.test.mjs`, 88 tests pass, the same names as on `main`. `python3
scripts/shared_checks.py` says `OK: shared_checks 1.7.5, check_nginx_headers
1.0.0, css_tokens 1.1.0, nginx_rig 1.1.1, psi 1.2.0`. Two mutations of
`atLeast` in a scratch copy (equal counts as below; the last part ignored)
each failed `atLeast compares versions by number, not text`.

## 2026-11-13: #92: post on the secret scanner that skipped archive-like files

**What.** `src/content/posts/secret-scanner-skipped-files-that-looked-like-archives.md`,
queued for 2027-01-26 07:00 UTC, the week after blog#75's post. It tells
buildforge-starter PR #313 (check_secrets 2.1.0) as a story: the hole as
iso-pathfinder-buddy PR #29's self-review found it, why gitleaks 8.30.1
skipped the file, the padding idea #313 dropped, the read marker and the
one-byte retry, the last-line allowlist hole, and #313's two Known limits.
Neither private repo is named or linked. The post names ISO Pathfinder Buddy,
the public product, and links its public page first, so it is pinned in
`tests/posts.test.mjs`'s first-link test. `strategy/STRATEGY.md`: Now step 5,
and a Users line for readers who scan commits for leaked keys.

**Tests.** `tests/posts.test.mjs`'s `QUEUED` gained the post (and blog#93's),
red first with `no post with slug secret-scanner-...` and `Now does not name
blog#92`. The first-link test then caught the draft linking gitleaks before
the product. A date moved one day early turned `each queued post keeps its
date` red. STRATEGY.md hit 82 lines, so two wrapped lines were joined.

**Facts from outside PR #313**, read 2026-11-13: ps-db, vedlikeholdsloggen
and iso-pathfinder-buddy each closed their "Shared parts up to date:
check_secrets 2.1.0" issue on 2026-11-12 (#732, #282, #32), which the post's
last paragraph says.

**The queued posts are not measured by `npm run test:pages`.** A production
build leaves a future post out, so the contrast and CSP walk never opens it.
To measure them, both posts were dated 2026-11-13 for one build and one
`playwright test` run (184 passed, the two new pages included, desktop and
390 px), then given their queued dates back.

## 2026-11-13: #93: post on nightly database backups with a write-only key

**What.** `src/content/posts/nightly-database-backups-write-only-ssh-key.md`,
queued for 2027-02-02 07:00 UTC, the week after blog#92's post. Facts from
the two issues and PRs that #93 names: the weekly whole-server backup before;
dump, keep 14 days, send with rsync over ssh, NAS pull; the `rrsync -wo
-no-del -no-overwrite` key, one per app, and the NAS's read-only second key;
the runner's account not being the one with the route home, and the review
finding that its route ran a binary from the everyday user's home folder; the
default-branch guard; the fakes and the mutation counts (30 and 43); the
second worker stopping because the first workflow was not on the default
branch yet; the `.gitignore` `parts/` catch; the 12 Nov proof run. No repo,
app, host, user name, folder path or IP is in the post, and no word on how
the server reaches home (grepped).

**Facts from outside the two PRs**, read 2026-11-13 with `gh run list` and
`gh run view --log-failed`: both first scheduled nights started more than six
hours after their cron time, after the NAS pull. The first app's run was
green; the second's was red because its key was not made yet. A restore
drill PR for the second app merged on 2026-11-13. The post says both.

**Tests.** As in `92.md`: the post is in `QUEUED` and STRATEGY.md's Now
step 5, both seen red first. No first-link pin: the post has no product,
since both apps are private.

## 2026-11-14 — #91: shared_checks 1.10.3

**What.** `python3 scripts/shared_checks.py update shared_checks 1.10.3`: the
pin tool and its pin, nothing else. The floor in
`tests/shared-checks.test.mjs` moved from 1.7.5 to 1.10.3 first, and went red
with `scripts/shared_checks.py is pinned at 1.7.5, below its floor 1.10.3`.
`python3 scripts/shared_checks.py` then says `OK: shared_checks 1.10.3,
check_nginx_headers 1.0.0, css_tokens 1.1.0, nginx_rig 1.1.1, psi 1.2.0`.

**What 1.7.6 to 1.10.3 add.** Since 1.8.0 the pin check also refuses a
workflow job whose tests need gitleaks with no fetch before them; since 1.9.0
that check is a part of its own, `fetch_first`
(`scripts/secretslib/fetch_first.py`). The pin tool loads it only when the
lock pins `check_secrets` 2.0.0 or later (`runs_gitleaks`). Blog pins no
scanner, so the check does not run here and no `fetch_first` is needed.

**The release steps do not apply here.** The starter's README at every tag
from `shared_checks-v1.7.6` to `-v1.10.3` names steps beyond `update
shared_checks` only for repos with the scanner: `fetch_first`,
`check_secrets`, `gitleaks_pin`, `secret_rules` and `secrets`, and "a repo
whose scanner runs gitleaks takes" `fetch_first`. Blog pins none of them.

**Checked.** `node --test tests/*.test.mjs`: 88 of 88 pass, with the same 88
test names as on `main`. A one-line hand edit to the new
`scripts/shared_checks.py` fails "every shared part is the release its pin
names", and only that test.

## 2026-11-14 — #96: shared_checks 1.11.1

**What.** `python3 scripts/shared_checks.py update shared_checks 1.11.1`: the
pin tool and its pin, nothing else. The floor in
`tests/shared-checks.test.mjs` moved from 1.10.3 to 1.11.1 first, and went red
with `scripts/shared_checks.py is pinned at 1.10.3, below its floor 1.11.1`.
`python3 scripts/shared_checks.py` then says `OK: shared_checks 1.11.1,
check_nginx_headers 1.0.0, css_tokens 1.1.0, nginx_rig 1.1.1, psi 1.2.0`.

**What 1.11.0 and 1.11.1 add.** Since 1.11.0, `update` refuses `--into` for
every part another pinned file loads by its path (the scanner, its rules, the
pin tool, the hook, the pinned workflows and their parts), where 1.10.3 only
refused it for `scripts/secretslib/`. 1.11.1 names the newer scanner releases
(fetch_first 1.6.0, gitleaks_pin 1.3.1, secret_rules 1.8.0) in its adoption
commands and docstring. blog places four parts, and none is on that list, so
the pins hold where they are. blog pins no scanner part, so the README's steps
after `update` do not apply.

**Tests.** `node --test tests/*.test.mjs`: 88 of 88 pass, the same 88 test
names as a run on `origin/main`.

**Also.** Folded `changes.d/91.md` into CLAUDE.md's "Shared parts".

## 2026-11-15 — #98: shared_checks 1.11.4

**What.** `python3 scripts/shared_checks.py update shared_checks 1.11.4`: the
pin tool and its pin, nothing else. The floor in
`tests/shared-checks.test.mjs` moved from 1.11.1 to 1.11.4 first, and went red
with `scripts/shared_checks.py is pinned at 1.11.1, below its floor 1.11.4`.
`python3 scripts/shared_checks.py` then says `OK: shared_checks 1.11.4,
check_nginx_headers 1.0.0, css_tokens 1.1.0, nginx_rig 1.1.1, psi 1.2.0`.
Under the new lock, the 1.11.1 file is refused (`REFUSING:
scripts/shared_checks.py is not the release its pin names`).

**What 1.11.2 to 1.11.4 add.** The starter's README at the tags
`shared_checks-v1.11.2`, `-v1.11.3` and `-v1.11.4` changes in three places. It
names newer scanner releases in the adoption command (fetch_first 1.7.0 to
1.9.0, secret_rules 1.8.1). It describes the exit and `BASH_ENV` cases
fetch_first 1.8.0 and 1.9.0 now catch. And since 1.11.3, `update` refuses
`--into` for `runner_tools` too. blog pins no scanner part and no
`runner_tools`, and its `psi` stays in `tools/`, so no step beyond `update`
applies.

**Tests.** `node --test tests/*.test.mjs`: 88 of 88 pass, the same 88 test
names as a run on `origin/main`.

**Also.** Folded `changes.d/96.md` into CLAUDE.md's "Shared parts".

## 2026-11-16 — #100: shared_checks 1.13.1

**What.** `python3 scripts/shared_checks.py update shared_checks 1.13.1`: the
pin tool and its pin, nothing else. The floor in
`tests/shared-checks.test.mjs` moved from 1.11.4 to 1.13.1 first, and went red
with `scripts/shared_checks.py is pinned at 1.11.4, below its floor 1.13.1`.
`python3 scripts/shared_checks.py` then says `OK: shared_checks 1.13.1,
check_nginx_headers 1.0.0, css_tokens 1.1.0, nginx_rig 1.1.1, psi 1.2.0`.

**What 1.12.0 to 1.13.1 add.** The starter's README at the tags
`shared_checks-v1.12.0`, `-v1.12.1`, `-v1.13.0` and `-v1.13.1` changes only
in its secret scanner sections. 1.12.0 splits `fetch_first` into
`fetch_first` 1.10.0 and `shell_reader` 1.0.0. 1.12.1 names `secret_rules`
1.9.0. 1.13.0 refuses a lock that drops a part a pinned file names on a
`__needs__` line, pins `status`, `test_secrets` and `test_init_script`, and
says to run `check_secrets.py` once after a move. 1.13.1 adds
`gitleaks_run` 1.0.0 for `check_secrets` 2.5.0 and moves the scanner's
release notes to the starter's `docs/SECRET_SCANNER.md`. blog pins no
scanner part, and none of its pinned files has a `__needs__` line, so no step
beyond `update` applies.

**Tests.** `node --test tests/*.test.mjs`: 88 of 88 pass, the same 88 test
names as a run on `origin/main`.

**Also.** Folded `changes.d/98.md` into CLAUDE.md's "Shared parts".

## 2026-11-16 — #102: shared_checks 1.13.3

**What.** `python3 scripts/shared_checks.py update shared_checks 1.13.3`: the
pin tool and its pin, nothing else. The floor in
`tests/shared-checks.test.mjs` moved from 1.13.1 to 1.13.3 first, and went red
against main's pin with `scripts/shared_checks.py is pinned at 1.13.1, below
its floor 1.13.3`. `python3 scripts/shared_checks.py` then says `OK:
shared_checks 1.13.3, check_nginx_headers 1.0.0, css_tokens 1.1.0, nginx_rig
1.1.1, psi 1.2.0`.

**What 1.13.2 and 1.13.3 add.** The pin tool itself changes in two places:
since 1.13.2 a pin with no version is no release (1.13.1 took one and then
failed with a KeyError, buildforge-starter#416), and every `scripts/initlib/`
file loads at its own path (buildforge-starter#415). The starter's README and
`docs/SHARED_PARTS.md` between `shared_checks-v1.13.1` and `-v1.13.3` name
new releases of the secret scanner parts, the `initlib` helpers,
`security_scan` 1.0.1 (actions at a commit SHA, buildforge-starter#430) and
`project_layout`. blog pins none of those, so no step beyond `update` applies.

**Tests.** `node --test tests/*.test.mjs`: 88 of 88 pass, the same 88 test
names as a run on `origin/main`.

**Also.** Folded `changes.d/100.md` into CLAUDE.md's "Shared parts", with the
floor this PR sets.

## 2026-11-19 — #104: a post on eight weeks of a Claude Code agent team, and its LinkedIn draft

**What.** One post, 9 February 2027 at 07:00 UTC, the first free week after
the 2 Feb post (blog#93): `building-an-ai-agent-team.md`. It says in its
first lines that AI wrote it and that Stefan edited it. Its spine: the
agents' code was the fast part, and each failure it tells sat in what was
built around the code. Six failures, from the issue's Facts: the CPU burners
(26 Sep), the compose test that replaced live containers (7 Jul) and the
hook after it, the instructions file that grew back to 108 KB, the board's
3 workers against a cap of 2, the related-memory line that measured as
noise, and 31 "waiting on you" alarms in a day. The session-start note
(Facts item 5) was left out: the issue allows 4 to 6.

**Three Facts that did not match their source** (the executive's review of
the PR). The 31 alarms are guard.py's: a worker whose turn ended, or whose
prompt waited, for 10 min, told to the executive, not questions for
Stefan. Until agent-orchestrator#222 (closed 3 Oct) a worker whose PR
waited on Stefan's UI yes alarmed too, so some of the 31 may have waited
on him. The post now tells it as measured, says the executive's review
caught its first draft's reading, and no longer claims Stefan was the
slowest part; the LinkedIn draft drops it. The 43
and 51 min are metrics.py's dispatch to merge, not issue to merge, and are
labelled so. The send-backs are 2 rounds in each lane's last 10 merges,
not 2 merges.

One number beyond the issue's Facts, read on 2026-11-19: the executive's
instructions file is 133 lines and 11,999 bytes against a 12,000-byte cap
(`wc -c`, and agent-orchestrator's own pair test for the cap). "Clear of
zero" for the 8 Oct memory run rests on agent-memory's README, whose 95%
range is +11.6 to +23.7. The README also shows the replacement note's 19.6%
sat just under its 1 in 5 bar when it was kept, which the issue's Facts do
not point out. Running-text numbers were cut to the ones a section turns on;
the rest are in the post's dated list.

**LinkedIn draft.** `docs/linkedin/building-an-ai-agent-team.md`, 159 words
by `tests/linkedin.mjs`'s count (155 without the URL and the 3 hashtags).
Nothing posts it. Its link answers 404 until the post goes live on 9 Feb.

**Tests.** `tests/linkedin.test.mjs` checks the draft rules: 120 to 200
words, "AI" in the first paragraph, the post's URL as the last line, 3
hashtags at most, no em dash, a post with the file's slug. It ran red against
a stub first. `tests/posts.test.mjs` pins the post in `QUEUED` (red: `no post
with slug building-an-ai-agent-team`, `Now does not name blog#104`) and
checks its first three lines name AI and say "edited". 13 mutations, each
killed by the test meant for it. Then 2 for the empty-draft test: one
survived, because `lines[0] ?? ""` never changed a result, so the fallback
was removed.

**Self-review (`code-review medium`), fixed.** The weekly merge counts in the
Facts added up to 624 against a total of 623. Counted again from
agent-orchestrator's merge commits in Oslo-time ISO weeks, weeks 39 to 46
give 55, 82, 114, 68, 63, 96, 43, 77: week 45 is 43, not the Facts' 44.
With 43 the list sums to 623, so the post keeps 623. (It said "over 620"
for one commit, before week 45 was settled.) The LinkedIn draft said
"for eight weeks I have run", which is wrong on its February posting date,
so it now says "since late September". The send-backs line was ambiguous,
and the opening dated every number 18 Nov when one is from 19 Nov. The
draft check read slugs with a regex; it now reads the front matter as YAML,
skips drafts and `_` files, and takes CRLF (`publishedSlug`). An issue
number such as `#104` no longer counts as a hashtag. 7 more mutations, each
killed.

**Page check before merge.** In a scratchpad copy only, with the post dated
18 Nov, `npm run build` then `npx playwright test`: 180 passed, 2 skipped
(the giscus checks, rig only). The post's page met AA and the CSP at both
widths.

**Found, not changed.** `buildforge-cloud/invoice-scanner` is public
(`gh repo list`, 2026-11-19), so `CLAUDE.md`'s "the org's only public repo"
is no longer true.

## 2026-11-19 — #106: the journey post on 24 Nov, the queued posts a week later

**What.** Stefan's card 4371: publish the journey post (blog#104) next week,
and move the others back one week. `building-an-ai-agent-team.md` goes from
9 Feb 2027 to 24 Nov 2026, 07:00 UTC. The 11 posts queued from 24 Nov to
2 Feb each move 7 days later, so 2 Feb's (blog#93) is now 9 Feb. STRATEGY.md's
Now is regrouped by the new dates, and step 4's "before" dates follow their
posts (19 Jan for blog#73, 26 Jan for blog#75, 9 Feb for blog#93).

**Checks.** `QUEUED` in `tests/posts.test.mjs` now pins all 12 queued posts,
from 24 Nov on (it started at 8 Dec). Red first: `building-an-ai-agent-team`
was 2027-02-09, expected 2026-11-24. Every old date was grepped outside this
log: each hit is a new date or a reading date. The one link between queued
posts (22 Dec to 1 Dec) still points back in time.

**Not changed.** This log's older entries keep the dates they had when they
were written. Parked blog#81 and #82's next free date is now 16 Feb 2027 or
later.

## 2026-11-19 — #107: the agent-team story as a LinkedIn Article

**What.** `docs/linkedin/building-an-ai-agent-team-article.md`, the journey
post (blog#104) as a LinkedIn Article: headline "I ran Claude Code as a team
of AI agents for eight weeks" (56 characters), 1,070 words, 8 sub-heads,
paragraphs of 3 sentences at most, and a closing question. It uses only
facts and numbers from the merged post; each number is checked against it.
Its cover, `building-an-ai-agent-team-cover.png`, is a 1920 x 1080 text card
in the post's OG-image design, drawn by `scripts/linkedin-cover.mjs`.
`building-an-ai-agent-team.md` is now the Article's share text: 80 words,
the hook first, the same closing question, no URL. (Figures as of the
second round, below.)

**Research** (sources in the PR body). LinkedIn Help: a cover is best at
1920 x 1080, cropped to 16:9; the search title is cut at 60 characters and
the search description is the first lines, 140 to 160 characters. Articles
reached 0.69 times an average post's reach from March 2025 to February 2026
(AuthoredUp), because the feed shows a card that takes a click, so a short
share post carries the reach. A post shows about 140 characters on a phone
before "see more". 2026 guides: a sub-head every 200 to 300 words,
paragraphs of 2 or 3 sentences, 1,000 to 2,500 words, a closing question.
Link studies disagree (Metricool 2025: links gave 13.6% more interactions;
others report less reach), and hashtags are a minor factor.

**Voice check** (the issue's first step). Lines of the post that read as a
blog post, not as LinkedIn: the two relative links ("I wrote about [its first
day](/posts/the-bugs-were-in-the-brakes/)"), which break off the blog; the
three repo names (agent-orchestrator, agent-os, agent-memory), which mean
nothing to a reader there; the nine-line dated numbers list and the weekly
row "55, 82, 114, 68, 63, 96, 43, 77", a table on a phone; the confidence
range "-2.7 to +10.7"; "This post went the same way", about the post itself;
and the journal close "I wrote this on 19 November. The next step is mine".
The Article names what each tool does instead of its repo, keeps a few
numbers in the running text, links the post once for the full list, and
ends with a question.

**Checks.** `tests/linkedin.mjs` gains `articleProblems`, `shareProblems`,
`postText`, `pngSize`, `pngTitle`, `titledPng` and `coverProblems`;
`tests/linkedin.test.mjs` runs them on every `<slug>-article.md`, its cover
and its share text. Red against stubs first (17 tests, then 7 more for the
review fixes). 38 mutations, each killed by its own test.

**Review fixes** (`code-review medium`, 7 nits, all fixed). The cover holds
its headline in an iTXt "Title" chunk, and the test fails when it is not the
Article's headline, so a retitled Article needs a new cover. sharp reads that
chunk back, but it ignores a bad CRC, so each chunk's CRC is checked apart.
The number check skips a link's address and reads 1,000 as 1000. A numbered
or `*` list item counts alone, e.g., i.e. and vs. end no sentence, and a
paragraph glued to its sub-head is counted. The 160-character preview skips
link addresses. The cover script finds its files from its own path.
AGENTS.md's draft rules now say a draft beside an Article is its share text.
From the self-review checklist: an Article saved with CRLF reads as with LF,
and the real cover must end in IEND, so a write cut short fails.

**Second round** (the executive's review, changes needed). The first
Article was a re-cut of the post: 44 of its 82 sentences and 5 of its 7
sub-heads were the post's word for word (the review's count; the test's
sentence split counted 38), and the AI line took 60 of the 160 preview
characters, so the hook was cut before "see more". The Article is now new
writing from the post's facts, as lessons for LinkedIn readers: 1 of its 78
sentences is the post's, all 8 sub-heads are new, and it opens with a
109-character hook, then "Written by AI, edited by me." The share text
opens the same way. Rules added, red first on the old Article: 5 copied
sentences at most, no post sub-head, a hook of 140 characters at most and an
AI line of 40 at most right after it. The cover's headline went from 104 px
to 148 px and its byline from 44 to 60 px. Also from the review: a CRLF
headline loses its \r (`headlineOf`), and the PNG title code moved to
`scripts/png-title.mjs`, so the cover script no longer imports from
`tests/`. 48 mutations, each killed by its own test.

## 2026-11-20 — #111: the deploy pulls the newest base image

nginx 1.31.9 (2026-11-19) fixes 10 CVEs, 3 of them major. `deploy.yml` built
with `docker compose build` and no `--pull`, so the runner's cached
`nginx:alpine` and `node:22-alpine` stayed in use, and a fixed base image
reached the site only when the cache happened to miss. The build now has
`--pull` (buildforge-starter#455 did the same with `docker build --pull` in
its template). `up -d` keeps no `--pull`: it starts the image just built.

`tests/workflows.test.mjs` fails when a `docker compose build` line in the
deploy job lacks `--pull` as a flag of its own, and when the job has no build
line at all. Red first on the old line. A second test pins the checker: a
`--pull` on `up` does not count for the build, and `--pull=false` is not
`--pull`. Three mutations of the checker (a prefix match, a substring match,
no build-line filter) were each killed. No compose run and no load on the
host: the proof is the test, and the next deploy's log shows the pull.

From the self-review: the checker now also finds a build written with
global flags (`docker compose -f x build`), `docker-compose` or `sudo`, and
reads a command wrapped with `\` as one line. Red first, then six mutations,
each killed. Two risks stay, named in the PR's Known limits: with `--pull` a
Docker Hub outage at 07:05 fails that day's build (a cached base used to
carry it), and the floating `nginx:alpine` tag can now move on any deploy,
so a new nginx that rejects `nginx.conf` is met only by the health check,
after `up -d` has replaced the container.

Also folded `changes.d/107.md` into AGENTS.md: the LinkedIn Article rules
under "Writing a post", and the prettier call under "Building from a
worktree".

## 2026-11-20 — #82: a post on why ISO 27001 Buddy was built

`src/content/posts/iso-pathfinder-buddy-why-we-built-it.md`, queued for
2027-02-23T07:00:00Z. The issue asked for 2 Feb, one week after the Skredda
post (blog#81). Since then blog#106 moved the queue a week, and 2 Feb and
9 Feb now hold blog#92 and blog#93. Skredda has no post or date yet, so it
can take 16 Feb, the first free week, and this one is a week later.

The story is Stefan's answers on the issue (2026-11-10, and decision 4457):
why he built it, that nothing went wrong, that Lovable's speed surprised
him, and that he learned the standard by having to approve what the AI
built. He answered "later" to when it was built, whether it is still worked
on, and who uses it, so the post says nothing on any of those: no date, no
move off Lovable, no users or plans. A first draft took dates from the app's
own git history; the executive's review cut them, as facts Stefan had not
given. The post names the app ISO 27001 Buddy (the review's call); its slug
keeps the issue's file name.

The post links the Lovable host at its root (the issue's default for
question 5) and `/roadmap` as the deep link. The app also serves at
iso.buildforge.no. Which host the blog should name is for Stefan:
`about.md`, the blog-post skill, the blog#92 post and this one all name the
Lovable host today.

Tests: the post joins `QUEUED` and "a product post links its product
first" in `tests/posts.test.mjs`, and STRATEGY.md's Now step 5. Red first
("no post with slug iso-pathfinder-buddy-why-we-built-it", "Now does not
name blog#82"). A mutation (Lovable's own site as the first link, the date on
16 Feb) failed both tests. A build of the scratch copy, with the post dated
in the past, gave the page and its OG image.

## 2026-11-19: the LinkedIn Article, rewritten as a journey for cold readers (#109)

**What.** `docs/linkedin/building-an-ai-agent-team-article.md` is new
writing, not an edit of blog#107's: four stages (one agent per project with
Stefan in the middle; a lead agent; one reviewer for the team; his part now),
then the pros and the cons, each with what it means for a reader who wants to
try it. The headline is now "From solo work to a team of AI agents: pros and
cons", so the share text and the cover changed with it. On the rebase onto
main, `changes.d/111.md` (blog#111's `--pull`) was folded into `AGENTS.md`
and removed; main had already folded blog#107's.

**Why.** Stefan, card 4421 (decision 4424): the Article must read "with no
prior knowledge or context information about the setup". Board chat
(decision 4425): it should describe a journey and the pros and cons overall,
not single deliveries.

**New rules.** `articleProblems` fails on an in-house word (the issue's list,
plus worktree and the three tool repos' names), a day with its month or an
ISO date, and more than 5 different numbers; `shareProblems` on an in-house
word. RED first: the old Article failed with `31 numbers, not 5 or fewer`, 11
dates and 5 in-house words; the old share text with `an in-house word:
"worker"`. 28 mutations of the new clauses, each killed by its own test, read
from the TAP output. Gate: 146 node tests pass.

**Measured, not tested.** The rules cannot see what a stranger cannot follow,
so each round went to a fresh subagent given only the two texts. 9 rounds
listed 29, 15, 9, 13, 10, 10, 8, 6 and 0 items. The rise in round 4 came
after round 3 answered with more detail; cutting detail (two first-day bugs,
a memory feature, a review median) is what brought it down. The executive's
review then found that the thousands of decisions were credited to the
questions alone, where the post says cards and logged decisions. That line
now names both; rounds 10 to 12 read the changed text and listed 1, 1 and 0
items. A second review asked for the post's subject back (the lead agent put
the decisions in front of Stefan; about 1,220 were his). Rounds 13 to 16
listed 2, 3, 1 and 1 items, each on that line, and the executive chose a
rewording. Round 17 still listed one item on it: decisions already made
cannot be "put in front of" him. That item stands; the lists are in the PR
body.

**The cover.** The new headline wrapped to 4 lines at the script's 148 px,
with "cons" alone on the last. Two shorter headlines were drawn in the
scratchpad copy first; both fit in 3, and the one in use is 52 characters.
