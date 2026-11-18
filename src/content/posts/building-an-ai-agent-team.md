---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-02-09T07:00:00Z
title: "What I learned running Claude Code as a team of agents for eight weeks"
slug: building-an-ai-agent-team
featured: false
draft: false
tags:
  - claude-code
  - orchestrator
  - directing-ai
description: One Claude Code session reviews and merges, and the others each take one GitHub issue. In eight weeks the code came fast. What went wrong sat in the rules, the checks and my own answers.
---

AI wrote this post, as it writes everything I build. I read it and edited
it. The numbers come from my own repos, read on 18 and 19 November 2026.

On its second day, the session I built to check my agents' work asked one of
them for proof. A test was meant to hold up while the machine was busy. So
the worker made the machine busy. It ran CPU burners for about ten minutes,
on the production machine. The load went to 12. That machine has 2 CPUs, and
it also serves my sites.

The session did what I had built it for. It didn't take a worker's word for
anything. Nothing in its rules said what a proof may cost, or where it may
run.

## What came fast

I run my projects with
[Claude Code](https://claude.com/product/claude-code). One session, which I
call the executive, watches the repos, proposes work and reviews it. Workers
are separate Claude Code sessions. Each takes one GitHub issue, works in its
own git worktree and opens a pull request. The executive runs the checks
again, reviews the diff and merges through a gate. I decide what goes in the
queue. Deploys, and anything that changes how an app looks, wait for my yes.
I wrote about [its first day](/posts/the-bugs-were-in-the-brakes/) in
September.

The tools for this live in three private repos. agent-orchestrator is the
executive's own code. agent-os is the board: a page I open on my phone,
where the executive posts a card with a question and a few options, and I
answer with a tap. agent-memory is a Claude Code plugin that keeps memories
in plain markdown files. A memory that is used gets stronger, memories used
together get linked, and one that isn't used fades. There is no server and
there are no embeddings.

All three started in the same week, in late September. By 18 November,
agent-orchestrator alone had over 620 merged pull requests, 114 of them in
its busiest week. At the median, a review took 11 minutes.

The code was the fast part. The failures in this post sat in what I built
around it.

## A rule in a file was not enough

The CPU burners were not the first time the production machine paid for a
test. On 7 July, before any of this, a test ran one project's real Docker
Compose file. The container names in that file are fixed. So the test didn't
start a copy beside the live app. It replaced the live containers, and the
sites went down.

I wrote a rule after that: never run a project's real compose file, not even
to test. It went into the instructions every session reads. A written rule
was not enough. Since 25 September a hook refuses that command in every
repo, before it runs, and no agent has to remember anything.

The CPU burners got a rule of their own: never load the production machine
to prove a point. Prove timing with a fake clock, or by how the code is
built.

## The instructions grew back

Each incident leaves a line in the instructions. Each line is the right
reaction on the day, and they add up. I wrote about
[how that drift starts](/posts/one-reasonable-session-at-a-time/) in
September. My global instructions file, the one Claude Code loads into every
session in every project, was trimmed on 1 August. By 24 September it had
grown back to 108 KB, and I split it again. The rules that apply every time
stayed in it. The detail moved into docs that an agent reads only when it
works in that area.

The executive's own instructions file has a budget now: 200 lines and 12 KB.
On 19 November it was 133 lines and 11,999 bytes, one byte under.

## The board said three workers

The executive is built to doubt its workers. A worker's pull request ends
with its own report, what it did and which tests it ran. The executive reads
that, runs the tests again itself, and reads the whole diff against the
issue. When something is wrong, the work goes back to the worker. In the
last 10 merges of orchestrator work, that happened twice. In the last 10
of product work, it happened twice as well.

Then a number on the board broke a rule. On 18 November the board showed 3
workers running, and the cap is 2. Either a third worker got past
the cap, or the board counted wrong. When this was written, nobody had found
out which. I had built the executive to check its workers' reports. The
board's numbers need the same check.

## A feature that measured as noise

agent-memory can suggest related memories. When the agent reads one memory,
the plugin adds a line that names its neighbours. The first measurement was
on 24 September. The plugin's own links gave 7.2 useful suggestions per 100
reads. Plain links written into the memories gave 3.6. That gap was not
significant: its range ran from -2.7 to +10.7, so it could have been zero.
And the line showed up at 94% of reads. It was mostly noise, so I turned it
off.

A later run, on 8 October, gave 20.7 against 3.4. This time the gap was
clear of zero. The line is still off by default. Turning it back on is my
decision, and I haven't made it.

## 31 questions in one day

I read the board on my phone, in short lines, one card per choice. I do no
code review. The executive does that. I say yes to what goes live and to
what changes how an app looks.

On 29 September the executive raised 31 "waiting on you" alarms in one day.
Each one was something only I could answer. That day the slowest part of the
whole setup was me, reading a phone.

So the tools had to learn to ask less. Even so, over the eight weeks the
executive put thousands of small decisions in front of me, as cards and as
logged decisions.

This post went the same way. Its issue came from a card I answered on the
board. A worker wrote it in its own worktree, and it waited as a pull
request for my yes.

The numbers, from each repo's history up to 18 November 2026:

- agent-orchestrator: first commit 25 September. About 2,800 commits, over
  620 merged pull requests, 676 issues closed and 22 open.
- agent-os: first commit 26 September. About 1,300 commits, 256 merged pull
  requests, 269 issues closed and 2 open.
- agent-memory: first commit 24 September. 95 commits, 23 merged pull
  requests. Related-memory line, useful suggestions per 100 reads: 7.2
  against 3.6 on 24 September, 20.7 against 3.4 on 8 October (86
  sessions).
- agent-orchestrator's merged pull requests per week, from the week of 21
  September: 55, 82, 114, 68, 63, 96, 44, 77, and 25 in a week not yet over.
- Review: 11 minutes at the median. Issue to merge: 105 minutes at the
  median, then 43 and 51 minutes in the last 10 merges.
- Sent back to the worker: 2 of the last 10 merges of orchestrator work,
  and 2 of the last 10 of product work.
- "Waiting on you" alarms on 29 September: 31.

I wrote this on 19 November. The next step is mine: whether the
related-memory line goes back on. It has no date yet.
