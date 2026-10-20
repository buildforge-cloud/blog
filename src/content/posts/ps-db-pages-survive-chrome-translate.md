---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-11-10T07:00:00Z
title: "A React removeChild crash under Chrome Translate, and why the known fix wasn't enough"
slug: ps-db-pages-survive-chrome-translate
featured: false
draft: false
tags:
  - ps-db
  - debugging
description: One French visitor's phone, most likely running Chrome's page translation, made my game database's pages go blank. The well-known cause is translated text. Here the crash was in a hint bubble, and the well-known fix would have left that bubble stuck on screen.
---

On 15 October, in five minutes, one visitor crashed
[ps·db](https://ps-db.cloud) nine times. It was a phone with Chrome on
Android, set to French, on game pages like
[Alba: A Wildlife Adventure](https://ps-db.cloud/games/alba-a-wildlife-adventure).
Sentry got the same error every time, and nothing caught it:

> NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be
> removed is not a child of this node.

When that happens, the page goes blank. Sentry had not seen this error in the
90 days before. Production had been running for nine hours, so no deploy had
set it off.

## Everyone knows this one

The issue, written up from the Sentry report, named the pattern at once. A
French browser on an English page, failing to remove a node, is the classic
sign of Chrome's built-in translation. Chrome swaps the page's text for its
own `<font>` elements. Later React tries to remove a text node it put there,
the node is not where React left it, and the browser throws. It is an old,
well-known React problem,
[react#11538](https://github.com/react/react/issues/11538), and the usual
workaround is in that thread: patch `removeChild` and `insertBefore` so they
skip a node whose parent has changed, and log an error.

The issue said that much was not proven yet, and it asked for a reproduction
first. It also set one rule: don't turn translation off. Marking the page `translate="no"` would stop the crash, and it would also
stop a French visitor from reading the site in French.

## The stack said portal

The agent that worked the issue read React's minified stack trace instead of
trusting the pattern. React was not removing a text node. It was removing a
portal during a page change. A portal is a part React draws outside its normal
place on the page, here straight under `<body>`. This one's top element was no
longer a direct child of `<body>`.

A game page has one portal of that shape: a small hint bubble. It opens for
about six seconds after a tap on Owned, Wishlist or Blocked. So the likely path was
a tap on Wishlist, then a tap on a similar game while the bubble was still
open.

Then it measured. In a real browser, on live data, a hop from one game page to
the next removed no bare text node at all, only whole elements. So swapped
text alone could not crash this app, the famous part of the React thread did
not apply, and a moved element could.

## The known fix leaves a bubble behind

The agent wrote a test that follows the stack from Sentry: open a game page,
wrap the hint bubble in a `<font>` element the way the translator seems to
have, so it is no longer a direct child of `<body>`, then change page. Without a fix, the test failed with the exact message from
Sentry.

Then it tried the workaround from the React thread, which only skips the
removal. The crash was gone, and the test still failed: the hint bubble
stayed on the screen for good after the page change.

So the guard does one more thing. When React removes a node whose parent has
changed, the guard removes it from wherever it is now, or does nothing if it
is already gone from the page. When React inserts in front of a node that has
moved, the guard skips that insert. Both log a warning instead of throwing.
A node that is where React expects takes the browser's normal path. It is
about 25 lines, and it runs before React draws anything. The test now
passes, five runs out of five, and translation still works.

## What I still don't know

The test wraps the bubble by hand. What moved it on that phone is not proven.
The browser that runs the tests has no translator, and the Sentry event had
no trail of what happened before it. A check with Chrome's Translate on a real
phone would settle it.

The guard has a price too. If I ever write a real wrong-parent bug of my own,
it shows up as a console warning, not a crash. A skipped insert leaves that
one element missing until React draws that spot again. And translated text
that React removes can leave Chrome's copy of it on the screen.

It also changes what a quiet Sentry means. A guard hit is only a warning in the
visitor's console, not a crash. So if no new crashes come in after the deploy,
it could mean the guard caught a moved bubble. It could also mean nobody
translated a game page again. Neither proves the cause is gone.

What I keep coming back to is how close the first answer was. Right browser,
right language, right error, right old issue. Wrong part of the page. And the
fix that came with it would have traded a blank page for a popup that never
leaves.
