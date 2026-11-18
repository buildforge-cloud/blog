// What a LinkedIn draft in docs/linkedin/ must be (blog#104).
// tests/linkedin.test.mjs checks it and runs it on each draft. Nothing posts a
// draft: Stefan edits it and posts it himself.
//
// A draft is the post's text as it is pasted: one paragraph per line, and
// its file is named after the post's slug.

// A word is a run of non-space characters with a letter or a digit in it, so
// the URL and each hashtag count as one, and a lone "·" or "-" does not.
export const wordsIn = text =>
  text.split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length;

export const postUrl = slug => `https://blog.buildforge.cloud/posts/${slug}/`;

// Each rule the draft breaks, in plain words; none is [].
export function linkedinProblems(text, slug) {
  const problems = [];
  const lines = text.split("\n").filter(line => line.trim());
  const words = wordsIn(text);
  if (words < 120 || words > 200)
    problems.push(`${words} words, not 120 to 200`);
  if (!/\bAI\b/.test(lines[0]))
    problems.push('its first paragraph does not say "AI"');
  if (lines.at(-1)?.trim() !== postUrl(slug))
    problems.push(`its last line is not ${postUrl(slug)}`);
  // A hashtag starts a word: blog#104 and a URL's #anchor are not one.
  const tags = text.match(/(?<![\p{L}\p{N}/])#[\p{L}\p{N}_]+/gu) ?? [];
  if (tags.length > 3) problems.push(`${tags.length} hashtags, not 3 or fewer`);
  if (text.includes("—")) problems.push("an em dash");
  return problems;
}
