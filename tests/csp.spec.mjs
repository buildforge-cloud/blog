// Every built page runs under the CSP nginx.conf sends (blog#21).
//
// Its `script-src` allows 'self' and giscus, and no inline script. So a
// `<script is:inline>`, or a small `<script>` Astro inlines by itself, is
// blocked on the live site, and only a console line says so. Until blog#21 no
// page got the CSP at all (nginx dropped it), so nothing showed it. This
// opens every page under that CSP and fails on any `securitypolicyviolation`.
// Then it checks that search, the back-to-top button and a post's other
// scripts still work, on a full load and after a client-side link.
//
// Run: `npm run build && npm run test:pages`. `astro preview` sends no CSP,
// so each page gets nginx.conf's CSP added here, and giscus.app is not
// called (CI makes no network call to it). With `NGINX_RIG=1` the real nginx
// serves the build and sends the CSP itself, and giscus loads for real.

import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { cspOf } from "./csp.mjs";

const csp = cspOf(
  readFileSync(new URL("../nginx.conf", import.meta.url), "utf8")
);
const nginx = process.env.NGINX_RIG === "1";

// Every page in the sitemap, read from the build this run serves.
const sitemap = readFileSync(new URL("../dist/sitemap-0.xml", import.meta.url));
const pages = [...sitemap.toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, url]) => new URL(url).pathname
);
// A post's own page; /posts/2/ is a page of the post list.
const isPost = /^\/posts\/(?!\d+\/$)[^/]+\/$/;
const posts = pages.filter(path => isPost.test(path));
const built = path =>
  readFileSync(new URL(`../dist${path}index.html`, import.meta.url), "utf8");
// A post's scripts add a link to each heading and a button to each code
// block, so only a post with headings shows that they ran.
const withHeadings = posts.filter(path => /<h[2-6][\s>]/.test(built(path)));

// Every violation the page reports while the test runs. The listener goes in
// before any page script, and the window keeps it across client-side links.
async function underCsp(page, baseURL) {
  const violations = [];
  await page.exposeFunction("reportCspViolation", v => violations.push(v));
  // A worker reports to its own scope, not the page's listener; Chromium
  // also logs each refusal, and Pagefind says when its worker failed.
  page.on("console", message => {
    if (/Content Security Policy|Pagefind web worker/.test(message.text())) {
      violations.push(`console: ${message.text()}`);
    }
  });
  await page.addInitScript(() => {
    document.addEventListener(
      "securitypolicyviolation",
      e =>
        window.reportCspViolation(
          `${e.effectiveDirective} blocked ${e.blockedURI || "inline"} ` +
            `on ${location.pathname} at ${e.sourceFile}:${e.lineNumber}`
        ),
      true
    );
  });
  if (nginx) return violations;
  await page.route("https://giscus.app/**", route => route.abort());
  // On every answer, as nginx sends it: Pagefind searches in a worker, and a
  // worker takes the CSP of its own script's answer, not the page's.
  const origin = new URL(baseURL).origin;
  await page.route(
    url => url.origin === origin,
    async route => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), "content-security-policy": csp },
      });
    }
  );
  return violations;
}

async function open(page, path) {
  const response = await page.goto(path);
  if (nginx) {
    expect(
      response.headers()["content-security-policy"],
      `nginx sent ${path} without nginx.conf's CSP`
    ).toBe(csp);
  }
  await page.waitForLoadState("networkidle");
  return response;
}

// A client-side link (or Back), done once Astro has swapped the page in.
async function navigate(page, act) {
  const loaded = page.evaluate(
    () =>
      new Promise(resolve =>
        document.addEventListener("astro:page-load", resolve, { once: true })
      )
  );
  await act();
  await loaded;
}

// What a post page's own scripts do: each runs once per page.
async function expectPostScriptsRan(page) {
  await expect(page.locator("#myBar"), "the reading progress bar").toHaveCount(
    1
  );
  const headings = await page.locator("h2, h3, h4, h5, h6").count();
  expect(headings, `${page.url()} has no heading`).toBeGreaterThan(0);
  await expect(page.locator(".heading-link")).toHaveCount(headings);
  await expect(page.locator(".copy-code")).toHaveCount(
    await page.locator("pre").count()
  );
  await expect(
    page.locator('#giscus-comments script[src="https://giscus.app/client.js"]'),
    "the giscus loader"
  ).toHaveCount(1);

  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight)
  );
  await expect(page.locator("#btt-btn-container")).toHaveClass(/opacity-100/);
  await expect
    .poll(() =>
      page.evaluate(() =>
        parseFloat(document.getElementById("myBar").style.width)
      )
    )
    .toBeGreaterThan(90);
  await page.locator("[data-button='back-to-top']").click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

for (const path of [...pages, "/no-such-page/"]) {
  test(`${path} runs under the CSP`, async ({ page, baseURL }) => {
    const violations = await underCsp(page, baseURL);
    await open(page, path);
    expect(violations).toEqual([]);
  });
}

// Search for a word from a post's own URL, so there is always a result.
test("search finds a post under the CSP", async ({ page, baseURL }) => {
  const violations = await underCsp(page, baseURL);
  const word = posts[0]
    .split("/")[2]
    .split("-")
    .sort((a, b) => b.length - a.length)[0];
  await open(page, `/search/?q=${word}`);
  await expect(page.locator(".pagefind-ui__result").first()).toBeVisible();
  expect(violations).toEqual([]);
});

test("a post opened directly runs its scripts under the CSP", async ({
  page,
  baseURL,
}) => {
  const violations = await underCsp(page, baseURL);
  const [withCode] = withHeadings.filter(path => built(path).includes("<pre"));
  await open(page, withCode);
  await expectPostScriptsRan(page);
  expect(violations).toEqual([]);
});

// Home, then a post, then the post next to it, then Back, then a tag: three
// posts and a page that is not one, which the ClientRouter swaps in with no
// full load between them.
test("posts reached by client-side links run their scripts under the CSP", async ({
  page,
  baseURL,
}) => {
  const violations = await underCsp(page, baseURL);
  const linkTo = async hrefs => {
    const all = await page
      .locator("main a")
      .evaluateAll(links => links.map(link => link.getAttribute("href")));
    const href = all.find(href => hrefs.includes(href));
    expect(
      href,
      `no link on ${page.url()} to a post with headings`
    ).toBeTruthy();
    return href;
  };

  await open(page, "/");
  const first = await linkTo(withHeadings);
  await navigate(page, () =>
    page.locator(`main a[href="${first}"]`).first().click()
  );
  expect(new URL(page.url()).pathname).toBe(first);
  await expectPostScriptsRan(page);

  const second = await linkTo(withHeadings.filter(path => path !== first));
  await navigate(page, () =>
    page.locator(`main a[href="${second}"]`).first().click()
  );
  expect(new URL(page.url()).pathname).toBe(second);
  await expectPostScriptsRan(page);

  await navigate(page, () => page.goBack());
  expect(new URL(page.url()).pathname).toBe(first);
  await expectPostScriptsRan(page);

  // A post's scripts stay loaded, so they must leave other pages alone.
  await navigate(page, () =>
    page.locator('main a[href^="/tags/"]').first().click()
  );
  expect(new URL(page.url()).pathname).toMatch(/^\/tags\//);
  await expect(page.locator("#myBar")).toHaveCount(0);
  await expect(page.locator(".heading-link")).toHaveCount(0);
  expect(violations).toEqual([]);
});

test("giscus loads its comments under the CSP", async ({
  page,
  baseURL,
}, testInfo) => {
  test.skip(!nginx, "giscus.app is a network call: run with NGINX_RIG=1");
  const violations = await underCsp(page, baseURL);
  await open(page, posts[0]);
  const comments = page.locator("#giscus-comments");
  await comments.scrollIntoViewIfNeeded();
  await expect(
    page.frameLocator("iframe.giscus-frame").locator("body")
  ).toContainText(/comments?/i, { timeout: 20_000 });
  await page.screenshot({
    path: testInfo.outputPath("post-with-comments.png"),
  });
  expect(violations).toEqual([]);
});
