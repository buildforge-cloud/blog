# From solo work to a team of AI agents: pros and cons

For eight weeks, a team of AI agents has written and checked my code. I don't review it. I answer their questions on my phone.

AI wrote this article. I edited it.

I build a few small apps on my own, and AI writes all of their code. I call each piece of software I keep a project: most are apps, and one is my blog.

It took me four stages to get from one agent per project to a team. If you are thinking of letting AI agents take on more of your work, the pros and cons after the stages are for you.

By an AI agent I mean an AI that works on a task by itself. It reads the code, changes it, runs commands and tests (small programs that check the code still works) and reports back.

Mine run on Claude Code, an AI coding tool made by Anthropic. Until October they ran on the same small rented server as my live apps; since October they run on a small server at home, and the live apps stay on the rented one.

## Stage one: me in the middle of every task

Before the team, each of my projects had one AI agent of its own, and every step went through me. I gave it its next task, read what it did and decided what came next.

The AI wrote the code, but I was still the planner, the reviewer and the one who said when something went live. A project moved only as fast as I could read.

That stage also gave me a habit I still have: each time something went wrong, I added a rule to one shared file of instructions. Every agent reads that file, the same for every project, before it starts a task. Each rule was right on its day.

Together they piled up. Every agent reads the whole file before every task, so each new line was more to read on every task, and a rule in a long file is easier to miss. I cut the file down, and later split it.

The rules that apply to every task stayed in the file. The details moved into separate documents, and the file says which one to open for which kind of task.

One of those rules came from the day one of my live apps went down.

A test the AI ran was meant to start its own copy of the app. It used the live app's settings file instead, the file that tells the rented server what to run and under which name. Starting an app under a name already in use replaces the copy that is running, so the live app went down.

I wrote a rule after that: never start an app from its live settings file, not even for a test. That rule comes back in the cons.

## Stage two: one agent leads, fresh agents do the work

In late September, eight weeks before this article, I built one AI agent to lead. It reads the list of open tasks I keep for each project, suggests what to work on next, and starts a fresh agent for each task I say yes to. Then it reviews what comes back.

Each task now gets a new agent of its own, with its own copy of the code, so two agents don't trip over each other. When it is done, it hands back the finished change with a short report of what it did and which tests it ran.

The lead agent is Claude Code plus a set of small programs that AI wrote for it. They start the other agents, check the memory and disk of the home server and the rented one, and write down each decision, the lead agent's and mine. Those programs are a project of their own, though not an app.

I didn't trust the lead agent with everything at once. Accepting a change makes it part of a project's code. Putting it live, where the people who use the app see it, is a separate step.

At first the lead agent could accept changes only into its own project, which is not an app and never goes live. Everything else waited for me.

## Stage three: one reviewer for the whole team

Then I let the lead agent review and accept the work on every project. It never takes an agent's report at its word: it runs the tests again itself and reads every changed line against the task.

When something is off, the work goes back to the agent that did it. One of the lead agent's small programs lets at most 2 agents work at the same time, and only when the home server they run on has enough free memory and disk for them.

The pace surprised me. I counted one project, the lead agent's own, which also started in late September. By the middle of November it had taken in 623 finished changes, each a piece of work an agent handed back, 114 of them in its busiest week.

Some decisions stayed with me. I choose which tasks get done at all. Anything that goes live, or changes how an app looks, waits for my yes.

## Stage four: what my days look like now

My part happens on my phone, on a simple web page my agents built for me. The lead agent posts a short question there with a few answers to pick from, and I tap one. The same page shows which agents are running.

I don't review any code. The log of decisions, the lead agent's and mine, is on that page too. Mine are the answers I give it and the things I tell it in a chat there.

Over the eight weeks, the lead agent put thousands of small decisions in front of me, as questions to answer and as entries in that log. My answers and the logged decisions set what gets built and what goes live.

This article was made the same way. An agent wrote it from a longer post on my blog, linked at the end, and I edited and approved it before posting it myself.

## The pros

The code is the fast part: it came quickly from the team's first day. If you try this, save your own time for the checks and the decisions around it.

A reviewer that doubts the agent that did the work catches real mistakes. Work goes back for another round when the tests fail, or when the work does not match the task.

So never let the agent that did the work be the one that says it is done. A separate check, by a separate agent, is worth the extra minutes.

My time now goes to decisions: I went from reading every change to answering questions. Your job will move from doing to deciding too, so before you start, write down which decisions stay with you.

Agents can work side by side. Each one has its own copy of the code and one task, so they don't get in each other's way. Keep each task small and separate, and more than one can run at a time.

## The cons: agents and rules

Agents take you literally. On its second day, the lead agent asked one of the other agents to prove that the code that agent had just written still worked while the rented server was busy.

So that agent made the server busy on purpose. For about ten minutes it overloaded the server that the agents then shared with my live apps.

Nobody broke a rule that day, because no rule said what a proof may cost or where it may run. Write down what is off limits as well as what you want.

A written rule only works if every agent remembers it, every time. So the rule from stage one is now also a guard: a small program that reads each command an agent is about to run. In every project, it blocks any command that would start an app from its live settings file.

Turn the rules that matter most into checks a machine enforces, and keep the written ones for everything else.

Instructions grow back. Every problem adds a line, and each line makes sense on the day you write it.

The lead agent also reads a second instructions file, its own. I gave that file a fixed size limit of 12 KB, a few pages of text, and a test fails if a change would make it bigger than that, so that change cannot be accepted. In mid-November, when this was written, it was one byte under.

Give your instructions a budget, and move the details into separate documents that an agent opens only when its task needs them.

## The cons: your own tools

Your own tools can be wrong too. One day the page on my phone showed three agents running, when the limit was two. Either one got past the limit or the page counted wrong, and in mid-November, when this was written, nobody knew which.

Doubt your own status pages as much as your agents.

Alarms need the same care. Another small program tells the lead agent when an agent has sat idle for a while, for example stuck on a question nobody answered. At first it also went off for agents that were waiting, as planned, for my yes.

On one day it went off more than thirty times. It could not tell the two kinds of waiting apart, so I can't say how many of those agents were truly stuck.

The first draft of the blog post this article comes from said every one of them was stuck on a question only I could answer. The lead agent's review caught that.

Check what your alarms count. An alarm that can't tell "stuck" from "waiting as planned" sends you to the wrong place.

## Where that leaves me

Eight weeks in, the team is still how I work. Every problem in this article came from the setup around the agents: what they were allowed to do, what they were told, and my own tools. None came from bugs in my apps.

If you are about to try this, start with the limits. Decide what the agents may never do, what they must prove, and which decisions stay with you.

Every number here, with its date, is in [the full post on my blog](https://blog.buildforge.cloud/posts/building-an-ai-agent-team/).

If you work with AI agents, which decision would you never hand over to them?
