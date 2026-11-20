---
author: Stefan M. Gulbrandsen
pubDatetime: 2027-02-16T07:00:00Z
title: "My AI CV tool invented skills, and telling it not to didn't work"
slug: skredda-what-it-does-and-one-lesson
featured: false
draft: false
tags:
  - skredda
  - directing-ai
description: Skredda fits a consultant's CV to a Norwegian public tender with Mistral AI. On its first day it made up an employer, then a skill. Why the prompt didn't stop it, and what did.
---

I have worked a lot as a consultant. Every bid wanted the CV in a different
shape. Each buyer had its own form and its own way of asking. There was no
structure to any of it, and that always struck me as weird.

So I built [Skredda](https://skredda.no). It reads the tender documents,
finds the requirements that apply to the consultant, and fills in the
buyer's own CV form. It runs on Mistral AI, which is French and hosted in
the EU. A CV is personal data, so that choice was part of the point.

The first version was simpler than that. I pasted a CV and a job ad, and it
wrote a tailored CV and a short cover note.

## I typed "Test" and got a whole CV back

On the first day I started it on my own machine and typed "Test" in both
fields.

It came back with a full CV. A made-up employer called TestCorp, made-up
years, made-up results, and a long list of tools this "consultant" knew.

The prompt already said, in plain words, never to invent employers, dates or
results that were not in the CV. The model did it anyway. Given nothing real
to work with, it would rather hand back something that looked right than say
no.

The whole point of the tool is a CV a consultant can send to a client. A
made-up line on it is the worst bug it can have.

The agent's fix came in two parts. The form now refuses text too short to be
a CV, before anything reaches Mistral. And the prompt got a new rule: if the
input has no real content, say so instead of writing a CV. I trusted the
first part. The second was the same kind of instruction the model had just
ignored.

## A real CV, and Python it never had

Later the same day it happened again, in a worse way. The agent tested a
mismatch on purpose: a sample CV of a frontend developer, all React and
TypeScript and nothing on the backend, against a job ad for a senior backend
developer.

The CV came back in good Norwegian. It also had Python in the skills list.
And it said the developer had broad full-stack experience and had worked
closely with backend systems. None of that was in the CV.

A real CV against a job that does not quite fit is what a real user sends.
A consultant could have sent that to a client with skills on it they did not
have.

The agent offered me a few ways out, one of them a stronger prompt. I did not
take any of them. I asked for a plan first. And I asked whether the CV should
be broken into simpler parts before the AI wrote anything at all.

## The writer never sees the CV

The plan became the fix, the same day.

One call reads only the CV and pulls out the facts: skills, jobs, education.
It never sees the job ad. The next call writes the tailored CV from those
facts alone. It never sees the original CV text. Then plain code checks every
skill in the result against the list the first call pulled out. If one does
not match, it asks again once and names the skill. If it still fails, the
user gets an error message and no CV.

The agent ran the same mismatch again. The skills list came back as exactly
what the CV had. No Python. And the cover note now said, in Norwegian,
"although I don't have direct Python experience in my CV". Nobody prompted
for that sentence. It came from the writer having nothing else to work from.

## The fix broke the language

Then an English CV that had come back in English that morning came back in
Norwegian.

The facts the first call pulls out are mostly names of tools and companies.
Those look the same in every language. The writer no longer saw the full
English text, and the prompt was full of Norwegian context, so it guessed
Norwegian. The fix was to let the first call, which does see the whole text,
write down the language as one more fact.

## What the check still misses

The check reads only the skills list. In that same test the cover note still
said the developer had worked closely with backend teams. The CV said nothing
of the kind. Catching that needs a different check, one that reads the prose
and asks whether the facts back it up. That gap was still open when the day
ended.

What I took from that day: telling the model not to invent things failed
twice. What worked was taking away the material it could invent from, and
checking the result with code that does not guess.

Skredda is in closed beta. It now reads a buyer's whole tender folder, not a
pasted job ad. It is a trial, and I never really fell in love with it as a
product.
