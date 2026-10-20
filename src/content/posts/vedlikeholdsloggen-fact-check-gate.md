---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-10-27T07:00:00Z
title: "Fact-checking my app's texts against their sources, with a CI gate"
slug: vedlikeholdsloggen-fact-check-gate
featured: false
draft: false
tags:
  - vedlikeholdsloggen
  - directing-ai
description: Every text in my home maintenance app names a source. Now the build fails if any of 573 texts has no recorded AI check against that source, and only a person can clear a doubt.
---

At one point my app told people to store the robot lawnmower's battery fully
charged over the winter. The page it cited said the opposite.

The app is [Vedlikeholdsloggen](https://vedlikeholdsloggen.buildforge.no/), a
Norwegian app that reminds me of the upkeep on a house or a cabin. It is in
the [App Store](https://apps.apple.com/no/app/vedlikeholdsloggen/id6812536099).
Every task and every article in it names a source: a Norwegian authority, an
insurer, a trade body. AI agents write the texts, and they cite as they go.
The battery advice had a source. The source just did not say that.

That is the kind of error a check I added in September exists for. An AI
model reads each paragraph next to the page it cites and answers one
question: does the page support this, contradict it, or not mention it? The
model is Jev, from TypeSafe. On 29 September it flagged a water heater task.
The task told the owner not to open the cover. The electrical safety site it
cited says to take a look behind the cover once the power is off. The
sentence had been there since the first build. I decided the same day that
the task follows its source.

## Nothing proved it had run

The check had a gap I did not see for a month. It ran when an agent edited an
article, or when someone ran it by hand. CI never ran it, and a missing key or
a timeout was only a soft note. Two pull requests in October ended with "clean",
and nothing in the repo showed it.

On 15 October I wrote: "We cant risk posting information that is not based on
facts."

## A receipt the build can read

The fix is a ledger, a file in the repo. Every real answer from Jev writes one
entry per text: a hash of the exact words and of the cached source page, the
verdict, the date, the model, and the request id TypeSafe gave that answer.
A test in the normal test run goes through every paragraph and task the app
ships, and fails for each one with no clean entry for its current hash. CI needs no key.
It only compares hashes.

One changed word makes a new hash, so it needs a new check. So does a source
page that has changed when we fetch it again.

The first full run was on 19 October. 285 texts: 232 article paragraphs and
53 tasks. 286 calls, because the agent ran one text alone first to see that an
entry really got written. The whole run cost under 7 cents. Every text came
back clean, two of them through a person's reading accepted earlier.

The gate has one hole that stays. It sees the form of an entry, not the
truth. An entry that copies the format and works out the hash by hand would
pass, because CI cannot ask TypeSafe anything. What makes an entry checkable
is its request id at TypeSafe, and the file's history in git.

The review of that first version found something worse than the hole. Only
article paragraphs had a way for a person to accept a doubtful answer. Tasks
had none. A correct task that Jev found only thinly supported would have
turned the build red for good. The only way out
would have been to reword a correct text until the model liked it. The
review asked for the same way to accept a doubt on tasks, and they got it.

## Headings are not claims

The first gate covered paragraphs and tasks. The review listed what it left
out: each article's title and lede, every heading, and three texts the app
shows when I say I don't have something. One of those three says a smoke
alarm is required by law.

The obvious design was to check each heading and title on its own. The agent
measured it before choosing: 333 headings and titles, 77 sent to a person, 2
marked wrong.
60 of the 77 were headings, and the other 17 titles and ledes. Nearly all
of the headings were labels. "Gjør det trygt" ("Make it safe"). "Slik
merker du det" ("How to tell"). A label says nothing a source can back up.

Read together with its paragraph, a heading is a claim again. The 60 flagged
headings dropped to 15. Then the agent planted seven wrong headings to see
what this misses. It caught six. The miss was "Fem grader holder" ("Five
degrees is enough") over a paragraph that says 10 °C. Jev scored it as fully
supported. The other design, with the heading as the claim and the paragraph
only as context, caught all seven. But 40 of the 60 labels stayed flagged.

The agent picked reading the heading with its paragraph: about three quarters
less noise, for one blind spot that has a name. The rules for the agents now
say it out loud. A heading that contradicts its own correct paragraph can get
through, so headings still get read by eye.

## A doubt waits for a person

The run over the 288 new texts gave 269 clean and 19 for a person. That person
was me. I accepted 14 as they stood. The other 5 said more than their source,
and were rewritten to say only what it says.

The radon article's title was "Du kan verken se eller lukte den"
("You can neither see nor smell it"). That is true of radon, but the government page it
cites does not say it. Now the title is "Enkelt og rimelig å måle" ("Simple
and cheap to measure"), which the page does say. The ventilation article
opened by saying the system gives no warning when its filter clogs, and the
air just slowly gets worse. Its source, an asthma and allergy association,
says the filters clog over time and the fans have to work harder to pull air
through. Now it says that.

A later review found the hole that mattered most. The ledger kept one
answer per text, and a new run wrote over the old one. A text close to the
limit could come back "review" once and "ok" the next time. The build would go
green, and nobody would have read the text. Asking again until the answer is
yes is not a check. Now a doubt about the same words is never sent again. A
person clears it: either an acceptance with a written reason, tied to those
exact words, or a rewrite, which makes a new hash.

The same review caught the three "I don't have this" texts being asked the
wrong question. They got the task question: does the page contradict it, and
is it on topic? A page about smoke alarms that never mentions the law passes
both. Asked the paragraph question, the smoke alarm text came back in doubt.
It says a smoke alarm on every floor is a legal requirement, and that it is
the owner's duty. The page it cited gave "every floor" as advice and
never named the owner.

I could change the words or find a source that states the rule. I kept the
words. The Norwegian fire prevention regulation,
[§ 7 at Lovdata](https://lovdata.no/dokument/SF/forskrift/2015-12-17-1710#%C2%A77),
says both: at least one detector or smoke alarm on every floor, and the owner
of a home or a holiday home must see to it. Checked against that page, the
text came back clean.

One part of that fix does not reach everyone. Someone who already had the
smoke alarm task before the update keeps a stored copy with the old link. The
words are the same.

## What the build knows now

All 573 texts the gate covers have a clean entry. The whole second round,
with the measuring and the design that got thrown away, cost about 20 cents.
It is not quite everything the app shows. The quoted lines behind each task's
interval are held by a different test, which checks that every quoted word is
on the source page. Jev never reads them.

What changed for me is where the decision sits. A check that runs when
someone remembers is a habit, not a gate. And the model's answer is not the
decision. Jev is tuned for English. The same claim, turned into its opposite,
was called a contradiction with a confidence of 0.87 in Norwegian and 0.99 in
English. The line for a sure verdict is 0.8, so in Norwegian a score just
under it is more often the language than an error. Those go to a person,
never to a verdict. The model finds the texts to read. Reading them is
still my job.
