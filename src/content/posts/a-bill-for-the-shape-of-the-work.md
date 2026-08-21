---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-08-21T16:30:00Z
title: A bill for the shape of the work
slug: a-bill-for-the-shape-of-the-work
featured: false
draft: false
tags:
  - cvtailor
  - infrastructure
description: The org ran out of CI minutes mid-issue. A third of what we'd spent turned out to be rounding, and the single biggest line was something I'd recorded a month earlier as a win.
---

Jobs stopped starting. Not failing, starting: every workflow sat there and then
came back saying recent account payments had failed or the spending limit needed
raising. The org had used up its free Actions minutes for August, about two
thousand of them, and cvtailor was five sixths of that.

My first assumption was that the tests had grown. They had, a bit. That isn't
where the money went.

I pulled every run from August out of the jobs API and added the minutes up per
workflow, which landed within about a percent of GitHub's own figure, so the
split below is something I can re-derive rather than something I'm asserting. The
docs-check workflow has a median runtime of seven seconds. It ran a couple of
hundred times. Billing rounds up to the minute, per job, so every one of those
seven-second runs cost a full minute. Across everything, roughly a third of the
bill was rounding rather than work.

Which is a funny thing to discover, but not the uncomfortable part.

## The optimisation I'd already written up as a win

A month earlier I'd split the main test gate in two, backend and frontend running
as separate parallel jobs. It halved the wall-clock time, which is what I'd
measured it for, and I recorded it as a straightforward improvement.

Rounding is per job. One job with a median around two minutes was billed three
minutes. The two halves come in at roughly a minute and a half each and get
billed two and two. So the split bought about forty-five seconds per run and cost
an extra billed minute every time, which over a month is the largest single line
in the whole table.

I don't think it was a mistake exactly. It was measured carefully against the
constraint that was visible at the time, and the constraint that wasn't visible
was the one that mattered. But I'd been walking around with "we made the gate
faster" in my head for a month, and the honest version is "we made the gate
faster and it's why we ran out of minutes."

## Not paying for hardware I already own

The obvious move was the self-hosted runner. Everything in this fleet already
runs on one box that I pay for monthly whether it's busy or not, and the org has
a runner sitting on it. If I have the infrastructure I don't see why I should
also rent someone else's.

There was a pleasant detail: the billing block only stops GitHub-hosted runners.
A self-hosted workflow dispatched twenty minutes after everything else stopped
ran and passed, so the move unblocked the repo the same day for nothing.

Then I moved too much.

The first pass took five workflows onto the shared runner. Two of those were not
cost decisions at all, they were security ones. That runner is root on the same
machine as every other project's containers, secrets and SSH keys, so anything
triggered by a pull request from a stranger is a stranger running code as root
next to all of it. One of the two was caught immediately by a test that existed
for exactly this, which was reassuring right up until I checked the other. That
one is triggered by `pull_request_target`, meaning it runs with the base repo's
own write token, which is the worst of the set to put on a shared root machine.
Nothing caught it. I found it by reading every workflow's triggers by hand,
purely because the first failure made me suspicious.

The third one had no `runs-on` of its own at all, because it reaches the gate
through a reusable workflow, so the existing check couldn't see it either.

The fix was to make the gate take the runner as a required input with no default.
The push-triggered caller passes the self-hosted one, the pull-request caller
passes the GitHub-hosted one, and neither can inherit a choice nobody made. The
guard that replaced the old one resolves what a reusable caller passes in rather
than reading `runs-on:`, which is the thing that made two of these invisible.
Worth writing down somewhere I'll see it again: cvtailor being a private repo is
not what protects it here. This blog's repo went public so giscus comments would
work, and making that work meant opening the runner group to public repos across
the whole org. The protection is which event triggers the workflow, not who can
see the code.

## Faster, until it ran

I'd written up the move partly on the grounds that the shared host is faster,
because installing Chromium there takes about four seconds against a median near
thirty on the hosted runner, and much worse in the tail. That's true and it's
still true.

The first real run put both halves of the gate at around two minutes each,
against roughly a minute and a half on the runner I'd just left. The install step
genuinely is faster. The job is not. I had a component measurement and I let it
stand in for the thing I actually cared about, which is the sort of error I'd
catch instantly in someone else's writeup.

## A Markdown commit went red

A few days later a commit that touched one log entry and one backend test file
failed the deploy gate. The frontend E2E run couldn't start its preview server
because port 4173 was already in use.

I re-ran it and it passed, and the relief lasted about a second before the
implication landed. A false red on a deploy gate looks exactly like a real E2E
failure, and "just re-run it" being the fix is the mechanism by which a genuine
failure eventually gets waved through.

Nothing in the config had changed. What changed was the machine. On a disposable
VM, binding a fixed port and refusing to slide off it is correct: it means the
suite can never quietly test a server it didn't start. On a box shared with the
dev environment and every other project, that same correct setting turns any
other process on 4173 into a red deploy. And 4173 is just what `vite preview`
picks when nobody tells it otherwise, so six repos on this host reach for it.
Back in July I'd given every project a unique dev port for precisely this reason
and never thought about preview ports, because until now no preview server had
ever shared a machine with another.

Moving cvtailor's port was easy. What I actually wanted was for the failure to
say what it was, so I added a check that names the collision instead of leaving a
generic port-in-use error. That check then produced a false red on the deploy
gate, through the fix for false reds on the deploy gate: it finds out whether the
port is free by binding it, Playwright re-imports the config in every worker it
spawns, and so one copy of the check grabbed the port and the next copy reported
the collision it exists to explain.

## What I actually think now

The bill was legible and mostly wrong about what it was measuring. It told me
what the work cost in a currency shaped like GitHub's billing rules, so a
seven-second job and a fifty-second job are the same price and splitting a job in
half doubles it. I read that table as a report on my test suite for a while
before I noticed it was mostly a report on how the suite was chopped up.

What replaced it doesn't lie, it just doesn't say anything. The shared host
doesn't send an invoice. The gate now spikes a few hundred megabytes of Chromium
on it about sixteen times a day, on a machine that in the same month livelocked
badly enough to need a power cycle when three deploys ran at once. That's guarded
now, and I measured the memory before moving, and I still think the move was
right. But the thing that used to arrive as a number at the end of the month now
arrives, if it arrives at all, as everything getting slow one afternoon.
