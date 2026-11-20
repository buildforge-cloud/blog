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

I have worked a lot as a consultant. When a public body in Norway buys
consulting work, it puts out a public tender: a set of documents that says
what it needs. Consulting firms answer with a bid. The bid holds a CV for
each consultant the firm puts forward for the job. The buyer often wants
those CVs filled in on its own CV form, and every buyer's form is different.
There was no common structure to any of those forms, and that always struck
me as weird.

So I built [Skredda](https://skredda.no). You give it the folder of tender
documents. It reads them, finds the requirements that apply to the
consultant, and fills in the buyer's own CV form. The writing is done by a
language model from Mistral AI, a French company that hosts it in the EU. A
CV is personal data, so that choice was part of the point.

I did not write Skredda's code myself. I built it with an AI coding agent: a
program that writes code from what I ask for, runs it, and tells me what
happened. In this post, "the coding agent" is that helper. It is not part of
Skredda. Inside Skredda, the only AI is Mistral's model.

The first version was simpler than the Skredda of today. It took no tender
documents. It had two text boxes: one for a CV and one for a single job ad.
It wrote a tailored CV and a short cover note: a few lines, in the
consultant's own voice, on why they fit the job.

## I typed "Test" and got a whole CV back

Skredda sends Mistral's model the CV and the job ad, together with a prompt:
written instructions for what to do with them. The prompt already said, in
plain words, never to invent facts, employers, dates or results that were
not in the CV.

On the first day I ran Skredda on my own machine and typed "Test" in both
boxes.

It came back with a full CV. A made-up employer called TestCorp, made-up
years, made-up results, and a skills list: a long list of tools and
technologies this "consultant" knew.

Mistral's model had been told not to do that, and did it anyway. Given
nothing real to work with, it would rather hand back something that looked
right than say no.

The whole point of the tool is a CV a consultant can send to a buyer. A
made-up line on it is the worst bug it can have.

The coding agent's fix came in two parts. Skredda now refuses text too short
to be a CV, before anything reaches Mistral. And the prompt got a new rule:
if the input has no real content, say so instead of writing a CV. After
that, "Test" got an error message and never reached Mistral. But the second
part was the same kind of instruction Mistral's model had just ignored.

## A real CV, and Python it never had

Later the same day it made things up again, in a worse way. The coding
agent tested a bad fit on purpose. It gave Skredda a sample CV of a frontend
developer, all React and TypeScript and nothing on the backend, and a job ad
for a senior backend developer.

The tailored CV had Python in the skills list. And it said the developer had
broad full-stack experience and had worked closely with backend systems.
None of that was in the CV.

A real CV against a job that does not quite fit is what a real user sends.
A consultant could have sent that to a buyer with skills on it they did not
have.

The coding agent offered me a few ways out, one of them a stronger prompt. I
did not take any of them. I asked the coding agent to write a plan first.
And I asked whether Skredda should first pull the CV apart into plain facts,
before the AI wrote anything at all. The part that writes the tailored CV,
which I will call the writer, would then see those facts, not the CV.

## The writer never sees the CV

The plan said yes: pull the facts out first. Skredda now splits the work
into two separate questions to Mistral's model, one after the other. That
split became the fix the same day.

In the first, the model sees only the CV and lists the facts in it: skills,
jobs, education. It never sees the job ad. In the second, the writer, the
model writes the tailored CV and the cover note from that list of facts and
the job ad. It never sees the original CV text.

Then a skill check in Skredda's own code, with no AI in it, compares every
skill in the new CV with the list of facts. If a skill is not on the list,
Skredda asks the writer to try again, once, and tells it which skill was
wrong. If the second try also fails, the consultant gets an error message
and no CV.

The coding agent then ran the same test again: the frontend CV against the
backend job ad. The skills list came back as exactly what the CV had. No
Python. And the cover note now said "although I don't have direct Python
experience in my CV". That sentence is true. Nobody asked for it. It came
from the writer having only the real facts to work from.

## The fix broke the language

Skredda is made for Norway, and the prompt it sends with every question had
a Nordic flavor. Earlier that day, an English test CV had come back in
English, as it should. After the split into two questions,
the same English test came back in Norwegian.

The writer no longer saw the English sentences of the CV. It saw only the
list of facts, and those are mostly names of tools and companies, which look
the same in every language. The strongest hint of a language it had left was
Skredda's Nordic-flavored prompt, so it wrote Norwegian. The fix: the first
question, which does see the whole CV, now also writes down the CV's
language as one more fact, and the writer gets it with the others.

## What the check still misses

The skill check reads only the skills list. In the run after the split, the
one with no Python, the cover note with the true Python sentence also said
the developer had worked closely with backend teams. The CV said
nothing of the kind. Catching that needs a check that reads the sentences of
the cover note, not only the list. That gap was still open when the day
ended.

What I took from that day: the rule against invented facts was in the prompt
the whole time, and Mistral's model broke it twice. What worked was taking
away the material it could invent from, and checking the result with code
that does not guess.

Skredda now reads the whole folder of tender documents, not a pasted job
ad. It is in closed beta and lets a few people in at a time, and you can ask
for access on its front page. If you write CVs for public tenders, try
Skredda at [skredda.no](https://skredda.no).
