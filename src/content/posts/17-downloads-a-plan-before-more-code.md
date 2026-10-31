---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-01-12T07:00:00Z
title: "Almost no downloads for my indie app: 17 in six weeks on the App Store, and a plan before more code"
slug: 17-downloads-a-plan-before-more-code
featured: false
draft: false
tags:
  - vedlikeholdsloggen
  - app-store
description: My home maintenance app Vedlikeholdsloggen had 17 first-time App Store downloads in six weeks, against a goal of 300. Its product page converts, and almost nobody sees it. The next step is three ASO and distribution checks, cheapest first, and no code.
---

On 31 October I opened App Store Connect and read one number. 17
first-time downloads, from launch on 18 September to 30 October. The goal
was 300 or more. This post is what I knew that day, and the plan that came
out of it.

The app is
[Vedlikeholdsloggen](https://vedlikeholdsloggen.buildforge.no/), a Norwegian
app that reminds me when to do the upkeep on a house or a cabin, and keeps a
log of what got done. It is in the
[App Store](https://apps.apple.com/no/app/vedlikeholdsloggen/id6812536099).
It also has a paid tier, Pluss, and the goal said 3% or more should buy it. I
didn't read that rate. With 17 downloads, 3% is half a buyer, so it couldn't
change anything.

7 of the 17 came in the first 13 days. So 10 came in the 30 days after.

## The rule from launch

My launch plan has a line on what success means. In my translation: under
100 downloads is a distribution problem, not a product problem, and then App
Store search (ASO) gets fixed before one line of code is touched.

So the rule was there. On 1 October, 13 days in, I read the funnel:

- 66 views in the App Store.
- 26 product page views, 39% of the views.
- 7 downloads, 27% of the page views.

The conclusion that day: the store page works, the problem is that almost
nobody sees it. Search alone doesn't give volume, and the traffic has to come
from outside the store.

That was the right reading. Then I spent the next weeks on the app.

On 30 September I had said yes to a list of the things in a home, and on 1
October I had a bigger idea: put the things at the centre of the whole app. A
new tab, a history for each appliance, a fix when the first version linked a
grill to every outdoor task. All of it merged in the first week of October.
Version 1.2 went live on 19 October, and I [wrote a
post](/posts/vedlikeholdsloggen-1-2-history-per-thing/) about it. Next on the
list was a new test layer that runs the real app on a simulator, and it costs
money to run.

1.2 did carry new search keywords. That part followed the rule. The rest was
code, built while the number that mattered was views, and in the first 13
days views were about 5 a day. At the end of October I put the test layer on hold, and asked for a plan
for how the app gets users first.

## Most of what I tried was never read

An agent read the launch docs and wrote the plan, in Norwegian, with a
source after each number. Where a number had not been read, it says "ikke
lest", not read. Unknown is never written as 0.

What it found, as of 31 October:

- App Store search. With 1.2, the app is number 2 for `boligvedlikehold` and
  `vedlikeholdsplan` (home maintenance, maintenance plan), where it wasn't
  listed at all on 4 October. Each word has only 4 or 5 apps.
- Product Hunt and X. I posted there by 29 September. I expected zero
  Norwegian installs from it. Not read.
- A nomination to Apple's editors, sent 1 October, for 2 to 15 November. No
  answer by 31 October. Apple picks.
- This blog: posts on 19 and 27 October. Not read. The blog has no analytics,
  so it can't count what it sends.
- The website and its articles: in Google from 2 October, with Apple's app
  banner on every page from 4 October. From 1 to 28 September, Search Console
  showed 1 impression and 0 clicks. Not read since.
- The local paper: not tried. Instagram: parked, since it needs a post every
  week.

The agent's first draft had one guess in it. It said those two narrow words
have few competitors, "and probably few searches". Its own read-through took
that out. The lookup it used shows how many apps a word returns, not how many
people search for it. The plan now says that.

The ranks it measured, through Apple's public search API for Norway, as a
stand-in for the App Store's own search:

- `vedlikehold` (maintenance): 6th of 178 apps.
- `vedlikehold hus` (house maintenance): 1st of 10.
- `leilighet` (apartment): 19th of 103.
- `hytte` (cabin): 49th of 154.
- `varmepumpe` (heat pump): 34th of 61.
- `hus` (house) and `bolig` (home): not among the 180 and 183 apps the
  search returned.

And 0 ratings. The app asks for one after the 10th finished task, and only
since 1.2.

## Apple shows nothing under five

The plan names one screen. In App Store Connect: Apps, then the app, then
Analytics, then Sources under Acquisition. Apple's
[page on it](https://developer.apple.com/help/app-store-connect-analytics/acquisition/acquisition)
has the definitions. The numbers that matter here are Unique Impressions (how
many devices saw the app in the App Store), Unique Product Page Views, and
First-Time Downloads. Each one splits by source: App Store search, App Store
browse, a web page in Safari, or a link in an app.

Two things on Apple's pages changed how I read it. A tap on a link in Chrome
counts as the Chrome app, under app referrers, not as a website. And Apple
shows a metric only once the app has
[at least five](https://developer.apple.com/help/app-store-connect/reference/app-metrics)
first-time downloads. So the plan reads a source that isn't shown as not
shown, never as 0.

The plan reads that screen in two passes. First the shares: if they still
look like 1 October, about 39% from view to page and 27% from page to
download, the page is not the problem. If either has fallen below half of
that, the page gets fixed before anything else. That line is a judgement,
not Apple's. Only then the count that decides the next step: Unique
Impressions from App Store search, which is what step 1 below is judged
on. The 1 October reading didn't say whether its
views were unique, so I only compare shares, and only roughly.

That first reading, split by source, was not done when the plan was written.
Every cell in its table says not read.

## Three readings and one e-mail

None of them costs money. Each one has the one number that says whether it
worked.

1. Judge 1.3's subtitle and keywords. Version 1.3 went to App Review on 31
   October with the subtitle "Vedlikehold av hus og hytte" (maintenance of
   house and cabin), and `leilighet` in place of `varmepumpe` in the
   keywords. The number is Unique Impressions from App Store search, per day,
   against the rate from launch to 30 October. It worked if that doubled. The
   reading was set for 1 December, or 28 days after release if 1.3 was not
   out by 3 November. 28 days and not 14, because at about 5 views a day a doubling in
   two weeks could be chance. The editors' window falls in the same weeks,
   and a feature from them counts as browse, not search, so search is read on
   its own.
2. Read the website in its season. It is the one channel that runs by
   itself, and nobody has read what it gave since September. The number is
   page views from the website as a web referrer, plus clicks in Search
   Console. Clicks in Google but no visits to the App Store would mean people
   stop between the article and the store.
3. One e-mail to a local paper. It is the only channel here that could give a
   jump, and the most uncertain one. The angle is the person and the problem,
   not the app. The number is first-time downloads from web and app referrers,
   14 days after the story runs. It worked at 5 or more, which is where Apple
   starts to show a number at all.

Left out on purpose: Apple Ads (the price hasn't been read, and this plan
spends nothing), new screenshots (the page converted on 1 October), and code.

## What 17 downloads still said

17 is a small number, and it still said something clear once it was split.
The page did its job for the few who saw it. So the question for now isn't
what the app does. It is how many people see it in the store, and from
where.

The numbers, read on 31 October:

- First-time downloads, 18 September to 30 October: 17. Goal: 300 or more.
- First 13 days: 7. The 30 days after: 10.
- On 1 October: 66 views, 26 page views, 7 downloads.
- Ratings: 0.
- Impressions by source: not read yet.

The plan was written on 31 October, before any of the three steps, and so
was this post. Which steps run is my call, and nothing in the plan spends
money. The first reading, the one for 1.3's subtitle and keywords, was set
for 1 December.
