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
- Stefan himself: the blog is his record (blog-post skill, "identity").

Source: the user stories in the issues named above.

## Now

1. After Stefan's yes to blog#28's proposal: new `title` and `description` for the 4 old posts PR #30 names, slugs kept.
2. After the same yes: change the blog-post skill's identity text ("not traffic", "not selling") to match decision 1245.
3. Add round two's PageSpeed "after" numbers to the 3 Nov phone speed post, if they are in before 3 Nov.

Source: PR #30 (the proposal for the old posts), `CLAUDE.md` "What a
post is for", `docs/ENGINEERING_LOG.md` (blog#42 to #44 entry). No open
issue holds any of these yet.

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
  `src/content/posts/` and checked on the live site.
- Floors that must stay green: `npm run test:pages` in CI (AA contrast, no
  tracker, CSP) and `python3 tools/psi.py https://blog.buildforge.cloud/`
  for PageSpeed.

Source: `CLAUDE.md` "Analytics" ("Search Console still gives the search
numbers"), `README.md` commands, blog#9.

## Open questions

1. The blog-post skill says the blog is "not traffic" and "not selling".
   Decision 1245 says its main job is to get the products seen. Do you say
   yes to blog#28's proposal, so the skill and 4 old titles change?
2. Which number means "seen": search clicks to the blog, or visits from the
   blog to each product? The blog has no analytics, so the second can only be
   read in each product's own tools. What target do you want?
3. No post is queued after 17 Nov. Does one a week go on, and who picks the
   next topics?
4. Every reader named in the issues is a developer. Is that the main reader,
   or do you also want app users (such as Vedlikeholdsloggen's Norwegian home
   owners, while the posts are in English)?

Source: the gaps and conflicts found in the sources above.
