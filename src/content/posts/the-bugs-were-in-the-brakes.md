---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-09-26T07:00:00Z
title: The bugs were in the brakes
slug: the-bugs-were-in-the-brakes
featured: false
draft: false
tags:
  - directing-ai
  - orchestrator
description: I spent a day building an AI session that hands work to my other AI sessions, reviews what comes back and merges some of it. The part that does things came together fast. The bugs that could have hurt something were in the parts meant to stop it.
---

The first real bug my new boss AI found was in its own code.

It was reviewing a pull request from a worker, another Claude session it had
sent off to add a help text to a status table. The change itself was fine. But
the review wandered outside the diff, into the script that had started that
worker, and found that the script threw away any flag it didn't recognise
without saying a word. The dry-run flag was spelled `--dry-run`. Type
`--dryrun` instead and the script would drop it and start a real worker in a
real repo.

A dry run is the one mode whose whole job is to make sure nothing happens. A
typo there doesn't fail. It just runs, for real, and I'd have found out from
whatever it did.

The review that caught it wasn't supposed to be that size either. It was a
change of about a hundred lines, and it got ten agents and roughly half an
hour, because the review level had been typed after the pull request's address
instead of before it. The tool read the level as part of the address and ran
at maximum. The boss's first note about why blamed the wrong setting, and it
only found the real cause a bit later, while fixing the flag, and corrected the
note in the same commit. So the review that ran at the wrong size by accident
is the one that found the real bug. The default is now the cheapest level
anyway, with a bigger one only for large or risky changes.

That's more or less how the whole day went. The part that does things came
together in an afternoon. The two bugs that could have hurt something were
both in the parts meant to stop it.

## The plan wanted memory the server didn't have

The idea is simple to say. I run about a dozen projects, each with its own
Claude session, and I read most of it on a phone. I wanted one session above
the others that knows the state of every project, proposes what to work on
next, sends a worker off when I say go, and reads back what the worker did.

I started with a Gemini deep-research report on how to build that, and it came
back with a whole stack: a chat interface, a graph engine to route work
between agents, a vector database for long-term memory, containers inside
containers as sandboxes for the workers, and a second issue tracker living in
git. Every piece came with a reason. The chat interface and the graph engine
alone wanted around 6 GB of memory. The server that already runs all my apps
had 2.7 GB free, and its disk was 96% full.

So almost none of it survived. What already worked was a terminal manager that
keeps one Claude session per project, a phone front-end for it that buzzes when
a session gets stuck, GitHub issues and pull requests as the record of what's
been done, and git worktrees, so a worker gets its own copy of a repo to make a
mess in. The boss became a thin layer on top of those: one more Claude session,
in its own project, with a handful of small scripts.

## The sparring partner took one back

Before building anything I had a second AI argue with the plan. Gemini again,
this time through its command line tool, over three rounds.

The first round was blunt. It called the chat-and-graph part buzzword soup and
said the stack would crush a server this size, which the memory numbers had
already said. The point that actually changed the design was smaller. It warned
that a worker started headless, with no terminal attached, dies the first time
it hits a permission prompt, because nobody is there to answer. So the workers
are ordinary interactive sessions in a terminal pane. When one gets stuck on a
prompt it shows up as blocked and reaches my phone like any other session.

It also assumed habits I don't have. It wanted the blog side fed from `feat:`
and `fix:` prefixes in commit messages. One commit in a sample of 375, across
six repos and thirty days, used one. And it wanted to keep the second tracker,
which it gave up in round two once it was pointed out that my existing tools
all read GitHub issues, and two trackers would split the truth in half.

Round two also brought the dangerous one, and it was a brake as well. The disk
was nearly full, so it suggested a scheduled job that prunes everything Docker isn't using at that
moment, volumes included, as a guard. On this server, "not using at that
moment" includes a stopped staging or production database. Challenged on that,
it withdrew the idea in round three. The plan now keeps a short list of
rejected ideas so nobody adds them back, and that one is first.

## A loop that doesn't believe its workers

What got built is a loop. The boss proposes, I say go, and a script checks
whether the server can take a worker right now: enough free memory, enough
disk, the one machine that runs every project's CI not busy, and no more than
two workers at once. Those checks live in code on purpose. The model doesn't
get to decide that the server looks fine.

The worker gets a short brief: this one issue, test first, one pull request,
don't merge, don't deploy. Its pull request has to end with four fixed
sections: the status, the tests it ran, whether the fix belongs in the starter
template my projects are made from, and whether it's worth a blog post. The
boss reads those and then doesn't believe them. It re-runs the tests itself,
on the worker's branch and again merged with whatever landed on main in the
meantime, reads the whole diff against the issue, runs its own code review,
and writes a verdict on the pull request.

The very first run went round the whole loop. The worker opened its pull
request about four minutes after it started. The review sent back four
changes, and the best of them was a test that couldn't fail. The fake tools in
the test suite wrote their log to a path that broke if the temp folder had a
space in it, so the test for "makes no calls to outside tools" would pass
whether any call was made or not. The worker fixed all four, the second review
approved, and the boss merged it.

It's allowed to merge in exactly one repo: its own, which deploys nothing.
Everything else waits for me.

## The filter that would have repeated what it caught

This blog is the only public repo I have. Everything else, the boss included,
is private, and a lot of it carries things that must never show up here:
server paths, internal hostnames, keys. The plan has the boss proposing posts
from finished work, so before that could happen it needed a leak filter, a
script that reads a draft and flags anything shaped like a secret or an
internal detail, plus a private list of names kept outside the repo.

It was written test-first, and the step that caught the problem was the dull
one. After the tests go green, the rule is to read the diff and point every
new line of code at a test that asked for it. One line had no test. When the
filter found something, it printed the offending line in full, so a person
could see what was wrong.

That sounds helpful until the next step. The boss posts the filter's findings
as a comment on the pull request, and on this repo pull requests are public.
The filter would have caught a leaked key and then published it in a comment
one step later. It reports only the line number and the name of the rule now,
and a test holds it to that.

It ran over every post already on this blog without a single false alarm. It
ran over this one too, before the pull request was opened.

## Merging is publishing

The test-first rule is older than the boss. A week and a half ago I asked the
agent whether it was actually doing test-driven development, and the honest
answer was "partly": it was writing all the tests for a design it had already
decided, then the code. Since then a test has to be seen failing before the
code exists, and a test that passes on its first run doesn't count until
someone has broken the code and watched it go red. The leak filter bug came out
of exactly that routine.

Partway through the afternoon I told the boss "You decide. You are the boss
orchestrator." That line is in its instructions now. It picks the review level,
sends findings back to workers, cleans up after a merge, files follow-up
issues and orders the work, and then tells me what it did.

What it doesn't decide is anything that reaches a live app. Merging into a repo
that deploys, deploying, publishing, deleting anything that isn't a worker's
own leftovers: those wait for a person. It doesn't even start a worker without
my go. That's why this post sits as a pull request that I'll merge myself,
because on this blog merging is publishing.

Gemini's first round had a line about this too. I was the supervisor, it said,
and I didn't need an LLM deciding when to spawn other LLMs. By the end of the
same day I'd told one to decide. The plan also says the blog side should wait
until the loop has run cleanly for two weeks. This post is from its first day.
