---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-01-19T07:00:00Z
title: "Almost no downloads for my indie app: 17 in six weeks on the App Store, and a plan before more code"
slug: 17-downloads-a-plan-before-more-code
featured: false
draft: false
tags:
  - vedlikeholdsloggen
  - app-store
description: My home maintenance app Vedlikeholdsloggen had 17 first-time App Store downloads in six weeks, against a goal of 300. Its product page converts, and almost nobody sees it. The next step is two readings and one e-mail, and no code.
---

On 31 October I opened App Store Connect and read one number. 17 first-time
downloads, from launch on 18 September to 30 October. The goal was 300 or
more. This post is what I knew that day, and the plan that came out of it.

The app is [Vedlikeholdsloggen](https://vedlikeholdsloggen.buildforge.no/), a
Norwegian app that reminds me when to do the upkeep on a house or a cabin, and
keeps a log of what got done. It is in the [App
Store](https://apps.apple.com/no/app/vedlikeholdsloggen/id6812536099). It also
has a paid tier, Pluss, and the goal said 3% or more should buy it. I didn't
read that rate. With 17 downloads, 3% is half a buyer, so it couldn't change
anything.

7 of the 17 came in the first 13 days. So 10 came in the 30 days after.

## The rule from launch

My launch plan has a line on what success means. In my translation: under 100
downloads is a distribution problem, not a product problem, and then the App
Store listing and its search words (ASO) get fixed before one line of code is
touched.

So the rule was there. On 1 October, 13 days in, I read the funnel in App
Store Connect:

- 66 impressions: times the app was shown in the App Store, in search results
  or lists.
- 26 product page views, 39% of the impressions.
- 7 downloads, 27% of the page views.

The conclusion that day: the store page works, and the problem is that almost
nobody sees it. Search alone doesn't give volume, so the traffic has to come
from outside the store.

That was the right reading. Then I spent the next weeks on the app.

I build the app with AI coding agents, and I decide what they work on. On 30
September I had said yes to a new feature: a list of the things in a home,
like the heat pump or the water heater. On 1 October I had a bigger idea: put
those things at the centre of the whole app. A new tab, a history for each
appliance, and a fix for how tasks were linked to them. All of it merged in
the first week of October. Version 1.2 went live on 19 October, and I [wrote a
post](/posts/vedlikeholdsloggen-1-2-history-per-thing/) about it. Next on my
list was a new kind of test that runs the real app on a simulator, on a paid
build service.

1.2 did carry new search keywords. That part followed the rule. The rest was
code, built while the real problem was that too few people saw the app in the
store: in the first 13 days, about 5 impressions a day. At the end of October
I put the new tests on hold, and asked an agent for a plan for how the app
gets users first.

## Most of what I tried was never measured

The agent read my launch plan and notes and wrote the new plan, in Norwegian,
with a source after each number. Where a number had not been read, it says
"ikke lest", not read. It never writes an unknown as 0.

What it found, as of 31 October:

- App Store search: the app was found for some words and not for others. The
  ranks are below.
- Product Hunt and X: I posted there by 29 September. I expected zero
  Norwegian installs from it. Not read.
- A nomination to Apple's editors, who pick the apps the App Store features,
  sent 1 October for a feature from 2 to 15 November. No answer by 31 October.
- This blog: posts on 19 and 27 October. Not read. The blog has no analytics,
  so it can't count what it sends.
- The app's own website and its articles on upkeep: Google read the sitemap on
  2 October, and Apple's Smart App Banner, which links to the app in the App
  Store, was on every page from 5 October. The last reading in Google's Search
  Console, for 1 to 28 September, showed 1 impression and 0 clicks.
- The local paper: not tried. Instagram: parked, since it needs a post every
  week.

The ranks came from Apple's public search API for Norway, a stand-in for the
App Store's own search:

- `boligvedlikehold` (home maintenance): 2nd of 5 apps. Not listed at all on 4
  October, before 1.2's keywords.
- `vedlikeholdsplan` (maintenance plan): 2nd of 4. Also not listed on 4
  October.
- `vedlikehold` (maintenance): 6th of 178.
- `vedlikehold hus` (house maintenance): 1st of 10.
- `leilighet` (apartment): 19th of 103.
- `hytte` (cabin): 49th of 154.
- `varmepumpe` (heat pump): 34th of 61.
- `hus` (house) and `bolig` (home): not among the 180 and 183 apps the search
  returned.

The agent's first draft had one guess in it. It said `boligvedlikehold` and
`vedlikeholdsplan` have few competitors, "and probably few searches". When it
checked its own draft, it took that out. The search API shows how many apps a
word returns, not how many people search for it. The plan now says that.

And 0 ratings. The app asks for one after the 10th finished task, and only
since 1.2.

## Reading App Store Connect by source

The plan names one screen. In App Store Connect: Apps, then the app, then
Analytics, then Sources under Acquisition. Apple's [page on
it](https://developer.apple.com/help/app-store-connect-analytics/acquisition/acquisition)
has the definitions. The numbers that matter here are Unique Impressions (how
many devices saw the app in the App Store), Unique Product Page Views, and
First-Time Downloads. Each one splits by source: App Store search, App Store
browse, a web page in Safari, or a link in another app.

Two things on Apple's pages changed how I read it. A tap on a link in Chrome
counts as the Chrome app, under app referrers, not as a website. And Apple
shows these metrics only once the app has [at least
five](https://developer.apple.com/help/app-store-connect/reference/app-metrics)
first-time downloads or pre-orders in all. So where Apple shows nothing, the
plan writes "not shown", never 0.

The plan reads that screen in two passes. First the shares: if they still look
like 1 October, about 39% from impression to page and 27% from page to
download, the page is not the problem. If either has fallen below half of
that, the page gets fixed before anything else. The half-way line is my own
judgement, not Apple's. Only then comes the count that decides the next step:
Unique Impressions from App Store search, which step 1 below is judged on. The
1 October numbers didn't say whether they counted unique devices. A share is
less thrown off by that than a count, so I compare only the shares with them,
and only roughly.

That first reading, split by source, was not done when the plan was written.
Every cell in the plan's table for it says not read.

## Two readings and one e-mail

None of them costs money, and each one names the number that says whether it
worked.

1. Judge the new store text in version 1.3, the app update I sent to Apple's
   App Review on 31 October. It has the subtitle "Vedlikehold av hus og hytte"
   (maintenance of house and cabin), and `leilighet` in place of `varmepumpe`
   in the keyword field. It already ranked 19th for `leilighet` without the
   word there. 1.3 went live on 1 November. The number is Unique Impressions
   from App Store search per day, against the same number for launch to 30
   October, read from the same screen. It worked if that doubled. The reading
   is set for 1 December, four weeks on and not two, because at about 5
   impressions a day a doubling in two weeks could be chance. The 2 to 15
   November window I asked Apple's editors for falls in the same weeks, and a
   feature from them counts as browse, not search, so search is read on its
   own.
2. Read what the website gives. It is the one channel that runs by itself, and
   nobody has read it since September. The numbers are product page views that
   came from a link on the website (Apple calls that a web referrer), and
   clicks in Search Console. Clicks in Google but no visits to the App Store
   would mean people stop between the article and the store.
3. One e-mail to a local paper. It is the only channel here that could give a
   jump, and the most uncertain one. The story would be about me and the
   problem the app solves, not about the app. The number is first-time
   downloads from web pages and other apps, 14 days after the story runs. It
   worked at 5 or more.

Left out on purpose: Apple Ads (the price hasn't been read, and this plan
spends nothing), new screenshots (the page converted on 1 October), and code.

## What 17 downloads still said

The first 7 downloads, split into impressions, page views and downloads on 1
October, showed that the page did its job for the few who saw it. So my
question now is how many people see the app in the store, and from where.

The numbers, read on 31 October:

- First-time downloads, 18 September to 30 October: 17. Goal: 300 or more.
- First 13 days: 7. The 30 days after: 10.
- On 1 October: 66 impressions, 26 page views, 7 downloads.
- Ratings: 0.
- Impressions by source: not read yet.

I wrote this post on 31 October, the day of the plan, before any of its steps
had run. I said yes to all three steps, in order, that day, and checked the
post's facts again on 24 November. The first reading, for 1.3's subtitle and
keywords, is set for 1 December.
