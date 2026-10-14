---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-10-14T06:50:00Z
title: How ps·db went from 0 to 41% of its pages indexed by Google
slug: how-ps-db-got-indexed-by-google
featured: false
draft: false
tags:
  - ps-db
  - seo
description: In August Google knew one page of ps·db, my PS5 game database. By October it had indexed 41% of a 300-page sample. I blamed the domain move first. The real cause was a dead end in my own links.
---

On 8 August 2026, Google knew one page of [ps·db](https://ps-db.cloud), my
PlayStation 5 game database. The homepage. I checked 300 pages from the sitemap,
spread evenly across it. 297 came back as "URL is unknown to Google". Not
rejected. Never seen.

On 14 October I ran the same check again. 124 of 300 were indexed. That is 41%.

This post is about what happened between those two numbers. Most of it is me
blaming the wrong thing.

## I blamed the domain move

ps·db moved from a subdomain to its own domain on 23 July. So when Google said
zero, the move was the obvious suspect. One page, `/about`, even showed the old
address as the one Google had picked as the real one. I wrote
[a whole post](/posts/cant-tell-if-any-of-it-worked/) around that, and in it I
said the signal Google wanted was a tool called Change of Address.

That was wrong. On 9 August I could read the old domain's own Search Console
data for the first time. Its sitemap report, from two days before the move,
said 2,773 submitted and 0 indexed. The move had not lost anything. There was
nothing to lose. Change of Address passes on what a site already has, and the
site had nothing.

The move did cost a little. A handful of game pages had ranked on the old
address, at positions 2.6 to 4.4. Three of the four links to ps·db that I knew
about still pointed at the old address too: Product Hunt, my studio's
portfolio, and the About page of this blog. By the end of 9 August all four
pointed at the new one. That was worth doing. It was not the cause.

## Google had nowhere to walk

The cause turned up on 6 September, and it was in my own code.

ps·db builds its pages in the browser. Crawlers get a separate plain HTML
version of each page. I fetched that version the way Googlebot does and counted
the links. The homepage had 24 links to games. A game page had 0 links to other
games.

So to a crawler, the whole site was the homepage, 24 games, and a dead end. The
other games, about 2,800 of them, had no link from anywhere on the site. The
only way to find them was the sitemap. A sitemap is a hint, not a path, and
Google had downloaded it and done almost nothing with it.

The real game page has always had a list of similar games. The crawler version
never got it. Every browser test passed, because a browser never sees the
crawler version. My 8 August post,
[I can't tell if any of it worked](/posts/cant-tell-if-any-of-it-worked/), was
about exactly this kind of bug, the kind only a crawler can see, and I still
missed this one for a month.

## Two fixes on one day

The first fix put the similar games on the crawler page too, 10 links per game.
Then I walked the links the way a crawler would. 1,659 of 2,781 games could now
be reached, 59.7%. Before the fix it was 24.

That still left 1,122 games out, and better data could not fix it. A popular
game gets linked from many pages. An obscure one links out to ten others, and
nothing links back.

The second fix, the same day, made the homepage list walkable page by page,
with a "next page" link a crawler can follow. I walked the live site as
Googlebot, following only those links, and compared the result with the
sitemap. 2,850 of 2,850 games reached. None missed.

One honest note: the climb had started before either fix. Daily impressions
jumped on 23 August, from about 2 to 11 a day to 30 to 51. Google was already
coming round on its own. What the fixes changed is that it now had somewhere to
go.

## Found is not the same as ranked

On 11 September the game pages Google had crawled sat at position 40 to 80,
with no clicks. Every search that reached them had the same shape: a game name
plus one fact. "horizon zero dawn esrb". "how long is disco elysium the final
cut". But the title was only the game name and the site name, and the
description was the game's story blurb. The facts people searched for were on
the page, just not in the two places Google weighs most.

So the titles changed to name those facts, live the evening of 11 September.
Measured on 30 September, 16 days after against 16 days before: game pages
went from 243 to 692 impressions, and their average position went from 55.9 to
15.3. [Chicory](https://ps-db.cloud/games/chicory-a-colorful-tale), a small
indie game, went from position 66.1 to 14.4.

I can't give the titles all the credit. Indexing roughly tripled in the same
weeks, so part of that gain is just more pages in the index.

Two more changes went live on 29 September. Game titles also say "age rating"
and time to beat now, and page 2 of the game list got its own title, so it
stopped taking searches for "ps db" away from the homepage. The 14 October
check says both did their job. Searches with "age" in them went from position
40.1 to 16.2. The homepage got 29 clicks in 12 days, up from 16.

## The numbers, in order

The same 300-page sample, the same tool, every time:

- 8 August: 1 indexed, 297 unknown to Google
- 6 September: 8 indexed, 289 unknown
- 16 September: 24 indexed, 262 unknown
- 30 September: 111 indexed (37%), 169 unknown
- 14 October: 124 indexed (41%), 168 unknown

Across the whole site, the 90 days to 8 August had 51 impressions and 2 clicks.
The 12 days from 30 September to 11 October had 1,900 impressions and 39
clicks.

Google's own sitemap counter still says 0 indexed. Google no longer fills that
field, so the sample is the only count I have.

## Where it has stopped

The last two weeks look different. From 16 to 30 September, 87 more pages in
the sample got indexed. From 30 September to 14 October, 13 did. "Unknown to
Google" went from 169 to 168.

Every page Google has crawled, it has indexed. The pages left out are the ones
it has not crawled. Every page is reachable now, so more internal links will
not help. What is missing is demand: Google does not want to come back for more
yet. The thing that moves that is links from other sites, and that is not a
code change.

Clicks are the other open problem. In those 12 days, game pages were shown
1,550 times and clicked 10 times, 0.65%. Most of them sit at position 5 to 10,
where 980 views gave 4 clicks. On page one, but low on it.

I will run the same check again around 11 November. If "unknown to Google" is
still about 168 then, the code side is done, and what is left is getting other
sites to link to ps·db.
