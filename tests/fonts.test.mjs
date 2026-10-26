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

// Each face is a .woff for browsers, then a .ttf: satori (the OG images)
// cannot read a .woff2, and getFontPathByWeight picks the "truetype" source.
test("every face ships a .woff, then a .ttf of the same face", () => {
  for (const family of fonts) {
    for (const v of variants(family)) {
      const face = `${family.name} ${v.weight} ${v.style}`;
      assert.equal(v.src.length, 2, `${face} has ${v.src.length} files`);
      const [woff, ttf] = v.src;
      assert.match(woff, /\.woff$/, `${face}: first file is ${woff}`);
      assert.equal(ttf, woff.replace(/\.woff$/, ".ttf"), `${face}: ${ttf}`);
    }
  }
});

// The faces, CSS variables and fallbacks the site served from Google Fonts
// before blog#64, read from the live front page on 2026-10-26. The order is
// Google's too: Astro sizes the fallback font from each family's first face.
test("the pages keep the same font families, faces and CSS variables", () => {
  const served = fonts.map(f => ({
    name: f.name,
    cssVariable: f.cssVariable,
    fallbacks: f.fallbacks,
    faces: variants(f).map(v => `${v.weight} ${v.style}`),
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
        "500 italic",
        "600 italic",
        "700 italic",
        "400 normal",
        "500 normal",
        "600 normal",
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
