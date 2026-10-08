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
npm test                  # Node checks: workflows, contrast arithmetic, analytics rule, CSS tokens, nginx headers, shared parts
npm run test:pages        # Playwright: contrast, no analytics, and the CSP, on every built page (build first)

python3 scripts/shared_checks.py   # the shared parts are the releases their pins name
NGINX_RIG=1 python3 -m unittest discover -s tests -p "test_nginx.py"   # nginx.conf on a real nginx
NGINX_RIG=1 npm run test:pages     # the browser checks on the build, served by a real nginx (nginx_rig's serve-dir; build first)
python3 tools/psi.py https://blog.buildforge.cloud/   # PageSpeed medians, measured by Google
python3 tools/psi.py https://blog.buildforge.cloud/ --category accessibility best-practices seo   # and the other three Lighthouse scores
```

`npm run test:pages` needs Chromium once: `npx playwright install chromium`.

`tools/psi.py` signs in one of two ways. With `PSI_API_KEY` set (an API key,
best restricted to the PageSpeed Insights API), it needs nothing more, and it
masks the key in all it prints or saves. Otherwise it uses a Google service
account key at `~/.gsc/service-account.json` (`--key` names another), and then
it needs `google-auth[requests]` in a venv (`python3 -m venv ~/.venvs/psi`,
then `~/.venvs/psi/bin/pip install "google-auth[requests]"`). With neither,
Google answers 429. Nothing in CI runs it.

The nginx test skips unless `NGINX_RIG=1`. With it, it serves the real
`nginx.conf` over a stub site, on Ubuntu's nginx 1.24 extracted into
`~/.cache/nginx_rig/` (no docker, no install), and checks the cache headers,
the 404 page, the hidden-file block, and the security headers on every kind
of answer.

The CSP allows no inline script (blog#21), so a page script is a bundled
`<script>` that runs on `astro:page-load`, never `is:inline`. In CI,
`npm run test:pages` adds `nginx.conf`'s CSP to each answer from
`astro preview`, and fails on any violation. Run it with `NGINX_RIG=1` after
any change to `nginx.conf` or the CSP: then a real nginx sends the headers,
giscus loads for real, and the check saves a screenshot of a post's comments.

### Shared parts

`scripts/shared_checks.py`, `tests/check_nginx_headers.py`, `tests/css_tokens.py`,
`tests/nginx_rig.py` and `tools/psi.py` are releases of the org's
buildforge-starter repo, pinned byte
for byte in `scripts/shared-checks.lock`. Never edit them here: `npm test` fails
on a hand edit. A fix is released in the starter, then taken here with
`python3 scripts/shared_checks.py update <name> <version>`.

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

None, by choice (blog#17). `npm run test:pages` fails if a built page loads a
tracker. Search Console gives the search numbers.

## Deployment

Multi-stage Docker build (`node:22-alpine` → `nginx:alpine`, see `Dockerfile`).
`docker-compose.yml` joins the `web` external Docker network and uses Traefik labels
for `blog.buildforge.cloud` with the `mytlschallenge` SSL cert resolver, host port
`8082`. `.github/workflows/deploy.yml` builds and redeploys on every push to `main`
via the org's self-hosted runner.
