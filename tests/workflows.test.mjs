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
