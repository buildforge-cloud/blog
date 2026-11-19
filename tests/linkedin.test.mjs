// The LinkedIn drafts in docs/linkedin/ keep the rules blog#104 set, and each
// one belongs to a post. Run with `npm test`. tests/linkedin.mjs holds the
// rules.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { crc32 } from "node:zlib";
import sharp from "sharp";
import {
  articleProblems,
  coverProblems,
  linkedinProblems,
  pngSize,
  pngTitle,
  postText,
  postUrl,
  publishedSlug,
  shareProblems,
  titledPng,
  wordsIn,
} from "./linkedin.mjs";

const SLUG = "a-post";
const A_URL = "https://blog.buildforge.cloud/posts/a-post/";

// A draft of `total` words: a 3-word opening, filler, the tags, the URL.
const draft = (
  total,
  { opening = "AI wrote this.", tags = ["#ai"], end = A_URL } = {}
) => {
  const filler = Array(total - 3 - tags.length - 1).fill("word");
  return [opening, filler.join(" "), tags.join(" "), end].join("\n\n") + "\n";
};

test("a draft that keeps every rule has no problems", () => {
  assert.deepEqual(linkedinProblems(draft(150), SLUG), []);
});

test("120 words is in, 119 is out", () => {
  assert.deepEqual(linkedinProblems(draft(120), SLUG), []);
  assert.deepEqual(linkedinProblems(draft(119), SLUG), [
    "119 words, not 120 to 200",
  ]);
});

test("200 words is in, 201 is out", () => {
  assert.deepEqual(linkedinProblems(draft(200), SLUG), []);
  assert.deepEqual(linkedinProblems(draft(201), SLUG), [
    "201 words, not 120 to 200",
  ]);
});

test("the URL and a hashtag are one word each, a lone dot is none", () => {
  assert.equal(wordsIn(`AI · wrote it\n#ai ${A_URL}\n`), 5);
});

test("3 hashtags are in, 4 are out, and blog#104 is not one", () => {
  const three = ["#ai", "#claudecode", "#agents"];
  assert.deepEqual(linkedinProblems(draft(150, { tags: three }), SLUG), []);
  assert.deepEqual(
    linkedinProblems(draft(150, { tags: [...three, "#devops"] }), SLUG),
    ["4 hashtags, not 3 or fewer"]
  );
  const issue = draft(150, { opening: "AI wrote blog#104.", tags: three });
  assert.deepEqual(linkedinProblems(issue, SLUG), []);
  const ref = draft(150, { opening: "AI fixed #104.", tags: three });
  assert.deepEqual(linkedinProblems(ref, SLUG), [], "#104 is an issue number");
});

// The slug a draft must match: the post's own, as the build reads it.
const post = (front, body = "Text.\n") => `---\n${front}\n---\n${body}`;

test("a post's slug is read as YAML, quoted or not", () => {
  const front = "title: A\nslug: my-post\ndraft: false";
  assert.equal(publishedSlug("a.md", post(front)), "my-post");
  const quoted = 'title: A\nslug: "my-post"\ndraft: false';
  assert.equal(publishedSlug("a.md", post(quoted)), "my-post");
});

test("a post saved with CRLF line ends has its slug", () => {
  const text = post("title: A\nslug: my-post\ndraft: false").replace(
    /\n/g,
    "\r\n"
  );
  assert.equal(publishedSlug("a.md", text), "my-post");
});

test("a slug: line in a post's body is not its slug", () => {
  const text = post("title: A\nslug: my-post\ndraft: false", "slug: other\n");
  assert.equal(publishedSlug("a.md", text), "my-post");
});

test("a draft post, or one the build skips, has no published slug", () => {
  const front = "title: A\nslug: my-post\ndraft: false";
  assert.equal(
    publishedSlug("a.md", post(front.replace("false", "true"))),
    null
  );
  assert.equal(publishedSlug("_a.md", post(front)), null);
  assert.equal(publishedSlug("sub/_a.md", post(front)), null);
  assert.equal(
    publishedSlug("a.md", "slug: my-post\n"),
    null,
    "no front matter"
  );
});

// content.config.ts's glob skips only a file whose own name starts with `_`.
test("a post in a `_` folder is still built, so its slug counts", () => {
  const front = "title: A\nslug: my-post\ndraft: false";
  assert.equal(publishedSlug("_dir/a.md", post(front)), "my-post");
});

test("the first paragraph must say AI", () => {
  const late = draft(150, { opening: "I wrote nothing." });
  assert.deepEqual(linkedinProblems(late.replace("word", "AI"), SLUG), [
    'its first paragraph does not say "AI"',
  ]);
});

test("the last line must be this post's URL", () => {
  assert.equal(postUrl(SLUG), A_URL);
  const other = draft(150, { end: postUrl("another-post") });
  assert.deepEqual(linkedinProblems(other, SLUG), [
    `its last line is not ${A_URL}`,
  ]);
  const after = draft(149) + "\nThanks.\n";
  assert.deepEqual(linkedinProblems(after, SLUG), [
    `its last line is not ${A_URL}`,
  ]);
});

test("an empty draft lists its problems and does not throw", () => {
  assert.deepEqual(linkedinProblems("", SLUG), [
    "0 words, not 120 to 200",
    'its first paragraph does not say "AI"',
    `its last line is not ${A_URL}`,
  ]);
});

test("an em dash is a problem", () => {
  const dash = draft(150, { opening: "AI wrote this — mostly." });
  assert.deepEqual(linkedinProblems(dash, SLUG), ["an em dash"]);
});

// A LinkedIn Article (blog#107): `<slug>-article.md`, read against its post.
// The fixture's headline is 3 words, its opening 7 and its end 5; each
// section is a 2-word sub-head and `n` filler words, in one-sentence
// paragraphs of up to 50 words. No digit appears, so no number is checked.
const POST_TEXT =
  "In its busiest week it merged 114 pull requests, 7.2 per 100.";
const HEAD = "# A plain headline";
const OPEN = "AI wrote this, and I edited it.";
const END = "What would you check first?";
const section = n => {
  const paragraphs = [];
  for (let left = n; left > 0; left -= 50)
    paragraphs.push(Array(Math.min(50, left)).fill("word").join(" ") + ".");
  return ["## Sub head", ...paragraphs].join("\n\n");
};
// 15 + the sum of (n + 2) words: [245, 245, 245, 245] is 1,003.
const article = ({
  head = HEAD,
  open = OPEN,
  sections = [245, 245, 245, 245],
  extra = "",
  end = END,
} = {}) =>
  [head, open, ...sections.map(section), extra, end]
    .filter(Boolean)
    .join("\n\n") + "\n";

test("an Article that keeps every rule has no problems", () => {
  assert.equal(wordsIn(article()), 1003);
  assert.deepEqual(articleProblems(article(), POST_TEXT), []);
});

test("an Article's headline is its first line, 60 characters in, 61 out", () => {
  const sixty = `# ${"a".repeat(60)}`;
  assert.deepEqual(articleProblems(article({ head: sixty }), POST_TEXT), []);
  assert.deepEqual(articleProblems(article({ head: `${sixty}b` }), POST_TEXT), [
    "its headline is 61 characters, not 60 or fewer",
  ]);
  const none = article({ head: "A plain headline" });
  assert.deepEqual(articleProblems(none, POST_TEXT), [
    'its first line is not a "# " headline',
  ]);
});

test('an Article says "AI" and "edited" in its first 160 characters', () => {
  const at = pad => article({ open: `${"x".repeat(pad)} ${OPEN}` });
  assert.deepEqual(articleProblems(at(132), POST_TEXT), []);
  assert.deepEqual(articleProblems(at(133), POST_TEXT), [
    'its first 160 characters do not say "edited"',
  ]);
  const late = article({ open: "I wrote this, and then I checked." });
  assert.deepEqual(articleProblems(late, POST_TEXT), [
    'its first 160 characters do not say "AI"',
    'its first 160 characters do not say "edited"',
  ]);
});

test("an Article has a sub-head every 300 words: 300 in, 301 out", () => {
  const at = n => article({ sections: [n, 245, 245, 245] });
  assert.deepEqual(articleProblems(at(298), POST_TEXT), []);
  assert.deepEqual(articleProblems(at(299), POST_TEXT), [
    "a section of 301 words, not 300 or fewer",
  ]);
});

test("an Article is 1,000 to 2,500 words", () => {
  const words = sections => article({ sections });
  const short = [245, 245, 245, 242];
  assert.equal(wordsIn(words(short)), 1000);
  assert.deepEqual(articleProblems(words(short), POST_TEXT), []);
  const under = words([245, 245, 245, 241]);
  assert.deepEqual(articleProblems(under, POST_TEXT), [
    "999 words, not 1,000 to 2,500",
  ]);
  const long = [...Array(8).fill(274), 275];
  assert.equal(wordsIn(words(long)), 2500);
  assert.deepEqual(articleProblems(words(long), POST_TEXT), []);
  const over = words([...Array(8).fill(274), 276]);
  assert.deepEqual(articleProblems(over, POST_TEXT), [
    "2501 words, not 1,000 to 2,500",
  ]);
});

test("an Article's paragraph has 3 sentences at most", () => {
  const three = article({ extra: 'One. Two? "Three."' });
  assert.deepEqual(articleProblems(three, POST_TEXT), []);
  const four = article({ extra: 'One. Two? "Three." Four!' });
  assert.deepEqual(articleProblems(four, POST_TEXT), [
    'a paragraph of 4 sentences, not 3 or fewer: One. Two? "Three." Four!',
  ]);
  const listed = article({ extra: "- One. Two. Three.\n- One. Two. Three." });
  assert.deepEqual(articleProblems(listed, POST_TEXT), [], "each list item");
});

test("a numbered list item counts alone, without its number", () => {
  const steps = article({
    extra: "1. Run it. Then wait. Then look.\n2. Check it.\n3. Merge it.",
  });
  assert.deepEqual(articleProblems(steps, "Steps 1, 2 and 3."), []);
});

test("e.g., i.e. and vs. do not end a sentence", () => {
  const short = article({
    extra:
      "A rule vs. a hook, e.g. a check, i.e. a gate. It broke. We fixed it.",
  });
  assert.deepEqual(articleProblems(short, POST_TEXT), []);
});

test("a paragraph glued to its sub-head is still counted", () => {
  const glued = article({ extra: "## Glued head\nOne. Two. Three. Four." });
  assert.deepEqual(articleProblems(glued, POST_TEXT), [
    "a paragraph of 4 sentences, not 3 or fewer: One. Two. Three. Four.",
  ]);
});

test("an Article ends with a question", () => {
  assert.deepEqual(
    articleProblems(article({ end: "That is all." }), POST_TEXT),
    ["its last paragraph is not a question"]
  );
});

test("each number in an Article is in its post", () => {
  const known = article({ extra: "It merged 114 pull requests, 7.2 per 100." });
  assert.deepEqual(articleProblems(known, POST_TEXT), []);
  const unknown = article({
    extra: "It merged 115 pull requests, 7.3 per 100.",
  });
  assert.deepEqual(articleProblems(unknown, POST_TEXT), [
    "115 is not in the post",
    "7.3 is not in the post",
  ]);
  const twice = article({ extra: "It merged 115, then 115 again." });
  assert.deepEqual(articleProblems(twice, POST_TEXT), [
    "115 is not in the post",
  ]);
});

test("a number in a link's address is no claim, and 1,000 is 1000", () => {
  const post = "It took 1000 reads. See [it](https://example.com/issues/104).";
  const fromLink = article({ extra: "It took 104 reads." });
  assert.deepEqual(articleProblems(fromLink, post), ["104 is not in the post"]);
  const commas = article({ extra: "It took 1,000 reads." });
  assert.deepEqual(articleProblems(commas, post), []);
  const linked = article({
    extra: "See [it](https://example.com/issues/999).",
  });
  assert.deepEqual(articleProblems(linked, post), []);
});

test("the first 160 characters are read without link addresses", () => {
  const target = `https://example.com/${"x".repeat(120)}`;
  const linked = article({
    open: `[My post](${target}) says AI wrote it, and I edited it.`,
  });
  assert.deepEqual(articleProblems(linked, POST_TEXT), []);
});

test("an Article's links are absolute, and it has no em dash", () => {
  const relative = article({ extra: "See [the post](/posts/a-post/)." });
  assert.deepEqual(articleProblems(relative, POST_TEXT), [
    "a relative link: /posts/a-post/",
  ]);
  const absolute = article({ extra: `See [the post](${A_URL}).` });
  assert.deepEqual(articleProblems(absolute, POST_TEXT), []);
  const dash = article({ extra: "It held — mostly." });
  assert.deepEqual(articleProblems(dash, POST_TEXT), ["an em dash"]);
});

test("an Article saved with CRLF line ends is read as with LF", () => {
  const crlf = article().replace(/\n/g, "\r\n");
  assert.deepEqual(articleProblems(crlf, POST_TEXT), []);
  const long = article({ head: `# ${"a".repeat(61)}` }).replace(/\n/g, "\r\n");
  assert.deepEqual(articleProblems(long, POST_TEXT), [
    "its headline is 61 characters, not 60 or fewer",
  ]);
});

test("an empty Article lists its problems and does not throw", () => {
  assert.deepEqual(articleProblems("", POST_TEXT), [
    'its first line is not a "# " headline',
    "0 words, not 1,000 to 2,500",
    'its first 160 characters do not say "AI"',
    'its first 160 characters do not say "edited"',
    "its last paragraph is not a question",
  ]);
});

test("a post's text is its title, description and body", () => {
  const text = post("title: T 1\ndescription: D 2\nslug: a", "Body 3.\n");
  assert.equal(postText(text), "T 1\nD 2\nBody 3.\n");
});

// The share text that goes with an Article: `<slug>.md` beside it.
const share = (words, { opening = "AI wrote this.", tags = ["#ai"] } = {}) =>
  [
    opening,
    Array(words - 3 - tags.length)
      .fill("word")
      .join(" "),
    tags.join(" "),
  ].join("\n\n") + "\n";

test("a share text is 80 words at most", () => {
  assert.equal(wordsIn(share(80)), 80);
  assert.deepEqual(shareProblems(share(80)), []);
  assert.deepEqual(shareProblems(share(81)), ["81 words, not 80 or fewer"]);
});

test('a share text says "AI" first, and names no URL', () => {
  assert.deepEqual(shareProblems(share(40, { opening: "I wrote it." })), [
    'its first paragraph does not say "AI"',
  ]);
  const linked = share(40).replace("word", A_URL);
  assert.deepEqual(shareProblems(linked), [
    "a URL: LinkedIn attaches the Article",
  ]);
});

test("a share text has 3 hashtags at most, and no em dash", () => {
  const four = ["#ai", "#claudecode", "#agents", "#devops"];
  assert.deepEqual(shareProblems(share(40, { tags: four })), [
    "4 hashtags, not 3 or fewer",
  ]);
  const dash = share(40, { opening: "AI wrote this — mostly." });
  assert.deepEqual(shareProblems(dash), ["an em dash"]);
});

test("an empty share text lists its problem and does not throw", () => {
  assert.deepEqual(shareProblems(""), [
    'its first paragraph does not say "AI"',
  ]);
});

// A PNG's first 33 bytes: the signature, then the whole IHDR chunk (its
// length, type, width, height, 5 more bytes of data and a CRC left at 0).
const pngHead = (width, height) => {
  const head = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(head);
  head.writeUInt32BE(13, 8);
  head.write("IHDR", 12, "latin1");
  head.writeUInt32BE(width, 16);
  head.writeUInt32BE(height, 20);
  return head;
};

test("a PNG's size is read from its header", () => {
  assert.deepEqual(pngSize(pngHead(1920, 1080)), { width: 1920, height: 1080 });
  assert.equal(pngSize(Buffer.from("not a png at all, no header")), null);
  assert.equal(pngSize(Buffer.alloc(0)), null, "an empty file");
  const noHeader = pngHead(1920, 1080);
  noHeader.write("IDAT", 12, "latin1");
  assert.equal(pngSize(noHeader), null, "the first chunk is not IHDR");
  const noSignature = pngHead(1920, 1080);
  noSignature[0] = 0;
  assert.equal(pngSize(noSignature), null, "a wrong signature");
  const cut = pngHead(1920, 1080).subarray(0, 23);
  assert.equal(pngSize(cut), null, "a header cut short");
});

const cover = (width, height, title = "A headline") =>
  titledPng(pngHead(width, height), title);

test("a cover is a 1920 x 1080 PNG", () => {
  assert.deepEqual(coverProblems(cover(1920, 1080), "A headline"), []);
  assert.deepEqual(coverProblems(cover(1200, 627), "A headline"), [
    "1200 x 627, not 1920 x 1080",
  ]);
  assert.deepEqual(coverProblems(cover(1920, 1200), "A headline"), [
    "1920 x 1200, not 1920 x 1080",
  ]);
  assert.deepEqual(coverProblems(Buffer.from("GIF89a"), "A headline"), [
    "not a PNG",
  ]);
});

// The cover keeps the headline it was drawn with, so a new headline with an
// old cover fails (blog#107's review).
test("a cover carries the headline it was drawn with", () => {
  assert.equal(pngTitle(cover(1920, 1080)), "A headline");
  assert.equal(pngTitle(pngHead(1920, 1080)), null, "no title");
  assert.equal(pngTitle(cover(1920, 1080, "ps·db på norsk")), "ps·db på norsk");
  assert.deepEqual(coverProblems(cover(1920, 1080), "A new headline"), [
    'drawn for "A headline", not "A new headline": draw it again',
  ]);
  assert.deepEqual(coverProblems(pngHead(1920, 1080), "A headline"), [
    "no title: draw it with scripts/linkedin-cover.mjs",
  ]);
});

// A real 2 x 2 PNG, made by sharp.
const blankPng = () =>
  sharp({
    create: { width: 2, height: 2, channels: 3, background: "#ffffff" },
  })
    .png()
    .toBuffer();

// The PNG spec: each chunk ends with the CRC of its type and data. sharp
// reads a title with a wrong CRC all the same, so this is checked apart.
// A chunk that runs past the end is named as cut short.
const badCrcs = bytes => {
  const bad = [];
  for (let at = 8; at + 8 <= bytes.length;) {
    const length = bytes.readUInt32BE(at);
    const body = bytes.subarray(at + 4, at + 8 + length);
    const type = body.toString("latin1", 0, 4);
    if (at + 12 + length > bytes.length) return [...bad, `${type} cut short`];
    if (bytes.readUInt32BE(at + 8 + length) !== crc32(body)) bad.push(type);
    at += 12 + length;
  }
  return bad;
};

test("a PNG cut inside a chunk is named, not read past its end", async () => {
  const png = await blankPng();
  assert.deepEqual(badCrcs(png.subarray(0, png.length - 13)), [
    "IDAT cut short",
  ]);
});

test("a PNG decoder reads the title back", async () => {
  const titled = titledPng(await blankPng(), "ps·db på norsk");
  const { comments } = await sharp(titled).metadata();
  assert.deepEqual(comments, [{ keyword: "Title", text: "ps·db på norsk" }]);
});

test("the title chunk's CRC is the CRC of its type and data", async () => {
  const png = await blankPng();
  assert.deepEqual(badCrcs(png), [], "sharp's own chunks");
  assert.deepEqual(badCrcs(titledPng(png, "A headline")), []);
});

test("a title is read from the chunks after IHDR, and a cut file stops it", () => {
  const titled = cover(1920, 1080);
  assert.equal(pngTitle(titled.subarray(0, titled.length - 1)), null);
  const after = Buffer.concat([titled, Buffer.from("trailing bytes")]);
  assert.equal(pngTitle(after), "A headline");
});

// The real drafts. A listed one must exist, so the check can't pass on an
// empty folder.
const DRAFTS = new URL("../docs/linkedin/", import.meta.url);
const POSTS = new URL("../src/content/posts/", import.meta.url);
const REQUIRED = ["building-an-ai-agent-team"];
const ARTICLES = ["building-an-ai-agent-team"];

// Each published post's text, by slug.
const posts = new Map();
for (const path of readdirSync(POSTS, { recursive: true })) {
  if (!/\.mdx?$/.test(path)) continue;
  const text = readFileSync(new URL(path, POSTS), "utf8");
  const slug = publishedSlug(path, text);
  if (slug) posts.set(slug, text);
}

const files = existsSync(DRAFTS) ? readdirSync(DRAFTS) : [];
const articleSlugs = files
  .filter(name => name.endsWith("-article.md"))
  .map(name => name.replace(/-article\.md$/, ""));

test("each LinkedIn draft belongs to a post and keeps the rules", () => {
  assert.ok(existsSync(DRAFTS), "no docs/linkedin/ folder");
  const drafts = files.filter(
    name => name.endsWith(".md") && !name.endsWith("-article.md")
  );
  for (const slug of REQUIRED)
    assert.ok(drafts.includes(`${slug}.md`), `no docs/linkedin/${slug}.md`);
  for (const name of drafts) {
    const slug = name.replace(/\.md$/, "");
    assert.ok(posts.has(slug), `${name}: no post with slug ${slug}`);
    const text = readFileSync(new URL(name, DRAFTS), "utf8");
    // With an Article beside it, the draft is the Article's share text.
    const problems = articleSlugs.includes(slug)
      ? shareProblems(text)
      : linkedinProblems(text, slug);
    assert.deepEqual(problems, [], name);
  }
});

test("each LinkedIn Article keeps the rules, with its cover and share text", () => {
  for (const slug of ARTICLES)
    assert.ok(
      articleSlugs.includes(slug),
      `no docs/linkedin/${slug}-article.md`
    );
  for (const slug of articleSlugs) {
    assert.ok(posts.has(slug), `${slug}-article.md: no post with slug ${slug}`);
    const text = readFileSync(new URL(`${slug}-article.md`, DRAFTS), "utf8");
    assert.deepEqual(
      articleProblems(text, postText(posts.get(slug))),
      [],
      `${slug}-article.md`
    );
    assert.ok(files.includes(`${slug}.md`), `no share text ${slug}.md`);
    const image = `${slug}-cover.png`;
    assert.ok(files.includes(image), `no docs/linkedin/${image}`);
    const headline = text.split("\n")[0].replace(/^# /, "");
    const bytes = readFileSync(new URL(image, DRAFTS));
    assert.deepEqual(coverProblems(bytes, headline), [], image);
    assert.deepEqual(badCrcs(bytes), [], `${image}: chunks with a bad CRC`);
    // A write cut short leaves no IEND chunk at the end.
    assert.equal(
      bytes.toString("latin1", bytes.length - 8, bytes.length - 4),
      "IEND",
      `${image}: no IEND at the end`
    );
  }
});
