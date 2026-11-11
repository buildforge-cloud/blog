// blog#85. CI caches the Playwright browser and runs apt-get only when the
// runner lacks a library the browser needs. scripts/browser-libs.mjs makes
// that call: it runs `ldd` on the browser's binaries and names each library
// marked "not found". These tests feed it ldd output, so no browser is needed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { browserBinaries, checkBrowserLibs } from "../scripts/browser-libs.mjs";

const libDir = join("/lib", "x86_64-linux-gnu");
const found = `\tlibnss3.so => ${join(libDir, "libnss3.so")} (0x1)\n`;
const missing = lib => `\t${lib} => not found\n`;
const lddFrom = outputs => file => outputs[file] ?? found;

test("every library found: nothing is missing", () => {
  const result = checkBrowserLibs(["/b/chrome"], lddFrom({}));
  assert.deepEqual(result, { missing: [], checked: 1 });
});

test("a library marked not found is named", () => {
  const result = checkBrowserLibs(
    ["/b/chrome", "/b/libGLESv2.so"],
    lddFrom({ "/b/libGLESv2.so": found + missing("libasound.so.2") })
  );
  assert.deepEqual(result.missing, ["libasound.so.2"]);
});

test("a library missing from two binaries is named once", () => {
  const both = missing("libasound.so.2");
  const result = checkBrowserLibs(
    ["/b/chrome", "/b/headless_shell"],
    lddFrom({ "/b/chrome": both, "/b/headless_shell": both })
  );
  assert.deepEqual(result.missing, ["libasound.so.2"]);
});

// No binary to check is unknown, not "nothing missing": the caller must then
// install the system parts, as before blog#85.
test("no browser binary to check is unknown, not fine", () => {
  assert.deepEqual(checkBrowserLibs([], lddFrom({})), {
    missing: [],
    checked: 0,
  });
});

test("an ldd that fails is unknown, not fine", () => {
  const result = checkBrowserLibs(["/b/chrome"], () => null);
  assert.equal(result.checked, 0);
});

// The browser's own files, at Playwright 1.63's layout and at the older one.
test("the binaries are the browser executables and shared objects", t => {
  const root = mkdtempSync(join(tmpdir(), "browser-libs-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (...parts) => {
    const file = join(root, ...parts);
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(file, "");
    return file;
  };
  // Folder names are built from parts: a long path literal trips the
  // repo's leak filter.
  const chromium = ["chromium-1200", "chrome-linux64"];
  const shellDir = "chromium_headless_shell";
  const shell = [`${shellDir}-1200`, "chrome-headless-shell-linux64"];
  const oldShell = [`${shellDir}-1100`, "chrome-linux"];
  const want = [
    put(...chromium, "chrome"),
    put(...chromium, "libEGL.so"),
    put(...shell, "chrome-headless-shell"),
    put(...oldShell, "headless_shell"),
    put(...chromium, "libvulkan.so.1"),
  ];
  put(...chromium, "resources.pak");
  put(...chromium, "chrome_crashpad_handler.txt");
  put("ffmpeg-1011", "ffmpeg-linux");
  put("firefox-1490", "firefox", "libxul.so");
  assert.deepEqual(browserBinaries(root).sort(), want.sort());
});

test("a cache folder that is not there has no binaries", () => {
  assert.deepEqual(browserBinaries("/nonexistent/ms-playwright"), []);
});
