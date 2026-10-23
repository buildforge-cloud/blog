---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-11-03T07:00:00Z
title: "Making a React site faster on phones: two measured rounds of PageSpeed"
slug: ps-db-phone-speed-two-rounds
featured: false
draft: false
tags:
  - ps-db
  - performance
description: My game database scored 65 on PageSpeed on a phone. The biggest cost was not on PageSpeed's list. The phone built the whole desktop layout and then hid it. Round one took the home page to 85, and round two found a cause the list never named either.
---

On 15 October the home page of [ps·db](https://ps-db.cloud), my PlayStation 5
game database, scored 65 out of 100 on PageSpeed for a phone. I wanted 90.

Even the 65 was shaky. The three runs behind it were 64, 83 and 65. In the
two low ones, PageSpeed's own load drew nothing for over two seconds while the
page sat idle. The agent looked for a cause in the app and found none. So from
the first day the rule was to read all three runs, not only the median.

## The list said JavaScript and images

For the home page, PageSpeed's top three were unused JavaScript, image
delivery and a CSS file that blocks the render. The unused JavaScript was
162 KiB: 76 of it our own bundle, 64 PostHog and 22 Sentry. I had already
decided that PostHog and Sentry load the way they do, so that part was not on
the table. The image was the hero at the top of the page, a 1280 px file shown
in a 721 px box. Lower down, among the other failing checks, was a 33 ms
forced reflow that pointed into the desktop filter sidebar's code. It
pointed at the right part of the page, but the cause came from somewhere
else.

## The phone was building the desktop page too

Instead of working down the list, the agent recorded a CPU profile of a phone
load. The real build in Chrome, at phone size, with the CPU slowed 4×, and
production's data. The profile showed the phone building the whole desktop
layout: a table with 24 rows and the filter sidebar. Then CSS hid both. About
300 ms of work before the first paint, for nothing anyone could see.

The page had always built both layouts and let CSS pick one. A hidden part
still costs the phone the work of building it.

The first fix went all the way: build only the layout for the current width.
The code review caught what that breaks. Open the Filters sheet on a tablet,
turn it so it crosses the width where the desktop layout starts, and the sheet
closes. An iPad mini is 744 px wide in portrait. So the phone layout is built
at every width again, and only the desktop-only parts wait for a wide screen.
The reviewing agent counted the page at 390 px: 2427 elements before, 1181
after.

The same profile had smaller costs in it. Each date in a list built its own
date formatter, 45 to 57 ms for a list. A sort's first call to
`localeCompare` loaded the browser's collation data, 37 ms, inside a script
that holds up the rest of the page. From PageSpeed's list, the hero picture
became WebP, about a quarter smaller. Its size in pixels stayed the same.

On the agent's phone setup, the home page's first paint went from 1.2
seconds to just under 1. The time the page was blocked after that first paint
went from 104 ms to 1.

One number went the wrong way. PageSpeed's count of our own unused
JavaScript grew from 76 to 93 KiB. The phone still downloads the table code.
It just doesn't run it any more. Loading the
table later would cost every desktop visit a round trip, and that was tried
and reverted once in July.

PageSpeed again, on 19 October, with round one live:

| page        | before | after | LCP before | LCP after |
| ----------- | ------ | ----- | ---------- | --------- |
| home        | 65     | 85    | 5.29 s     | 3.93 s    |
| game page   | 81     | 82    | 4.66 s     | 4.58 s    |
| coming soon | 79     | 80    | 5.04 s     | 4.81 s    |

The home page moved 20 points. The other two barely moved. None reached 90.

## The worst page had a cause the list didn't name

Round two started with a fresh run that evening: home 86, game page 83,
coming soon 81. Coming soon was now the worst page.

PageSpeed's list did not say why. The trace did. On coming soon, the hero
image started loading at 633 ms. On the home page it started at 153 ms.

The page's HTML has a small script that asks for the hero's data and starts
its image before the app's code has even loaded. It only did that on the home
page. That rule was older than the hero on the other list pages. When the
hero moved to every list page, the early start stayed behind on the one page
that used to have it. Now it runs on every list page.

On the phone setup, coming soon's largest paint went from 3.7 seconds to
2.4. Its first paint got about half a second later. The hero image now downloads next to the
app's code and shares the connection, so the code arrives later. The home page
made the same trade earlier in October. The trade stays, because the hero
image is the page's largest paint.

A game page waits for a different thing: its description, which comes from
the API. That request used to wait for the app's code, then the page's own
code, then a render. Now the HTML starts it while it is still being read. The
game page's largest paint came about a quarter of a second sooner.

One idea measured slower. Preloading the game page's own code from the HTML
sounded like an easy win. On the phone setup the largest paint came about 50 ms
later. That code competes with the main bundle for the connection, and
the wait is the phone's CPU, not the round trip. It was dropped.

Two more costs went. The release notes' text left the main bundle, which got
about 16 KiB smaller compressed. And a game page's gallery stopped drawing
144 × 80 thumbnails from 1080p screenshots. On Elden Ring's page those were
1.6 MB.

## The score I asked for and the causes I got

Round two went live on the evening of 19 October. PageSpeed measured it on
23 October, on a phone, as the median of three runs:

| page        | round one | round two | LCP round one | LCP round two |
| ----------- | --------- | --------- | ------------- | ------------- |
| home        | 85        | 87        | 3.93 s        | 3.85 s        |
| game page   | 82        | 84        | 4.58 s        | 4.23 s        |
| coming soon | 80        | 90        | 4.81 s        | 3.36 s        |

The trade on coming soon paid. Its largest paint came almost 1.5 seconds
sooner, and it went from the worst page to the only one at 90. The other two
moved two points each. The runs still spread: the home page's three were 77,
87 and 90, and coming soon's were 80, 90 and 90.

What I take from both rounds is about the list. I asked for a score, and the
score came with a list of what to fix. In both rounds the biggest cause was
not on it. In round one the only hint was a 33 ms line below the list, and
the cause itself showed up in a CPU profile. In round two it was one line of
timing in the trace, on the page with the worst score.
