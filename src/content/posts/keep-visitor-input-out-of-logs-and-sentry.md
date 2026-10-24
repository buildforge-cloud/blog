---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-12-01T07:00:00Z
title: "Keeping query strings out of nginx access logs and Sentry"
slug: keep-visitor-input-out-of-logs-and-sentry
featured: false
draft: false
tags:
  - ps-db
  - security
description: What a visitor types in ps·db's search should stay private. It took fixes in nginx's access log, the API's log, Sentry's events and the 422 answer.
---

The test was one line. A made-up search word goes into a request that fails,
and the word must not be anywhere in the error event Sentry gets.

The issue had asked for two things to go: the event's query string, and any
query in its address. The issue's own test, run through the real Sentry SDK,
found the word in about 33 more places.

## One decision, made more than once

[ps·db](https://ps-db.cloud) is my PS5 game database. It has a search box,
and a search is a plain `GET /api/games?search=...`. What someone types there
is theirs. It can be a game, a typo, or something they would rather nobody
saw. So the rule I gave was short: what a visitor types stays on our side. It
does not go into a log, and it does not go to Sentry.

I thought of that as one setting. It turned out to be one decision that had
to be made again in every layer that touches a request. Each fix showed me
the next layer. All of it happened on 23 and 24 October.

The first layer was the error answer itself. The API is FastAPI, and FastAPI's
default answer to a bad request, a 422, puts the bad value back in the reply.
A page number sent as text came back with that text. From there it can land
in a browser console, a proxy's log or a bug report. The fix answers with
FastAPI's own reply, less the value. My starter template had this first, and
its review found the case its own docstring had missed: a field that picks
one of several shapes by a tag. There pydantic quotes the wrong tag in the
message, so that message is now written from the tags the model expects.

The second layer was the API's access log. uvicorn writes one line per
request with the full address, query string included. A small logging filter
now cuts the address at its first `?` and changes nothing else in the line.

## nginx wrote it twice

The pull request for that filter named the layer in front of it. ps·db's
frontend is served by nginx, and nginx keeps its own access log. The config
set no log format, so the image's default applied. Its request field is the
whole request line, query and all. Its referrer field carries the address of
the page that made the call. So a search on the home page went into the log
once as the page's own request, and again as the referrer of every API call
that page made.

The issue suggested nginx's `$uri` for the path. It looked right: `$uri` has
no query string. On a real nginx, every page of the app logged as
`GET /index.html`. nginx writes the log line after its own
rewrites, and `$uri` holds the rewritten path. So the fix starts from the raw
request address, `$request_uri`, and cuts it at the `?` with a `map`. The
referrer gets the same cut.

The real nginx caught one more thing. A `map` that gives an empty value logs
`""`, not the `-` nginx writes for a field with no value. A request with no
referrer, or a broken request line, needed a line of its own in each map.

The review sent 26 odd requests at it. Many `?`, an absolute address, old
HTTP versions, a 20 KB referrer. Before the fix, 22 of them logged the query.
After it, one did: a path with an encoded `%3F` in it, which nginx reads as
part of the path. The app never builds a path like that.

## The 33 other places

Back to Sentry. By default, the Python SDK sends each stack frame's local
variables with an error. Nearly every frame inside the web framework holds
the raw request, query string and all. The route's own frame holds the
`search` argument. And the browser sends the page's address as the referrer
on each API call, so the header had it too.

The fix is one `before_send` function, which Sentry runs on each event before
it leaves. It drops the query string, cuts the address and the referrer at
`?`, and drops the local variables from every frame. File names, line numbers
and code lines stay, and so do the release and the environment. The price is
that Sentry no longer shows me local variables when I debug an error. I took
it.

The review sent it back. Its own run made a database error on a search, and
the search text was still in the event. SQLAlchemy's error message ends with
the values it sent to the database, and the scrub kept error messages on
purpose. The engine now runs with `hide_parameters=True`. The error still
names its SQL, and the values read as hidden.

Then the same function went into my starter template, so other projects can
take it. Its own whole-event search found one more place: the breadcrumb of
an outgoing HTTP call keeps its query apart from its address. The review of
that version sent failing requests with a search word to a copy of the
template. The word was in 110 places before the scrub, and in none after.

That pull request also named the last hole. A failed POST sends its body to
Sentry, parsed, as the request's data. The second version drops the body in every
shape. ps·db has no POST route today, so no body ever got there. Its tests
add one anyway, so a future form is covered.

## Made once, used by every project

Each layer is now a part of my starter template: the 422 answer, the uvicorn
filter and the Sentry scrub, each pinned at a version, plus the nginx format
in the template's config. A project takes a part with one command, and a
check fails if anyone edits the copy by hand. A fix to a part reaches every
project with a version bump. ps·db took the Sentry scrub's second version the
same day it was made.

Sentry's tracing is off in ps·db. Tracing events skip `before_send`, so
turning tracing on would need a scrub of its own.

What is still open is text the app writes itself. If an exception's own
message quotes what someone typed, the scrub can't tell it apart from any
other text. A Postgres error that quotes a bad value in its own words is one
example. FastAPI checks the types before a query runs, so I don't know of a
route that reaches it today.
