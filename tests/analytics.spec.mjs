// No built page or script ships analytics (blog#17). The blog has none, by
// choice. The PostHog snippet it carried from 2026-08-07 never ran: Astro
// printed it as a string, and nothing read what the build shipped. This does.
// tests/analytics.mjs decides what counts; tests/analytics.test.mjs checks it.
//
// Run: `npm run build && npm run test:pages`.

import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { trackersIn } from "./analytics.mjs";

const dist = new URL("../dist/", import.meta.url);
const files = readdirSync(dist, { recursive: true }).filter(file =>
  /\.(html|js)$/.test(file)
);

test("no built page or script loads analytics", () => {
  expect(files, "the walk found no home page").toContain("index.html");
  expect(
    files.filter(file => file.startsWith("posts/")).length,
    "the walk found no post"
  ).toBeGreaterThan(0);
  expect(
    files.filter(file => file.endsWith(".js")).length,
    "the walk found no script"
  ).toBeGreaterThan(0);

  const found = files.flatMap(file =>
    trackersIn(file, readFileSync(new URL(file, dist), "utf8")).map(
      excerpt => `${file}: ${excerpt}`
    )
  );
  expect(found, `analytics in the build:\n  ${found.join("\n  ")}`).toEqual([]);
});
