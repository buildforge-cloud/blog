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
// folder, so the month's routine bumps are one PR, not one each. The majors
// get a group of their own (blog#135, Stefan 4807): those are the ones that
// break, so they never ride in the routine PR, but a month's majors are one
// PR, not one each.
const takesAll = (group, types) =>
  JSON.stringify(group.patterns) === '["*"]' &&
  JSON.stringify([...(group["update-types"] ?? [])].sort()) ===
    JSON.stringify(types);
const routineGroup = group => takesAll(group, ["minor", "patch"]);
const majorsGroup = group => takesAll(group, ["major"]);
const withoutOne = test => updates =>
  updates
    .filter(u => Object.values(u.groups ?? {}).filter(test).length !== 1)
    .map(u => u["package-ecosystem"]);
export const ungrouped = withoutOne(routineGroup);
export const majorsUngrouped = withoutOne(majorsGroup);

// Every ecosystem's groups carry the same two names, so the month's PRs
// read alike ("Bump the majors group ...") whatever they move.
const GROUP_NAMES = ["majors", "minor-and-patch"];
export const misnamedGroups = updates =>
  updates
    .filter(
      u =>
        JSON.stringify(Object.keys(u.groups ?? {}).sort()) !==
        JSON.stringify(GROUP_NAMES)
    )
    .map(u => u["package-ecosystem"]);

// A group with `applies-to: security-updates` would put a security fix in a
// batch PR. Left at its default (version-updates), each fix comes at once,
// as a PR of its own.
export const groupsSecurity = updates =>
  updates
    .filter(u =>
      Object.values(u.groups ?? {}).some(
        g => (g["applies-to"] ?? "version-updates") !== "version-updates"
      )
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

// The file each ecosystem reads in its folder. `has(dir, re)` says whether
// the folder holds a file whose name matches.
const MANIFESTS = {
  npm: /^package\.json$/,
  docker: /^Dockerfile/,
  "docker-compose": /^(docker-)?compose.*\.ya?ml$/,
  pip: /^requirements.*\.txt$|^pyproject\.toml$/,
};
export const folderProblems = (updates, has) =>
  updates.flatMap(entry => {
    const ecosystem = entry["package-ecosystem"];
    return folders(entry)
      .filter(dir =>
        ecosystem === "github-actions"
          ? dir !== "/" || !has("/.github", /^workflows$/)
          : !MANIFESTS[ecosystem] || !has(dir, MANIFESTS[ecosystem])
      )
      .map(dir => `${ecosystem} ${dir}`);
  });

const hasInRepo = (dir, re) => {
  const url = new URL(`.${dir}/`.replace("//", "/"), root);
  return existsSync(url) && readdirSync(url).some(f => re.test(f));
};

test("each entry looks in the folder that holds its files", () => {
  assert.deepEqual(folderProblems(config().updates, hasInRepo), []);
});

test("the folder check knows every ecosystem the reader can find", () => {
  const tree = {
    "/": ["package.json", "Dockerfile", "docker-compose.yml"],
    "/.github": ["workflows"],
    "/api": ["requirements.txt"],
  };
  const has = (dir, re) => (tree[dir] ?? []).some(f => re.test(f));
  const entry = (ecosystem, directory) => ({
    "package-ecosystem": ecosystem,
    directory,
  });
  assert.deepEqual(
    folderProblems(
      [
        entry("npm", "/"),
        entry("docker", "/"),
        entry("docker-compose", "/"),
        entry("github-actions", "/"),
        entry("pip", "/api"),
      ],
      has
    ),
    []
  );
  assert.deepEqual(
    folderProblems(
      [
        entry("npm", "/api"),
        entry("docker-compose", "/api"),
        entry("pip", "/"),
        entry("github-actions", "/api"),
        entry("bundler", "/"),
      ],
      has
    ),
    [
      "npm /api",
      "docker-compose /api",
      "pip /",
      "github-actions /api",
      "bundler /",
    ]
  );
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

test("every entry puts the month's majors in one group of their own", () => {
  assert.deepEqual(majorsUngrouped(config().updates), []);
});

test("the majors check refuses no group, one that takes minor, two, or a narrow one", () => {
  const majors = { patterns: ["*"], "update-types": ["major"] };
  const routine = { patterns: ["*"], "update-types": ["minor", "patch"] };
  assert.deepEqual(
    majorsUngrouped([
      { "package-ecosystem": "npm", groups: { a: routine, b: majors } },
      { "package-ecosystem": "docker", groups: { a: routine } },
      {
        "package-ecosystem": "pip",
        groups: { a: { ...majors, "update-types": ["major", "minor"] } },
      },
      {
        "package-ecosystem": "github-actions",
        groups: { a: majors, b: majors },
      },
      {
        "package-ecosystem": "docker-compose",
        groups: { a: { ...majors, patterns: ["astro*"] } },
      },
    ]),
    ["docker", "pip", "github-actions", "docker-compose"]
  );
});

test("every entry names its groups minor-and-patch and majors", () => {
  assert.deepEqual(misnamedGroups(config().updates), []);
});

test("the name check refuses a missing, an extra or an ecosystem-named group", () => {
  const g = { patterns: ["*"] };
  assert.deepEqual(
    misnamedGroups([
      {
        "package-ecosystem": "npm",
        groups: { "minor-and-patch": g, majors: g },
      },
      { "package-ecosystem": "docker", groups: { "minor-and-patch": g } },
      {
        "package-ecosystem": "pip",
        groups: { "minor-and-patch": g, majors: g, extra: g },
      },
      {
        "package-ecosystem": "github-actions",
        groups: { "actions-minor-and-patch": g, majors: g },
      },
      { "package-ecosystem": "docker-compose" },
    ]),
    ["docker", "pip", "github-actions", "docker-compose"]
  );
});

test("no group holds a security fix back in the month's batch", () => {
  assert.deepEqual(groupsSecurity(config().updates), []);
});

test("the security check takes version-updates or none, and refuses security-updates", () => {
  const g = { patterns: ["*"] };
  assert.deepEqual(
    groupsSecurity([
      { "package-ecosystem": "npm", groups: { a: g } },
      {
        "package-ecosystem": "docker",
        groups: { a: { ...g, "applies-to": "version-updates" } },
      },
      {
        "package-ecosystem": "pip",
        groups: { a: g, b: { ...g, "applies-to": "security-updates" } },
      },
      { "package-ecosystem": "github-actions" },
    ]),
    ["pip"]
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

// A hijacked release is usually caught within a week, so no entry takes one
// younger than that. A cooldown holds back version updates only: a security
// fix still comes at once.
const COOLDOWN_DAYS = 7;
export const withoutCooldown = updates =>
  updates
    .filter(u => !(u.cooldown?.["default-days"] >= COOLDOWN_DAYS))
    .map(u => u["package-ecosystem"]);

test("every entry waits a week before it offers a new release", () => {
  assert.deepEqual(withoutCooldown(config().updates), []);
});

test("the cooldown check takes 7 days and refuses 6 or none", () => {
  assert.deepEqual(
    withoutCooldown([
      { "package-ecosystem": "npm", cooldown: { "default-days": 7 } },
      { "package-ecosystem": "docker", cooldown: { "default-days": 6 } },
      { "package-ecosystem": "pip" },
    ]),
    ["docker", "pip"]
  );
});

// Whether an ignore rule's `versions` hold back this major of the image.
// Each requirement is clauses joined by commas (">= 25, < 26"), compared on
// the major alone, which is all a `22-alpine` tag names.
const OPS = {
  ">=": (a, b) => a >= b,
  ">": (a, b) => a > b,
  "<=": (a, b) => a <= b,
  "<": (a, b) => a < b,
  "=": (a, b) => a === b,
};
export const majorIgnored = (entry, name, major) =>
  (entry?.ignore ?? [])
    .filter(r => r["dependency-name"] === name)
    .flatMap(r => r.versions ?? [])
    .some(requirement =>
      requirement.split(",").every(clause => {
        const m = clause.trim().match(/^(>=|<=|>|<|=)?\s*v?(\d+)/);
        return m && OPS[m[1] ?? "="](major, Number(m[2]));
      })
    );

// node:22-alpine names a major only, so the docker entry can offer only the
// next major, and Dependabot takes the newest. 23 and 25 are odd majors, six
// months of Current and never an LTS, so they are held back and the PR names
// 24 or 26. From 27 on, Node ships one major a year and each one becomes LTS
// (nodejs.org, "Evolving the Node.js Release Schedule"), so 27 and later are
// offered.
test("the docker entry offers node's LTS majors and never 23 or 25", () => {
  const docker = config().updates.find(
    u => u["package-ecosystem"] === "docker"
  );
  const offered = [22, 23, 24, 25, 26, 27, 28, 29].filter(
    major => !majorIgnored(docker, "node", major)
  );
  assert.deepEqual(offered, [22, 24, 26, 27, 28, 29]);
});

test("the version reader reads a range, an exact major and no rule", () => {
  const entry = {
    ignore: [
      { "dependency-name": "node", versions: [">= 25, < 26", "23"] },
      { "dependency-name": "nginx", versions: [">= 1"] },
    ],
  };
  assert.deepEqual(
    [22, 23, 24, 25, 26].filter(m => majorIgnored(entry, "node", m)),
    [23, 25]
  );
  assert.equal(majorIgnored({}, "node", 25), false);
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
// The major of a package as installed, from the lockfile, so how
// package.json spells the range ("^7.0.8", "7.x", ">=7 <8") does not matter.
export const lockedMajor = (lock, name) => {
  const version = lock.packages?.[`node_modules/${name}`]?.version;
  assert.ok(version, `${name} is not in package-lock.json`);
  return Number(version.split(".")[0]);
};

test("the lockfile reader takes the top copy's major", () => {
  const lock = {
    packages: {
      "node_modules/@astrojs/mdx": { version: "8.0.1" },
      "node_modules/x/node_modules/@astrojs/mdx": { version: "7.0.8" },
    },
  };
  assert.equal(lockedMajor(lock, "@astrojs/mdx"), 8);
  assert.throws(() => lockedMajor({ packages: {} }, "@astrojs/mdx"));
});

test("while @astrojs/mdx is on 7, Dependabot leaves astro at 7.2.9", () => {
  const lock = JSON.parse(read("package-lock.json"));
  const npm = config().updates.find(u => u["package-ecosystem"] === "npm");
  const astroRules = (npm.ignore ?? []).filter(
    r => r["dependency-name"] === "astro"
  );
  if (lockedMajor(lock, "@astrojs/mdx") === 7)
    assert.deepEqual(astroRules, [
      { "dependency-name": "astro", versions: [">= 7.2.10"] },
    ]);
  else assert.deepEqual(astroRules, [], "mdx 8 lifts the astro cap");
});

// GitHub branch filter globs: `*` stops at `/`, `**` does not, `?` and `+`
// act on the sign before them as in a regex, `[...]` is a set, and a leading
// `!` excludes what an earlier pattern took.
const globToRegExp = glob =>
  new RegExp(
    "^" +
      glob
        .replace(/[.^${}()|\\]/g, "\\$&")
        .replace(/\*\*/g, "\u0000")
        .replace(/\*/g, "[^/]*")
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

// The branches Dependabot pushes here, one of each shape: a single bump
// (a security fix) and both groups' branches for each ecosystem, and a
// scoped package's.
const DEPENDABOT_BRANCHES = [
  "dependabot/npm_and_yarn/astro-7.3.3",
  "dependabot/npm_and_yarn/@astrojs/mdx-8.0.1",
  "dependabot/npm_and_yarn/minor-and-patch-6b0a3e1c2f",
  "dependabot/npm_and_yarn/majors-3c4d5e6f7a",
  "dependabot/docker/node-24-alpine",
  "dependabot/docker/minor-and-patch-1f2e3d4c5b",
  "dependabot/docker/majors-0a1b2c3d4e",
  "dependabot/github_actions/actions/checkout-5",
  "dependabot/github_actions/minor-and-patch-9a8b7c6d5e",
  "dependabot/github_actions/majors-5e6f7a8b9c",
];
const takesAny = (patterns, take) =>
  DEPENDABOT_BRANCHES.some(branch => take(patterns, branch));

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
      if (filter?.branches) return takesAny(filter.branches, branchMatches);
      if (filter?.["branches-ignore"])
        return takesAny(
          filter["branches-ignore"],
          (patterns, branch) => !branchMatches(patterns, branch)
        );
      return !filter?.tags; // tags alone: a branch push starts nothing
    })
    .map(([event]) => event);
};

// The org's own runners, by the label a job names, as buildforge-starter's
// ORG_RUNNERS (test_deploy_workflows.py): `self-hosted` is the server beside
// production that runs every deploy; `home` and `home-light` are Stefan's
// home machine, which takes test jobs and runs them with sudo. A
// `${{ inputs.runner }}` lets the caller pick, so it counts as one too.
const ORG_RUNNERS = ["self-hosted", "home", "home-light"];

// A whole label, not a substring: `home` is an ordinary word, and
// `homebrew` or `inputs.home` is no runner.
const namesLabel = (runsOn, label) =>
  Array.isArray(runsOn)
    ? runsOn.some(item => String(item).trim() === label)
    : new RegExp(`(?<![\\w.-])${label.replace(/[-]/g, "\\-")}(?![\\w.-])`).test(
        String(runsOn ?? "")
      );

export const onOrgRunner = runsOn => {
  // `runs-on: {group, labels}`: the labels decide.
  const value =
    runsOn && typeof runsOn === "object" && !Array.isArray(runsOn)
      ? [runsOn.labels ?? []].flat()
      : runsOn;
  return (
    ORG_RUNNERS.some(label => namesLabel(value, label)) ||
    /inputs\.runner/.test(String(value ?? ""))
  );
};

// The jobs of a workflow that run on an org runner. A `uses:` job runs the
// called workflow's jobs, so it counts when the `runner` it passes is not
// GitHub's, as in the starter, or when the callee, read with
// `readCallee(path)`, has a job on an org runner with that `runner`. A
// callee in another repo cannot be read here, so it counts.
export const orgRunnerJobs = (wf, readCallee) =>
  Object.entries(wf.jobs ?? {})
    .filter(([, job]) => {
      if (!job.uses) return onOrgRunner(job["runs-on"]);
      const runner = job.with?.runner ?? "ubuntu-latest";
      if (String(runner).trim() !== "ubuntu-latest") return true;
      if (!job.uses.startsWith("./")) return true;
      return Object.values(readCallee(job.uses).jobs ?? {}).some(callee =>
        onOrgRunner(
          String(JSON.stringify(callee["runs-on"] ?? "")).replace(
            /\$\{\{\s*inputs\.runner\s*\}\}/g,
            runner
          )
        )
      );
    })
    .map(([id]) => id);

test("the runner check counts self-hosted, home and home-light, as whole labels", () => {
  for (const runsOn of [
    "self-hosted",
    "home",
    "home-light",
    ["self-hosted", "linux"],
    ["home"],
    "${{ inputs.runner }}",
    { group: "org", labels: ["home-light"] },
    { group: "org", labels: "self-hosted" },
  ])
    assert.equal(onOrgRunner(runsOn), true, JSON.stringify(runsOn));
  for (const runsOn of [
    "ubuntu-latest",
    "homebrew",
    "${{ inputs.home }}",
    ["ubuntu-latest"],
    { group: "hosted", labels: ["ubuntu-latest"] },
    undefined,
  ])
    assert.equal(onOrgRunner(runsOn), false, JSON.stringify(runsOn));
});

test("the runner check follows a uses: job to the runner it passes and its callee", () => {
  const callees = {
    "./.github/workflows/gates.yml": {
      jobs: { test: { "runs-on": "${{ inputs.runner }}" } },
    },
    "./.github/workflows/hosted.yml": {
      jobs: { test: { "runs-on": "ubuntu-latest" } },
    },
    "./.github/workflows/deploy.yml": {
      jobs: { deploy: { "runs-on": "self-hosted" } },
    },
  };
  const wf = {
    jobs: {
      own: { "runs-on": "home" },
      hosted: { "runs-on": "ubuntu-latest" },
      passesHome: {
        uses: "./.github/workflows/gates.yml",
        with: { runner: "home" },
      },
      passesHosted: {
        uses: "./.github/workflows/gates.yml",
        with: { runner: "ubuntu-latest" },
      },
      callsHosted: { uses: "./.github/workflows/hosted.yml" },
      // The input is the decision, as in the starter: a callee that ignores
      // it today can read it tomorrow.
      passesHomeToHosted: {
        uses: "./.github/workflows/hosted.yml",
        with: { runner: "home" },
      },
      callsDeploy: { uses: "./.github/workflows/deploy.yml" },
      remote: { uses: "someone/repo/.github/workflows/x.yml@v1" },
    },
  };
  assert.deepEqual(
    orgRunnerJobs(wf, path => callees[path]),
    ["own", "passesHome", "passesHomeToHosted", "callsDeploy", "remote"]
  );
});

// This is a public repo, and a Dependabot PR is a bump nobody has read yet.
// An org runner holds every project (`self-hosted`) or runs jobs with sudo
// on Stefan's machine (`home`, `home-light`).
test("no Dependabot branch or PR can start a job on an org runner", () => {
  const readCallee = path => parse(read(path.replace(/^\.\//, "")));
  for (const name of workflowFiles()) {
    const wf = parse(read(`.github/workflows/${name}`));
    const onOrg = orgRunnerJobs(wf, readCallee);
    if (onOrg.length === 0) continue;
    const events = dependabotEvents(wf.on ?? wf[true] ?? {});
    assert.deepEqual(
      events,
      [],
      `${name}: ${events.join(", ")} can start org-runner job(s) ${onOrg.join(", ")} from a Dependabot branch`
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

test("the reach check knows each Dependabot branch shape", () => {
  for (const pattern of [
    "dependabot/github_actions/**",
    "dependabot/docker/**",
    "dependabot/npm_and_yarn/minor-and-patch-*",
    "dependabot/docker/majors-*",
    "dependabot/npm_and_yarn/@astrojs/**",
  ])
    assert.deepEqual(
      dependabotEvents({ push: { branches: ["main", pattern] } }),
      ["push"],
      pattern
    );
});

// GitHub's filter signs: `?` is zero or one of the sign before it, `+` one
// or more, `[...]` one of the set (GitHub's "Filter pattern cheat sheet").
test("the reach check reads `?`, `+` and `[...]` as GitHub does", () => {
  for (const pattern of [
    "[a-z]*/**",
    "[d]ependabot/**",
    "dependabo+t/**",
    "dependabott?/**",
  ])
    assert.deepEqual(
      dependabotEvents({ push: { branches: [pattern] } }),
      ["push"],
      pattern
    );
  assert.deepEqual(
    dependabotEvents({ push: { branches: ["dependabot?x/**", "[0-9]*/**"] } }),
    [],
    "neither pattern takes a dependabot/ branch"
  );
});
