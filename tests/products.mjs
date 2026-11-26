// The products STRATEGY.md's Goal names, each with the link text and the
// live address a post, the About page and the blog-post skill give it, and
// the names and hosts a product has left behind. Read by
// `tests/posts.test.mjs` and `tests/blog-post-skill.test.mjs`.

export const PRODUCTS = [
  ["ps·db", "https://ps-db.cloud"],
  ["ISO 27001 Buddy", "https://iso.buildforge.no/roadmap"],
  ["Skredda", "https://skredda.no"],
  ["Vedlikeholdsloggen", "https://vedlikeholdsloggen.buildforge.no/"],
];

// Each one is a plain string, matched in any case. A host stays here after
// it 301s: a redirect passes search signal only once Google crawls the old
// URL again (blog#1).
export const RETIRED = [
  // ps·db moved to ps-db.cloud on 2026-07-23 (blog#1).
  "ps-db.buildforge.cloud",
  // The ISO app's name until Stefan's decision 4458 (iso-pathfinder-buddy#70).
  "ISO Pathfinder Buddy",
  // Its copy on Lovable, left at the old name "ISO 27001 Guide" when the
  // app moved to iso.buildforge.no.
  "iso-pathfinder-buddy.lovable.app",
];

// The retired strings that `text` holds, matched in any case. Markdown wraps
// its lines, so a name split over two lines counts too ("ISO\nPathfinder
// Buddy" was how STRATEGY.md held it).
export const retiredIn = text => {
  const flat = text.replace(/\s+/g, " ").toLowerCase();
  return RETIRED.filter(old => flat.includes(old.toLowerCase()));
};
