---
author: Stefan M. Gulbrandsen
pubDatetime: 2026-10-15T17:00:00Z
title: "How fast AI coding agents change: Claude Code on GitHub, week by week"
slug: how-fast-agent-setups-change
featured: false
draft: false
tags:
  - claude-code
  - directing-ai
description: I counted merged pull requests from AI coding agents on GitHub for 8 weeks. Claude Code's share went from 67% to 82%, and a new model, Claude Opus 5.5, went from 0% to 60% of its PRs in two weeks.
---

In the last week of September, 60% of the public pull requests made with
[Claude Code](https://claude.com/product/claude-code) named a model called Claude Opus
5.5. One week earlier it was 33%. One week before that, 0%.

I was not looking for that. I was looking for something about my own setup,
and this turned out to be the louder answer.

## Was my agent setup falling behind?

I run a small group of AI agents that
[write, review and merge code](/posts/the-bugs-were-in-the-brakes/) across my
projects. I have a dashboard for them. In early October I wanted one more
thing on it. In my own words at the time: "an indication of when we need to do
improvements or pick up on changes in the market that I may not have picked up
for how to operate agents better."

So, two questions. Are my agents getting slower than setups like mine? And is
the market changing under me?

The first one is the one I cared about. It is also the one the public numbers
could barely answer.

## How I counted, and what it misses

Everything here comes from GitHub's own search. The weeks run Saturday to
Friday in UTC, from 8 August to 2 October 2026.

- **Counts.** Each week, the number of merged pull requests each agent left a
  mark on. Claude Code writes "Generated with Claude Code" into the PR text.
  Codex and Cursor start their branch names with `codex/` and `cursor/`.
  Copilot's and Devin's agents open PRs from their own app accounts.
- **A sample.** Three or four short windows of time each week, picked at
  random, with every merged Claude Code PR in each window. 714 PRs over the 8
  weeks, about 100 a week.
- **The model.** Claude Code adds a `Co-Authored-By` line to its commits, and
  that line names the model. I read it on the last commit of each sampled PR.

All three undercount. Claude Code's mark can be turned off or edited, so a PR
without it is invisible here. 18% of the sampled PRs had no Claude trailer on
their last commit. A Codex PR on a renamed branch is not counted. Search only
sees public repositories, and most company work is private.

The sample has holes too. The heavier query failed with a server error on 14 of
40 requests. The third week has only 26 PRs, because 3 of its 4 requests
failed.

## The comparison was mostly noise

The question I cared about was speed: how long from opening a PR to merging
it. In the week to 2 October my agents' median was 16.4 minutes. The median of
all merged Claude Code PRs that week was 13.8.

That looks a little slow. It is not a real gap. A median of about 100 PRs moves
a lot by chance. Two public weeks could differ by up to 14.8 minutes and mean
nothing. The band for my comparison was 22 minutes either way, and my gap was
2.6.

Who counts as "similar" moved the answer more than anything else. Public Claude
Code PRs with no review at all merged in a median of 9.2 minutes. With only a
bot's review, 84 minutes. With a review by another person, 375 minutes. Only
4.2% of the sample had that last kind. If I had picked reviewed PRs as my peers,
my agents would have looked many times faster. That would have measured how
long people take to read a PR, not anything about my setup.

Size pulled the other way. My PRs that week had a median of 373 lines, the
public ones 145. Mine carry their tests and docs. A bigger PR takes longer, so
the speed has to be compared over the same mix of sizes.

So at about 100 PRs a week, the line can show a gap of about 2× and nothing
smaller. My rule for "behind peers" fired on nothing. Run on the public weeks
against each other, it fired 0 times in 7. That is what I want from it on
noise. It is also all it can say for now.

## Claude Code's share of agent PRs

The second question had a loud answer.

| Week to | Agent PRs merged | Claude Code | Codex | Cursor |
| ------- | ---------------- | ----------- | ----- | ------ |
| 14 Aug  | 681k             | 66.8%       | 24.0% | 6.7%   |
| 28 Aug  | 731k             | 64.0%       | 25.6% | 8.6%   |
| 11 Sep  | 1,070k           | 71.9%       | 20.0% | 6.7%   |
| 25 Sep  | 1,286k           | 77.7%       | 14.9% | 6.0%   |
| 2 Oct   | 1,792k           | 81.9%       | 12.9% | 3.9%   |

Claude Code's share grew every week from the end of August. Codex's fell.
Copilot and Devin stayed under 2% the whole time.

Claude Code's own count went from 455k merged PRs a week to 1.47M. In the
week of 8 to 14 October it was 1,812,623.

The merge rate barely moved: 98.1% to 98.8%. Most public PRs are merged by the
person who opened them, so this number says almost nothing about quality.

## A new Claude model took 60% in two weeks

The model names moved fastest. Share of the sampled Claude Code PRs, by the
model in the trailer:

| Week to | Opus 5 | Opus 5.5 | Sonnet 5.5 | Fable 5.1 |
| ------- | ------ | -------- | ---------- | --------- |
| 4 Sep   | 49%    | 0%       | 0%         | 0%        |
| 11 Sep  | 41%    | 0%       | 0%         | 15%       |
| 18 Sep  | 60%    | 0%       | 0%         | 20%       |
| 25 Sep  | 29%    | 33%      | 0%         | 10%       |
| 2 Oct   | 4%     | 60%      | 12%        | 2%        |

Opus 5 fell to 4% in the same two weeks. I don't trust its 60% in mid
September, though. The sample comes in bunches, and one busy repository can
fill a whole window.

The switch held. In the week of 8 to 14 October, 112 of 190 sampled PRs named
Opus 5.5. That is 58.9%.

My own agents moved with everyone else. Of the 278 PRs my account opened
between 25 September and 3 October, 276 name Opus 5.5. I did not think of that as a
market move when it happened. I thought of it as a new model in my config.

What did not move: review and CI. Between 8% and 20% of sampled PRs had any
review, and 76% to 88% ran CI, with no trend. PR size went down by about 100
lines from the first four weeks to the last four, which is right at the edge of
chance.

## What these numbers can't tell me

They can't say why people switched. A new default in the tool would look
exactly like a lot of people choosing the new model. The counts can't tell
those apart.

They can't say if the switch was right. The merge rate is close to 100% every
week, so it can't separate a good model from a bad one.

They can't say if the growth is more people or more PRs per person. A count of
PRs has no team size.

What changed for me is how I read a comparison. The research papers I found on
agent PRs are careful, and they end in April 2025 and November 2025. Their
numbers are real, for the models of their time. When the peer group changes
its main model in two weeks, a benchmark is only true for its date. The
dashboard now fetches these numbers every day, so the next switch should show
up in the week it happens.
