// Every run of text on the built site meets WCAG AA against what is actually
// painted behind it (blog#6).
//
// On paper nothing looks broken when a colour drops under AA, and ember
// #c2410c on paper clears it by 0.13. A check computed from the token table
// would miss a rule that puts muted ink on the alternating band, or a `prose`
// default that beats a token, so this one reads the rendered page: each text
// node's computed colour, and every background and opacity above it.
// tests/contrast.mjs does the arithmetic; tests/contrast.test.mjs checks it.
//
// Run: `npm run build && npm run test:pages`.

import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { contrast, floorFor, paint, triage } from "./contrast.mjs";

// Every page in the sitemap, read from the build this run serves.
const sitemap = readFileSync(new URL("../dist/sitemap-0.xml", import.meta.url));
const pages = [...sitemap.toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, url]) => new URL(url).pathname
);
// A post's own page; /posts/2/ is a page of the post list.
const isPost = /^\/posts\/(?!\d+\/$)[^/]+\/$/;

// Text under AA that is recorded here instead of fixed. Stefan decides how
// the site looks, so a failure found by this check is listed with its ratio
// and the fix is his call. A record passes only its own colour pair, on its
// own pages, and fails the check once the failure is gone, so delete it with
// the fix. Each record is { what, text, ground, on }: what failed and its
// ratio, the two colours as the check prints them, and a RegExp of the pages.
const known = [];

// Runs in the page. Every visible run of text, with its colour, its size and
// the elements it sits in, from <html> down.
function readText() {
  const ctx = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  // Any CSS colour (hex, rgb(), oklch(), color-mix()) as 8-bit sRGB and alpha.
  const rgba = css => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };

  const runs = [];
  const seen = new Set();
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walk.nextNode(); node; node = walk.nextNode()) {
    const el = node.parentElement;
    const text = node.textContent.replace(/\s+/g, " ").trim();
    if (!text || !el || seen.has(el)) continue;
    seen.add(el);
    // WCAG 1.4.3 sets no floor for a control that is switched off. The post
    // list's Prev/Next with nowhere to go are `opacity-50` ink, 3.27:1.
    if (el.closest("[aria-disabled='true'], :disabled")) continue;
    const shown = el.checkVisibility({
      visibilityProperty: true,
      opacityProperty: true,
    });
    if (!shown) continue;

    const layers = [];
    for (let a = el; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      layers.unshift({
        background: rgba(s.backgroundColor),
        opacity: Number(s.opacity),
      });
    }
    const style = getComputedStyle(el);
    runs.push({
      text: text.slice(0, 40),
      where:
        el.tagName.toLowerCase() +
        [...el.classList]
          .slice(0, 2)
          .map(c => `.${c}`)
          .join(""),
      color: rgba(style.webkitTextFillColor),
      size: parseFloat(style.fontSize),
      weight: Number(style.fontWeight),
      layers,
    });
  }
  return runs;
}

const toHex = rgb =>
  "#" + rgb.map(c => Math.round(c).toString(16).padStart(2, "0")).join("");

async function checkPage(page, path) {
  const runs = await page.evaluate(readText);
  expect(
    runs.length,
    `no text found on ${path}; the walk is broken`
  ).toBeGreaterThan(0);

  const failures = runs.flatMap(run => {
    const { ground, text } = paint(run.layers, run.color);
    const ratio = contrast(text, ground);
    const floor = floorFor(run.size, run.weight);
    if (ratio >= floor) return [];
    const [fg, bg] = [toHex(text), toHex(ground)];
    const line = `${ratio.toFixed(2)}:1 (needs ${floor}) ${fg} on ${bg} ${run.where} "${run.text}"`;
    return [{ text: fg, ground: bg, line }];
  });

  const { unknown, stale } = triage(path, failures, known);
  expect(unknown, `under AA on ${path}:\n  ${unknown.join("\n  ")}`).toEqual(
    []
  );
  expect(
    stale,
    `recorded in \`known\` but no longer on ${path}; delete the record:\n  ${stale.join("\n  ")}`
  ).toEqual([]);
}

for (const path of pages) {
  test(`text on ${path} meets AA`, async ({ page }) => {
    await page.goto(path);
    await checkPage(page, path);
  });
}

// The search page holds only a text box until someone searches. Search for a
// word from a post's own URL, so there is always at least one result.
//
// Pagefind shows each result at once as grey placeholder rows
// (`.pagefind-ui__loading`, text the colour of its ground: 1.00:1), and fills
// it in when the result's fragment arrives. The fragments are held back here,
// so every run meets that state, not only a run on a slow machine.
test("text in search results meets AA", async ({ page }) => {
  await page.route("**/pagefind/fragment/**", async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue();
  });
  const slug = pages.find(p => isPost.test(p)).split("/")[2];
  const word = slug.split("-").sort((a, b) => b.length - a.length)[0];
  await page.goto(`/search/?q=${word}`);
  await expect(page.locator(".pagefind-ui__result").first()).toBeVisible();
  await expect(page.locator(".pagefind-ui__loading")).toHaveCount(0);
  await checkPage(page, "/search/");
});

test("text on the 404 page meets AA", async ({ page }) => {
  const response = await page.goto("/no-such-page/");
  expect(response.status(), "this URL did not get the 404 page").toBe(404);
  await checkPage(page, "/404/");
});

test("the walk covers every kind of page blog#6 names", () => {
  for (const path of ["/", "/about/", "/tags/", "/search/"]) {
    expect(pages, "the sitemap walk lost a page").toContain(path);
  }
  expect(
    pages.filter(p => isPost.test(p)).length,
    "no post pages"
  ).toBeGreaterThan(0);
});

// blog#6: the one exception recorded by name. White on ember-fill, inherited
// as-is from buildforge.cloud's own ::selection. It is shown only while text is
// selected, it is not a run of body copy, and changing it would make the two
// sites' selection colours differ. Changing it is Stefan's call.
test("::selection is the recorded exception at 3.66:1", async ({ page }) => {
  await page.goto("/about/");
  const [color, background] = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector("main p"), "::selection");
    return [s.color, s.backgroundColor];
  });
  const rgb = css => [...css.matchAll(/\d+/g)].slice(0, 3).map(Number);
  const ratio = contrast(rgb(color), rgb(background));
  expect(
    ratio.toFixed(2),
    `::selection is now ${color} on ${background}; update this record, or delete it if it passes AA`
  ).toBe("3.66");
});
