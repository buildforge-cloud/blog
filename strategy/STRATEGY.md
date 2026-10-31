# blog strategy

What the blog is for, who reads it, and what comes next. Reviewed once a
month (decision 1943, blog#50). How it is built is in `CLAUDE.md`.

## Goal

Get BuildForge's products seen: ps·db, Vedlikeholdsloggen, Skredda and ISO
Pathfinder Buddy. Each post must still read as a person wrote it: a title in
the words a searcher types, the product linked at its first mention, short
plain sentences, no em dash. The blog is also Stefan's record of building
apps with AI agents, told with the wrong turns left in.

Source: `CLAUDE.md` "What a post is for" (decision 1245, 2026-10-12),
`src/content/pages/about.md`, `README.md`, blog#28.

## Users

- Developers who run a small site and want it indexed by Google (blog#28).
- Developers who use coding agents and want to know when to switch (blog#35).
- Developers who search for GitHub Actions secrets and fork PRs (blog#46).
- Readers the posts bring to ps·db and Vedlikeholdsloggen (blog#42, #43, #44).
- Indie app makers whose app is live and nobody downloads it (blog#73).
- Stefan himself: the blog is his record (blog-post skill, "identity").

Source: the user stories in the issues named above.

## Now

Each post goes live at the 07:05 UTC deploy on its day; check it on the site.
1. 24 Nov, 1 Dec, 8 Dec: AI-written tests (blog#58), visitor input in logs (blog#59), copied text (blog#60).
2. 15, 22, 29 Dec: tests that skipped a file (blog#68), the weekly usage limit (blog#69), Comment Finder 1.9.1 (blog#70).
3. 5 Jan: splitting a large file in five steps (blog#72). 12 Jan: 17 downloads, a plan before more code (blog#73).
4. Before 12 Jan: add the 1 Dec reading of Vedlikeholdsloggen 1.3 to blog#73's post if it is in.

Source: blog#58 to #60 (Stefan's "Queue these 3", decision 2128); blog#68
to #70 (decision 2293); blog#72, #73 ("Queue these 2", decision 2529).

## Not doing

- No analytics or tracker on the site (blog#17). `npm run test:pages` fails if one comes back.
- No dark mode (blog#4). The site follows buildforge.cloud's paper design.
- No CMS or admin panel. A post is a Markdown file and a push to `main`.
- No tutorials and no sales pitch: no calls to action in a post (PR #30, "Keep").
- No numbered series ("Part 3"). Tags group posts instead.
- No links to private repos or to apps behind a login.
- No release of all queued posts at once: one a week (blog#44, blog#46).
- No `@astrojs/react` or `@giscus/react`: it breaks the OG image build.

Source: `CLAUDE.md` (Analytics, Design, Writing a post, Comments),
`.claude/skills/blog-post/SKILL.md`, the issues named above.

## Measure

- Search clicks and impressions for blog.buildforge.cloud, read in Google
  Search Console. The repo holds no baseline and no target yet.
- Posts that went live, one a week: read from `pubDatetime` in
  `src/content/posts/` and checked on the live site. The executive proposes
  3 topics a month, and Stefan says yes to each one (decision 2124).
- Floors that must stay green: `npm run test:pages` in CI (AA contrast, no
  tracker, CSP) and `python3 tools/psi.py https://blog.buildforge.cloud/`
  for PageSpeed.

Source: `CLAUDE.md` "Analytics" ("Search Console still gives the search
numbers"), `README.md` commands, blog#9, decision 2124 (blog#58).

## Open questions

1. The blog-post skill says the blog is "not traffic" and "not selling".
   Decision 1245 says its main job is to get the products seen. Do you say
   yes to blog#28's proposal, so the skill and 4 old titles change?
2. Which number means "seen": search clicks to the blog, or visits from the
   blog to each product? The blog has no analytics, so the second can only be
   read in each product's own tools. What target do you want?
3. Every reader named in the issues is a developer. Is that the main reader,
   or do you also want app users (such as Vedlikeholdsloggen's Norwegian home
   owners, while the posts are in English)?

Source: the gaps and conflicts found in the sources above. The old
question 3, on the topics after 17 Nov, is answered in Measure.
