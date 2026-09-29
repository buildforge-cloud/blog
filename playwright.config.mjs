import { defineConfig, devices } from "@playwright/test";

// Playwright runs the browser checks in tests/*.spec.mjs against the
// production build, so build first: `npm run build && npm run test:pages`.
// `npm test` runs the Node checks in tests/*.test.mjs and needs no browser.
//
// 4177 is this repo's preview port. On the shared host every project's preview
// port is its dev port minus 1000 (dev is 5177), so two projects' checks never
// race for one port. The server is never reused: a check must not measure a
// server it did not start, which may be another project's.
const port = 4177;

export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.mjs",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: `astro preview --host 127.0.0.1 --port ${port}`,
    // When Astro 7 sees an AI agent in the environment, `astro preview`
    // re-launches itself as a detached background server and exits. Playwright
    // then reports that its server "exited early", and the detached copy keeps
    // the port after the run. The detached copy is told apart by this
    // variable, so setting it keeps the server in the foreground, where
    // Playwright can stop it. Without an agent (CI) it changes nothing.
    env: { ASTRO_PREVIEW_BACKGROUND: "1" },
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
  },
});
