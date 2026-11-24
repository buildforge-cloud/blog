---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-01-12T07:00:00Z
title: "Letting an AI agent refactor a large file: 3,265 lines split in five safe steps"
slug: split-a-large-file-in-five-safe-steps
featured: false
draft: false
tags:
  - ps-db
  - refactoring
  - directing-ai
description: AI agents split ps·db's 3,265-line games router under 800 lines in five pull requests, with every page byte-identical. Moving the code was easy to prove safe. The trouble was tests that checked one file by name and stopped seeing the code that left it.
---

The first step of the split was done, and the tests were green. Then the AI
agent that did it reviewed its own pull request and saw a possible gap. To
check it, the agent planted a bug in the code it had just moved: it read a
database column directly. That column says whether a game is out yet, and the
app's rules say to read it in one place only. A guard test exists to forbid
exactly that. The guard stayed green.

Nothing in the site had broken. The guard only read the folder the code had
just left.

## A 3,265-line file

The app is [ps·db](https://ps-db.cloud), my PS5 game database. Its backend had
one file, `routers/games.py`, of 3,265 lines. A tool of my own that watches my
repos marks any source file over 800 lines red, and I had said to fix every
red one. By that tool's count, AI agent work on ps·db's six files over the
limit had cost about $123 in 30 days.

Most of `games.py` was not routing. About 1,800 lines built the HTML that
search crawlers and link previews get, plus the sitemap. Another 640 or so
(723, counting the helpers that went with it) served the similar games, the
row of related games under a game page like [Elden
Ring's](https://ps-db.cloud/games/elden-ring).

The work was done by AI agents, each a Claude Code session. A worker takes one
GitHub issue, does it, and opens a pull request. Another session, which I call
the executive, reviews each pull request, runs the checks again and merges it.
I decide what goes in the queue.

I didn't want one big pull request. Each step would be its own issue and its
own pull request, touching at most four source files, and no change in what
the site does:

1. The helpers that write the preview text: titles and descriptions.
2. The functions that build the preview HTML from that text.
3. The functions that pick and fill the preview for each URL.
4. The sitemap, `robots.txt` and `llms.txt` (a site summary for AI tools).
5. The similar games, to a new `routers/similar.py`.

The next issue was written only after the last pull request had merged. So
each issue could carry the notes from the review before it: a stale comment, a
constant in the wrong module.

## The easy part to prove

`games.py` kept a re-export of every name that left it. About 25 test files
import from it, and none of their imports had to change. Each step started
with a new test that imported the moved names from their new home and checked
that each was the same object `games.py` still exports. It failed first, while
the new module was missing or empty. Then the code moved.

The real proof was comparing what the app sends back: its pages and API
responses. In step 1 only the executive did that. From step 2 on, the worker
did it too: it saved the pages and responses the moved code serves, on the
test data, before and after the move, and compared them byte for byte. Then it
changed one letter or one word in the moved code and ran the comparison again,
to see it fail. If it can't fail, the comparison shows nothing.

- Step 2, the preview HTML: 76 pages, all identical. One planted letter, in
  the function that builds 6 of those pages, made exactly those 6 differ.
- Step 5, the similar games: 1,064 responses, all identical, headers included,
  and the API schema too. One planted word made 60 differ.

Each worker reviewed its own pull request before handing it in, and that is
where the gaps below were found and fixed. Then the executive ran its own
comparison on each step and approved every one on its first look. All five
merged on 28 October, between 07:13 and 11:20 UTC.

## Guards that watch a file by name

ps·db has two rules about its data. One column says whether a game is out yet,
and the code must read it in one place only. Another holds the hours it takes
to beat a game. Some of those are not believable, so the code must read it
through a helper that filters them. Each rule has a guard test that reads the
source code and fails on a direct read of its column.

The release-status guard read only the files in `routers/`. Step 1 moved code
to `preview_text.py`, outside `routers/`. So a direct read there passed. The
fix was a new test beside the old guards: one scan over every module in the
app, for both columns, skipping only the file where each column may be read.

The same review found a second blind spot. Two copies of a name can drift
apart, so a test checked that no moved name was defined again in `games.py`.
But it skipped assignments that unpack a tuple, so `TOP_GAMES_PREVIEW_LIMIT,
_unused = 24, 0` passed it. That was fixed too.

In step 5 the guard problem came back. The old hours-to-beat guard still read
`games.py` only. Step 5 moved the function that turns a game into its list
entry over to `routers/similar.py`. A planted direct read there was caught by
the new scan, but the old guard, the one written for that rule, passed it. Now
the old guard reads every router too.

Step 3 had a cousin of this. A test froze the clock by patching `datetime` in
the games router, so the coming-soon page, which groups upcoming games by
release date, would be built from a fixed date. That page now read the clock
in its new module, so four tests failed: they got the real date. The fix
patched the new module. The review then noticed the fix had replaced the old
patch rather than added to it, so another route's clock was no longer frozen.
Now it patches both.

Each of these was a test that looked for code in a fixed place. The clock test
at least went red. The others kept passing after the code had moved out of
them.

## Four more files, the same shape

After `games.py`, four more files went under 800 the same way, each in its own
pull request: code moved out to new files, the old file re-exporting it,
answers compared before and after.

- `frontend/src/lib/api.ts`, 1,112 lines. Every test was green after the first
  try. But the build changed: the page now preloaded 13 scripts instead of 7,
  so a first visit downloaded more. Re-exporting the moved code from `api.ts`
  by name didn't fix it, and neither did importing straight from the new
  files. Moving all the code out did, into three new files, with `api.ts` left
  as nothing but re-exports. It is 28 lines now, and a test fails if it gets
  code of its own.
- `ingest/clean.py`, 996 lines, to 568. It is part of the code that takes in
  game data. Running every recorded input through it gave the same output, 3.6
  MB, byte for byte. One changed byte in a moved function made 55 fields
  differ. The review found that a new test, meant to catch two modules
  importing each other in a loop, missed three ways of writing that import.
- `routers/meta.py`, 891 lines, to 748. In this split the worker caught the
  problem while moving the code. One test of the search filters looked up the
  routes to check in `meta.py`'s router. After the move it would have passed
  and quietly stopped checking the endpoint that lists games by release
  window.
- `similarity.py`, a separate module from the `similar.py` router, 1,168
  lines, to 776. 2,052 saved answers, 16 MB, with 0 differences. It was
  rebased twice onto the other splits, and compared again after the last one.

## The order I'd use again

The numbers, from the nine pull requests of 28 to 30 October:

- `routers/games.py`, at the start and after each step: 3,265, 2,810, 2,170,
  1,490, 1,405 and 682 lines.
- Step pull requests: 5, every one approved on the executive's first look.
- Byte-identical answers in the largest step: 1,064 of 1,064.
- Old guards that would have stayed green on code they no longer saw: 3. The
  release-status guard in step 1, the hours-to-beat guard in step 5, and a
  search filter test in the `meta.py` split.

For a big refactor with agents, I would work in this order again. I'd keep the
steps small and merge each one before writing the next. I'd compare real
answers before and after, and plant a change to prove the comparison can fail.
And after each move I'd check every test that finds its code by file name,
because those can stop seeing the code and still pass. That last check belongs
in the plan before step 1, not left for each step's review to find.

The plan also named a sixth step. `games.py` was under 800 after five, and
when I last checked, on 24 November, step 6 had no GitHub issue yet. It is
still needed. To stay within the files its issue listed, step 5 put two
helpers the games routes use into `routers/similar.py`, so the games router
now imports from the similar-games router. That is backwards, and after step 5
`similar.py` had only 22 lines left under the limit. Step 6 gives those
helpers a home of their own. It has no date yet.
