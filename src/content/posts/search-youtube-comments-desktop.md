---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-01-05T07:00:00Z
title: "Search YouTube comments on desktop: why my Chrome extension stopped at about 60"
slug: search-youtube-comments-desktop
featured: false
draft: false
tags:
  - comment-finder
  - debugging
description: Comment Finder, my Chrome extension to search YouTube comments, stopped at about 60 on the desktop and said YouTube had stopped sending. YouTube was sending them, to a hidden list. The fix, with next and previous buttons, reached the Chrome Web Store in version 1.9.2.
---

My Chrome extension's search bar said "YouTube stopped sending". It had
searched 60 comments. At the same moment, the page held 280 comment threads. A
thread is one top comment with the replies under it. So the page had far more
comments than the search had looked at.

The extension is [Comment Finder for
YouTube](https://commentfinder.buildforge.no/). It searches the comments under
a video, which YouTube itself can't do. It puts a search bar above the
comments. It hides the comments that don't match and highlights the word in
the ones that do. It works on the comments the page has loaded, and asks
YouTube's page for more as it goes.

## Found while testing something else

I wasn't looking for this. On 5 October an AI coding agent, which is how I
build most things, was testing a feature I had wanted for a while: buttons
that jump to the next and the previous match. The idea had been on my list for
the extension since September. On one video I had found 48 matches in 740
comments, and the only way to get from one to the next was to scroll.

The buttons had their own wrong turns. The first version put them right after
the search box. In the comments panel beside a Short on the desktop, a counter
("3 of 48") appeared when a search began and pushed them 26 pixels to the
side. A second click on the spot where "next" had been now hit "previous". On
a normal desktop video they moved 179 pixels when the comments finished
loading. And after the first jump, the whole bar scrolled away under YouTube's
top bar, so I had to scroll back up for every next match.

The browser tests would not have caught that last one. They use Playwright, a
tool that drives a real browser, and its `click()` scrolls a button into view
before it clicks it. A real mouse doesn't. So a button that has scrolled out
of sight, or sits under a fixed header, still passes. The tests now find where
the button is on screen, check that it is the thing under that point, and
click there, the way a person would. The buttons now sit at the right end of
the bar, where nothing pushes them, and on the desktop the search bar stays in
view, just under YouTube's own top bar, during a search.

While the agent measured all that, it noticed the search on the desktop
stopped at about 60 comments. The version in the store did the same when it
ran side by side, so the bug was older than the buttons. I filed it as a
separate GitHub issue.

## 280 threads, 60 searched

The agent measured it on one video with the search word "a", which matches
almost every comment, in four runs. After 20 seconds the search had covered 60
to 80 comments. The page held 180 to 300 comment threads. On YouTube's phone
site, opened in the same test browser, the same test went far past 60 within
12 seconds. So it looked like a desktop problem: the extension was not seeing
new threads. The best guess written in the issue was that YouTube now put new
threads somewhere the extension didn't read.

The threads were in another place, as the issue guessed, but the extension had
put them there, not YouTube.

## Two comment lists, one hidden

YouTube loads comments in batches. At the end of a list sits a "load more"
marker, and YouTube's own code fetches the next batch for it. The extension
doesn't scroll to get more. It asks YouTube's code, from inside the page, to
fetch the next batch for a marker.

The fix started with a new measuring script that counts each comment list on
the page separately. The desktop watch page has two. One is the list under the
video that everyone sees. The other sits inside a side panel that YouTube
keeps hidden. I don't know what YouTube uses it for. That one has its own
"load more" marker from the start.

The extension has two parts that matter here. The main script runs in the
extension's own space next to the page, where it can read the page but not
call YouTube's code. It holds every difference between the desktop and the
phone site, and decides which list is the comment list. A small helper script
is placed inside YouTube's own page, where it can call YouTube's code, and
does the asking. The helper picked its marker by itself: the last one in the
page. That was the hidden panel's.

So each time the extension asked for more, YouTube loaded them into a list
nobody can see. After 20 seconds the hidden panel held up to 340 threads. The
list on screen stopped somewhere between 60 and 100, depending on the run, and
the bar said YouTube had stopped sending. Most of the threads the first
measurement had counted were in the hidden panel.

The two scripts had drifted apart in version 1.6.0. Before that, both looked
for the comment list by its id. Then the main script learnt to pick the list
that actually holds the comments, and the helper kept its own old rules for
finding markers.

Now only the main script decides which list is real. It sends the "load more"
request from that list's own marker, and the helper asks for exactly that one.

The agent's review of its own fix found two more problems of the same kind.
When YouTube redraws the list, the marker the extension had just used no
longer works, so the extension now looks the list up again before every batch.
And a hidden list can hold comment threads too, so when two lists hold
threads, the one on screen now wins.

## Up to 360 comments in 20 seconds

Before the fix, a search stopped somewhere between 60 and 100, depending on
the run. In the run below it was 100. Measured for the fix's pull request,
merged on 26 October, on the real desktop page, the same video and the same
word, at 6, 12 and 20 seconds:

- Before the fix: 100, 100 and 100 searched. 340 threads in the hidden panel.
- After the fix: 140, 240 and 360 searched. No threads in the hidden panel.
  Two runs, the same both times.
- After the fix, on a desktop Short: all 460 comments that had loaded.
- After the fix, on the phone site: 240, 400 and 561, about the same as the
  old code there.

The next and previous buttons work on desktop videos, desktop Shorts, phone
videos and phone Shorts. Enter and Shift+Enter in the box do the same.

Neither change went to the store on its own. The buttons were version 1.9.0
and the desktop fix 1.9.1. The store went from 1.8.1 straight to 1.9.2 on 3
November, with both changes in it.

The extension still has limits. It stops asking for more after 400 batches, or
when nothing new arrives for about 6 seconds. On a very busy video YouTube
itself stops sending after roughly one to three thousand comments, and the bar
says so. And Chrome on Android and iPhone runs no extensions at all, so on an
Android phone it needs a browser that does, like Vivaldi. Both limits are also
on its [store
listing](https://chromewebstore.google.com/detail/comment-finder-for-youtub/pfmklefdjlkanjehfipnmhffjkkakcnb).

The extension also has a switch that searches the replies under each comment.
When the desktop fix was done, that switch worked on the phone only. On the
desktop the same code loaded no replies and made the page jump, so the switch
was taken off there. Another fix, merged on 31 October, found why and put it
back, so 1.9.2 has replies on the desktop too.
