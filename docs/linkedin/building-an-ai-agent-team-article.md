# I ran Claude Code as a team of AI agents for eight weeks

On day two, my AI reviewer asked a worker agent for proof. The worker got it by loading my production server.

Written by AI, edited by me.

The request was fair. A test was supposed to survive a busy machine, so the worker made the machine busy: CPU burners for about ten minutes, until the load reached 12.

The box has 2 CPUs and serves my websites too. Nobody broke a rule that day. I had built the reviewer to never take a worker's word, and it didn't.

What it lacked was any rule about what a proof may cost, or where it may run. That pattern held for eight weeks: the agents wrote code fast, and the trouble lived in the rules and checks I put around them.

## How the team is wired

Since late September, every project I run has Claude Code sessions in two roles.

One session reviews. I call it the executive. It watches my repositories, suggests work, and decides whether a change is good enough to merge.

The others are workers. A worker picks up one GitHub issue, does it in a separate copy of the code, and hands back a pull request.

Three decisions stay with me: what goes in the queue, what goes live, and anything that changes how an app looks.

Three small tools hold it together, all started in the same week:

- the executive's own code;
- a board on my phone, where the executive asks me questions as cards I answer with a tap;
- a memory plugin that keeps the agents' notes as plain files, with no server and no embeddings.

## The pace was never the problem

By 18 November, the executive's code alone had 623 merged pull requests. Its full weeks ranged from 43 merges to 114.

The median review took 11 minutes. Over the last 10 merges, a worker's start to its merge took 43 minutes at the median for work on the team's own tools, and 51 for work on my products.

The other two tools grew alongside it: about 1,300 commits on the board, 95 on the memory plugin. Speed was the easy part. Every failure in this article sat in what I built around the code.

## Turn rules into hard checks

The CPU burners were not my first production scare. On 7 July, before any of this, a test started one project's real Docker Compose file.

Its container names are fixed, so the test could not run beside the live app. It took the live app's place, and my sites went down.

My first fix was a sentence in the instructions every session reads: never run a project's real compose file, not even to test.

That sentence was not enough. Since 25 September, a hook blocks the command in every repository before it can run, and no agent has to remember anything.

The CPU burners got their own rule: prove timing with a fake clock or by design, never by loading production.

## Give your instructions a budget

Every incident adds a line to the agents' instructions. Each line makes sense on the day it is written. Together, they pile up.

My global instructions file loads into every Claude Code session on every project. I cut it down on 1 August. By 24 September it had swollen to 108 KB again.

So I split it. Rules that always apply stayed. Details moved into documents an agent opens only when it works in that area.

The executive's own file now has a hard cap of 200 lines and 12 KB. On 19 November it held 133 lines and 11,999 bytes: one byte to spare.

## Doubt your own dashboard

I built the executive to be suspicious. Each pull request ends with the worker's own report of what it did and which tests it ran.

The executive treats that report as a claim. It reruns the tests and reads every changed line against the issue.

When something is off, the work goes back to the worker. In the last 10 merges of each kind of work, that happened 2 times in each kind.

Then my own board broke a rule. On 18 November it showed 3 workers running, with a cap of 2.

Either a worker slipped past the limit, or the board miscounted. When I wrote this up, nobody knew which.

The suspicion I built into the reviewer has to cover my own tools as well.

## Measure the feature before you trust it

The memory plugin can point an agent to related notes. When the agent opens one memory, the plugin adds a line that names its neighbours.

I measured it on 24 September. The plugin's own links gave 7.2 useful suggestions per 100 reads, and plain links written into the memories gave 3.6.

That gap was too uncertain to rule out zero. Meanwhile the extra line showed up on 94% of reads, so I switched it off.

A second run on 8 October looked much better: 20.7 against 3.4, clearly above zero.

The line is still off by default. Switching it back on is my call, and I haven't made it yet.

## Alarms need design too

A script looks at each worker every 5 minutes. If a worker has stopped, or a prompt has sat waiting, for 10 minutes, it tells the executive.

On 29 September that alarm fired 31 times. Until 3 October it also fired when a worker was only waiting for my yes on a visual change, so some of those 31 may have been waiting on me.

The first draft of my blog post said all 31 were questions only I could answer. The executive's review of that draft caught the mistake.

## What is left for me

My part happens on my phone. I read short cards, one per decision, and tap an answer.

I don't review code at all: the executive does. I approve what goes live and what changes how an app looks.

Over eight weeks, that added up to thousands of small decisions. The blog post behind this article went the same way: a card I answered became an issue, a worker wrote it, and it waited for my yes.

Every number here, with its date, is in [the full post on my blog](https://blog.buildforge.cloud/posts/building-an-ai-agent-team/).

If you run AI agents on real work, what was the first rule you had to turn into a hard check?
