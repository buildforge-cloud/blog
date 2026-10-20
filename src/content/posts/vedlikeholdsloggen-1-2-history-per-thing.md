---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-10-19T12:00:00Z
title: "Vedlikeholdsloggen 1.2: a home maintenance app with a history for each appliance"
slug: vedlikeholdsloggen-1-2-history-per-thing
featured: false
draft: false
tags:
  - vedlikeholdsloggen
  - directing-ai
description: Version 1.2 of my home maintenance app puts the things in the home at the centre, with a history for each one. The first version linked a grill to every outdoor task.
---

On 4 October I wrote this about my own app, in Norwegian. My translation:

> We can't ship the equipment list in my home the way it is now. For some
> equipment it makes sense that all the tasks are linked to it. But say I add
> a robot lawnmower, or a grill. Then I get all the outdoor tasks linked to
> it..? The user has to be able to link a piece of equipment to whatever task
> they want. And create the equipment from the task too.

That message stopped the release. The app is
[Vedlikeholdsloggen](https://vedlikeholdsloggen.buildforge.no/), a Norwegian
app that reminds me when to do the upkeep on a house or a cabin, and keeps a
log of what got done. Version 1.2 went live in the App Store on 19 October. Its
big change is a new tab, Hjemmet ("the home"), with the things in the home at
the centre. The grill is why it took a detour on the way.

## Filter day

The idea is from mid September. It is filter day for the heat pump, I am
standing in front of it, and I don't remember which filter it takes. Or the
water heater is old, and I don't know if it is 14 years old or 4. The app is
already in my hand at that moment. It knows I have a heat pump. It doesn't
know which one.

On 30 September I said build it, and keep it free. The agents built a flat
list of things per home: name, model, year and a note. It sat three taps deep
in the settings. A thing showed up on a task through a switch the app already
had. During setup the app finds out if the home has a heat pump, a water
heater, a wood stove, balanced ventilation, or a garden. A thing marked "heat pump" shows
up on every heat pump task.

The spec the agent wrote for that link was careful, in one direction. It
turned down the wider task category on purpose. That category puts the heat
pump next to the kitchen fan and the radon test, so the heat pump would have
shown up on "measure the radon in the home". The switch was the narrow
choice.

I looked at the screenshots before it merged. One of them was the heat pump's
filter task, with the heat pump on it. That is the case the rule was made for,
and it worked.

## Moving the things to the middle

The next day I had a different thought about the whole app. I wrote: "In many
ways the tasks in vedlikeholdsloggen would not be necessary without the utstyr
(asset) that we are performing a task towards."

A task exists because something in the home needs care. So the list should
not be three taps deep in the settings. Of the sketches I was shown, I picked
the one that gave the things a tab of their own, built in two steps.

Step one was the Hjemmet tab. One card for each thing, with its next task and
the last job done on it. Step two was history per thing. When I finish a task
that belongs to a thing, the job is saved on that thing. With two heat pumps,
the app asks which one, or whether the job was for the whole home. Open the
thing, and every job done on it is there, with the date, the note and the
cost.

Both steps merged on 3 October. Both were built on top of the switch rule.

## What a grill would have got

The garden switch has three tasks behind it: wash the terrace, bring in the
garden furniture and empty the water butts, and store the robot lawnmower for
the winter. A grill is not
a heat pump, so the only switch that fits it is the garden one. So the grill
got all three, including the robot lawnmower's winter storage. With a robot
lawnmower and a grill in the same home, "wash the terrace" would ask me which
of the two I had just washed.

The other way out was "Other", which linked a thing to no task at all. 35 of
the 47 tasks in the catalog have no switch. The smoke alarms, for one, could
not be linked to the smoke alarm tasks in any way.

The rule had been checked hard against the one wrong link someone thought of,
the heat pump on the radon test. Nobody asked what else lives in a garden. The
screenshots I said yes to showed the heat pump, because that is what the list
was imagined around. Four of the five switches stand for one kind of thing.
The fifth stands for a whole part of the property.

It was cheap to find this then. Version 1.1 went live on 24 September, before
the list existed, so no one with the App Store version had a single thing
saved. Only the test builds had it.

## Letting the owner decide

The fix was to stop letting the switch decide. The field called "belongs to"
is now "type", and the type only suggests tasks. For a heat pump,
balanced ventilation, a wood stove or a water heater, the suggested tasks are
ticked from the start, and I can untick any of them. For a garden thing or
"Other", nothing is ticked, and I pick. It works from both sides: from a
thing I pick its tasks, and from a task I can pick a thing or add a new one
right there. It merged on 5 October.

That is the version that shipped. The release note says it in plain words: I
choose which tasks a thing belongs to, and I can add a new thing straight from
the task.

## A history that starts empty

One part of 1.2 looks thin on purpose. Before 1.2, a job in the log did not
belong to any thing. When the update arrives, every old job is marked as being
for the whole home. The app makes no guess about which heat pump an old
filter change was on.

So someone who has used the app since 1.1, and adds their heat pump today,
opens it and finds an empty history. The release note says so: the history
begins with the jobs logged from now on.

Hjemmet and the history per thing are free for everyone.
