// What the workflows in .github/workflows/ must keep doing.
//
// A workflow is only ever run on GitHub, so a mistake in one shows up as a
// deploy that did not happen, not as a red test. These tests read the YAML
// and pin the parts that would fail silently. Run with `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { parse } from "yaml";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const workflow = name => parse(read(`.github/workflows/${name}`));
const workflowFiles = () =>
  readdirSync(new URL(".github/workflows/", root)).filter(f =>
    /\.ya?ml$/.test(f)
  );

// YAML 1.1 reads a bare `on:` key as `true`; the `yaml` package (YAML 1.2)
// keeps it as the string "on". Accept both so a parser change cannot hide
// every trigger.
const triggers = wf => wf.on ?? wf[true] ?? {};

test("deploy.yml rebuilds every day at 07:05 UTC, so scheduled posts go live", () => {
  const crons = (triggers(workflow("deploy.yml")).schedule ?? []).map(
    s => s.cron
  );
  assert.deepEqual(
    crons,
    ["5 7 * * *"],
    `deploy.yml schedule is ${JSON.stringify(crons)}; want one daily run at 07:05 UTC`
  );
});

// The scheduled run builds the same commit as the day before, and the build's
// output depends on the clock. Docker's layer cache cannot see the clock, so
// `RUN npm run build` needs a cache key that changes on every run, or the
// rebuild can hand back yesterday's site. A re-run keeps its `run_id` and only
// `run_attempt` changes, so the key needs both: a failed 07:05 run re-run at
// 09:00 must not get the 07:05 build back.
test("every deploy run builds the site fresh, not from Docker's cache", () => {
  const lines = read("Dockerfile")
    .split("\n")
    .map(l => l.trim());
  const copy = lines.indexOf("COPY . .");
  const build = lines.indexOf("RUN npm run build");
  const arg = lines
    .slice(copy + 1, build)
    .map(l => l.match(/^ARG (\w+)$/)?.[1])
    .find(Boolean);
  assert.ok(
    copy >= 0 && build > copy && arg,
    "Dockerfile needs an `ARG` between `COPY . .` and `RUN npm run build`"
  );

  const runs = workflow("deploy.yml")
    .jobs.deploy.steps.map(s => s.run ?? "")
    .join("\n");
  assert.match(
    runs,
    new RegExp(
      `docker compose build [^\\n]*--build-arg ${arg}=\\$\\{\\{ github\\.run_id \\}\\}-\\$\\{\\{ github\\.run_attempt \\}\\}`
    ),
    `deploy.yml must pass --build-arg ${arg}=\${{ github.run_id }}-\${{ github.run_attempt }}`
  );
  assert.doesNotMatch(
    runs,
    /docker compose up[^\n]*--build/,
    "`docker compose up --build` rebuilds without the per-run arg"
  );
});

test("a push to main still deploys", () => {
  assert.deepEqual(triggers(workflow("deploy.yml")).push?.branches, ["main"]);
});

// This is the org's only public repo, so anyone can open a pull request. A
// self-hosted job that a pull request can start would run a stranger's code
// on the shared server.
test("no pull request can start a self-hosted job", () => {
  for (const name of workflowFiles()) {
    const wf = workflow(name);
    const on = triggers(wf);
    const events =
      typeof on === "string" ? [on] : Array.isArray(on) ? on : Object.keys(on);
    const fromPr = events.filter(e => e.startsWith("pull_request"));
    const selfHosted = Object.entries(wf.jobs ?? {})
      .filter(([, job]) =>
        JSON.stringify(job["runs-on"]).includes("self-hosted")
      )
      .map(([id]) => id);
    assert.ok(
      fromPr.length === 0 || selfHosted.length === 0,
      `${name}: ${fromPr.join(", ")} can start self-hosted job(s) ${selfHosted.join(", ")}`
    );
  }
});

// blog#6. The contrast check reads the built site, so it runs after the build.
// Without this pin, a CI edit that drops the step turns the check off with
// every run still green. (A pull request starts it, so the test above keeps
// it off the self-hosted runner.)
test("ci.yml checks text contrast on the built site", () => {
  const runs = job => (job.steps ?? []).map(s => (s.run ?? "").trim());
  const job = Object.values(workflow("ci.yml").jobs).find(j =>
    runs(j).includes("npm run test:pages")
  );
  assert.ok(job, "no ci.yml job runs `npm run test:pages`");
  const build = runs(job).indexOf("npm run build");
  const check = runs(job).indexOf("npm run test:pages");
  assert.ok(
    build >= 0 && build < check,
    "ci.yml must run `npm run test:pages` after `npm run build`"
  );
});

// blog#64. A Google Fonts fetch failure stopped the deploy twice. The fonts
// now come from the repo, and CI proves it: Google's font hosts point nowhere
// before the build, so a build that still fetches a font fails the PR.
// Astro's Google provider asks fonts.google.com for its font list first, then
// fonts.googleapis.com for the CSS and fonts.gstatic.com for the files.
const googleFontHosts = [
  "fonts.google.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
];

test("ci.yml builds with Google's font hosts blocked", () => {
  const runs = job => (job.steps ?? []).map(s => (s.run ?? "").trim());
  const job = Object.values(workflow("ci.yml").jobs).find(j =>
    runs(j).includes("npm run build")
  );
  assert.ok(job, "no ci.yml job runs `npm run build`");
  const blocks = run =>
    run.includes("/etc/hosts") &&
    googleFontHosts.every(host => run.includes(` ${host}`));
  const block = runs(job).findIndex(blocks);
  const build = runs(job).indexOf("npm run build");
  assert.ok(
    block >= 0 && block < build,
    `ci.yml must point ${googleFontHosts.join(", ")} at nothing in /etc/hosts before \`npm run build\``
  );
  // A text check cannot tell a working hosts line from a commented one, so
  // the step looks each host up after writing it and fails on a real address.
  assert.match(
    runs(job)[block],
    /getent ahosts/,
    "the block step must check with `getent ahosts` that each host now resolves to 0.0.0.0"
  );
});

// blog#2. With one runner for the whole org, runs already take turns, so a
// group that queues changes nothing today; it writes the rule down, and it
// holds if a second runner is ever added. It must not cancel (the test below).
test("deploy.yml runs in one concurrency group that queues", () => {
  const group = workflow("deploy.yml").concurrency;
  assert.ok(group?.group, "deploy.yml has no concurrency group");
  assert.equal(
    group["cancel-in-progress"],
    false,
    "deploy.yml's concurrency group must say `cancel-in-progress: false`, so the decision to queue is written down"
  );
});

test("the production deploy is never cancelled by a newer run", () => {
  const wf = workflow("deploy.yml");
  const groups = [
    ["workflow", wf.concurrency],
    ...Object.entries(wf.jobs).map(([id, job]) => [id, job.concurrency]),
  ];
  for (const [where, group] of groups) {
    const cancel = group?.["cancel-in-progress"];
    assert.ok(
      cancel === undefined || cancel === false,
      `deploy.yml ${where}: cancel-in-progress is ${cancel}`
    );
  }
});

// blog#3. A job with no `timeout-minutes` runs for up to GitHub's default of
// 6 hours, and this org has one self-hosted runner for every repo, so a stalled
// deploy here holds everybody's deploys. A job that only `uses:` a reusable
// workflow cannot take the key (GitHub rejects it) and gets the callee's
// bounds, so that is the one exemption, and a job claiming it must really have
// `uses:`.
const unboundedJobs = wf =>
  Object.entries(wf.jobs ?? {})
    .filter(([, job]) => (job.steps ? !job["timeout-minutes"] : !job.uses))
    .map(([id]) => id);

test("every job that runs steps declares timeout-minutes", () => {
  for (const name of workflowFiles()) {
    assert.deepEqual(
      unboundedJobs(workflow(name)),
      [],
      `${name}: these jobs have no timeout-minutes, so GitHub's 6-hour default applies`
    );
  }
});

test("the timeout check exempts a reusable-workflow call and nothing else", () => {
  const wf = {
    jobs: {
      bounded: { "timeout-minutes": 5, steps: [{ run: "true" }] },
      unbounded: { steps: [{ run: "true" }] },
      caller: { uses: "./.github/workflows/ci.yml" },
      neither: { "runs-on": "ubuntu-latest" },
    },
  };
  assert.deepEqual(unboundedJobs(wf), ["unbounded", "neither"]);
});

// Measured 2026-09-28 over all 23 Deploy runs: the job took 51s at the median
// and 102s at most. The 867s "tail" in blog#3 was queue wait on the shared
// runner (829s of it), and `timeout-minutes` does not count queue wait. So the
// bound is a hang detector, not a budget: 20 minutes clears a build from a
// cold Docker cache many times over, and 30 caps how long a hang can hold the
// runner.
test("the deploy job's bound is a hang detector: 20 to 30 minutes", () => {
  const minutes = workflow("deploy.yml").jobs.deploy["timeout-minutes"];
  assert.ok(
    minutes >= 20 && minutes <= 30,
    `deploy.yml deploy: timeout-minutes is ${minutes}; want 20 to 30`
  );
});

// A job that times out is stopped wherever it is. If that lands inside
// `docker compose up`, the old container can be gone and the new one not yet
// started. So every step before the recreate has its own, smaller bound: a
// hang there fails that step, and the steps after it never run. What is left
// of the job's bound is for the recreate and the health check (2s and 6s at
// most in the same measurement).
test("a timeout cannot land between the container recreate and the health check", () => {
  const job = workflow("deploy.yml").jobs.deploy;
  const up = job.steps.findIndex(s => /docker compose up/.test(s.run ?? ""));
  assert.ok(up > 0, "deploy.yml has no `docker compose up` step");
  const before = job.steps.slice(0, up);
  assert.deepEqual(
    before.filter(s => !s["timeout-minutes"]).map(s => s.uses ?? s.run),
    [],
    "these steps before the recreate have no timeout-minutes of their own"
  );
  const left =
    job["timeout-minutes"] -
    before.reduce((sum, s) => sum + s["timeout-minutes"], 0);
  assert.ok(
    left >= 5,
    `${left} min of the job's bound is left for the recreate and the health check; want at least 5`
  );
});

// blog#85. `playwright install --with-deps` runs apt-get, and a dead apt
// mirror hung CI three times on 2026-11-11 until the 8-minute job bound
// cancelled it. So the browser is cached, keyed on the @playwright/test
// version in package-lock.json, and apt-get runs only when that cache misses.
const ciJob = () =>
  Object.values(workflow("ci.yml").jobs).find(j =>
    (j.steps ?? []).some(s => /playwright install/.test(s.run ?? ""))
  );
const browserSteps = job =>
  (job.steps ?? []).filter(s => /playwright install/.test(s.run ?? ""));
const cacheStep = (job, kind) =>
  (job.steps ?? []).find(
    s =>
      new RegExp(`^actions/cache/${kind}@`).test(s.uses ?? "") &&
      String(s.with?.path).includes("~/.cache/ms-playwright")
  );
const onMiss = id => `steps.${id}.outputs.cache-hit != 'true'`;

test("ci.yml caches the Playwright browser, keyed on the version in package-lock.json", () => {
  const job = ciJob();
  assert.ok(job, "no ci.yml job runs `playwright install`");
  const restore = cacheStep(job, "restore");
  assert.ok(
    restore,
    "no actions/cache/restore step holds ~/.cache/ms-playwright"
  );
  assert.ok(
    job.steps.indexOf(restore) < job.steps.indexOf(browserSteps(job)[0]),
    "the cache must be restored before the install"
  );
  const ref = String(restore.with.key).match(
    /steps\.([\w-]+)\.outputs\.[\w-]+/
  );
  assert.ok(ref, "the cache key must use a step output (the version)");
  const versionStep = job.steps.find(s => s.id === ref[1]);
  assert.ok(
    versionStep &&
      /package-lock\.json/.test(versionStep.run ?? "") &&
      /@playwright\/test/.test(versionStep.run ?? ""),
    `step ${ref[1]} must read @playwright/test's version from package-lock.json`
  );
});

// A hit skips apt-get, so it trusts the runner image to have Chromium's
// libraries. A new image (ubuntu-latest moving on a release) must miss once.
// The `env` context holds only the workflow's own variables, not the
// runner's, so `${{ env.ImageOS }}` is empty: the image is read in a step.
test("the browser cache key names the runner image", () => {
  const job = ciJob();
  const key = String(cacheStep(job, "restore")?.with?.key);
  assert.doesNotMatch(
    key,
    /env\.ImageOS/,
    "${{ env.ImageOS }} is always empty"
  );
  const fromImage = [
    ...key.matchAll(/steps\.([\w-]+)\.outputs\.([\w-]+)/g),
  ].some(([, id, out]) =>
    new RegExp(`\\b${out}=\\$\\{?ImageOS\\b`).test(
      job.steps.find(s => s.id === id)?.run ?? ""
    )
  );
  assert.ok(
    fromImage,
    "the cache key must hold a step output read from $ImageOS"
  );
});

// apt-get is the part that hangs, and on a miss the browser itself comes
// from Playwright's own download, not apt. So no step runs `--with-deps`:
// scripts/browser-libs.mjs checks the libraries, and apt-get runs only when
// one is missing (blog#85, second run: apt's mirror did not resolve).
test("ci.yml downloads the browser only on a miss, and never with apt-get", () => {
  const job = ciJob();
  const id = cacheStep(job, "restore")?.id;
  assert.ok(id, "the restore step needs an id");
  const runs = browserSteps(job).map(s => s.run.trim());
  assert.deepEqual(
    runs.filter(r => /--with-deps/.test(r)),
    [],
    "no step may run `playwright install --with-deps`"
  );
  const download = browserSteps(job).find(
    s => s.run.trim() === "npx playwright install chromium"
  );
  assert.ok(download, "no step runs `npx playwright install chromium`");
  assert.equal(String(download.if ?? "").trim(), onMiss(id));
});

test("ci.yml runs apt-get only when the browser lacks a library", () => {
  const job = ciJob();
  const runs = (job.steps ?? []).map(s => (s.run ?? "").trim());
  const libs = runs.indexOf(
    "node scripts/browser-libs.mjs ~/.cache/ms-playwright || npx playwright install-deps chromium"
  );
  assert.ok(libs >= 0, "no step checks the libraries before install-deps");
  const download = runs.indexOf("npx playwright install chromium");
  const pages = runs.indexOf("npm run test:pages");
  assert.ok(
    download < libs && libs < pages,
    "the library check runs after the download and before the page tests"
  );
  assert.equal(
    runs.filter(r => /install-deps/.test(r)).length,
    1,
    "install-deps may run only behind the library check"
  );
});

// A stalled cache service must not fail the job: the restore times out, its
// cache-hit is empty, and the install runs as on a miss.
test("a hung cache restore falls through to the install", () => {
  assert.equal(cacheStep(ciJob(), "restore")?.["continue-on-error"], true);
});

// actions/cache's own post-job save has no bound of its own, so the save is
// a step: after the page tests, only on a miss, and a failed save never fails
// the run.
test("ci.yml saves the browser as its own step, only on a miss", () => {
  const job = ciJob();
  const restore = cacheStep(job, "restore");
  const save = cacheStep(job, "save");
  assert.ok(save, "no actions/cache/save step holds ~/.cache/ms-playwright");
  assert.ok(
    job.steps.indexOf(save) >
      job.steps.findIndex(s => (s.run ?? "").trim() === "npm run test:pages"),
    "the save must come after the page tests, so only a browser that ran is cached"
  );
  assert.equal(String(save.if ?? "").trim(), onMiss(restore.id));
  // The key is written out, not taken from the restore's outputs: a restore
  // that timed out sets none, and the save would then get an empty key.
  assert.equal(save.with.key, restore.with.key);
  assert.equal(save["continue-on-error"], true);
});

// A hang while fetching the browser (the restore, the install or the save)
// should name that step and stop in 3 minutes, not run on to the job's
// 8-minute bound.
const MAX_BROWSER_MINUTES = 3;
const fetchesBrowser = s =>
  /playwright install/.test(s.run ?? "") ||
  String(s.with?.path ?? "").includes("ms-playwright");
const slowBrowserSteps = job =>
  (job.steps ?? [])
    .filter(fetchesBrowser)
    .filter(s => !(s["timeout-minutes"] <= MAX_BROWSER_MINUTES))
    .map(s => s.name);

test("each step that fetches the browser has its own bound of 3 minutes at most", () => {
  assert.deepEqual(slowBrowserSteps(ciJob()), []);
});

test("the browser bound check takes 3 minutes and refuses 4 or none", () => {
  const step = (name, minutes) => ({
    name,
    run: "npx playwright install chromium",
    ...(minutes === undefined ? {} : { "timeout-minutes": minutes }),
  });
  const job = {
    steps: [
      step("three", 3),
      step("four", 4),
      step("none"),
      {
        name: "cache",
        uses: "actions/cache@v4",
        with: { path: "~/.cache/ms-playwright" },
      },
      { name: "other", run: "true" },
    ],
  };
  assert.deepEqual(slowBrowserSteps(job), ["four", "none", "cache"]);
});

// A pull request's cache is visible to that pull request only, but a cache
// saved on `main` is visible to every pull request. CI runs on a push to
// `main` so the browser is cached there, and a new pull request's first run
// skips apt-get too.
test("ci.yml runs on a push to main, so pull requests can read its cache", () => {
  const on = triggers(workflow("ci.yml"));
  assert.deepEqual(on.push?.branches, ["main"]);
  assert.ok("pull_request" in on, "ci.yml must still run on pull_request");
});
