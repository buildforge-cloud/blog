# blog

Dev journey blog — documenting building AI-generated apps. Live at
[blog.buildforge.cloud](https://blog.buildforge.cloud).

Built with [Astro](https://astro.build) on the [AstroPaper](https://github.com/satnaing/astro-paper)
theme. See the org-wide `~/.claude/CLAUDE.md` (buildforge.cloud shared infrastructure)
for the deployment conventions this repo follows (Pattern A: Docker Compose build on
the self-hosted GitHub Actions runner, Traefik + Let's Encrypt for TLS).

## Commands

```bash
npm install
npm run dev             # Astro dev server on :5177 (this project's assigned dev port)
npm run build            # astro check && astro build && pagefind index
npm run preview          # serve dist/ locally
npm run lint              # eslint
npm run format:check      # prettier --check
```

**Dev access URL:** `https://dev.buildforge.cloud/absproxy/5177/`

## Writing a post

Add a Markdown or MDX file under `src/content/posts/`. See `src/content/posts/hello-world.md`
for the required frontmatter shape (`author`, `pubDatetime`, `title`, `tags`, `description`, ...).

## Comments

Comments are handled by [giscus](https://giscus.app), backed by this repo's GitHub
Discussions (config in `src/utils/giscus.ts`, embed logic in `src/components/Comments.astro`).
Giscus requires the repo to stay **public** — that's why this repo isn't private like
the rest of the org's repos (see the "Repo visibility" decision made when this repo
was set up, and the org's "GitHub plan limits" section for why private repos there
can't get branch protection anyway).

## Analytics

PostHog Cloud (EU), reusing the buildforge.cloud org's existing project rather than a
dedicated one (snippet in `src/layouts/Layout.astro`, production builds only).

## Deployment

Multi-stage Docker build (`node:22-alpine` → `nginx:alpine`, see `Dockerfile`).
`docker-compose.yml` joins the `web` external Docker network and uses Traefik labels
for `blog.buildforge.cloud` with the `mytlschallenge` SSL cert resolver, host port
`8082`. `.github/workflows/deploy.yml` builds and redeploys on every push to `main`
via the org's self-hosted runner.
