# From solo work to a team of AI agents: pros and cons

For eight weeks, a team of AI agents has written and checked my code. I don't review it. I answer their questions on my phone.

AI wrote this article. I edited it.

This is how I got there, in four stages, and what I make of it now. I build a few small apps on my own, and AI writes all of their code. Each app, with its code, is what I call a project.

If you are thinking of letting AI agents take on more of your work, the pros and cons at the end are for you.

An AI agent, in this article, is an AI that works on a task by itself. It reads the code, changes it, runs the tests (small programs that check the code still works) and reports back. Mine run on Claude Code, an AI coding tool made by Anthropic, on the same small server that runs my apps.

## Stage one: me in the middle of every task

Before the team, each of my projects had one AI agent of its own, and every step went through me. I gave it its next task, read what it did and decided what came next. I did most of that on my phone, in a phone app for watching agents: it shows what each one is doing and buzzes when one is done.

The AI wrote the code, but I was still the planner, the reviewer and the one who said when something went live. A project moved only as fast as I could read.

It also gave me a habit I still have. Every agent reads one shared file of instructions before it starts a task. Each time something went wrong, I added a rule to that file, and each rule was right on its day.

Together they piled up. Every agent reads the whole file before every task, so each new line was more to read on every single task, until I cut the file down and later split it.

One of those rules came from the day one of my live apps went down. Each app on my server runs as a few named parts, started from a setup file, and no two parts can share a name.

A test the AI ran used the live app's setup file. So the server swapped the live app's parts for the test's copies, and the app went down.

I wrote a rule after that: never use a live app's setup file, not even for a test. Remember that rule. It comes back in the cons.

## Stage two: an agent to lead the others

In late September I built one AI agent to lead the others. It looks at all my projects, suggests what to work on next, and starts a new agent for each task I say yes to. Then it reviews what comes back.

Each new agent gets one task and its own copy of the code, so two agents don't trip over each other. When it is done, it hands back the finished change with a short report of what it did and which tests it ran.

The lead agent is more than Claude Code. It is also a set of small programs built for it, which start the other agents, check the server and keep its records. Those programs are a project of their own too, though not an app.

On the lead agent's first day, the code that hands out and checks work came together in an afternoon. The bugs that could have hurt something were in the safety checks built into it: the code meant to stop it from starting real work by mistake, or from publishing something private.

So I started small. Accepting a change makes it part of a project's real code, and at first the lead agent could accept changes only into its own project, which puts nothing live. Everything else waited for me.

## Stage three: one reviewer for the whole team

Then I let the lead agent review and accept the work on every project. It never takes an agent's report at its word. It runs the tests again itself and reads every changed line against the task.

When something is off, the work goes back to the agent that did it. A script lets at most 2 agents work at the same time, and only when the server has enough free memory and disk for them.

The pace surprised me. I counted one project, the lead agent's own: by the middle of November it had taken in 623 finished changes, 114 of them in its busiest week. Half of the reviews took 11 minutes or less.

Some decisions stayed with me. I choose which tasks get done at all. Anything that goes live, or changes how an app looks, waits for my yes.

## Stage four: what my days look like now

My part happens on my phone, on a simple web page my agents built for me, separate from the phone app in stage one. The lead agent posts a short question there with a few answers to pick from, and I tap one. The same page shows which agents are running.

I don't review any code. Over the eight weeks, the questions added up to thousands of small decisions. Together they decide what gets built and what goes live.

This article was made the same way. An agent wrote it from a longer post on my blog, linked at the end, and it waited for my yes before I posted it.

## The pros

The code is the fast part. It came quickly from the first day. If you try this, expect it to arrive fast, and save your own time for the checks and the decisions around it.

A reviewer that doubts the agent that did the work catches real mistakes. Work goes back for another round when the tests or the task say it is not done. The lead agent even caught a wrong claim in the first draft of that blog post.

What that means for you: never let the agent that did the work be the one that says it is done. A separate check, by a separate agent, is worth the extra minutes.

My time goes to decisions, not to code. I went from reading every change to answering questions. What that means for you: your job moves from doing to deciding, so write down which decisions stay with you before you start.

Agents can work side by side. Each one has its own copy of the code and one task, so they don't get in each other's way. What that means for you: keep each task small and separate, and more than one can run at a time.

## The cons: agents and rules

Agents take you literally. On its second day, the lead agent asked one of the other agents to prove that the code that agent had just written still worked while the server was busy.

So that agent made the server busy on purpose. For about ten minutes the server was overloaded, with my live apps running on it.

Nobody broke a rule that day, because no rule said what a proof may cost or where it may run. What that means for you: write down what is off limits, not only what you want.

A written rule only works if every agent remembers it, every time. So the rule from stage one is now also a check: starting anything from a live app's setup file is blocked before it runs, in every project.

What that means for you: turn the rules that matter most into checks a machine enforces. Keep the written ones for everything else.

Instructions grow back. Every problem adds a line, and each line makes sense on the day you write it.

The shared file from stage one is split now. The lead agent also has its own, separate instructions file, and it has a fixed size limit of 12 KB, a few pages of text. When I wrote this, it was one byte under.

What that means for you: give your instructions a budget. Move the details into separate documents that an agent opens only when its task needs them.

## The cons: your own tools

Your own tools can be wrong too. One day the page on my phone showed three agents running, when the limit was two. Either one got past the limit or the page counted wrong, and when I wrote this, nobody knew which.

What that means for you: doubt your dashboard as much as your agents. The suspicion you build into the review should cover your own tools.

Some clever ideas turn out to be noise. My agents keep a memory, short notes they write for themselves and read on later tasks. I added a feature that pointed an agent from one note to related ones.

Some notes already linked to others, like links on a web page. In its first test, the new pointers did better than those links, but not by enough to rule out chance. They also added a line to almost every read, which is clutter when it rarely helps, so I turned the feature off.

A later test looked better, but the feature is still off until I decide. What that means for you: measure a feature before you trust it, and measure it again before you drop it for good.

Alarms need care too. A script tells the lead agent when another agent has sat idle for a while, for example stuck on a question nobody answered. At first it also went off for agents that were waiting, as planned, for my yes.

On one day it went off more than thirty times, and some of those may have been the planned kind. What that means for you: check what your alarms actually count. An alarm that can't tell "stuck" from "waiting as planned" sends you to the wrong place.

## Where that leaves me

Eight weeks in, the team is still how I work. The code comes faster than I could read it. Every problem in this article sat in the rules, checks and tools around the agents, not in the code they wrote.

If you are about to try this, start with the limits. Decide what the agents may never do, what they must prove, and which decisions stay with you.

Every number here, with its date, is in [the full post on my blog](https://blog.buildforge.cloud/posts/building-an-ai-agent-team/).

If you work with AI agents, which decision would you never hand over to them?
