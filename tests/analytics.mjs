// What counts as analytics in a built file, for tests/analytics.spec.mjs
// (blog#17). tests/analytics.test.mjs checks it without a build.

// PostHog by name, or a PostHog project key.
export const tracker = /posthog|phc_/i;

// The parts of a built page that the browser runs or fetches: each <script>,
// each src, and each <link>. JSON-LD is left out, because it is data and holds
// a post's own title. So is the prose, so a post may name PostHog and link to
// it. Prose shown as code is escaped (&lt;script), so it never looks like a tag.
function code(html) {
  const parts = [];
  const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi);
  for (const [, attrs, body] of scripts) {
    if (!/application\/ld\+json/i.test(attrs)) parts.push(attrs + body);
  }
  for (const [tag, name] of html.matchAll(/<([a-z][\w-]*)\b[^>]*>/gi)) {
    if (name.toLowerCase() === "link") parts.push(tag);
    for (const [, src] of tag.matchAll(/\ssrc="([^"]*)"/gi)) parts.push(src);
  }
  return parts;
}

// Each tracker in a built file, with a little of the text around it. A .js
// file is code from end to end.
export function trackersIn(path, text) {
  const parts = path.endsWith(".js") ? [text] : code(text);
  return parts.flatMap(part => {
    const at = part.search(tracker);
    return at < 0 ? [] : [part.slice(Math.max(0, at - 30), at + 50)];
  });
}
