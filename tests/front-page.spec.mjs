// The first post a reader meets on the front page is the newest one
// (blog#62). Until then "Starting this blog" (7 Aug) sat in the Featured
// slot above every newer post, and the product posts came second.
// `/posts/` lists every post newest first, so its first link is the newest.
//
// Run: `npm run build && npm run test:pages`.

import { test, expect } from "@playwright/test";

const firstPostLink = page =>
  page.locator('#main-content a[href*="/posts/"]').first();

test("the first post on the front page is the newest post", async ({
  page,
}) => {
  await page.goto("/posts/");
  const newest = await firstPostLink(page).getAttribute("href");
  expect(newest, "/posts/ lists no post").toMatch(/\/posts\/.+/);

  await page.goto("/");
  await expect(
    firstPostLink(page),
    "the front page's first post is not the newest"
  ).toHaveAttribute("href", newest);
});

test("the archive still lists Starting this blog", async ({ page }) => {
  await page.goto("/archives/");
  await expect(
    page.locator('#main-content a[href$="/posts/starting-this-blog/"]')
  ).toHaveCount(1);
});
