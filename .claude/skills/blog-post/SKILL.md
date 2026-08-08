---
name: blog-post
description: Helps write posts for Stefan's dev-journey blog (blog.buildforge.cloud) — turns a rough idea into a Gemini research prompt grounded in the blog's real identity, then turns Gemini's research back into an actual post file under src/content/posts/. Use when asked to write a blog post, brainstorm a post idea, turn a project incident/session into a post, or "help me research a post."
---

# Blog Post

This blog is a personal record of Stefan's journey building things (mostly with AI
agents doing the actual implementation), kept both for himself and for whoever else
finds it — even if that's one reader. Every step below should protect that identity,
not drift toward generic "content marketing" blogging advice, which is the default
failure mode of both AI-assisted writing and of research tools like Gemini if you
don't anchor them first.

## The blog's identity — treat this as fixed, don't re-derive it per post

- **Why it exists**: documenting the journey, for Stefan's own record and
  entertainment first; connecting with anyone else who finds it interesting is a
  welcome side effect, not the goal being optimized for.
- **What "doing this well" actually means**: not traffic, not audience growth —
  whether the post is still worth rereading years from now. That means capturing
  *why* a decision was made and what the thinking actually was, not just recording
  that something happened. A flat list of "did X, then did Y" ages badly; the
  reasoning and the wrong turns are what make it worth rereading.
- **Audience**: nobody specific. Not written *for* recruiters, not written *for*
  beginners, not written *for* a subreddit. Anyone interested is welcome to read it.
- **Throughline**: a mix of learning journey and experimentation — there is no fixed
  narrative arc ("becoming a developer," "building a startup") to keep consistent.
  Individual posts can be about wildly different things as long as they're honest
  about what actually happened. Don't serialize posts as numbered parts ("Project X:
  Part 3") — use tags instead, so an abandoned or stalled project doesn't create
  pressure to "finish the series."
- **Voice**: personal journal style. First person, informal, reflective — not a
  writeup addressed to a reader who needs onboarding.
- **What a reader should walk away with**: knowing what the work was actually like,
  and what I now think that I didn't think before. Not persuaded, not sold, not
  taught a skill step by step. "Informed" is a byproduct, not the target — aiming
  at it directly is what quietly turns a post into a report, because it gives every
  true fact a claim to be included (see "Structural tells" below).
- **Source material**: anything relevant — a real incident from a buildforge.cloud
  project, a decision and why it was made, a struggle that isn't resolved yet, a
  more general reflection with no specific project event behind it at all.
- **Hard boundaries**:
  - Not a tutorial. Don't let a post drift into "here's how you do X" structure.
  - Not selling anything — no calls to action, no positioning, no product pitch.
  - Must be transparent about struggles along the way. A post that only recounts
    the win and skips what was frustrating, confusing, or still broken is off-brand
    for this blog specifically — the struggle is part of the point.

## Post shape — no forced length or cadence

Don't impose a target word count or a "should have posted by now" pressure on
either the user or the drafting process:

- A short entry (a paragraph, even ~100 words) about one specific discovery or
  screwup is a complete, legitimate post — don't pad it out to look more
  substantial.
- A long post-mortem is also fine at full length — don't truncate it to fit some
  assumed norm.
- Never add meta-commentary apologizing for a gap since the last post ("sorry for
  the radio silence"). Just post the next thing.
- Publish when there's something real to say (a milestone, a blocker, an insight),
  not on a schedule.

## Mechanical rules that keep the voice from drifting

These exist because the two failure modes for this kind of writing are specific
and predictable: collapsing into an unfiltered operational dump, or drifting into
an instructional/tutorial tone without meaning to (the second one is the harder
trap given the subject matter looks like technical documentation from a distance).

- **Open where the tension is, not with a summary of conclusions.** Don't build up
  chronologically ("first I did X, then Y") — but don't open with an executive
  summary of the findings either. That's an abstract, and it's the fastest way to
  make a post read like a report. Open at the moment something stopped making
  sense, or where the stakes actually were, and let the reader arrive at the
  conclusion roughly the way I did. One striking number can open a post; three of
  them stacked with supporting detail cannot.
- **No second person.** Never write "you should..." or "if you want to do this,
  first...". Stay in first person, describing what *I* did and decided. This is the
  mechanical enforcement of "not a tutorial" — tone alone drifts, this rule doesn't.
- **Externalize raw artifacts, don't inline them.** Long terminal output, full
  diffs, or verbose logs don't belong pasted into the narrative — link to the
  commit/PR (only for this repo, the one public one — see the colophon note below)
  or summarize the shape of it in prose instead of dumping it.
- **Select facts by what they changed, not by whether they're true.** A detail
  earns its place if it changed my thinking, or if it shows what the work actually
  felt like. Not because it was hard-won, not because it's interesting on its own,
  not because it took ages to find out. Everything else already lives in the
  project's own log and issues, and belongs there instead. Watch precision
  specifically: a timestamp to the minute, a duration to the tenth of a second, an
  exact worker count — that level of precision is report register. Unless the
  precision *is* the point, round it or cut it.
- **Wrong turns must be load-bearing, never collected into a section.** Every
  substantial post needs real "this didn't work the first time" or "I got this
  wrong" content. But if it all ends up under one heading ("Where I got it wrong,"
  "Mistakes made"), the rule has been satisfied as a checkbox while the narrative
  stayed untouched. **The test: if that block can be deleted and nothing else in
  the post needs rewriting, the structure is wrong.** A wrong turn belongs at the
  point in the story where it actually misled me, so the reader is wrong alongside
  me and gets corrected alongside me. Good raw material to mine for it:
  - Where a high-level instruction got interpreted differently than intended.
  - A specific hallucination, regression, or wrong assumption the agent produced,
    and how it actually got caught.
  - The real prompt/approach iteration that fixed something — not "eventually I
    got it working," but what specifically changed.

## AI writing tells to avoid

Even on a blog that's upfront about AI involvement, prose that reads as
machine-generated is still grating to a reader, and it works against the
whole point: the writing is supposed to be recognizably Stefan's, not
recognizably a model's. Run every draft against this before calling it done.

- **No em dashes.** This is the single most common tell and worth naming on
  its own. Use a period, comma, colon, or parentheses instead. Rewrite the
  sentence if none of those fit cleanly rather than reaching for the dash.
- **No stock AI vocabulary**: seamless, leverage, robust, comprehensive,
  cutting-edge, game-changer, transformative, innovative, delve, dive into,
  unlock, unleash, elevate, "in today's fast-paced world," "it's worth
  noting," "at the end of the day," "needless to say."
- **No "not just X, but Y"** or other symmetric rhetorical constructions
  that sound composed rather than spoken.
- **No forced rule-of-three lists** ("fast, flexible, and reliable") when
  the real thought only has one or two parts. Say the actual number of
  things, not a stylized triad.
- **No throat-clearing transitions** ("Additionally," "Furthermore,"
  "That said," "It's important to note that") — just say the next thing.
- **No manufactured on-the-other-hand balance.** If the honest take is
  one-sided, let it be one-sided instead of hedging toward false symmetry.
- **Vary sentence length and structure like an actual person typing this
  out**, not a template applying the same clause pattern repeatedly.

If a full draft comes back clean on every other rule in this file but still
*reads* like AI wrote it, that's a real problem worth fixing before it ships,
not a nitpick to skip.

## Structural tells — the report failure mode

The list above catches prose that *sounds* machine-written. This one catches a
draft where every sentence passes and the **shape** is still a report. This is the
more common failure on this blog, because the source material (engineering logs,
issues, commit history) is genuinely report-shaped and that shape transfers
without anyone deciding to transfer it.

Any one of these is worth a restructure, not a tweak:

- **Section headers that are topic labels rather than moments.** "Search Console
  API access" is a bucket. "The number that made me stop" is a moment.
- **Sections of roughly uniform length**, each opening a subject and closing it
  cleanly before the next. Real narrative sections are lopsided.
- **An opening that summarises the findings** before anything is at stake.
- **Enumerated findings** — "Three worth recording," "Two things worth noting."
  Nobody talks like that. It's the register of a status update.
- **A "Still open" / "Next steps" close.** Ending on unresolved things is honest
  and good; ending on a *checklist* of them is bookkeeping. Say what's still
  nagging, not what's still on the list.
- **The post is a survey** — several incidents each getting a fair share of space.
  That means it has no spine. Several incidents can absolutely appear in one post,
  but as evidence for one thread, never as a catalogue.

## Workflow

### 1. Gather what's specific to *this* post

Don't re-ask about the blog's identity above — that's fixed. Only ask for what's
missing for this particular post:

- **Seed** — the rough topic, incident, or feeling prompting this post.
- **Source material** — a specific project/session/incident to ground it in (point
  at git history, an issue, a CLAUDE.md/ops-log entry, or this conversation's own
  history if relevant), or confirm it's a freestanding reflection with no specific
  event behind it. If raw notes from the actual session exist (a scratchpad, a
  chat log), use those as source material rather than reconstructing from memory.
- **The honest struggle** — what part of this didn't go smoothly? Use the three
  prompts above (intent vs. interpretation, a specific agent misstep and how it was
  caught, the real fix) if the user doesn't have one ready.
- **Anything off-limits** — a client/person/detail that shouldn't be named, a
  secret that shouldn't leak (check against the buildforge.cloud CLAUDE.md's known
  secrets/tokens before including any real command output verbatim — this matters
  concretely, not hypothetically: that file holds live API tokens and infra
  details that must never end up quoted in a public post).

If the seed is vague ("something about the giscus thing"), that's fine to work
with — resolve specifics via step 2's research rather than interrogating the user
further.

### 2. Produce the Gemini research prompt

This is the actual deliverable of this step. Fill the template below in from step
1's answers and the fixed identity block above, and output it as a single
copy-pasteable fenced block. Don't call Gemini yourself — hand the prompt back for
the user to run.

```
I'm doing research to help me write a post for my personal dev-journey blog.
Ground everything you tell me in what this blog actually is — don't give me
generic blogging/content-marketing advice, it doesn't apply here.

WHAT THE BLOG IS:
- A personal record of building things (mostly AI agents doing the actual
  implementation), kept for myself and for whoever else finds it interesting —
  even if that's one reader.
- No target audience — not written for recruiters, beginners, or any specific
  community.
- No fixed narrative arc. Posts vary; the only throughline is honesty about what
  actually happened.
- Voice: personal journal, first person, informal.
- Reader goal: informed, not persuaded, not taught a how-to.
- Hard rules: NOT a tutorial. NOT selling anything. MUST be honest about what
  struggled or went wrong, not just the win.

WHAT THIS POST IS ABOUT:
{seed}

SOURCE MATERIAL / WHAT ACTUALLY HAPPENED:
{source material, or "no specific incident — general reflection" if freestanding}

THE HONEST STRUGGLE I WANT TO INCLUDE:
{the honest struggle from step 1}

WHAT I WANT FROM YOU:
1. Angle — given everything above, what's the most honest and specific way to
   frame this post? Flag any framing that would drift it toward tutorial or
   sales-y territory so I can avoid it.
2. Structure — a loose shape for the post (not full prose), matching journal
   voice, not listicle/how-to voice.
3. What's already out there — if this topic has been written about a lot
   elsewhere, tell me what the common takes are so I don't just repeat them, and
   flag anything commonly claimed that's actually wrong or oversimplified.
4. Honesty check — push back if my framing of "the struggle" above looks like
   it's papering over what actually happened, or ask me clarifying questions to
   get closer to what's real.
5. Open questions — anything you'd want to know before this could become an
   actual draft.

Don't write the blog post itself. I want research and a thinking partner, not
copy.
```

### 3. When the research comes back

The user will paste Gemini's response back in. Use it to settle on an angle and
structure, but don't let Gemini's suggestions override the hard boundaries above —
if its structure suggestion reads like a tutorial or a listicle, that's a signal to
push back, not to follow it because it came from research.

### 4. Find the spine before writing a word

**Do this explicitly, in the conversation, before drafting.** State the spine back
to the user and get agreement if there's any doubt. Skipping this step is what
produces a competent report instead of a post.

Write one sentence naming what the post is *about* — not its topic, but the change
in understanding or the experience underneath it. Two shapes that reliably work:

- "I believed X. Then Y happened. Now I think Z."
- "Here is what it is actually like to do W."

"SEO problems on ps·db" is a topic, not a spine. "SEO is the first thing I've built
where I can't see whether I'm right" is a spine.

Then test every candidate section against it: does this earn its place as evidence
for that one sentence? Material that is true, interesting and unrelated gets **cut**,
not demoted into a smaller section. Nearly all of it is already recorded in the
project's own log, which is where it belongs.

**If the research step was skipped** (the user asked for a draft directly, which
they're entitled to do), this step is not optional — it's the compressed version of
what step 2's prompt existed to settle. Do it inline and say which spine was
chosen, so the user can redirect before there's a whole draft to argue with.

### 5. Draft the post — organize, don't originate

**This step is about structuring the user's own account, not generating journal
voice from scratch.** Handing a topic and some research to an LLM and asking it to
write reflective first-person prose reliably produces homogenized writing that
strips out the specific quirks and self-critique that make this kind of journal
worth rereading — the exact thing this blog exists to avoid.

Concretely:

- If the user has given actual raw reflections, notes, or an account of what
  happened (from step 1, or pasted in directly), organize and structure *that*
  into the post — apply the mechanical rules above, build the frontmatter, fix
  structure — but keep their actual words and specifics as the backbone of the
  prose rather than rewriting the reflective content from scratch.
- If the user hasn't given their own account yet and only a topic/seed exists,
  **ask for it** rather than inventing plausible-sounding reflections, emotional
  beats, or opinions to fill the gap. A generated "what this felt like" is exactly
  the failure mode to avoid.
- **Not all source material is a safe backbone, and the difference matters far
  more than it looks.** Raw notes, a scratchpad, a chat log, or the user talking
  through what happened are *unstructured* — organizing those is exactly right. An
  engineering log, a GitHub issue body, a CLAUDE.md section or a commit history is
  **already a report**, written deliberately in report register. Reorganizing one
  produces a report every time, and it happens invisibly: the section structure and
  the flat evidentiary tone transfer with no decision to transfer them. Mine those
  for **facts only**, and build structure from the spine (step 4), never from the
  document. **Explicit check before calling the draft done: line the post's section
  headers up against the source doc's. If they map onto each other, the source's
  structure was inherited and the post needs restructuring, however good the
  individual sentences are.** This is a real observed failure, not a hypothetical —
  the first SEO post drafted off ps·db's `ENGINEERING_LOG.md` reproduced that
  entry's section order almost one-to-one.
- When describing what the AI agent did on a project, keep a critical, evaluative
  distance from its output — describe and assess it like reviewing someone else's
  work, not just narrating "I built X."

File mechanics, per this repo's own conventions (see `CLAUDE.md`'s "Writing a
post" section — re-read it if unsure, don't assume the schema from memory):

- New file under `src/content/posts/`, using `hello-world.md` as the frontmatter
  template and `src/content.config.ts` for the authoritative schema.
- `draft: true` by default — never flip to `false` without the user confirming
  the post is actually ready.
- **Tags**: before finalizing frontmatter, check what tags are already in use
  across published posts (`grep -h "  - " src/content/posts/*.md` under each
  `tags:` block, or just check `/tags` on the live site) so the taxonomy stays
  coherent instead of fragmenting into near-duplicates (`ai-agent` vs.
  `ai-agents` vs. `agents`). Tags are the mechanism this blog uses *instead of*
  numbered series (see "Throughline" above) — a project-name tag (`ps-db`,
  `budget-tracker`) lets a reader follow one project's thread across posts
  without forcing a linear "part 3 of" structure, and a theme tag (`meta`,
  `directing-ai`, `infrastructure`) groups cross-project reflections. Reuse an
  existing tag when the post genuinely fits it; introduce a new one when the
  post covers real new ground, don't force-fit the nearest existing tag just
  to avoid adding one. Usually 1-3 tags is enough — resist tagging a single
  post with everything it loosely touches. The schema defaults to `["others"]`
  if none are given; treat that as a sign no real tag was chosen yet, not an
  acceptable resting state.
- Watch the underscore-prefix build gotcha documented in CLAUDE.md if the post
  goes in a subdirectory.
- If the post links to a specific commit/PR in this blog's own repo (the org's
  only public one), that's fine per the site's `/colophon` page — don't link to
  or quote from any other buildforge.cloud repo, since those are private and the
  colophon explicitly says raw session/repo detail isn't published here.
- **Don't link a reader straight at a live app that's gated behind Cloudflare
  Access** (`budget.buildforge.cloud`, `luna.buildforge.cloud`, and any future
  app on the same pattern — see the global CLAUDE.md's "Multi-user identity
  via the Access header" section for which apps this applies to). A reader
  without Stefan's login just hits an auth wall, which is a bad link to hand
  someone. Fine to write about these projects narratively, just don't link
  out to the live instance. The two projects that are actually public and
  safe to link directly are ps·db (`https://ps-db.cloud` — note it moved off
  `ps-db.buildforge.cloud` in the 2026-07-23 domain migration; the old
  subdomain only 301s now) and ISO
  Pathfinder Buddy (`https://iso-pathfinder-buddy.lovable.app/roadmap`) — both
  listed on [buildforge.cloud](https://buildforge.cloud), which is also a fine
  generic fallback link. Recheck this list before linking anything new; it'll
  drift as projects go public or get gated.
- Before treating the draft as done, run it against **both** the "AI writing tells
  to avoid" and the "Structural tells" sections above — check for em dashes
  specifically, since they're easy to drop in without noticing, and check the
  section headers against the spine and against the source doc.

### 6. Wrap

Point the user at `npm run dev` → `https://dev.buildforge.cloud/absproxy/5177/` (or
`astro dev --background` per this repo's dev-server convention) to preview before
they flip `draft: false` and push.

## Inspiration, not a template

If tone calibration is ever unclear, these are worth a look — not to imitate
structurally, but as evidence this shape of writing works: Joey Hess's git-annex
devblog (unfiltered, zero-agenda daily build log), Simon Willison's
main-blog/TIL-subdomain split (lets small discoveries publish with near-zero
friction without cluttering long-form posts), and Dan Luu's writing (rejects
audience-optimized advice-giving in favor of self-auditing and evidence-based
reasoning). Don't copy their structure wholesale — this blog's own identity above
takes precedence.
