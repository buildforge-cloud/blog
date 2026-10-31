---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-12-29T07:00:00Z
title: "Search YouTube comments past the first 60 on desktop: Comment Finder 1.9.1"
slug: search-youtube-comments-desktop
featured: false
draft: false
tags:
  - comment-finder
  - debugging
description: My Chrome extension to search YouTube comments stopped at about 60 on the desktop and said YouTube had stopped sending. YouTube was sending them to a hidden list. Version 1.9.1 fixes that and adds next and previous buttons.
---

The search bar said "YouTube stopped sending". It had searched 60 comments.
In the same page, at the same moment, there were 280 comment threads.

The extension is [Comment Finder for
YouTube](https://commentfinder.buildforge.no/), a Chrome extension of mine
that searches the comments under a video. YouTube has no search for them. It
needs no API key and no account, and it sends nothing anywhere. It hides the
comments that don't match and highlights the word in the ones that do.

## Found while testing something else

I wasn't looking for this. On 5 October an agent was testing a feature I had
wanted for a while: buttons that jump to the next and the previous match.
The idea had sat on the extension's list since September, from a video with
48 matches in 740 comments, found only by scrolling.

The buttons had their own wrong turns. The first version put them right after
the search box. In the desktop Shorts panel, the counter ("3 of 48") appeared
when a search began and pushed them 26 pixels, so a second click on the same
spot hit "previous". On the wide desktop bar they moved 179 pixels when
loading ended. And after the first jump, the bar scrolled away under
YouTube's top bar, so a reader had to scroll back up for every next one.

A browser test would not have seen that last one. Playwright's `click()`
scrolls the button into view before it clicks, and a person can't. So a
button that has scrolled away, or sits under a fixed header, passes. The
tests now find where the button is on screen, check that it is the thing
under that point, and click there. The buttons sit at the right end of the
second row, where nothing pushes them, and on the desktop the bar stays under
YouTube's top bar during a search. That was version 1.9.0.

While the agent measured that, it noticed the search on the desktop stopped
at about 60 comments. The released version did the same, side by side, so it
was older than the buttons. It became an issue of its own.

## 280 threads, 60 searched

The issue measured it on one popular video with the search word "a". After
20 seconds the search had covered 60 to 80 comments. The page held 180 to 300
comment threads. The phone site, in the same session, loaded 420 in 12
seconds. So it looked like a desktop problem with the extension not seeing
new threads. The issue's best guess was that YouTube now put the new threads
somewhere the extension didn't read.

That guess was close. The threads were somewhere else, but YouTube had not
moved them. The extension had sent them there.

## Two comment lists, one hidden

The fix started with a new probe that counts each comment list on the page on
its own. The desktop watch page has two. One is the list under the video that
everyone sees. The other has no id and sits inside a side panel that is
hidden. That one has its own "load more" marker from the start.

The extension loads more comments by asking YouTube's own code, from inside
the page, to fetch the next batch for a marker. The piece that asks picked
its marker by itself: the last one in the page. That was the hidden panel's.

So each time the extension asked for more, YouTube loaded them into a list
nobody can see. After 20 seconds the hidden panel held up to 340 threads.
The list on screen stopped between 60 and 100, and the bar said YouTube had
stopped sending. The threads the issue had counted in the page were mostly
the panel's.

Why it went wrong is the part I keep. Two pieces of the extension each had
their own idea of where the comment list is. One holds every difference
between the desktop and the phone site. The piece inside YouTube's page kept
its own copy of the page's shapes. The two drifted apart in version 1.6.0,
when only the first one learnt to choose a list by what it holds.

Now only one piece decides which list is real. It sends the "load more"
request from the marker on that list, and the piece inside the page asks for
exactly that one.

The review found two more of the same kind. After YouTube redraws the list,
the marker the extension had asked was a dead one, so it now reads the list
again every round. And a hidden list can hold threads too, so a visible list
now wins over one that only holds threads.

## What 1.9.1 does

Measured on the real desktop page, the same video and the same word, at 6,
12 and 20 seconds:

- 1.9.0: 100, 100 and 100 searched. 340 threads in the hidden panel.
- 1.9.1: 140, 240 and 360 searched. None in the hidden panel. Two runs, the
  same both times.
- 1.9.1 on a desktop Short: 460 of 460.
- 1.9.1 on the phone site: 240, 400 and 561, about as before.

The next and previous buttons work on all four: desktop video, desktop Short,
phone video and phone Short. Enter and Shift+Enter in the box do the same.

It still has limits. Loading stops after 400 rounds, or when nothing new
arrives for about 6 seconds. On a very busy video YouTube itself stops
sending after roughly one to three thousand comments, and the bar says so.
Chrome on Android and iPhone runs no extensions at all, so on a phone it
needs a browser like Vivaldi for Android. The
[store listing](https://chromewebstore.google.com/detail/comment-finder-for-youtub/pfmklefdjlkanjehfipnmhffjkkakcnb)
says the last two in the same words.

Searching the replies is still phone only. On the desktop the same code loads
no replies and moves the page, so the switch is not offered there. Finding
out why is the next step. It has its own issue, still open and with no date
yet.
