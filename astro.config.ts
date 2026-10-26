import { defineConfig, envField, svgoOptimizer } from "astro/config";
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
import { fonts } from "./fonts.config.mjs";

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
    build: {
      // nginx.conf's CSP runs no inline script (blog#21), and Astro inlines
      // a bundled `<script>` under 4 KB into the page by itself. So a script
      // is always its own file in /_astro/. Every other asset (a small
      // stylesheet, an image) keeps Vite's default rule.
      assetsInlineLimit: filePath =>
        filePath.endsWith(".js") ? false : undefined,
    },
  },
  fonts,
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
