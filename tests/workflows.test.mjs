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
// rebuild can hand back yesterday's site.
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
      `docker compose build [^\\n]*--build-arg ${arg}=\\$\\{\\{ github\\.run_id \\}\\}`
    ),
    `deploy.yml must pass --build-arg ${arg}=\${{ github.run_id }}`
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
  const names = readdirSync(new URL(".github/workflows/", root)).filter(f =>
    /\.ya?ml$/.test(f)
  );
  for (const name of names) {
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
