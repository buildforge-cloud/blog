## What this is

Stefan's dev journey blog — documenting building AI-generated apps. Live at
[blog.buildforge.cloud](https://blog.buildforge.cloud). Built on
[Astro](https://astro.build) + the [AstroPaper](https://github.com/satnaing/astro-paper)
theme (scaffolded 2026-08-07), with theme demo content/branding stripped out.

This repo is part of the buildforge.cloud fleet — see `~/.claude/CLAUDE.md` (the
user's global, cross-project instructions) for the shared server/deploy conventions.
That file is the source of truth for anything spanning multiple projects (Traefik,
the self-hosted runner, Cloudflare); this file only covers what's specific to `blog`.

**This repo is the org's only public repo** (every other buildforge.cloud repo is
private). That's a real, deliberate decision, not an oversight — see "Comments"
below for why, and `~/.claude/CLAUDE.md`'s "Public repos and the self-hosted runner"
section for the org-wide runner-policy consequence it had (already fixed, but
**read that section before adding any new workflow to this repo** that might run on
`self-hosted` — a public repo takes PRs from anyone, and a `pull_request`-triggered
self-hosted job would be reachable by a stranger).

## Writing a post

No admin panel / CMS — this is a git-based static site. To publish:

1. Add a Markdown or MDX file under `src/content/posts/` (use `hello-world.md` as a
   frontmatter template: `author`, `pubDatetime`, `title`, `slug`, `featured`, `draft`,
   `tags`, `description` — see `src/content.config.ts` for the full schema).
2. Preview: `npm run dev` → https://dev.buildforge.cloud/absproxy/5177/ (live reload),
   or `npm run build && npm run preview` for an exact production build.
3. Write it with `draft: false` from the start. This theme hides drafts in
   `npm run dev` too, so a `draft: true` post cannot be previewed at all. The real
   gate is the push to `main`: do not push until the post is ready. (Stefan's
   correction, 2026-09-10.)
4. Commit and push to `main` — `deploy.yml` rebuilds and redeploys automatically via
   the org's self-hosted runner, live within about a minute.

**To schedule a post**, set `pubDatetime` to the future time and merge it as
normal. `deploy.yml` also rebuilds every day at **07:05 UTC** (blog#9), and the
post goes live at the first production build after its `pubDatetime`. The theme's
15-minute `scheduledPostMargin` counts too, so a post dated 07:00 UTC goes live at
that day's 07:05 run, and one dated 09:00 waits for the next push or the next
day's run.

Until then a production build leaves the post out completely: no page, no index,
tag or RSS entry. Only its OG image (`/posts/<slug>/index.png`) is built early,
because that route filters drafts but not dates. So the title and description can
be seen at that `.png` URL, but the page itself cannot. Measured 2026-09-25 on
blog#8: `dist/posts/<slug>/` held only `index.png`. `npm run dev` shows a
future-dated post as normal (`import.meta.env.DEV ||` in `postFilter.ts`), so the
preview cannot tell you a date is wrong.

GitHub can start a scheduled run late when Actions is busy, and it turns schedules
off in a public repo after 60 days with no repository activity. If a scheduled
post has not appeared, check the Actions tab for the 07:05 run first.

Organizing posts into subdirectories under `src/content/posts/` is fine (the
subdirectory name becomes part of the post URL) — just don't use a leading
underscore on any directory/file component you want in the actual output; the content
collection's glob (`**/[^_]*.{md,mdx}` in `content.config.ts`) only excludes the
**final filename**, not underscore-prefixed parent directories, so a stray demo file
inside an underscore-prefixed folder still gets built. This bit real bugs during
initial setup (`_releases/`, `_color-schemes/` — see "Removed from the AstroPaper
scaffold" below) — don't assume a `_`-prefixed directory alone keeps its contents out
of the build.

## Outbound links to other buildforge.cloud projects

`.claude/skills/blog-post/SKILL.md` keeps the canonical list of which fleet projects
are safe to link at directly (public, not behind Cloudflare Access) and at which
URL — check it there, don't re-derive it. **That list only gets consulted when
writing a post**, though, so the standing pages under `src/content/pages/`
(`about.md`, `colophon.md`) don't get swept by it and can quietly go stale when a
project migrates domains. That's exactly what issue #1 was: `about.md` still pointed
ps·db at `ps-db.buildforge.cloud` for two and a half weeks after it moved to
`https://ps-db.cloud` (2026-07-23). Nothing was broken for readers — the old host
still 301s — but a redirect only passes SEO signal once Google re-crawls the old
URL, which it hadn't done since the day before the move. When a fleet project
changes domain, grep this whole repo for the old hostname, not just the posts.

## Comments (giscus)

Comments are [giscus](https://giscus.app) — a GitHub-Discussions-backed widget, no
server/DB of its own. Config lives in `src/utils/giscus.ts` (repo id, category id —
generated once via giscus.app against `buildforge-cloud/blog`'s "Announcements"
discussion category), embed/theme-sync logic in `src/components/Comments.astro`.

**Giscus requires the backing repo to be public** — visitors can't see or post
comments on a private repo's Discussions, it just silently shows nothing. That's the
entire reason this repo is public and every other buildforge.cloud repo isn't (a real
decision made and confirmed with the user 2026-08-07, not an accident).

**The giscus GitHub App must be installed on the repo separately from any code
change** — visit https://github.com/apps/giscus → Install → buildforge-cloud org →
"Only select repositories" → `blog`. There's no API/CLI path for this (installing a
GitHub App is inherently a browser-consent action by the account owner) — it's a
one-time manual step, already flagged to the user, not something a future session
needs to redo unless the app is ever uninstalled. Until it's installed, every post
page shows "An error occurred: giscus is not installed on this repository" in the
comments slot — that's the expected, documented failure mode, not a code bug.

**Why the embed is vanilla JS, not the official `@giscus/react` component:**
AstroPaper's own dynamic-OG-image feature (`features.dynamicOgImage: true` in
`astro-paper.config.ts`, implemented in `src/pages/og.png.ts` and
`src/pages/posts/[...slug]/index.png.ts`) generates images via
[satori](https://github.com/vercel/satori) using its own JSX-like plain object
literals. Adding the `@astrojs/react` integration (needed for `@giscus/react`) sets
`tsconfig.json`'s `jsxImportSource` to `"react"` globally, which makes `astro check`
start type-checking those satori object trees against React's actual `ReactNode`
type and fail with two `ts(2345)` errors — unrelated files break just from adding
React anywhere in the project. Tried once (2026-08-07), reverted. **Don't re-add
`@astrojs/react`/`@giscus/react` without first either disabling
`features.dynamicOgImage` or finding a real fix for that type conflict** — it's not
a one-off fluke, it's structural to how this theme's OG image generation works.
`Comments.astro` used to carry a live light/dark theme sync via giscus's own
`postMessage` API; that is gone as of 2026-09-10, because the site is paper-only
and giscus is pinned to its `light` theme (see "Design" below). It still needs
the `data-astro-rerun` attribute — this theme's own
`[...slug]/index.astro` script block sets the same precedent (see its comment): a
script whose text content is byte-identical across every post only runs once per SPA
session under Astro's ClientRouter unless marked to re-run.

## Design — the paper system

Adopted 2026-09-10. The blog wears the same design as
[buildforge.cloud](https://buildforge.cloud), the studio site that owns it: warm
paper (`#f5f2ea`), near-black ink (`#141a22`) for text and drawn structure, and
one ember accent (`#c2410c` for text and links, `#7c2d12` for link hover,
`#e8542a` for solid fills and rules). Type is Space Grotesk for headings, IBM Plex Sans for body copy, IBM Plex
Mono for the small uppercase labels (dates, nav items) — the `label-mono` utility
in `global.css`. The canonical version of these tokens lives in
`profile-homepage/assets/css/variables.css`; `src/styles/theme.css` is this
repo's copy of it, so change both together or they drift.

**There is no dark mode, deliberately** — the studio site made that call and the
blog follows it. That means several things are gone that AstroPaper ships by
default, and none of them should come back one at a time:

- `features.lightAndDarkMode` is `false`, which only hides the toggle button.
- `src/scripts/theme.ts` and the inline FOUC script in `Layout.astro` are
  deleted; nothing sets `data-theme` on `<html>` any more.
- `global.css` has no `@custom-variant dark`, so a `dark:` Tailwind prefix
  anywhere in this repo silently does nothing. Don't write one.
- Shiki runs in single-`theme` mode (`astro.config.ts`), so there are no
  `--shiki-light-*` / `--shiki-dark-*` CSS variables to read.
- `<meta name="theme-color">` is the literal paper hex, not filled at runtime.

The failure this ordering prevents is the one the studio site hit first: a
`color-scheme: light` declaration sitting next to a `prefers-color-scheme: dark`
token override, so the site claimed light and shipped dark to anyone whose OS was
in dark mode. If a dark variant is ever wanted, design it; do not let it fall out
of a token override.

The favicon and the header wordmark share the BuildForge hexagon mark
(`public/favicon.svg`, `src/assets/icons/IconBuildforge.svg`), copied from
`profile-homepage/favicon.svg`.

⚠️ **Issue #4's spec table disagrees with `profile-homepage`'s actual CSS in
three places, and the CSS is the one that was followed.** The issue is the
design brief; it was written before the site shipped and three of its figures
never matched what was built. Body ink is `#141a22` here, not the `#4a5766` the
table lists — `profile-homepage`'s `body` rule uses `--color-text-primary`,
which is `#141a22`, and `#4a5766` is its *tertiary* text. Label tracking is
`0.12em`, not `0.16em`, because `--letter-spacing-widest` is `0.12em` and the
studio nav uses it. And the 5px ember strip exists above the footer only; the
studio has no strip at the top of the page, despite the brief calling for one.
If a fourth divergence turns up, check `variables.css` before assuming the brief
is right.

**Contrast has no automated check yet — that is #6.** Every run of text on the
shipped palette was measured by hand at adoption and passes AA, but ember
`#c2410c` on paper clears it by 0.13, so a token nudge could drop it under
without anything looking wrong. Measure, don't review by eye. The one recorded
exception is `::selection`, which paints white on ember-fill at 3.66:1,
inherited verbatim from the studio site's own `::selection`.

## Analytics

PostHog Cloud (EU), reusing the buildforge.cloud org's existing "Default project"
(see `~/.claude/CLAUDE.md`'s PostHog section for the org/project IDs) rather than a
dedicated project — snippet lives in `src/layouts/Layout.astro`'s `<head>`, gated
behind `import.meta.env.PROD` so `npm run dev` browsing never pollutes real pageview
data. Because Astro's `ClientRouter` does client-side view-transition navigation
(not a full page reload between posts), `capture_pageview` is explicitly turned off
in `posthog.init` and re-armed via an `astro:page-load` listener instead — that
event fires on both the very first load and every subsequent transition, so a
pageview fires exactly once per navigation either way.

## Deployment

Multi-stage Docker build (`node:22-alpine` → `nginx:alpine`, see `Dockerfile`).
`docker-compose.yml` joins the `web` external network, Traefik labels for
`blog.buildforge.cloud` (`mytlschallenge` cert resolver), host port `8082` — a
plain public Traefik domain, **not** routed through the Cloudflare Tunnel (unlike
`budget`/`luna`, which sit behind Cloudflare Access — see the global CLAUDE.md's
"dev-proxy path standard" section for that distinction). DNS is already covered by
an existing `*.buildforge.cloud` wildcard record, confirmed live 2026-08-07 — no
per-subdomain DNS step was needed.

`.github/workflows/deploy.yml` (self-hosted runner, Pattern A) redeploys on every
push to `main`, and on a daily `schedule` at 07:05 UTC so scheduled posts publish
(see "Writing a post"). `.github/workflows/ci.yml` (from the AstroPaper scaffold, adapted
pnpm→npm) runs lint/test/format/build on PRs, deliberately on GitHub-hosted
`ubuntu-latest` rather than `self-hosted` — see the "public repo" runner-policy note
at the top of this file for why that distinction matters here specifically.

⚠️ **The build's output depends on the clock, and Docker's layer cache cannot see
the clock.** The scheduled run builds the same commit as the day before, so
`RUN npm run build` could come back from cache with yesterday's site. The
Dockerfile's `ARG BUILD_ID` sits just above that step, and `deploy.yml` passes
`--build-arg BUILD_ID=${{ github.run_id }}-${{ github.run_attempt }}` to
`docker compose build`, so the step re-runs every time. Both parts are needed: a
re-run keeps its `run_id`, and only `run_attempt` changes, so a failed 07:05 run
re-run at 09:00 would otherwise get the 07:05 build back. That is why the deploy is two steps (`build`, then `up -d`
without `--build`): `up --build` would build again without the arg. Before blog#9
nothing needed this, because every deploy was a push with new content, and new
content already changes the `COPY . .` layer.

`npm test` (`tests/workflows.test.mjs`, Node's built-in runner plus the `yaml`
package) pins what the workflows must keep doing: the 07:05 UTC cron, the
per-run `BUILD_ID`, deploy on push to `main`, no `cancel-in-progress` on the
production deploy, and no workflow where a `pull_request` can start a
`self-hosted` job. A workflow only runs on GitHub, so without this a cron typo
stays silent until the morning a post fails to appear.

Dev server pinned to port **5177** with the `/absproxy/5177/` convention (see
`astro.config.ts` — Astro's own `defineConfig` doesn't take a Vite-style
`(command) => config` callback, so dev-vs-build is detected via
`process.argv.slice(2).includes("dev")`, not `NODE_ENV`).

## Removed from the AstroPaper scaffold

Stripped during initial setup (2026-08-07) since none of it applies to a personal
blog: all theme demo/changelog posts (`adding-new-post.mdx`,
`how-to-configure-astropaper-theme.mdx`, `_releases/`, `_color-schemes/`, etc.),
unused branding images (`AstroPaper-v*.png`, `astropaper-og.jpg`,
`forrest-gump-quote.png`, the lighthouse-score SVG), the theme's own OSS-project
GitHub scaffolding (`FUNDING.yml`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
`PULL_REQUEST_TEMPLATE.md`, `ISSUE_TEMPLATE/`), its pnpm-based `Dockerfile`/
`compose.yaml` (replaced with the buildforge.cloud npm-based Pattern A convention),
and `pnpm-lock.yaml`/`pnpm-workspace.yaml` (this project standardizes on npm, per
the org-wide convention — `package-lock.json` is the real lockfile). The `LICENSE`
file (MIT, attributed to AstroPaper's author) was **kept as-is** — required by the
theme's license terms since its code is still the base this site runs on.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

**Building from a worktree** (how a dispatched worker runs): a fresh worktree
has no `node_modules`, and a symlink to the main checkout's copy is enough for
`npm run build`, `lint` and `format:check`, with no install. Two catches, both
hit on blog#8 (2026-09-25). `.gitignore`'s `node_modules/` matches only a
directory, so the link shows as untracked: stage files by name, and delete the
link before the worktree is cleaned up. And `astro dev --port N` from a
worktree still serves under `/absproxy/5177/`, because the config's `base`
wins over `--base`; fetch it at `http://localhost:N/absproxy/5177/...`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/) — **see "Comments (giscus)" above before adding `@astrojs/react`; it's not neutral in this project.**
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
