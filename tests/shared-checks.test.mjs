// The shared parts this repo takes from buildforge-starter are byte for byte
// the releases `scripts/shared-checks.lock` pins (blog#19). A hand edit to one
// of them, or a lost file, fails here. To move a part to a new release:
// `python3 scripts/shared_checks.py update <name> <version>`. Run with
// `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

// The oldest release each part may be pinned at: a downgrade fails here.
// shared_checks 1.10.3 (blog#91) is the starter's current pin tool.
const FLOORS = { "scripts/shared_checks.py": "1.10.3" };

const parts = v => [0, 1, 2].map(i => Number(v.split(".")[i] ?? 0));
const atLeast = (have, floor) => {
  const [a, b] = [parts(have), parts(floor)];
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

test("atLeast compares versions by number, not text", () => {
  assert.equal(atLeast("1.7.1", "1.7.2"), false);
  assert.equal(atLeast("1.7.2", "1.7.2"), true);
  assert.equal(atLeast("1.7.4", "1.7.5"), false);
  assert.equal(atLeast("1.7.5", "1.7.5"), true);
  assert.equal(atLeast("1.10.0", "1.7.2"), true);
  assert.equal(atLeast("0.9.9", "1.7.2"), false);
  assert.equal(atLeast("1.7", "1.7.0"), true, "a missing part counts as 0");
  assert.equal(atLeast("x.y.z", "1.7.2"), false, "a malformed pin is below");
});

test("no shared part is pinned below its floor", () => {
  const lock = JSON.parse(
    readFileSync(new URL("../scripts/shared-checks.lock", import.meta.url))
  );
  for (const [file, floor] of Object.entries(FLOORS)) {
    const pin = lock.files[file]?.version;
    assert.ok(pin, `${file} has no pin in scripts/shared-checks.lock`);
    assert.ok(
      atLeast(pin, floor),
      `${file} is pinned at ${pin}, below its floor ${floor}`
    );
  }
});

test("every shared part is the release its pin names", () => {
  const run = spawnSync("python3", ["scripts/shared_checks.py"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(
    run.status,
    0,
    `scripts/shared_checks.py exited ${run.status}:\n${run.stdout}${run.stderr}`
  );
});
