// A LinkedIn cover's headline, kept in the PNG itself (blog#107), so
// tests/linkedin.test.mjs can tell a cover drawn for an older headline.
// scripts/linkedin-cover.mjs writes it; tests/linkedin.mjs reads it.

import { crc32 } from "node:zlib";

// A PNG's chunks after the signature, as { type, data }, until the bytes end
// or a chunk runs past them.
function* chunksOf(bytes) {
  for (let at = 8; at + 8 <= bytes.length; ) {
    const length = bytes.readUInt32BE(at);
    const end = at + 12 + length;
    if (end > bytes.length) return;
    const type = bytes.toString("latin1", at + 4, at + 8);
    yield { type, data: bytes.subarray(at + 8, at + 8 + length) };
    at = end;
  }
}

// The start of an iTXt chunk named "Title": the keyword and its 0, no
// compression (0, 0), then an empty language tag and translated keyword,
// each ended by a 0. The UTF-8 text follows.
const TITLE = Buffer.from("Title\0\0\0\0\0", "latin1");

// The headline a cover was drawn with, or null.
export function pngTitle(bytes) {
  for (const { type, data } of chunksOf(bytes))
    if (type === "iTXt" && data.subarray(0, TITLE.length).equals(TITLE))
      return data.subarray(TITLE.length).toString("utf8");
  return null;
}

// The PNG with an iTXt "Title" chunk just after its IHDR chunk, which ends
// at byte 33.
export function titledPng(png, title) {
  const data = Buffer.concat([TITLE, Buffer.from(title, "utf8")]);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write("iTXt", 4, "latin1");
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    crc32(chunk.subarray(4, 8 + data.length)),
    8 + data.length
  );
  return Buffer.concat([png.subarray(0, 33), chunk, png.subarray(33)]);
}
