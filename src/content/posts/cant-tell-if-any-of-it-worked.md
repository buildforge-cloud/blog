---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-08-08T18:00:00Z
title: I can't tell if any of it worked
slug: cant-tell-if-any-of-it-worked
featured: false
draft: false
tags:
  - ps-db
  - seo
description: SEO is the first thing I've built where I genuinely can't see whether I'm right. The browser lies, the reports arrive weeks late, and the one instrument I built myself lied too.
---

For a few days in July I thought [ps·db](https://ps-db.cloud) was doing fine on
Google. Search Console said the site averaged position 2.8 for its own name.
That's page one, near the top.

Then I searched for it logged out, in a private window, and got nothing. Not a
bad ranking. Nothing, through seven pages, until Google gives up and shows the
screen where it admits it has run out of results.

The 2.8 was me. My own searches, my own clicks, handed back to me as a ranking.
I'd been reading my own reflection and calling it data.

I've been building things for a while now where the feedback loop is basically
instant. Something renders or it doesn't. A test passes or it doesn't. The
container starts or the logs tell me why not. SEO is the first thing I've worked
on where I genuinely cannot see whether I'm right, and three weeks after that
incognito search I found out how much worse that gets.

## The morning I sat down to close an email

Google sent me a warning that some pages weren't found. I opened it expecting
ten minutes of work.

It was two URLs. The `www` variants of the homepage. I went looking for when
Google had last crawled them, found the timestamp, and then found the commit
that added the `www` redirect. It had landed eight hours after Google's last
look. The report describing something broken reached my inbox ten days after it
stopped being broken.

There was nothing to fix. The correct response was to click a button in Search
Console telling it to check again.

That's twice now that I've run a full investigation into code that was already
correct. Both times the answer was sitting in `git log` the whole time, and both
times I went straight to the source instead. So the rule I've written down for
myself isn't about robots.txt or redirects, it's about time: before anything
else, when did Google last actually look at this, and did I ship something
after that. Every report is a photograph of a moment that has already passed.

While I was in there, I checked the sitemap report. 2,784 URLs submitted, 0
indexed.

That counter has a reputation for being wrong, so I didn't believe it. I pulled
300 URLs spread evenly across the sitemap, so the sample wouldn't be skewed
toward whatever sorts first, and inspected each one. 297 came back as "URL is
unknown to Google."

Unknown is a specific word and I had to look up what it meant. Not blocked. Not
rejected. Not judged and found wanting. Never discovered. Never queued. Ninety
days of performance data confirmed it: two clicks, fifty-one impressions, every
single one of them on the homepage. No game page has ever appeared in a search
result for anybody.

I'd been shipping to this site for weeks. Google had looked at one page of it.

## Being right turns out not to be enough

The most likely explanation is that a domain migration never finished. ps·db
moved off a subdomain onto its own domain in July, and `/about` (one of the
literal handful of pages Google has ever crawled) still reports its canonical
as the old address. Google believes the real site lives somewhere else, which
would make every page at the new address look like a copy of it.

So I checked the redirects. Every Google user agent I could think of, IPv4 and
IPv6, cert, robots.txt. All of them clean 301s pointing exactly where they
should. I checked them from about five angles and they were correct from every
one.

It didn't matter. Correct redirects are apparently not the signal. The signal
is a tool called Change of Address, which is UI-only, has no API, and quietly
rejects the 308 that our proxy issues by default (which is why these particular
redirects are hand-written 301s at the nginx layer in the first place). When I
went to run it, its own verification step failed with "could not fetch the
page."

I still don't know whether that's the whole story. The test is to complete it,
wait a week, and look again. That's the actual debugging cycle here. A week.

## Everything looked fine, and that was the problem

Somewhere in the middle of this I noticed that every SEO bug this project has
ever had shares one property: the browser said it was fine.

Four real pages on the site were returning 404 to Googlebot while returning 200
to everyone with eyes. The privacy page, two list pages, every DLC page. Each
had been broken since the day it shipped, one of them for six weeks. Nobody
noticed because every browser test passed and the crawler path had no tests at
all.

Before that, `HEAD` requests were failing across the entire API, which is
invisible in normal use and happens to be exactly how Search Console's
validators knock on the door. Sitemap submission failed with a message about an
invalid address, which is not what was wrong. Before that, the favicon and the
social preview image were unreachable to any crawler, because the same rule
that routes bots to a server-rendered page was catching image requests too.

Every one of those looked perfect in Chrome. There is a whole category of bug
here that only exists for visitors I can't be, and I had been testing the site
by being a visitor.

## Then the instrument lied too

I decided the fix for all this was tooling, so I turned the project's accumulated
incidents into a reusable audit script and pointed it at production as its first
real test.

It reported a clean crawler-versus-browser check on a site I knew for a fact had
three broken routes.

It found the routes to test by reading the sitemap and following links on the
homepage. None of the three were in either place, and that isn't bad luck. A
route that's broken for crawlers tends to be missing from the sitemap for
exactly that reason, and an app that renders on the client serves no links at
all in its shell. The discovery method was structurally blind to the entire
category of bug the tool exists to find.

I fixed it by feeding routes in from the router source directly, then had to fix
the fix, because guessing at conventional paths made it over-report: when the
catch-all returns 200 for any URL, a page that doesn't exist and a page that's
broken look identical over HTTP.

A tool built from a list of my own bugs, unable to find those bugs. That one
sat with me for a while.

I got something else wrong in the same stretch, and it's the more embarrassing
kind. When I filed the crawler-404 routes, I wrote that they were the cause of
the "not found" email. They weren't. Those four pages are unknown to Google and
have never been crawled, so they can't be responsible for a report about
crawling. The bug was real, my explanation of it was tidy, and tidy is what made
it wrong. I went back and corrected the issue rather than leaving it, mostly
because the wrong version was the satisfying one and I'd have believed it again
in a month.

## Where that leaves me

I have issues open about Lighthouse scores and render performance on pages that
Google has never once requested. I'm not going to touch them. There's no point
optimising the loading speed of a page nobody can find, and the measurement that
actually feeds ranking needs real visitors before it reports anything at all.

The uncomfortable part is that the real problem might not be a problem I can
solve by writing code. A two-week-old domain with almost no inbound links stays
invisible no matter how correct it is. I can keep making the site more
technically perfect and it would change nothing, and I'd feel productive the
entire time. That's a specific trap I can feel the shape of now.

Meanwhile there's a landmine sitting in the ingest pipeline. Every game's URL
comes from a slug copied out of an upstream API, the whole database is dropped
and rebuilt on every refresh, and there's no alias table anywhere. If anything
upstream gets retitled, the URL silently changes and the old one 404s forever.
The change report keys on a numeric id, so a retitle doesn't even show up as a
line in the diff.

It's completely harmless right now, because nothing is indexed for it to break.

Being relieved about that is a strange feeling.
