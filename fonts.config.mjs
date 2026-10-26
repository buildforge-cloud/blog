import { fontProviders } from "astro/config";

// The font files live in src/assets/fonts/ (blog#64). They are the files
// Google Fonts served the site until 2026-10-26, so the pages look the same.
// Astro's Google provider fetched them on every build, and twice that fetch
// failed and stopped the deploy. The local provider reads them from disk.
//
// Each face is a .woff for browsers and a .ttf after it, as before: satori
// (the OG image) reads the .ttf (see src/utils/getFontPathByWeight.ts).
const faces = (slug, weights, styles) =>
  styles.flatMap(style =>
    weights.map(weight => ({
      weight,
      style,
      src: [
        `./src/assets/fonts/${slug}-${weight}-${style}.woff`,
        `./src/assets/fonts/${slug}-${weight}-${style}.ttf`,
      ],
    }))
  );

// Type stack copied from buildforge.cloud (see profile-homepage's
// assets/css/variables.css): Space Grotesk for headings, IBM Plex Sans for
// body copy, IBM Plex Mono for the small uppercase labels. The blog used to
// ship a single mono face for everything; the studio site is the parent
// brand, so the blog follows it rather than the other way round.
export const fonts = [
  {
    name: "Space Grotesk",
    cssVariable: "--font-space-grotesk",
    provider: fontProviders.local(),
    fallbacks: ["Helvetica Neue", "Arial", "sans-serif"],
    options: {
      variants: faces("space-grotesk", [500, 600, 700], ["normal"]),
    },
  },
  {
    name: "IBM Plex Sans",
    cssVariable: "--font-ibm-plex-sans",
    provider: fontProviders.local(),
    fallbacks: ["system-ui", "sans-serif"],
    // Italic first, in Google's order: Astro sizes the fallback font (the
    // size-adjust while the real font loads) from the first face.
    options: {
      variants: faces(
        "ibm-plex-sans",
        [400, 500, 600, 700],
        ["italic", "normal"]
      ),
    },
  },
  {
    name: "IBM Plex Mono",
    cssVariable: "--font-ibm-plex-mono",
    provider: fontProviders.local(),
    fallbacks: ["monospace"],
    options: {
      variants: faces("ibm-plex-mono", [400, 500, 600], ["normal"]),
    },
  },
];
