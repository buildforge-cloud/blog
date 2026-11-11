// No locked package may sit in a range a known advisory names (blog#83).
//
// The first weekly package scan (2026-11-11) found a critical hole in astro
// and high ones in eight packages under it. This repo is public, and the
// site is built from these packages. A floor here keeps a later lockfile
// change from bringing an old copy back. Each line is a GitHub advisory's
// vulnerable range: `from` (inclusive) up to `fixed` (the first safe version).
// Run with `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export const ADVISORIES = [
  // critical GHSA-26w7-cxv4-gfx2. astro's moderate and low ones need 7.3.3,
  // which needs @astrojs/mdx 8, a major update (blog#83's PR says why not yet).
  { name: "astro", from: "0.0.0", fixed: "7.2.8" },
  { name: "brace-expansion", from: "4.0.0", fixed: "5.0.12" },
  { name: "devalue", from: "0.0.0", fixed: "5.9.3" },
  { name: "fast-uri", from: "3.0.0", fixed: "3.1.9" },
  { name: "js-yaml", from: "4.0.0", fixed: "4.3.2" },
  { name: "sharp", from: "0.0.0", fixed: "0.35.5" },
  { name: "source-map-js", from: "1.0.0", fixed: "1.2.2" },
  { name: "svgo", from: "4.0.0", fixed: "4.1.0" },
  { name: "vite", from: "8.2.0", fixed: "8.2.4" },
  { name: "zod", from: "0.0.0", fixed: "4.6.6" },
];

// -1, 0 or 1. A prerelease sorts before its release (0.35.5-rc.1 < 0.35.5).
export function compare(a, b) {
  const [coreA, preA] = a.split("-", 2);
  const [coreB, preB] = b.split("-", 2);
  const numsA = coreA.split(".").map(Number);
  const numsB = coreB.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (numsA[i] !== numsB[i]) return numsA[i] < numsB[i] ? -1 : 1;
  }
  if (preA === preB) return 0;
  if (preA === undefined) return 1;
  if (preB === undefined) return -1;
  return preA < preB ? -1 : 1;
}

export const vulnerable = (version, { from, fixed }) =>
  compare(version, from) >= 0 && compare(version, fixed) < 0;

// Every copy of `name` in the lockfile, nested ones included, as [path, version].
export function copies(lock, name) {
  return Object.entries(lock.packages)
    .filter(
      ([path]) =>
        path === `node_modules/${name}` ||
        path.endsWith(`/node_modules/${name}`)
    )
    .map(([path, entry]) => [path, entry.version]);
}

test("the last vulnerable version is out and the first fixed one is in", () => {
  const astro = ADVISORIES.find(a => a.name === "astro");
  assert.equal(vulnerable("7.2.7", astro), true, "7.2.7 should be vulnerable");
  assert.equal(vulnerable("7.2.8", astro), false, "7.2.8 should be safe");
});

test("a version below the advisory's range is safe", () => {
  const brace = ADVISORIES.find(a => a.name === "brace-expansion");
  assert.equal(vulnerable("2.0.2", brace), false, "2.0.2 is below 4.0.0");
  assert.equal(vulnerable("4.0.0", brace), true, "4.0.0 opens the range");
});

test("a prerelease of the fixed version is still vulnerable", () => {
  const sharp = ADVISORIES.find(a => a.name === "sharp");
  assert.equal(vulnerable("0.35.5-rc.1", sharp), true);
  assert.equal(vulnerable("0.35.5", sharp), false);
});

test("a release sorts after its own prerelease, either way round", () => {
  assert.equal(compare("7.3.0", "7.3.0-beta.1"), 1);
  assert.equal(compare("7.3.0-beta.1", "7.3.0"), -1);
});

test("a copy nested under another package counts, a look-alike name does not", () => {
  const fake = {
    packages: {
      "": { version: "6.1.0" },
      "node_modules/devalue": { version: "5.9.3" },
      "node_modules/astro/node_modules/devalue": { version: "5.9.0" },
      "node_modules/devalue-extra": { version: "1.0.0" },
    },
  };
  assert.deepEqual(copies(fake, "devalue"), [
    ["node_modules/devalue", "5.9.3"],
    ["node_modules/astro/node_modules/devalue", "5.9.0"],
  ]);
});

const lock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8")
);

test("astro, a direct dependency, is in the lockfile", () => {
  assert.ok(
    copies(lock, "astro").length > 0,
    "astro not found in package-lock.json"
  );
});

// astro 7.2.10 and later want @astrojs/markdown-remark ^7.3, and every
// @astrojs/mdx 7.x pins 7.2.x. While mdx is on 7, a range like ^7.2.9 lets
// `npm update` or `npm audit fix` reach for a newer astro and stop with
// ERESOLVE, which blocks every other update in the same run.
test("while @astrojs/mdx is on major 7, astro is pinned below 7.2.10", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8")
  );
  const mdx = pkg.dependencies["@astrojs/mdx"];
  const astro = pkg.dependencies.astro;
  if (!/^[\^~]?7\./.test(mdx)) return; // mdx 8 lifts the cap
  assert.match(astro, /^\d+\.\d+\.\d+$/, `astro "${astro}" is a range`);
  assert.equal(compare(astro, "7.2.10"), -1, `astro ${astro} needs mdx 8`);
});

for (const advisory of ADVISORIES) {
  test(`no locked copy of ${advisory.name} is below ${advisory.fixed}`, () => {
    const bad = copies(lock, advisory.name).filter(([, version]) =>
      vulnerable(version, advisory)
    );
    assert.deepEqual(
      bad,
      [],
      `${advisory.name} copies in ${advisory.from} to <${advisory.fixed}`
    );
  });
}
