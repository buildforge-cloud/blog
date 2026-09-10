import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";

// Astro's own defineConfig doesn't take a Vite-style (command) => config
// callback, so dev-vs-build is detected the way Astro's docs recommend:
// checking the CLI command directly rather than relying on NODE_ENV.
// Port 5177 is this project's assigned dev port — see the dev port table
// in the root CLAUDE.md. See min-okonomi/vite.config.ts and
// ps-db/frontend/vite.config.ts for the /absproxy/ pattern this mirrors.
const isDev = process.argv.slice(2).includes("dev");

export default defineConfig({
  site: config.site.url,
  base: isDev ? "/absproxy/5177/" : "/",
  server: {
    port: 5177,
    host: true,
    allowedHosts: ["dev.buildforge.cloud"],
  },
  integrations: [
    mdx(),
    sitemap({
      filter: page =>
        config.features?.showArchives !== false || !page.endsWith("/archives/"),
    }),
  ],
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      // Single light theme, deliberately. The site is paper-only (see
      // src/styles/theme.css) so the dual light/dark `themes` + `defaultColor:
      // false` machinery — which emits --shiki-light/--shiki-dark CSS vars for
      // a runtime swap — has nothing to swap between. A single `theme` makes
      // Shiki emit plain inline colours instead, so typography.css styles the
      // block's frame and lets Shiki own the syntax colours.
      theme: "min-light",
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  // Type stack copied from buildforge.cloud (see profile-homepage's
  // assets/css/variables.css): Space Grotesk for headings, IBM Plex Sans for
  // body copy, IBM Plex Mono for the small uppercase labels. The blog used to
  // ship a single mono face for everything; the studio site is the parent
  // brand, so the blog follows it rather than the other way round.
  fonts: [
    {
      name: "Space Grotesk",
      cssVariable: "--font-space-grotesk",
      provider: fontProviders.google(),
      fallbacks: ["Helvetica Neue", "Arial", "sans-serif"],
      weights: [500, 600, 700],
      styles: ["normal"],
      formats: ["woff", "ttf"],
    },
    {
      name: "IBM Plex Sans",
      cssVariable: "--font-ibm-plex-sans",
      provider: fontProviders.google(),
      fallbacks: ["system-ui", "sans-serif"],
      weights: [400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff", "ttf"],
    },
    {
      name: "IBM Plex Mono",
      cssVariable: "--font-ibm-plex-mono",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [400, 500, 600],
      styles: ["normal"],
      formats: ["woff", "ttf"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
