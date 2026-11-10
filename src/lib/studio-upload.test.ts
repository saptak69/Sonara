import { test } from "node:test";
import assert from "node:assert/strict";
import { checkUpload } from "./studio-upload.ts";

test("accepts supported audio and artwork with the right content type", () => {
  assert.deepEqual(checkUpload("audio", "My Song.MP3", 5_000_000), { ok: true, ext: "mp3", mimeType: "audio/mpeg" });
  assert.deepEqual(checkUpload("artwork", "cover.jpeg", 200_000), { ok: true, ext: "jpeg", mimeType: "image/jpeg" });
});

test("rejects wrong types, empty files and oversize files", () => {
  assert.equal(checkUpload("audio", "cover.png", 1000).ok, false);
  assert.equal(checkUpload("artwork", "song.exe", 1000).ok, false);
  assert.equal(checkUpload("audio", "song.mp3", 0).ok, false);
  assert.equal(checkUpload("audio", "song.mp3", 61 * 1024 * 1024).ok, false);
  assert.equal(checkUpload("artwork", "cover.png", 11 * 1024 * 1024).ok, false);
});
