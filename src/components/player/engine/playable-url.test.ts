import { test } from "node:test";
import assert from "node:assert/strict";
import { resolvePlayableUrl } from "./playable-url.ts";

const song = (streamUrl: string, kind: "track" | "radio" = "track") => ({ streamUrl, kind });

test("plays CORS-friendly hosts directly", () => {
  for (const url of [
    "https://aac.saavncdn.com/1/a_320.mp4",
    "https://cf-media.sndcdn.com/x.mp3",
    "https://archive.org/download/a/b.mp3",
    "https://abc.public.blob.vercel-storage.com/audio/x.mp3",
    "https://api.audius.co/v1/tracks/abc/stream?app_name=sonara",
  ]) {
    assert.equal(resolvePlayableUrl(song(url)), url);
  }
});

test("sends other hosts through the proxy, encoded", () => {
  const url = "https://audio-ssl.itunes.apple.com/clip.m4a?x=1&y=2";
  assert.equal(resolvePlayableUrl(song(url)), `/api/stream?url=${encodeURIComponent(url)}`);
});

test("leaves live radio, playlists, local and already proxied sources alone", () => {
  for (const url of ["http://radio.example.com/live", "https://x.test/a.m3u8", "blob:abc", "data:audio/mp3;base64,AA", "/api/stream?url=x", "/uploads/audio/a.mp3"]) {
    assert.equal(resolvePlayableUrl(song(url, url.includes("radio") ? "radio" : "track")), url);
  }
});

test("returns an empty string without a stream", () => {
  assert.equal(resolvePlayableUrl(null), "");
  assert.equal(resolvePlayableUrl(song("")), "");
});
