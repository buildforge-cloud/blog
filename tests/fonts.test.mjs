// The site's fonts come from the repo, not from Google Fonts (blog#64).
//
// Astro fetches a remote provider's fonts while `npm run build` runs. Twice
// (2026-10-08 and 2026-10-26) that fetch failed and stopped the deploy, so a
// merged post waited for the next day's 07:05 UTC build. ci.yml proves the
// build makes no font request; these tests keep the config honest. Run with
// `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fonts } from "../fonts.config.mjs";

const root = new URL("../", import.meta.url);
const variants = family => family.options?.variants ?? [];

test("every font family is served from the repo, not fetched over the network", () => {
  for (const family of fonts) {
    assert.equal(
      family.provider?.name,
      "local",
      `${family.name} uses the "${family.provider?.name}" provider; want "local"`
    );
  }
});

test("every font file the config names is in the repo", () => {
  const files = fonts.flatMap(f => variants(f).flatMap(v => v.src));
  assert.ok(files.length > 0, "the config names no font file");
  for (const src of files) {
    const path = fileURLToPath(new URL(src, root));
    assert.ok(existsSync(path), `${src} is not in the repo`);
  }
});

// The faces, CSS variables and fallbacks the site served from Google Fonts
// before blog#64, read from the live front page on 2026-10-26.
test("the pages keep the same font families, faces and CSS variables", () => {
  const served = fonts.map(f => ({
    name: f.name,
    cssVariable: f.cssVariable,
    fallbacks: f.fallbacks,
    faces: variants(f)
      .map(v => `${v.weight} ${v.style}`)
      .sort(),
  }));
  assert.deepEqual(served, [
    {
      name: "Space Grotesk",
      cssVariable: "--font-space-grotesk",
      fallbacks: ["Helvetica Neue", "Arial", "sans-serif"],
      faces: ["500 normal", "600 normal", "700 normal"],
    },
    {
      name: "IBM Plex Sans",
      cssVariable: "--font-ibm-plex-sans",
      fallbacks: ["system-ui", "sans-serif"],
      faces: [
        "400 italic",
        "400 normal",
        "500 italic",
        "500 normal",
        "600 italic",
        "600 normal",
        "700 italic",
        "700 normal",
      ],
    },
    {
      name: "IBM Plex Mono",
      cssVariable: "--font-ibm-plex-mono",
      fallbacks: ["monospace"],
      faces: ["400 normal", "500 normal", "600 normal"],
    },
  ]);
});
