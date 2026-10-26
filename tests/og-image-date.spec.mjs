// A post's share image is built only when its page is (blog#66). Until then
// `/posts/<slug>/index.png` was built for every non-draft post, so a post
// planned for a later date showed its title there weeks early. The page uses
// `postFilter`, which hides a post until its `pubDatetime`; the image route
// now uses it too.
//
// It reads `dist/` directly, so the build's own clock decides which posts are
// live, not the clock when the check runs.
//
// Run: `npm run build && npm run test:pages`.

import { test, expect } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const postsDir = "src/content/posts";
const distPosts = "dist/posts";

// The slug, draft flag and ogImage of each post, from its front matter.
// A post with no `slug` takes its file name, as the content loader does.
function readPosts() {
  return readdirSync(postsDir)
    .filter(name => /^[^_].*\.mdx?$/.test(name))
    .map(name => {
      const text = readFileSync(path.join(postsDir, name), "utf8");
      const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
      const field = key =>
        front
          .match(new RegExp(`^${key}:\\s*(.*)$`, "m"))?.[1]
          ?.trim()
          .replace(/^["']|["']$/g, "");
      return {
        name,
        slug: field("slug") || name.replace(/\.mdx?$/, ""),
        draft: field("draft") === "true",
        ogImage: Boolean(field("ogImage")),
      };
    })
    .filter(post => !post.draft && !post.ogImage);
}

const built = slug => ({
  page: existsSync(path.join(distPosts, slug, "index.html")),
  image: existsSync(path.join(distPosts, slug, "index.png")),
});

// A post in a subfolder gets the folder in its URL, which readPosts() does
// not work out. Fail, so such a post is not left out of the check unseen.
test("every post is in the top folder this check reads", () => {
  const nested = readdirSync(postsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  expect(nested, "teach readPosts() the URL of a post in a subfolder").toEqual(
    []
  );
});

test("a post's share image is built only when its page is", () => {
  expect(existsSync(distPosts), "no dist/posts: run `npm run build`").toBe(
    true
  );
  const posts = readPosts();
  const live = posts.filter(post => built(post.slug).page);
  expect(live.length, "no post page was built").toBeGreaterThan(0);

  for (const { slug } of posts) {
    const { page, image } = built(slug);
    expect(
      image,
      page
        ? `${slug}: its page is built, but its share image is not`
        : `${slug}: its page is not built yet, but its share image is`
    ).toBe(page);
  }
});

test("a post planned for a later date has no share image", () => {
  const planned = readPosts().filter(post => !built(post.slug).page);
  test.skip(
    planned.length === 0,
    "no planned post in this build, so this half is unchecked"
  );
  for (const { slug } of planned) {
    expect(
      built(slug).image,
      `${slug} is not live, but /posts/${slug}/index.png was built`
    ).toBe(false);
  }
});
