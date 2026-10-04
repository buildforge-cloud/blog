// The shared parts this repo takes from buildforge-starter are byte for byte
// the releases `scripts/shared-checks.lock` pins (blog#19). A hand edit to one
// of them, or a lost file, fails here. To move a part to a new release:
// `python3 scripts/shared_checks.py update <name> <version>`. Run with
// `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

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
