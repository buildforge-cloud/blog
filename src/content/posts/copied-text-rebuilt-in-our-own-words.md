---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-12-08T07:00:00Z
title: "AI text that copied its sources: what an originality check found"
slug: copied-text-rebuilt-in-our-own-words
featured: false
draft: false
tags:
  - vedlikeholdsloggen
  - directing-ai
description: My app's AI-written articles kept too close to their sources. An originality check found 173 of 181 blocks in Vedlikeholdsloggen were not our own words.
---

In October a Norwegian source wrote to me. It asked that my app stop
reproducing its articles.

The app is [Vedlikeholdsloggen](https://vedlikeholdsloggen.buildforge.no/), a
Norwegian app that reminds me of the upkeep on a house or a cabin. Every task
and article in it names a source, and AI agents write the texts. The first
step was to measure. 13 of the 53 articles rested on that source. Of
their 60 texts, 15 were close to word for word, and 30 were close paraphrase.

That is not our own text.

## The rule that made the copies

I did not ask for copies. I asked for the opposite of made-up advice. The
agents' house rule said a text may only restate what its source says. And I
had built a [fact check](/posts/vedlikeholdsloggen-fact-check-gate/) that
reads each text next to the page it cites. When a text claimed more than
its page, the fix was to make the text say only what the page
says.

Both rules pull the same way. The closer a text sits to its source, the
safer it is with both. Nobody set out to copy. The rules rewarded it.

## Taking it down

The first fix removed the texts. 11 articles went, and their pages sent a
visitor on to the task list. Two more lost their blocks from that source. The
source's name came out of the app's welcome screen, the store text and the
site's front page. Each article now ends with a new line. In my translation:
the text is written by Vedlikeholdsloggen from facts at the sources above,
and the sources do not stand behind the app or check what it says.

The house rule changed too. It used to say restate. Now it says to give the
facts in our own words, and never to follow the source's sentence order.

Then a check against a repeat. A new or changed text may share at most 8
words in a row with the page it cites, and at most a quarter of its runs of
four words. A short quote is fine.

That check found more than the one source. Of the 225 texts in the 42
articles left, 180 were over those limits. On the share of shared four-word
runs, the source that wrote to me measured 44 %. Another source measured
78 %.

## Copies at zero overlap

A word check sees words. A text can follow a page point by point, in the same
order, with every word changed. That is still the page.

So I asked for a second check, next to the fact check. An AI model reads
each block next to the page it cites, and answers two questions. Is this the
page's text, its order, or our own? And does it make our own point, with the
page backing a fact? The model is Jev, from TypeSafe, and Norwegian is not its
strong language. So a doubt goes to a person, never to a pass or a fail on its
own.

Before any threshold, the agent measured it on 37 pairs with a known answer.
Some were real copies and close paraphrases from the old articles. Some it
wrote itself: rewrites with new words in the source's order, and own words
with one cited fact. The word check let through 9 of the 12 close paraphrases,
and all 5 planted rewrites, at 0 % overlap. The model caught all 14.

Then it ran on every block the app had left. 181 blocks in 42 articles, for
about 4 cents. 1 came back clean. 7 were in doubt. 173 were not our own words.

Those blocks had all passed the fact check. They were true, and they named
their source. By this measure they were also the source.

## Our point first, then one fact

The rebuild started with the 13 articles that had rested on that source,
now written from other sources.
The first round failed. 41 of 45 new blocks were not own words, by the
model's reading. "In our own words" was not enough of an instruction.

What worked was a shape. Each block opens with our own advice: when to do the
job, how, and what to look at. Then it takes one fact from the page, with the
source's name. The third round passed every block.

Another 175 blocks followed in two batches. The first had 115 blocks and
eight writers working at once. Every check passed on the merged result.
Reading it still found six slips.

That batch also showed me the two checks disagree on quotes. A decision of
mine rested on "a short quote passes the copy check". The word check skips
quotes on purpose. The model reads a quote as copied text. One block in the
wood stove article keeps its quote. It passes on a named exception, and no
other block can use that exception.

The last 60 blocks went to six helpers, each in its own copy of the repo.
Reading the merged text against the cached pages found more slips. One
dropped a source's reason. One gave a rule without the limit the source
puts on it.

## What the rewrite cost

Some advice did not survive. The radon article lost its 5- and 10-year
rules. The snow load article lost a table that turned kilos per square metre
into a depth of snow. They went in the rewrite, and the pull requests name
each one.

On 22 October the list of blocks that were not own words was empty. The
pass and fail lines were measured again on a newer version of the model,
and they still held. The checks now run on every new or changed block. The word check also
covers each article's lede and the task texts, and 24 of those are still
over its limits.
