---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-11-24T07:00:00Z
title: "Do AI-written tests test anything? What mutation testing found"
slug: ai-written-tests-mutation-testing
featured: false
draft: false
tags:
  - ps-db
  - testing
  - directing-ai
description: Coding agents wrote ps·db's backend tests, test first. A mutation testing run found 2,080 code changes they let through, after a first run said none did.
---

The first mutation run said every mutant was killed. 100 out of 100. Each
one took about 12 seconds, for tests that ran in under a second all
together.

I wanted that number to be true. It was not.

## Why I asked

[ps·db](https://ps-db.cloud) is my PS5 game database. Its backend is Python,
and AI agents write the code and the tests. They are told to work test first:
a test that fails, then the code that makes it pass. On 23 October, 2,318
backend tests passed.

Another project of mine had started a weekly mutation run, and it found 15
gaps in a codebase that was also written test first. So I asked why ps·db had
none.

A mutation tool makes small changes to the code, one at a time. A `>=`
becomes `>`, an `or` becomes `and`, a string becomes `"XXXX"`. Each change is
a mutant. Then it runs the tests. If a test fails, the mutant is killed. If
every test still passes, the mutant survived, and a real bug of that shape
would get through too. The tool here is
[mutmut](https://github.com/boxed/mutmut).

## The 100 that were not killed

mutmut copies the code into a folder of its own and runs the tests from
there. About 50 of ps·db's test files find the repo by their own path, so they
broke from the copy. The agent pointed the tests back at where they live.
Then mutmut handed pytest test ids that, from its folder, pointed at nothing.
pytest found no such tests and stopped with an error. mutmut counts any
failure as a kill, a usage error too.

So the first answer was a perfect score from tests that never ran. The 12
seconds each was the clue. The agent fixed the ids, and the same mutants then
ran at about 12 a second.

Since then, a change to that set-up has one rule: prove one kill and one
survivor by hand before trusting a count. A kill must fail on an assert, not
on an error.

## 2,080 survivors

The real first run made 11,043 mutants. 2,080 survived. Another 1,452 sat in
code that no test runs at all.

The worst share was in a data rule. It reads IGDB's multiplayer data for a
game and gives it tags like Co-op and Local Multiplayer. 60 of its 66 mutants
survived. One of them turned the `or` in the online co-op check into `and`.
No test called that function directly. The tests that reached it through
another function killed 6.

The report also lists the 10 functions with the most survivors. Second on
that list was the function that cleans one game record from IGDB. 110 of its 221 mutants survived. Its tests checked the tags, the scores
and the release flags. The rest of the game could be lost or renamed and
nothing would fail: the developer and publisher, the summary, the cover, the
screenshots, the videos. Even the title and the slug.

So the tests ran the code, and mostly did not look at what came out.

## Tests that were true and thin

The fixes were tests too, written by agents. They took real records from
a copy of the catalogue: [Hades](https://ps-db.cloud/games/hades--1), Dead
Space, It Takes Two, Gran Turismo 7. Each new test had to fail first against
the mutants it was meant to kill.

The multiplayer rule went from 60 survivors to 1. The one left can't be told
apart from the real code by any input, so it stays. In the cleaning function,
110 went to 0.

The cleaning work also caught a gap from the round before. The multiplayer
rule reads several rows per game, one for each platform. Its test had two
rows, and the PS5 row came last. That row alone makes all three tags. So a
bug where only the last row counts would pass. The same two rows in the
other order catch it. A test with the right data in one order only was true,
and still too thin.

## The function that looked like set-up

Number one on that list was the `main` of the script that pulls data from
RAWG, a second game database. 111 of its 240 mutants survived. The report
shows each function's first survivor, and here that was the line that sets
up the command-line help.

An agent wrote the next step from that. Its first draft called the function
command-line set-up and picked another one to test. The body of that
function is the opposite of boilerplate. It decides what happens when RAWG is
down halfway through a run.

That logic exists because of August. A RAWG pass was cut short by an outage,
and the data file lost the RAWG scores and play times for about 2,780 games.
The live database was never touched. The rule since then: a cut-short run
fails, or it keeps the old values and says so. It never ships a half-empty
file.

The new tests found one real hole there. When the matching pass hit an
outage, the old test checked `code != 0`. In Python, `SystemExit(None)`
passes that check, and the process still exits 0. So the mutant that ended
the run with no error code survived. The workflow that runs the weekly refresh
would have gone on to its next step. Now the test checks the exact message.

111 survivors became 34. All 34 are changes nobody can see. 28 only change
the wording of a help line. The other 6 give the same result another way,
such as an indent in a JSON file that nothing reads byte for byte.

## What the agent's own tests got wrong

The agents' new tests were not clean on the first try either. One reads the
script's `--help` output and checks that each flag has a line. The help text
wraps to the width of the terminal. At 2 of 161 widths, a wrapped line
started with a flag name, and the test read it as a flag. The code review
caught it, and the test now sets the width.

The pull requests were also checked by a review that broke the code by hand
and ran the new tests against it. For the RAWG script, 4 of its 5 hand-made
mutants had survived the old tests. All 5 failed the new ones. The review did
not run the full mutation count again. That count comes from the agent that
wrote the tests.

## What I check now

Not every survivor is a gap. A help line in another case is the same program.
But the gaps I found had shapes I can look for:

- An exit checked with `!= 0`. `SystemExit(None)` is not zero, and it still
  exits 0.
- Rows in only one order. If the last one decides the answer, a "last row
  wins" bug passes.
- A test that calls a function and checks one field of what it returns.
- A mutation report taken at its word. Mine said 100 of 100 before it had
  run a single test.
- A function judged by its first line. The first survivor said "help text",
  and the body held the outage logic.

mutmut can't see everything. It skips decorated functions, so ps·db's API
route handlers are not mutated, only the helpers they call. And code that only
runs when the app starts reads as survived, every mutant of it.

On 24 October, three functions from the report had their new tests. The
next one down the list builds a preview of the coming-soon page, and 101 of
its 198 mutants are still alive.
