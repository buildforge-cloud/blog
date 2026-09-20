---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-09-20T01:00:00Z
title: The fix was already written
slug: the-fix-was-already-written
featured: false
draft: false
tags:
  - vedlikeholdsloggen
  - directing-ai
description: Apple rejected my first app twice in one day on the same guideline number, for two different things. The fix for the second rejection had been sitting in main the whole time.
---

The second rejection arrived a few hours after the first one, and it cited the
same guideline. 3.1.2 both times. I read it twice before I accepted that Apple
wasn't repeating itself.

This is the first app I've put on the App Store.
[Vedlikeholdsloggen](https://apps.apple.com/no/app/vedlikeholdsloggen/id6812536099),
a Norwegian thing that reminds me when to do the maintenance on a house and a
cabin and keeps a log of what got done. Seven days of building, mostly by
agents under my direction, and then it went into a queue.

Rejection one said the Terms of Use link was missing from the App Store
description. Not from the app. From the text on the product page, the part that
lives in a form and has nothing to do with a build. Rejection two said the
Terms of Use and privacy links had to be inside the app, on the screen that
sells the subscription. Same rule number, two different surfaces, hours apart.

The guideline number tells me what is wrong. It does not tell me where.

## The build that wasn't needed

When the first rejection came in, the agent told me it needed build 5. I
believed it, because it sounds right: rejected app, new build, back in the
queue. It was wrong. The fix was a paragraph of store copy, minutes of work and
no build at all, and the agent worked that out a little later and said so.

So what I remember about that hour isn't the rejection. It's that I was being
told two different things about what a rejection costs, and the answer moved
while I was looking at it. That used up the window where the interesting
question was still on the table.

## What was sitting in main

The links Apple asked for in rejection two were already written. Commit
`0be71b9`, in main, finished before the first rejection ever arrived. I had a
compliant paywall in the repo while I spent a full review round fixing one
sentence in the store listing.

The rule I was working from was mine, and I still think it's a good one: don't
guess what Apple objects to, wait for the message that names it. Guessing is
how people rebuild a binary three times over a problem in a text field. Apple's
first message was specific, the fix was cheap, and I made it.

Right about which fix. Wrong about the timing, and those are not the same
decision. The careful move was to change exactly what Apple named. The fast
move was to ship everything that rule could possibly cover in one build and
give the next pass nothing to find. Both were available to me. I only noticed
there had been a choice when the second rejection told me what the other half
of the rule was.

The note I've written for next time is narrow, which is the only kind I trust:
when a rejection cites a guideline that covers more than one surface, fix every
surface in the same round. Not because guessing is fine. Because a fix that is
already written isn't a guess.

## Round three

Build 5 went up with the paywall links, plus a screen recording in the
Resolution Center, which Apple asked for directly. The same message suggested I
use SwiftUI's `SubscriptionStoreView`. The app is React Native and cannot use
that component at all, and the guideline doesn't ask for it anyway. It asks for
the information.

I don't read that as hostility. It reads like a reviewer working from a list
with one recommended answer per rule, applied to an app they have no reason to
know the shape of. It's the same gap as the rule number: the process names the
box that is unticked, never where that box sits on the screen in front of me.

Approved on the 18th, roughly 48 hours after the first submission. Two
rejections inside that window is fast, which I hadn't expected, and it's the
opposite of what most of the writing about App Review had prepared me for. The
friction was never the waiting. It was that each round was one sentence from
someone I couldn't ask a follow-up question.

What nags is how ordinary the mistake was. Nothing was broken, nothing was
hard, the code was written and the tests were green. I lost a round to a
sequencing decision nobody made out loud, in a process where I find out whether
I chose right only once it's too late to choose again.
