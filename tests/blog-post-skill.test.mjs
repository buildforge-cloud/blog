// The blog-post skill's identity text follows decision 1245 (blog#53). Run
// with `npm test`.
//
// The skill is what every new post is written from, so an old line that says
// "not traffic" or "not selling" quietly undoes the decision. The kept rules
// (honest struggle, not a tutorial, no numbered series) must stay.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const skill = readFileSync(
  new URL("../.claude/skills/blog-post/SKILL.md", import.meta.url),
  "utf8"
);
const claude = readFileSync(new URL("../CLAUDE.md", import.meta.url), "utf8");

// The text from one "## " heading up to the next one.
const section = (text, heading) => {
  const start = text.indexOf(`\n## ${heading}`);
  assert.notEqual(start, -1, `no "## ${heading}" section`);
  const end = text.indexOf("\n## ", start + 1);
  return text.slice(start, end === -1 ? undefined : end);
};

const identity = section(skill, "The blog's identity");

// The Gemini prompt is the fenced block under "### 2.".
const geminiPrompt = () => {
  const step = skill.indexOf("### 2. Produce the Gemini research prompt");
  assert.notEqual(step, -1, "no Gemini prompt step");
  const open = skill.indexOf("```", step);
  return skill.slice(open, skill.indexOf("```", open + 3));
};

test("the old 'not traffic' and 'not selling' lines are gone", () => {
  for (const old of [/not traffic/i, /not selling/i, /nobody specific/i])
    assert.doesNotMatch(skill, old, `the skill still says ${old}`);
});

test("the identity says the main job is to get the products seen", () => {
  assert.match(identity, /get (?:BuildForge's |the )?products seen/i);
  assert.match(identity, /decision 1245/);
});

test("a product is linked where a post is about it, with no pitch", () => {
  assert.match(identity, /no sales pitch/i);
  assert.match(identity, /no calls? to action/i);
  assert.match(identity, /linked/i);
});

test("the kept rules are still in the identity", () => {
  assert.match(identity, /Not a tutorial/);
  assert.match(identity, /transparent about struggles/i);
  assert.match(identity, /numbered parts/i);
  assert.match(identity, /First person/i);
});

test("the identity block has no em dash", () => {
  assert.ok(!identity.includes("—"), "an em dash in the identity block");
});

test("the Gemini prompt agrees with the identity", () => {
  const prompt = geminiPrompt();
  assert.doesNotMatch(prompt, /NOT selling anything/);
  assert.doesNotMatch(prompt, /No target audience/);
  assert.match(prompt, /products seen/i);
  assert.ok(!prompt.includes("—"), "an em dash in the Gemini prompt");
});

test("CLAUDE.md no longer waits for Stefan's pick", () => {
  const purpose = claude.slice(claude.indexOf("**What a post is for**"));
  const paragraph = purpose.slice(0, purpose.indexOf("\n\n"));
  assert.doesNotMatch(paragraph, /until Stefan picks/);
  assert.match(paragraph, /blog-post/);
});
