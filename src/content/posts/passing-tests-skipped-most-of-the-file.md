---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-12-15T07:00:00Z
title: "Passing tests that never read most of the file: a comment-stripping regex bug"
slug: passing-tests-skipped-most-of-the-file
featured: false
draft: false
tags:
  - ps-db
  - testing
description: Five of ps·db's tests read App.tsx as text, through a regex that strips comments. A /* inside a // comment hid 1,085 of its 1,423 lines, and every test passed.
---

Line 122 of my app's main file is a comment. It says there is no
`*Query/*Pulse` state to go with a filter. For two of my tests, everything
from that comment down to line 1206 did not exist.

The app is [ps·db](https://ps-db.cloud), my PS5 game database. The file is
its `App.tsx`, 1,423 lines of React. The tests passed the whole time.

## Tests that read code as text

Some of ps·db's tests don't run the frontend at all. They are Python tests
that open the source files and read them as text, looking for a shape.

The one this started with is a guard. When I ship a new version, a visitor
with the old page open can ask for a piece of JavaScript that no longer
exists. If the page loads that piece with a bare `import()`, the page can go
blank.
So every lazy load has to go through a wrapper that handles a missing piece,
and a test reads the code and fails on any bare `import()` or `lazy(` it
finds.

A comment that says "never call `import()` here" should not fail that test.
So the test strips the comments first. It did that with two regular
expressions. The first took out every `/* ... */` block. The second took out
every line that starts with `//`.

The order is the bug. The comment on line 122 starts with `//`, but it holds
`*Query/*Pulse`, and that has a `/*` in the middle. The first regex doesn't
know it is inside a line comment. It sees `/*` and looks for the next `*/`.
That was at the end of a real block comment, on line 1206.

So the test read lines 1 to 121 and 1207 to 1423. The 1,085 lines in
between, 810 of them code, were gone before any check looked. A bare
`import()` anywhere in them would have passed. The same thing hid 31 lines of
a filter component.

## Found in a copy

Nobody found this by looking at ps·db. I was moving the guard into my
starter template, so new projects get it from day one. The AI review of the
starter's version flagged its stripper: a `/*` inside a `//` comment hides everything up to
the next `*/`. Then it said the part that made me stop. The same stripper in
ps·db hides 1,084 lines of App.tsx today. (The fix counted 1,085, from line
122 to 1206 with both ends in.)

The starter already had a stripper that gets this right. Its docstring names
an earlier bug of the same kind in another project of mine. So I had fixed
this class of bug once. ps·db's tests still used the two-regex pair, and they
kept passing, so nothing pointed at them.

## Proving the whole file is read

The fix is one pass over the text, in the order things come: strings, regex
literals, `//` comments and `/* */` blocks. A `/*` inside a line comment is
part of that comment, and a `//` inside a string is part of the string. A
comment turns into spaces, not nothing, so the line numbers stay and the
words on either side stay apart.

A new stripper is easy to test on small inputs. `// see /* here` and then an
`import('x')` on the next line: the old code lost the import, the new one
keeps it. What I wanted was proof that the tests now read every file to its
end.

The agent found a neat one. ps·db's TypeScript settings turn on
`noUnusedLocals`, so the build fails on any import the code never uses. That
means every name a file imports shows up again somewhere in its code. So the
test strips each file, lists its imports, and looks for each name in what is
left. A name that is imported and never seen again is code the stripper ate.

On the old stripper it named 52 imports in App.tsx. On the new one, none. The
review then checked the new stripper against the TypeScript parser's own
comment positions, over all 256 files in the frontend's source. Not one character of
code was blanked, and not one comment character was kept.

The automated review of that pull request read nothing. At its lowest level
it skips test files, and the whole change was a test file. The agent said so
in the pull request and read the diff by hand.

## Three more, and nothing was hiding

The first fix covered two tests: the guard and a second one that shares its
reader. The pull request also measured five other text tests that strip
comments the same way. Three of them hid the same App.tsx lines: one that
checks every empty state offers a way out, one that checks a request for games
named by slug also says which release status it means, and one that protects
the frontend's own test setup.

They moved to the shared stripper the next day, 27 October. Each got a check
that it can see something deep in App.tsx. For the empty states that is the
text "No games match your filters", on line 985. All three checks failed on
the old strippers, as they should.

Then the full read found nothing. No bare `import()` had been hiding, and no
empty state without a way out. The counts were the same before and after. So
these tests had passed and been right, but only by luck. They could
not have caught a mistake in three quarters of the file they were written to
guard.

It is the same lesson as the [mutation testing
run](/posts/ai-written-tests-mutation-testing/), from another side. There the
tests ran the code and didn't look at the result. Here they looked hard, at a
file that was mostly missing.

## What I look for now

The numbers, from the pull requests of 26 and 27 October:

- App.tsx: 1,423 lines. Hidden: 1,085, from line 122 to 1206. 810 of them
  code.
- Test files whose stripper hid those lines: 5.
- Imports the whole-file check named on the old stripper: 52.
- Real misses found once the whole file was read: 0.

What I check now in any test that reads source as text:

- A comment stripper made of more than one regex. Each pass can eat what the
  other one was meant to protect.
- A test with no check that it saw the end of the file. A name from deep in
  the file, asserted on, catches this.
- Imports that never appear in the stripped code, where the compiler already
  forbids unused ones.

The new stripper still guesses. It is not a real JavaScript parser. The
review named the shapes that would fool it, and none is in the code today.
JSX text with `/*` in it, like a path written as `/games/*`, would open a
block. A lone `'` in JSX text, as in "the '90s", would start a string. It
suggested a cheap fix, ending a quoted string at the end of its line, and
called it hardening for later, in ps·db and the starter both.
