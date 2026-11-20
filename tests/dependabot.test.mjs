// What Dependabot updates in this repo, and how often (blog#116).
//
// Stefan, card 4454: every site gets its package, base-image and Actions
// updates once a month, and security fixes at once. buildforge-starter#458
// (tag stages-v1.1.0) gave the web template its `.github/dependabot.yml`;
// this is the blog's copy, with the blog's own folders. Security fixes are
// not on the schedule: GitHub opens those at once when the repo setting
// "Dependabot security updates" is on. Run with `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { parse } from "yaml";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const exists = path => existsSync(new URL(path, root));
const config = () => parse(read(".github/dependabot.yml"));
const workflowFiles = () =>
  readdirSync(new URL(".github/workflows/", root)).filter(f =>
    /\.ya?ml$/.test(f)
  );

const MAX_OPEN_PRS = 10;

const folders = entry => entry.directories ?? [entry.directory];

// Every `image:` a compose file runs. A `build:` service has none, and
// Dependabot has nothing to move there.
const composeImages = texts =>
  texts.flatMap(text =>
    [...text.matchAll(/^\s*image:\s*["']?([^\s"']+)/gm)].map(m => m[1])
  );

const imageName = ref => ref.split("@")[0].replace(/:[^/:]*$/, "");

// The ecosystems this repo has, read from its files, so a new one (a compose
// file that runs an image, a Python requirements file) fails the test until
// dependabot.yml names it.
export const ecosystemsFound = ({ files, composeTexts }) => {
  const found = [];
  if (files.includes("package.json")) found.push("npm");
  if (files.some(f => /^Dockerfile/.test(f))) found.push("docker");
  if (composeImages(composeTexts).length > 0) found.push("docker-compose");
  if (files.includes(".github/workflows")) found.push("github-actions");
  if (files.some(f => /^requirements.*\.txt$|^pyproject\.toml$/.test(f)))
    found.push("pip");
  return found.sort();
};

const rootFiles = () => {
  const files = readdirSync(root);
  if (exists(".github/workflows")) files.push(".github/workflows");
  return files;
};
const composeTexts = () =>
  readdirSync(root)
    .filter(f => /^(docker-)?compose.*\.ya?ml$/.test(f))
    .map(read);

// The entries not on the monthly round.
export const notMonthly = updates =>
  updates
    .filter(u => u.schedule?.interval !== "monthly")
    .map(u => u["package-ecosystem"]);

// The entries with no group that takes every minor and patch bump of the
// folder, so the month's routine bumps are one PR, not one each. A major
// stays a PR of its own: those are the ones that break.
const routineGroup = group =>
  JSON.stringify(group.patterns) === '["*"]' &&
  JSON.stringify([...(group["update-types"] ?? [])].sort()) ===
    '["minor","patch"]';
export const ungrouped = updates =>
  updates
    .filter(
      u => Object.values(u.groups ?? {}).filter(routineGroup).length !== 1
    )
    .map(u => u["package-ecosystem"]);

// A database's next major cannot read the data directory the old one wrote:
// that move is a dump and a restore by hand, never a merged PR.
const DATABASES = ["postgres", "mysql", "mariadb", "mongo"];
export const databaseMajorsProposed = (updates, images) => {
  const entry = updates.find(u => u["package-ecosystem"] === "docker-compose");
  const ignored = new Set(
    (entry?.ignore ?? [])
      .filter(r =>
        (r["update-types"] ?? []).includes("version-update:semver-major")
      )
      .map(r => r["dependency-name"])
  );
  return images
    .map(imageName)
    .filter(name => DATABASES.includes(name.split("/").pop()))
    .filter(name => !ignored.has(name));
};

test("dependabot.yml names each ecosystem this repo has, and no other", () => {
  const found = ecosystemsFound({
    files: rootFiles(),
    composeTexts: composeTexts(),
  });
  assert.ok(
    found.includes("npm") && found.includes("github-actions"),
    `the reader found ${JSON.stringify(found)}; it should see package.json and the workflows`
  );
  const declared = config()
    .updates.map(u => u["package-ecosystem"])
    .sort();
  assert.deepEqual(declared, found);
});

test("the ecosystem reader counts a compose file only when it runs an image", () => {
  const files = ["package.json", "Dockerfile", "docker-compose.yml"];
  assert.deepEqual(
    ecosystemsFound({
      files,
      composeTexts: ["services:\n  a:\n    build: .\n"],
    }),
    ["docker", "npm"]
  );
  assert.deepEqual(
    ecosystemsFound({
      files: [...files, "requirements.txt", ".github/workflows"],
      composeTexts: ["services:\n  db:\n    image: postgres:16.4\n"],
    }),
    ["docker", "docker-compose", "github-actions", "npm", "pip"]
  );
});

test("each entry looks in the folder that holds its files", () => {
  const holds = {
    npm: dir => exists(`.${dir}/package.json`.replace("//", "/")),
    docker: dir =>
      readdirSync(new URL(`.${dir}/`.replace("//", "/"), root)).some(f =>
        /^Dockerfile/.test(f)
      ),
    "github-actions": dir => dir === "/" && exists(".github/workflows"),
  };
  for (const entry of config().updates) {
    const check = holds[entry["package-ecosystem"]];
    assert.ok(check, `no folder check for ${entry["package-ecosystem"]}`);
    for (const dir of folders(entry))
      assert.ok(
        check(dir),
        `${entry["package-ecosystem"]}: ${dir} holds none of its files`
      );
  }
});

test("every entry runs monthly", () => {
  assert.deepEqual(notMonthly(config().updates), []);
});

test("the monthly check takes monthly and refuses weekly or none", () => {
  assert.deepEqual(
    notMonthly([
      { "package-ecosystem": "npm", schedule: { interval: "monthly" } },
      { "package-ecosystem": "docker", schedule: { interval: "weekly" } },
      { "package-ecosystem": "pip" },
    ]),
    ["docker", "pip"]
  );
});

test("every entry puts the month's minor and patch bumps in one group", () => {
  assert.deepEqual(ungrouped(config().updates), []);
});

test("the group check refuses no group, a group that takes majors, or two", () => {
  const routine = { patterns: ["*"], "update-types": ["minor", "patch"] };
  assert.deepEqual(
    ungrouped([
      { "package-ecosystem": "npm", groups: { a: routine } },
      { "package-ecosystem": "docker" },
      {
        "package-ecosystem": "pip",
        groups: {
          a: { ...routine, "update-types": ["major", "minor", "patch"] },
        },
      },
      {
        "package-ecosystem": "github-actions",
        groups: { a: routine, b: routine },
      },
      {
        "package-ecosystem": "docker-compose",
        groups: { a: { ...routine, patterns: ["react*"] } },
      },
    ]),
    ["docker", "pip", "github-actions", "docker-compose"]
  );
});

test("every entry caps its open pull requests at 10", () => {
  for (const entry of config().updates) {
    const limit = entry["open-pull-requests-limit"];
    assert.ok(
      Number.isInteger(limit) && limit >= 1 && limit <= MAX_OPEN_PRS,
      `${entry["package-ecosystem"]}: open-pull-requests-limit is ${limit}`
    );
  }
});

test("no database image gets a major version PR", () => {
  assert.deepEqual(
    databaseMajorsProposed(config().updates, composeImages(composeTexts())),
    []
  );
});

test("the database check wants a major ignore for postgres, not for nginx", () => {
  const ignore = [
    {
      "dependency-name": "postgres",
      "update-types": ["version-update:semver-major"],
    },
  ];
  const images = ["postgres:16.4", "nginx:1.27.1"];
  assert.deepEqual(
    databaseMajorsProposed([{ "package-ecosystem": "docker-compose" }], images),
    ["postgres"]
  );
  assert.deepEqual(
    databaseMajorsProposed(
      [{ "package-ecosystem": "docker-compose", ignore }],
      images
    ),
    []
  );
});

// blog#83: astro 7.2.10 and later need @astrojs/mdx 8, and
// tests/packages.test.mjs fails on them while mdx is on 7. Unignored, the
// month's npm group would take astro along and be red every month, holding
// every other bump back. The ignore must go when mdx 8 lifts the cap.
test("while @astrojs/mdx is on 7, Dependabot leaves astro at 7.2.9", () => {
  const pkg = JSON.parse(read("package.json"));
  const npm = config().updates.find(u => u["package-ecosystem"] === "npm");
  const astroRules = (npm.ignore ?? []).filter(
    r => r["dependency-name"] === "astro"
  );
  if (/^[\^~]?7\./.test(pkg.dependencies["@astrojs/mdx"]))
    assert.deepEqual(astroRules, [
      { "dependency-name": "astro", versions: [">= 7.2.10"] },
    ]);
  else assert.deepEqual(astroRules, [], "mdx 8 lifts the astro cap");
});

// GitHub branch filter globs: `*` stops at `/`, `**` does not, a leading
// `!` excludes what an earlier pattern took.
const globToRegExp = glob =>
  new RegExp(
    "^" +
      glob
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, "\u0000")
        .replace(/\*/g, "[^/]*")
        .replace(/\?/g, ".")
        .replace(/\u0000/g, ".*") +
      "$"
  );
const branchMatches = (patterns, branch) =>
  patterns.reduce((taken, p) => {
    const negated = p.startsWith("!");
    return globToRegExp(negated ? p.slice(1) : p).test(branch)
      ? !negated
      : taken;
  }, false);

// A branch Dependabot pushes, as GitHub names them.
const DEPENDABOT_BRANCH = "dependabot/npm_and_yarn/astro-7.3.3";

// The events of a workflow that a Dependabot branch or PR can start. A
// `schedule` and a `workflow_dispatch` start only from what a person chose; a
// push starts one only if its branch filter takes `dependabot/...`; every
// other event (pull_request, workflow_run, workflow_call...) is counted as
// reachable, since a Dependabot PR or its CI run can lead to it.
export const dependabotEvents = on => {
  const events =
    typeof on === "string"
      ? { [on]: null }
      : Array.isArray(on)
        ? Object.fromEntries(on.map(e => [e, null]))
        : on;
  return Object.entries(events)
    .filter(([event, filter]) => {
      if (event === "schedule" || event === "workflow_dispatch") return false;
      if (event !== "push") return true;
      if (filter?.branches)
        return branchMatches(filter.branches, DEPENDABOT_BRANCH);
      if (filter?.["branches-ignore"])
        return !branchMatches(filter["branches-ignore"], DEPENDABOT_BRANCH);
      return !filter?.tags; // tags alone: a branch push starts nothing
    })
    .map(([event]) => event);
};

// This is a public repo, and a Dependabot PR is a bump nobody has read yet.
// A self-hosted job runs on the shared server that holds every project.
test("no Dependabot branch or PR can start a self-hosted job", () => {
  for (const name of workflowFiles()) {
    const wf = parse(read(`.github/workflows/${name}`));
    const selfHosted = Object.entries(wf.jobs ?? {})
      .filter(([, job]) =>
        JSON.stringify(job["runs-on"]).includes("self-hosted")
      )
      .map(([id]) => id);
    if (selfHosted.length === 0) continue;
    const events = dependabotEvents(wf.on ?? wf[true] ?? {});
    assert.deepEqual(
      events,
      [],
      `${name}: ${events.join(", ")} can start self-hosted job(s) ${selfHosted.join(", ")} from a Dependabot branch`
    );
  }
});

test("the Dependabot reach check takes main pushes and refuses wider ones", () => {
  assert.deepEqual(
    dependabotEvents({
      push: { branches: ["main"] },
      schedule: [{ cron: "5 7 * * *" }],
    }),
    []
  );
  assert.deepEqual(dependabotEvents({ push: { branches: ["**"] } }), ["push"]);
  assert.deepEqual(
    dependabotEvents({ push: { branches: ["dependabot/*"] } }),
    []
  );
  assert.deepEqual(
    dependabotEvents({ push: { branches: ["dependabot/**"] } }),
    ["push"]
  );
  assert.deepEqual(
    dependabotEvents({ push: { branches: ["**", "!dependabot/**"] } }),
    []
  );
  assert.deepEqual(
    dependabotEvents({ push: { "branches-ignore": ["dependabot/**"] } }),
    []
  );
  assert.deepEqual(
    dependabotEvents({ push: { "branches-ignore": ["staging"] } }),
    ["push"]
  );
  assert.deepEqual(dependabotEvents({ push: null }), ["push"]);
  assert.deepEqual(dependabotEvents("push"), ["push"]);
  assert.deepEqual(dependabotEvents(["pull_request", "workflow_dispatch"]), [
    "pull_request",
  ]);
  assert.deepEqual(dependabotEvents({ workflow_run: { workflows: ["CI"] } }), [
    "workflow_run",
  ]);
});
