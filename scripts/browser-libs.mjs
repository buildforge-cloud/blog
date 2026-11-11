// blog#85. Does this machine have every library the cached Playwright browser
// needs? CI runs this after it restores or downloads the browser, and runs
// `playwright install-deps` (apt-get) only when the answer is not yes.
//
//   node scripts/browser-libs.mjs ~/.cache/ms-playwright
//
// Exit 0: every browser binary was checked and no library is missing.
// Exit 1: a library is missing, or nothing could be checked (unknown).

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Chromium's executables (headless shell included, at the old and the new
// layout) and the shared objects shipped beside them.
const BINARY = /^(chrome|chrome-headless-shell|headless_shell)$|\.so(\.\d+)*$/;

export const browserBinaries = root => {
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true, recursive: true });
  } catch {
    return [];
  }
  return entries
    .filter(e => e.isFile() && BINARY.test(e.name))
    .map(e => join(e.parentPath, e.name))
    .filter(file => /[/\\]chromium[^/\\]*-\d+[/\\]/.test(file));
};

// `ldd` returns its output, or null when it could not run.
export const checkBrowserLibs = (files, ldd) => {
  const missing = new Set();
  let checked = 0;
  for (const file of files) {
    const out = ldd(file);
    if (out === null) continue;
    checked += 1;
    for (const [, lib] of out.matchAll(/^\s*(\S+) => not found/gm)) {
      missing.add(lib);
    }
  }
  return { missing: [...missing], checked };
};

const runLdd = file => {
  try {
    return execFileSync("ldd", [file], { encoding: "utf8", timeout: 10_000 });
  } catch {
    return null;
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv[2];
  const files = browserBinaries(root);
  const { missing, checked } = checkBrowserLibs(files, runLdd);
  const say = line => process.stdout.write(`${line}\n`);
  if (checked === 0) {
    say(`No Chromium binary could be checked under ${root}.`);
    process.exit(1);
  }
  if (missing.length > 0) {
    say(`Missing libraries: ${missing.join(" ")}`);
    process.exit(1);
  }
  say(`${checked} of ${files.length} browser binaries checked: no library missing.`);
}
