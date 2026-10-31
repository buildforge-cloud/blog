---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-01-05T07:00:00Z
title: "Letting an AI agent refactor a large file: 3,265 lines split in five safe steps"
slug: split-a-large-file-in-five-safe-steps
featured: false
draft: false
tags:
  - ps-db
  - refactoring
  - directing-ai
description: AI agents split ps·db's 3,265-line games router under 800 lines in five pull requests, with every page byte-identical. Moving the code was the easy part. The tests that watched a file by name were not.
---

The first step was done, and the tests were green. Then the review of the
agent's own pull request named a gap, and the agent planted a bug to check it.
It put a raw read of a database column into the code it had just moved, the
kind of read a guard test exists to forbid. The guard stayed green.

Nothing had broken. The guard just wasn't looking any more.

## A 3,265-line file

The app is [ps·db](https://ps-db.cloud), my PS5 game database. Its backend
had one file, `routers/games.py`, of 3,265 lines. My agent setup marks any
file over 800 lines red, and I had said to fix every red one. By my tools'
count, agent work on ps·db's six files over the limit had cost about $123 in
30 days.

Most of `games.py` was not routing. About 1,800 lines built the HTML that
crawlers and link previews get, plus the sitemap. Another 640 or so served the
similar games, the rail under a game page like
[Elden Ring's](https://ps-db.cloud/games/elden-ring).

I didn't want one big pull request for that. Each step would be its own issue
and its own pull request, at most four source files, and no change in what the
site does. The next issue was written only after the last one had merged.
So each issue could carry the notes from the review before it: a stale
comment, a constant in the wrong module.

## The easy part to prove

Moving the code turned out to be the part that was easiest to prove.

`games.py` kept a re-export of every name that left it. About 25 test files
import from it, and none of them had to change. Each step started with a new
test that imported the moved names from their new home and checked that each
one was the same object `games.py` still exports. It failed first, while the
new module was missing or empty. Then the code moved.

The real proof was comparing answers. The agent saved the pages and responses
the moved code serves, on the test data, at the old commit and the new one,
and compared them byte for byte. Then it changed one letter in the moved code
and ran the comparison again, to see it fail. A comparison that can't fail proves nothing.

- Step 2, the preview HTML: 76 pages, all identical. One planted letter made
  exactly the 6 static pages differ.
- Step 5, the similar games: 1,064 responses, all identical, headers
  included, and the API schema too. One planted word made 60 differ.

Each worker reviewed its own pull request before handing it in, and that is
where the gaps below were found and fixed. Then my executive session, which
reviews the workers' pull requests, ran its own comparison on each one. It
approved every step on its first look. All five merged on 28 October, between 07:13 and 11:20 UTC.

## Guards that watch a file by name

So where did the planted bug in step 1 slip through?

ps·db has two rules about its data. One column says whether a game is out
yet, and the code must read it in one place only. Another holds the hours to
beat a game, and some of those are not believable, so the code must read it
through a helper. Each rule has a guard test that reads the source and fails
on a raw read.

The release-status guard read only the files in `routers/`. The code that
moved to `preview_text.py` was not in `routers/` any more. So a raw read in it
passed. The fix was a new test beside the old guards: one scan over every
module in the app, for both columns, with each rule's own home left out.

The same review found a second blind spot. A test checked that no moved name
was defined again in `games.py`. An assignment like
`TOP_GAMES_PREVIEW_LIMIT, _unused = 24, 0` passed it, because the check
didn't read tuples. That one was fixed too.

I thought that was the end of it. In step 5 it came back. The old
hours-to-beat guard was still there, and it read `games.py` only. Step 5 moved
the function that turns a game into its list entry over to
`routers/similar.py`. A planted raw read there failed the new scan and passed
the old guard. Now the old guard reads every router.

Step 3 had a cousin of this. A test froze the clock by patching `datetime` in
the games router. The coming-soon page now read the clock in its new module,
so four tests failed: the bands were built from the real date. The fix patched
the new module. The review then noticed the fix had replaced the old patch
rather than added to it, so another route's clock was no longer frozen. Now it
patches both.

None of this broke the site. Every page was byte-identical at every step. What
broke was the safety net. A test can stay green because it is right, or
because it is reading a file the code just left.

## Four more files, the same shape

After `games.py`, four more files went under 800 the same way: one block out
to a new file, the old file re-exporting it, answers compared before and
after.

- `frontend/src/lib/api.ts`, 1,112 lines. Every test was green after the
  first try. But the build changed: the page now preloaded 13 scripts instead
  of 7. Named re-exports and direct imports didn't fix it. Making `api.ts` a
  file of nothing but re-exports did, with the code in three new files. It is
  28 lines now, and a test fails if it gets code of its own.
- `ingest/clean.py`, 996 lines, to 568. A replay of every recorded entry gave
  the same output, 3.6 MB, byte for byte. One changed byte in a moved function
  made 55 fields differ. The review found the new no-cycle test passed three
  ways of writing the import it was meant to catch.
- `routers/meta.py`, 891 lines, to 748. Here the agent saw it while moving:
  one facet test would have passed and quietly stopped probing the
  release-window endpoint, since it read its routes from `meta.py`'s router.
- `similarity.py`, 1,168 lines, to 776. 2,055 saved answers, 16 MB, with 0
  differences. It was rebased twice onto the other splits, and compared again
  after the last one.

## What I'd keep

The numbers, from the pull requests of 28 to 30 October:

- `routers/games.py`: 3,265, 2,810, 2,170, 1,490, 1,405, 682 lines.
- Step pull requests: 5, every one approved on the executive's first look.
- Byte-identical answers in the largest step: 1,064 of 1,064.
- Old guards that would have stayed green on code they no longer saw: 3. The
  release-status guard in step 1, the hours-to-beat guard in step 5, and a
  facet test in the `meta.py` split.

For a big refactor with agents, what I'd do again is the order. Small steps,
each one merged before the next is written. A comparison of real
answers before and after, and a planted change to prove it can fail. And
after each move, a check on every test that finds its code by file name,
because those are the ones that go blind without going red. That last check
belongs in the plan before step 1, not left for each step's review to find.

The plan had a sixth step. `games.py` was under 800 after five, and when I
wrote this at the end of October, step 6 had no issue. It is still needed. To
stay inside the files its issue named, step 5 put two helpers the games
routes use into `routers/similar.py`, so the games router now imports from the
similar-games router. That is backwards, and `similar.py` has 22 lines left
under the limit. Step 6 gives those helpers a
home of their own. It has no date yet.
