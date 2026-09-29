// WCAG 2.x contrast, measured the way a browser paints.
//
// A colour is [r, g, b, a]: channels 0 to 255, alpha 0 to 1.

export const hex = s => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
  1,
];

// Relative luminance, WCAG 2.x. The sRGB threshold is 0.04045; the older
// 0.03928 in WCAG 2.0 gives the same result for every 8-bit channel value.
const luminance = ([r, g, b]) => {
  const lin = c => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// AA's floor for a run of text. "Large" is 18pt, or 14pt bold, and a CSS
// point is 4/3 of a CSS pixel.
export const floorFor = (px, weight) =>
  px >= 24 || (weight >= 700 && px >= (14 * 4) / 3) ? 3 : 4.5;

// Source-over: `top` painted on `under`.
const over = ([r, g, b, a], [R, G, B, A]) => {
  const out = a + A * (1 - a);
  if (out === 0) return [0, 0, 0, 0];
  const mix = (c, C) => (c * a + C * A * (1 - a)) / out;
  return [mix(r, R), mix(g, G), mix(b, B), out];
};

const fade = ([r, g, b, a], opacity) => [r, g, b, a * opacity];

const canvas = [255, 255, 255, 1];

// One element as a single picture on a clear backdrop: its own background,
// with its child's picture (or, at the bottom, the text) on top. `opacity`
// fades a whole picture at once, which is how the browser applies it.
const flatten = ([{ background }, ...inner], text) => {
  const top = inner.length
    ? fade(flatten(inner, text), inner[0].opacity)
    : text;
  return top ? over(top, background) : background;
};

// What is painted under the text, and the text itself, as the eye gets them.
// `layers` runs from <html> down to the element that holds the text, each
// { background, opacity }.
export const paint = (layers, text) => {
  const seen = t =>
    over(fade(flatten(layers, t), layers[0].opacity), canvas).slice(0, 3);
  return { ground: seen(null), text: seen(text) };
};

// Sorts one page's failures against the recorded ones. A record covers its own
// colour pair on its own pages only, and a record whose failure is no longer
// on one of its pages is stale: the fix landed, so the record must go too.
export const triage = (path, failures, known) => {
  const here = known.filter(k => k.on.test(path));
  const same = (k, f) => k.text === f.text && k.ground === f.ground;
  return {
    unknown: failures.filter(f => !here.some(k => same(k, f))).map(f => f.line),
    stale: here.filter(k => !failures.some(f => same(k, f))).map(k => k.what),
  };
};
