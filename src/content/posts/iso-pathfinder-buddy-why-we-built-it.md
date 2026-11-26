---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-02-23T07:00:00Z
title: "Why I built an ISO 27001 guide with Lovable, and what it taught me"
slug: iso-pathfinder-buddy-why-we-built-it
featured: false
draft: false
tags:
  - iso-27001-buddy
  - directing-ai
description: ISO 27001 Buddy is a step-by-step ISO 27001 guide I first built with Lovable. Why I built it, and how checking the AI's work made me learn how the standard fits together.
---

At my old job I worked on ISO 27001 certification. ISO 27001 is the
standard for how a company runs its information security, and a certificate
says an auditor has checked that it does. I found the certification process
more confusing than anything else.

So I built [ISO 27001 Buddy](https://iso.buildforge.no/), an ISO 27001 guide
that runs in the browser. I wanted something light, that helps a company
along the way to a certificate one step at a time. I also had a reason of my
own. I hoped that if I had to build something that explains ISO 27001 to
others, I would understand it better myself.

## How fast it came up in Lovable

I first built it with [Lovable](https://lovable.dev), an AI app builder that
writes an app from requests in plain words. I made it early in my time building
with AI, when I had little experience of it. The app has since moved off
Lovable, to its own site, the one linked here.

What surprised me was how fast I had something up and running. Nothing
broke while I built it. The app has a setup wizard, a
[roadmap](https://iso.buildforge.no/roadmap) in ten phases, evidence
templates, the Annex A controls (the standard's list of 93 security
measures), a glossary, and the upkeep that keeps a certificate valid. There
is no account. What a user enters stays in their own browser.

## Approving what the AI built

Lovable wrote each part of the guide, from the wizard to the templates, as I
asked for it. Before I accepted a part, I had to know it was right. And I
couldn't judge one part without knowing where it sat among the others.

So I read the descriptions and support documents for ISO 27001 again and
again. Each time Lovable delivered a new part, I had to work out how it
connected to the rest, or I couldn't approve it.

Building it did help me understand ISO 27001. At my old job the process
confused me. Having to approve each part made me work out how it all
connects.
