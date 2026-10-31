---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-01-19T07:00:00Z
title: "Site disappeared from Google overnight: still indexed in Search Console, impressions down 99%"
slug: google-stopped-showing-our-site-in-a-day
featured: false
draft: false
tags:
  - ps-db
  - seo
description: On 26 October Google stopped showing ps·db, my PS5 game database, within one hour. Search Console still said indexed, there was no manual action, and Bing held. What I checked after the Google traffic drop, the suspects I ruled out, and a rule I was breaking all along.
---

Until 17:59 UTC on 26 October, Google showed [ps·db](https://ps-db.cloud), my
PS5 game database, 10 to 30 times an hour in its search results. From 18:00 it
showed it 0 or 1 times an hour. It stayed there.

On 25 October the site had 441 impressions in Google. On 30 October it had 5.
Every page fell at once, and the searches for the site's own name fell with
it.

## I blamed my own deploy

At 17:17 UTC that day, 43 minutes before the fall, a change of mine went live.
It gave the home page a new title and description. So the first suspect was
easy.

It didn't hold up. The change touched the home page only. No game page, no
sitemap, no robots.txt, no canonical, nothing the whole site shares. To cause
this, Google would have had to read the new home page inside those 43
minutes, then lower every other page within the hour because of one page's
title. No Google system I know of works that way.

The page that settled it was [Once Human's](https://ps-db.cloud/games/once-human).
Google had last crawled it on 11 October. It stopped ranking at 18:00 on 26
October, in the same hour as the home page. So did Metro 2039's page, last
crawled on 16 October. Nothing Google had read on those two pages had changed.
Whatever happened was a judgment about the site, not about a page Google had
just read again.

The rest of that afternoon went the same way. Seven production deploys
between 16:01 and 17:17 UTC, all green, each with a live check. A data update
at 18:27, after the fall had begun. And a crawler blocked at the door makes
pages drop out over days, as each recrawl fails. It doesn't take down a page
Google hasn't visited in two weeks, inside one hour.

## Indexed, but not shown

URL Inspection in Search Console, on the home page and two game pages, said
"Submitted and indexed" for all three. Robots allowed them, and Google's
chosen canonical was ours. I looked at Manual actions and Security issues
myself: nothing in either. Google Safe Browsing said no unsafe content.

Nothing had been removed. The home page still ranked, at an average position
of 36 where it used to be 7.4. Searches for the name, "ps db" and
"playstation database", went from 178 to 3. A noindex, a removal or a block
takes pages out. This left every page in and pushed them all down.

One number looked off at first. Search Console gave 26 October 171
impressions, about half a normal day, for a fall that came at 18:00 UTC. Its
days run on Pacific time, so its 26 October starts at 07:00 UTC. About 11
hours at the old rate of roughly 15 an hour makes about 165. The day fits the
hour.

## What an agent can't read

An agent went through the code and the live site, and wrote it up on 31
October. It could not read Search Console, the firewall in front of the site
or the server logs, and it wrote those down as unseen, never as "none". So
the write-up asks for four checks before any fix, to close what it couldn't
see. None needs code, and the first three are in any site's Search Console:

1. URL Inspection on the home page, for when Google last crawled it. Before
   17:17 UTC on 26 October means Google never read my change before the fall.
2. Settings, then Crawl stats: response codes and host status by day, 20 to
   30 October. A jump in 5xx or 4xx answers, or in robots.txt failures, on the
   26th would point at the deploys or at the firewall.
3. Removals, all three tabs, for any request or SafeSearch flag. Then Review
   snippets under Enhancements: did Google ever show stars, and is anything
   flagged?
4. The firewall's security events for 25 to 27 October, for the verified
   Googlebot: any challenge or block.

The write-up has no results for them.

## Only Google

ps·db has its own analytics, and the agent could read those, so there was a
second source. In the 12 days to 26 October, 47 sessions came from Google, 1
to 7 a day. In the 4 days after, none. Bing, DuckDuckGo and Brave sent about
5 a day before, and about 5 a day after.

So it was Google, and only Google. And Google had changed something. Search
Engine Roundtable reported volatility on 24 October, then on 27 October
[a new spike](https://www.seroundtable.com/google-search-ranking-volatility-42379.html)
that "seems to have started about 12 hours ago". Rank trackers read that
Monday at 9.4 out of 10 (Semrush) and 10 out of 10 (Wincher and Serpstat).
Google has confirmed nothing. Its
[Search Status Dashboard](https://status.search.google.com/) listed no update
for that date. The last one it listed was the September spam update, which
began on 24 September and ran 13 days. None of these sources is exact about
the hour. "The same day" is as far as they go.

Google's page on [core updates](https://developers.google.com/search/docs/appearance/core-updates)
has a part for "a sustained, large drop in position for your site as a
whole". It says to check the "site overall (not just individual pages)", and
that "it could take several months for our systems to learn and confirm that
the site as a whole is now producing helpful" content. That changed what I
was looking for. Not a trigger that fired at 18:00, but what Google might be
marking down across about 3,000 pages.

## What Google might be counting

The agent's write-up ranks each cause by how sure it is:

- Google re-scored the site as a whole that day: high.
- Thin, near-identical game pages: medium, the likeliest candidate.
- Ratings from another site, marked up as review stars: low as the cause,
  high as a broken rule.
- Words on the crawler's page that a visitor never sees: low as the cause,
  low to medium as a contributor.
- My home page change at 17:17: low.
- Every game page retitled twice in a month to match searches: low to medium,
  as a contributor. The other changes from 5 to 26 October: no.
- Removals, robots.txt, the old domains, a firewall blocking Googlebot: low.

The thin pages first. 3,149 of the sitemap's 3,154 URLs are game pages. On a
sample of 40, fetched the way Googlebot fetches them, a page had a median of
134 words, and 83 without the list of similar games. Its one paragraph is the
game's summary from IGDB, word for word, cut at 200 characters. Publishers
write those summaries, and IGDB and the stores show the same text. No sentence
on a game page was ps·db's own. A median of 32% of each page's three-word runs
also turned up on other pages. Google's [spam
policies](https://developers.google.com/search/docs/essentials/spam-policies)
give "Scraping feeds, search results, or other content to generate many
pages" as an example of scaled content abuse. What speaks against it: ps·db is
a database people use, with two sources matched up, filters and similar games.
On a page of 83 words, little of that shows.

The retitling is mine twice over. On 29 September every game title got "age
rating" and the time to beat. On 14 October they changed again: the snippet
now opened with the age rating, and the title ended in "ESRB rating | ps·db".
It worked for a while. On the 126 pages measured, searches with "age" in them
went from 15 impressions to 116, and I [wrote it up as a
win](/posts/how-ps-db-got-indexed-by-google/). Google's page on [helpful
content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
lists warning signs, and the first is "Is the content primarily made to
attract visits from search engines?". 3,000 pages retitled twice in a month to
match search patterns may well read as a yes.

And the visible page never said "age rating". ps·db builds its pages in the
browser, and crawlers get a plain HTML version of each one. For a game rated
Teen, that version said "ESRB Age Rating: Teen". A visitor saw a badge with a
"T" on it, and "ESRB: Teen" only in a hover tooltip, which a phone never
shows. The spam policies list, as cloaking, "Inserting text or keywords into a
page only when the user agent that is requesting the page is a search
engine". The words named a fact the visitor did see, as a letter. They were
also the exact words the titles were built around.

One more thing came out of that comparison. Search Console's live URL test
has no "Googlebot" in its user agent, so ps·db served it the browser's page.
The live test showed what a browser gets, not what Googlebot is served.

## A rule I was breaking anyway

Every game page's structured data had an `aggregateRating`: IGDB's score and
its count of ratings, offered as review stars. 36 of the 40 sampled pages had
it, so about 2,800 across the site. Google's [review snippet
guidelines](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
say: "Don't aggregate reviews or ratings from other websites." IGDB's score is
collected on igdb.com, not on ps·db.

It is probably not the cause. Google's stated penalty is a manual action,
after which the markup is ignored, and there was no manual action. A breach
like this costs stars, not rankings. But it was a plain breach on most pages,
and a judgment about the whole site may count it.

Both rule breaks were gone on 31 October. The `aggregateRating` went, and the
scores stay on the page as plain facts. The game page now spells the rating
out beside its badge: "Age rating: ESRB Mature, ages 17+".

That wording took one wrong turn. The first one on the table was "ESRB Teen,
ages 13+". The agent wrote the test before the change: render the crawler
page with and without a rating, take every word the rating adds, and require
each one on the visitor's page. "ESRB Teen, ages 13+" failed it for every
rating, because the crawler page says "age rating" twice. Keeping the "age
rating" searches meant the visitor page had to say it too.

## Waiting on Google

No single cause is proven, so the fixes are ranked by how sure each problem
is, against its cost:

1. Stop the two rule breaks. Small, low risk, live on 31 October. The
   write-up doesn't expect it to bring the rankings back. It takes away two
   things a spam system could count.
2. Take the thin tail out of the index: noindex, and out of the sitemap, for
   the game pages with no Google impressions in the 90 days before 26 October
   and nothing beyond IGDB's own data. Small to medium, medium risk. If
   Google's change reverses by itself, those pages lose their long tail for
   weeks after the noindex comes off.
3. Give each page something only ps·db has: the full summary, both scores
   side by side, the time to beat against the genre, and why each similar
   game is similar. Medium to high, low to medium risk, and the one aimed at
   the likeliest cause.

I said fix 1 now, and fix 2 only if the 11 November reading shows no
recovery.

The numbers, as of 31 October. Search Console, Google only:

- Impressions a day, 22 to 25 October: 333, 362, 371, 441.
- 26 October: 171. About 10 to 30 an hour until 17:59 UTC, then 0 to 1.
- 27 to 30 October: 3, 3, 4, 5.
- Pages with impressions: 763 in the 14 days before, 8 in the 5 days after.
- Searches for the name: 178 before, 3 after.
- Home page average position: 7.4 before, 36 after.

ps·db's own analytics, sessions by referrer:

- Google: 47 from 15 to 26 October, 0 from 27 to 30 October.
- Bing, DuckDuckGo and Brave: 65, then 20. About 5 a day both times.

I wrote this on 31 October, the day fix 1 went live. Two readings were set.
On 11 November, impressions a day in Search Console. The mark is over 100 a
day, and below it, fix 2 is next. On 25 November, the Review snippets
report, which should show 0 valid items once Google has seen fix 1, and the
impressions again.
