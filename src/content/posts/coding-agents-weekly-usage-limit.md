---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-12-22T07:00:00Z
title: "Keeping Claude Code agents inside a weekly usage limit, and lifting it on my word"
slug: coding-agents-weekly-usage-limit
featured: false
draft: false
tags:
  - claude-code
  - orchestrator
description: My coding agents stop new work when the plan's weekly token use passes 90%, to keep a reserve. One afternoon 4 hours before the reset I wanted them to go on, and there was no switch.
---

On the morning of 26 October my AI coding setup stood still. Pull requests
were reviewed and approved, and none of them merged. Both worker slots were
free, and no worker started.

It was waiting on a rule I had asked for.

## The brake

I run my projects with Claude Code. One session, which I call the executive,
hands GitHub issues to worker sessions, reviews what they send back and
merges it. It is the [orchestrator from an earlier
post](/posts/the-bugs-were-in-the-brakes/). It all runs on one Claude plan,
and the plan has two limits: one over 5 hours and one over 7 days. Claude Code
gives its status line the use of both, as a percentage, and my tools save it
so every gate can read it.

The rules are short:

- At 90% of either window, nothing goes live. A merge to production waits.
- At 95% of the 5-hour window, no new worker starts.
- At 90% of the 7-day window, issues marked Low wait. Higher ones still start.
- If the use is unknown, nothing goes live either.

The point of the weekly one is a reserve. In my own words, it keeps
the last percent for a blocker or an emergency. If something breaks in
production on day six, I want tokens left to fix it.

## Two reasons for one idle afternoon

That day the 7-day use sat between 93% and 96% from 08:00 until the reset at
15:00 UTC. So merges stopped, as they should. By the afternoon six approved
pull requests were waiting.

What I had not planned for was the workers. The rules let a Medium or High
issue start at 96%. None did. The tool that starts workers also refuses to
start one while pull requests wait for the executive's review, so they don't
pile up. And it counted the approved pull requests as waiting for review. They
were not. They were waiting for the usage to drop, and no review would help.

So the brake on merging had become a brake on all work, by a second road. I
wrote "its only 4 hours to token reset. Unpause all work." The fix took about
half an hour: a pull request that is approved and held only by usage no
longer stops new workers. That merged at 12:28.

The merges were still stuck, and that part was the rule working. But I looked
at the numbers and disagreed with my own rule. I wrote: "now that we have 4
hours to token reset, Im confident we wont spend all tokens ... I should be
able to unpause work again."

There was no way to do that. The limit was a constant in the code, and tests
pinned it. Changing it would have meant a pull request, and a second one to
put it back that I could easily forget.

## A switch that turns itself off

The issue asked for an override with an end time, and two rules around it.

The end time may not be later than the next reset of the 7-day window. So if
I lift the limit and forget about it, it comes back on at the reset by
itself. A later time is refused, and the refusal names the reset.

And only my word sets it. The executive can't lift its own limit. It puts a
card on the board I read on my phone, I tap yes, and then it applies the
change with that decision's number written next to it. The lines that
report usage then say the 7-day limit is lifted, until when, and on which
decision.

The override lifts the weekly limits only. The 5-hour limits stay. They stop
a worker from running out halfway through a task, and my judgement about the
week changes nothing about that. Unknown usage still stops a merge.

The review of that pull request found the edges. A lift that ended before
the 5-hour window reset made the tool announce "merge now" when it couldn't.
The end-time rule was only checked when the override was written, so a hand
edit could hold a later end; now it is checked each time the usage is read.
An override that had already ended could not be removed. And a test that forgot
its fake read the real usage file instead. It saw 5h at 9%, the live number
from that moment.

## Seventeen minutes late

The pull request merged at 15:17 UTC. The reset it was built for was at
15:00. By the time I had a switch, the week had started over and the limit
was not in the way any more.

The numbers from that day:

- 7-day use: 93% to 96%, from 08:00 to the 15:00 UTC reset.
- Approved pull requests that could not merge: six.
- The fix for the idle workers: issue filed 11:52, merged 12:28.
- The override: issue filed 11:55, merged 15:17.

What I would keep in any agent loop that runs on a usage plan is the shape,
not my numbers. A reserve that new work can't touch. A way to lift it that
needs a person's yes, and is written down with that yes. An end that comes by
itself, at the reset. And a check that a gate for one thing, here merging,
has not quietly become a gate for everything.

One gap is known. If the 7-day reset moves earlier after I lift the limit,
the lift still holds until the time I set, into the new week.
