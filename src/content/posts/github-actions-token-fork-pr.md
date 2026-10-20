---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-11-17T07:00:00Z
title: "Fork PRs and GITHUB_TOKEN: why unsetting it was not enough"
slug: github-actions-token-fork-pr
featured: false
draft: false
tags:
  - infrastructure
  - security
description: My GitHub Actions secret scan runs a pull request's own code. Taking GITHUB_TOKEN out of that step looked safe. It was not, because an earlier step can run code inside every later step through GITHUB_ENV or GITHUB_PATH. The fix keeps the token only in steps before any checked-out code runs.
---

The fix looked finished. The step that ran the scanner no longer had the
token. Python dropped it from its own environment, the shell unset it before
the scanner started, and the checkout left no token in `.git/config`. A test
planted a scanner that printed `GITHUB_TOKEN`, and it found no token.

The code review said I was looking at the wrong step.

## A scanner a stranger can rewrite

My starter template ships a secret scan: a GitHub Actions workflow that runs
on every push and pull request and looks for things shaped like API keys, in
the files and in every commit. The scanner is a Python script in the repo.
Each project that runs the scan pins its copy of the workflow and the script
to a release of the starter, so a fix reaches them with a version bump.

The workflow also uses the job's `GITHUB_TOKEN`. On a push to the default
branch it asks GitHub's API which commit the last successful scan read, so it
can read every commit since then. The token can only read: `contents: read`
and `actions: read`.

On a pull request, the checkout is the pull request's code. So the scanner is
whatever the pull request says it is. From a fork, that is a stranger's
script. Running it is fine. It is a scan, and a job with no token has nothing
to give away. Running it next to the token is the problem.

Until 20 October the token sat in the step that ran the scanner, on every
event. The review of [ps·db](https://ps-db.cloud), my PS5 game database, named
that as a known limit when ps·db took the pinned workflow. ps·db cannot edit
its pinned copy, so the fix went back to the starter.

## The step before

The first fix is the one at the top of this post. An agent wrote it and a
test passed.

The code review asked what runs before that step. The answer was the tree
scan, which runs the pull request's scanner one step earlier. And a step in
GitHub Actions can change the steps after it. A line it appends to the file
named in
[`$GITHUB_ENV`](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#setting-an-environment-variable)
becomes an environment variable in every later step. A folder it appends to
[`$GITHUB_PATH`](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#adding-a-system-path)
goes first on every later step's `PATH`.

So the earlier step does not need the token. It writes `BASH_ENV=` and the
path of a file of its own into `$GITHUB_ENV`. A `run:` step on Linux is a bash
script by default, and
[bash runs the file named in `BASH_ENV`](https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html)
before the script. The next step that holds the token starts its shell, the
stranger's file runs first, and the token is in its environment. A fake
`python3` on `$GITHUB_PATH` would do the same. Unsetting the token inside the
step comes too late, because the shell has already run that file.

The test had the same blind spot as the fix. It checked the scanner's own
process, the place where I had already decided the danger was.

## Before, not without

The fix that merged changes the question. It is no longer "does this step
hold the token?" It is "has anything from the checkout run yet?"

The lookup moved to its own step, right after the checkout and before any
step that runs the checkout's scripts. It is the last step in the job that
holds the token. The tree scan and the range scan come after it. They run the
pull request's code and have no token to lose. Nothing from the checkout has
run before the lookup, so nothing has had a chance to write to `$GITHUB_ENV`.

That step still runs Python inside the checked-out folder, and that is a trap
of its own. `python3 -` reads a script from stdin and puts the current folder
first on `sys.path`. This step never runs for a pull request. But a branch
pushed to the repo, or merged code, that adds a `json.py` at the top of the
repo would be imported the moment the script says `import json`. So the step
runs `python3 -I -`.
[`-I`](https://docs.python.org/3/using/cmdline.html#cmdoption-I) is isolated
mode: no current folder on the path, no `PYTHON*` variables and no user
site-packages. The test plants a `json.py` that prints the token, and checks
that it stays quiet.

The checkout also got `persist-credentials: false`.
[actions/checkout](https://github.com/actions/checkout) writes the token into
the repo's local git config by default, so that later git commands can use
it. The scan fetches nothing after the checkout, so it does not need it there.

Moving the step had a cost of its own, found before the merge. The tree scan
now came after the new step. When the new step refused bad input, the tree
scan was skipped, and a key in the newest commit would have gone unnamed in
that run. The tree scan got `always()`.

## The folder the last job left

That was version 1.2.0. ps·db took it about an hour later, and the review of
that change found the same trap one step earlier.

On a pull request the workflow first asks GitHub whether a push run has
already scanned this head. That step holds the token too, and it ran
`python3 -`, without `-I`. It runs before the checkout, so it looked safe:
there is no pull request code yet. But my private repos run this job on a
self-hosted runner, and a self-hosted runner does not start clean. The
working folder is the one the last job left. A `json.py` left there would load
with the token in reach. The test that proved it planted one, and it printed
the test's token.

"Before the checkout" had meant "before any untrusted code". On a reused
machine it does not.

Version 1.3.0 runs every step that holds a token with `python3 -I`. A test
reads the workflow and fails on any token-holding step that starts Python
without it. The first version of that test passed `python3 - -I`. There the
`-I` comes after the `-`, so it is an argument to the script, not an option
to Python. The review caught it, and the test now reads only Python's own
options.

None of this came from an incident. Code reviews found all of it, by reading
the workflow and by tests. The token can only read, and by default GitHub
gives a fork's pull request a read-only token anyway. With a write token or a
real secret in the same place, the same mistake would not be small.

## What I look for now

In a workflow that holds a token or a secret and also runs code from its own
checkout, these are the questions I ask now:

- Which step is the first one that runs checked-out code? Every step after it
  can be changed by that code, through `$GITHUB_ENV` or `$GITHUB_PATH`. The
  token belongs only in steps before it.
- Does a step with the token start Python with `-` or a script, in a folder
  someone else has written to? Then it needs `-I`.
- Does the checkout keep the token? It does, unless the step sets
  `persist-credentials: false`.
- On a self-hosted runner, "before the checkout" is not a clean folder.

The test that guards all of this reads one job, and finds a token only by
two spellings. It catches the mistakes that were already made.

So I now start from the other end. I find the first step that runs code I
did not write, and I move the token above it.
