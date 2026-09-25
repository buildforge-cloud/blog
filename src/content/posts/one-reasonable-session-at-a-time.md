---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-09-10T06:45:00Z
title: One reasonable session at a time
slug: one-reasonable-session-at-a-time
featured: false
draft: false
tags:
  - meta
  - directing-ai
description: In the first week of September I committed nearly four times as much to the agent's instructions as to the product. No single session decided that, which is the part I keep turning over.
---

In the first week of September I made about a hundred and sixty commits
touching the agent's own configuration on one project, and about forty touching
the actual application. Four weeks earlier that ratio didn't exist, because
the config didn't exist. Every commit in that first week was product.

I only saw the curve because I went looking for something unrelated. Nobody
decided it. There was no session where I chose to spend a month on tooling
instead of features, and I think that's the whole mechanism: it doesn't
arrive as a decision, it arrives as forty small ones that were each correct.

The project ran about four hundred sessions in a month, a dozen or so a day.
Sixty-six configuration files got added across twenty separate days. Not one
of them was a plan. Each was a reaction to something that had just gone
wrong, and reacting to it was the right call every time I looked at it up
close.

## Each one was individually right

Some of them were unambiguously worth it, which is why this is hard.

There's a rule in my global file about how the shell handles directories. It
exists because I ran a script over twenty sessions and found that one
mistake, an agent changing directory in a way that leaked into the next
command, was more than half of all the avoidable failures, appearing in
twelve of those twenty sessions. Writing that down bought back more than an
afternoon of features would have.

Except it didn't work. So the next session rewrote it with a stronger
argument, and the session after that found the prose still wasn't landing and
replaced the argument with a literal string to copy. The file now carries all
three attempts with their dates, each one noting that the previous version
failed. Three sessions, on three different days, to make one line stick.

That was a good use of three sessions and it was also, unmistakably, three
sessions.

The rules directory grew the same way. Nine files added one day in
mid-August, thirteen on another, then ones and twos for a month. Fifty-one
files now, about twelve thousand lines of instructions, against roughly sixty
thousand lines of application code. I have never once sat down to write a
rules file. They accumulate on the way past.

## Adopt nothing, delete nothing

Eventually the drift stopped being a background process and took a whole day.

I'd found someone else's collection of agent skills and asked whether
anything in it would improve my setup. One idea was testable: if a line in an
instructions file can be deleted with no change in the model's behaviour,
it's dead weight, and which lines those are can be proven by running the same
task with and without it. My instructions had grown large enough that I
genuinely didn't know which parts were load-bearing, so I asked if we could
test it rather than just adopt it.

That was a reasonable question and it ate about a hundred and fifty calls on
the expensive model, most of a session limit.

The rules work. Without the rule banning `async def` the model wrote it every
single time, with the rule never, against an arm that changed nothing at all
and produced no variance. Which retired a real doubt and is also exactly what
I'd have guessed. The question I actually cared about, whether the paragraphs
of justification under each rule earn their space, came back unanswered:
every bare rule already scored zero or a hundred percent, leaving no room for
the explanation to move anything. The verdict at the end was to adopt nothing
and delete nothing.

The grader was wrong three times before it was right, and all three errors
ran the same direction. It counted the word "score", so an output saying _no
score anywhere on the screen_ graded as showing a score. It measured refusals
from an arm that couldn't answer for lack of file access. It counted
`async def` inside a comment saying not to use `async def`.

That last one flipped a headline. It made the rules-with-justification arm
look three times worse than the bare rule, which reads as _explaining a rule
makes compliance worse_, a striking claim that happens to match what the
skill I was evaluating argues. I nearly reported it. All six of those
handlers were plain sync functions, and the only reason it got caught was
reading raw output instead of the summary, which is how all three were
caught.

Then there's the half of the bill that bought nothing. The expensive model
was necessary for measuring how steering text affects the model that actually
does my work. It was not necessary for finding out whether my own regexes
worked, which is what the other half went on. I debugged the instrument on
the thing the instrument was pointed at. The honest number for that half
isn't a cheaper model, it's zero calls: six handwritten example files with
known answers and an assertion each would have caught every grader bug. I
have a written rule about shipping the instrument before trusting it. I
skipped it and paid retail for the lesson.

## The number was already written down

None of this was the first warning, and that's the part that stings.

Two weeks before that day I'd asked for something specific, because I could
feel the drift without being able to name it: we need to push product
functionality, especially now when we still don't have anything to demo. What
came out of it was a review that runs before I start work and asks whether
yesterday moved the product.

The file it lives in records why it was written. In the two days before it,
eight of the nine issues I'd closed were about the repo's own tooling. The
share of commits touching application code had gone from just over half to
about fifteen percent in twelve days. That was sitting on my own machine,
diagnosed, in writing, while I later ran an experiment to find out whether my
instruction files were too long.

And look at the shape of the response. I wrote another tool. The diagnosis
that I was spending my time on tooling produced, as its output, more tooling.
It's a good one, and it carries a line warning against itself: four findings
and four fixes is the failure mode, because that's a second backlog, filed
against the process, by the process.

There's a smaller version of the same joke inside the measurement day. A
guardrail I'd built to make sure I always state whether I'm doing research
fired three times during that session and was ignored all three times. A
process check interrupting a session about process, going unanswered, while
the process was being measured.

## Why it keeps working on me

The trap is that none of this is fake work.

The directory rule really did stop the largest source of wasted turns on this
machine. The skill that drafts these posts caught a previous one reading like
an incident report when every individual sentence passed its checks. Ten of
these process tools now exist, built since mid-July, and I can point at what
several of them prevented.

But tooling has a property features don't: it produces its artifact
immediately, and the artifact looks like progress. A rules file is finished
the moment it's written. A feature isn't finished until someone can use it,
and finding out whether they can is slow and often disappointing. One of
those gives me a sense of completion inside twenty minutes and the other
doesn't, and I'm evidently not immune.

The measurement is also just more interesting. I would rather find out
whether a rule changes model behaviour than write another form validator.
That preference is real, and calling it efficiency work is easy, because at
some rate of return it genuinely is efficiency work. I don't know my rate of
return. That's what the experiment was supposed to tell me, and it came back
saying the instrument couldn't see one.

## Where it stands

I re-derived the weekly split today, same method across the whole period so
the numbers are comparable. Early August: zero commits to the agent's config,
because there wasn't any. Mid-August: config and product roughly level. The
first week of September: about a hundred and sixty to the config, about forty
to the application.

Sixteen days of owning a tool whose entire job is to ask whether yesterday
moved the product, and the product's share kept falling.

I don't have a clean read on that. Commits count activity, not value, and
some of that tooling stopped real failures I can name. But the drift never
announced itself, no session in the chain was the wrong call, and the biggest
single push I made to get a grip on it ended in a verdict that nothing should
change.
