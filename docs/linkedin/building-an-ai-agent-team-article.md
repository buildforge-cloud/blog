# I ran Claude Code as a team of AI agents for eight weeks

AI wrote this, as it writes everything I build. I edited it.

On its second day, the AI session I built to check my agents' work asked one of them for proof. The worker got it by loading my production machine.

A test was meant to hold up while the machine was busy. So the worker made the machine busy. It ran CPU burners for about ten minutes, and the load went to 12.

That machine has 2 CPUs, and it also serves my sites. The session did what I had built it for: it didn't take a worker's word for anything. Nothing in its rules said what a proof may cost, or where it may run.

## How the team works

I run my projects with Claude Code. One session, which I call the executive, watches my code, proposes work and reviews it.

The workers are separate Claude Code sessions. Each one takes a single task, works in its own copy of the code and hands in a pull request. The executive runs the checks again, reads the change and merges it.

I decide what goes in the queue. Anything that goes live, and anything that changes how an app looks, waits for my yes.

Around it sit three tools I started in the same week, in late September. One is the executive's own code.

One is a board on my phone, where the executive posts a card with a question and a few options, and I answer with a tap. The third keeps the agents' memories in plain text files.

By 18 November, the executive's code alone had 623 merged pull requests, 114 of them in its busiest week. At the median, a review took 11 minutes.

The code was the fast part. The failures sat in what I built around it.

## A rule in a file was not enough

The CPU burners were not the first time my production machine paid for a test. On 7 July, before any of this, a test ran one project's real Docker Compose file.

The container names in that file are fixed. So the test didn't start a copy beside the live app. It replaced the live containers, and my sites went down.

I wrote a rule after that: never run a project's real compose file, not even to test. It went into the instructions every session reads.

A written rule was not enough. Since 25 September a hook refuses that command in every project, before it runs. No agent has to remember anything.

The CPU burners got a rule of their own: never load the production machine to prove a point. Prove timing with a fake clock, or by how the code is built.

## The instructions grew back

Each incident leaves a line in the instructions. Each line is the right reaction on the day, and they add up.

My global instructions file is the one Claude Code loads into every session in every project. I trimmed it on 1 August. By 24 September it had grown back to 108 KB, and I split it again.

The rules that apply every time stayed in it. The detail moved into documents that an agent reads only when it works in that area.

The executive's own instructions file has a budget now: 200 lines and 12 KB. On 19 November it was 133 lines and 11,999 bytes. One byte under.

## The board said three workers

The executive is built to doubt its workers. Each worker ends its pull request with its own report: what it did and which tests it ran.

The executive reads that report, runs the tests again itself, and reads the whole change against the task. When something is wrong, the work goes back for another round. The last 10 merges of each kind of work took 2 such rounds between them.

Then a number on the board broke a rule. On 18 November the board showed 3 workers running, and the cap is 2.

Either a third worker got past the cap, or the board counted wrong. When I wrote this up, nobody had found out which.

I had built the executive to check its workers' reports. The board's numbers need the same check.

## A feature that measured as noise

The memory tool can suggest related memories. When an agent reads one memory, the tool adds a line that names its neighbours.

The first measurement was on 24 September. The tool's own links gave 7.2 useful suggestions per 100 reads, and plain links written into the memories gave 3.6. The gap was so uncertain that it could have been zero.

And that line showed up at 94% of reads. It was mostly noise, so I turned it off.

A later run, on 8 October, gave 20.7 against 3.4. This time the gap was clear of zero.

The line is still off by default. Turning it back on is my decision, and I haven't made it.

## 31 alarms in one day

A script checks every worker each 5 minutes. When a worker has stopped, or a prompt has waited, for 10 minutes, it tells the executive: "waiting on you".

On 29 September it said that 31 times. Until 3 October it also fired for a worker whose change to how an app looks waited on my yes. So some of the 31 may have been waiting on me.

The first draft of my blog post about all this called all 31 questions that only I could answer. The executive's review of the draft caught that.

## My part

My part happens on my phone. I read the board in short lines, one card per choice. I do no code review: the executive does that.

I say yes to what goes live and to what changes how an app looks. Over the eight weeks the executive put thousands of small decisions in front of me.

I kept every number with its date. The full list is in [the post on my blog](https://blog.buildforge.cloud/posts/building-an-ai-agent-team/).

If you run AI agents on real work, what was the first rule you had to turn into a hard check?
