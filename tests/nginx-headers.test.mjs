// Every response `nginx.conf` sends carries its security headers (blog#21).
//
// nginx drops every `add_header` of the level above in a block that sets one
// of its own, and says nothing: `nginx -t` passes and a page looks the same.
// Until blog#21 the `.html` block set `Cache-Control`, so no page got the CSP,
// the Referrer-Policy or HSTS. `tests/check_nginx_headers.py` is
// buildforge-starter's shared part (pinned in `scripts/shared-checks.lock`,
// never edited here); it reads every nginx config git tracks. Run with
// `npm test`. `tests/test_nginx.py` asks a real nginx the same thing, by hand.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { cspOf } from "./csp.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

test("no nginx block drops a security header it would inherit", () => {
  const run = spawnSync("python3", ["tests/check_nginx_headers.py"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(
    run.status,
    0,
    `check_nginx_headers.py exited ${run.status}:\n${run.stdout}${run.stderr}`
  );
});

test("the CSP lets no inline script run", () => {
  const conf = readFileSync(new URL("../nginx.conf", import.meta.url), "utf8");
  const scriptSrc = cspOf(conf)
    .split(";")
    .map(directive => directive.trim())
    .find(directive => directive.startsWith("script-src "));
  assert.ok(scriptSrc, "the CSP has no script-src");
  assert.doesNotMatch(scriptSrc, /'unsafe-inline'/);
});
