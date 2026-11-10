import { test } from "node:test";
import assert from "node:assert/strict";
import { artworkAt } from "./artwork.ts";

test("picks the smallest JioSaavn size that is big enough", () => {
  const url = "https://c.saavncdn.com/111/Espresso-English-2024-500x500.jpg";
  assert.equal(artworkAt(url, 112), "https://c.saavncdn.com/111/Espresso-English-2024-150x150.jpg");
  assert.equal(artworkAt(url, 40), "https://c.saavncdn.com/111/Espresso-English-2024-50x50.jpg");
  assert.equal(artworkAt(url, 360), url);
  assert.equal(artworkAt(url, 2000), url);
});

test("resizes iTunes and Audius artwork", () => {
  assert.equal(
    artworkAt("https://is1-ssl.mzstatic.com/image/thumb/Music/abc/500x500bb.jpg", 120),
    "https://is1-ssl.mzstatic.com/image/thumb/Music/abc/150x150bb.jpg",
  );
  assert.equal(
    artworkAt("https://audius-creator-1.example.audius.co/content/x/1000x1000.jpg", 300),
    "https://audius-creator-1.example.audius.co/content/x/480x480.jpg",
  );
});

test("leaves other sources and empty values alone", () => {
  assert.equal(artworkAt("https://images.example.com/cover-500x500.jpg", 100), "https://images.example.com/cover-500x500.jpg");
  assert.equal(artworkAt(null, 100), null);
  assert.equal(artworkAt(undefined, 100), undefined);
  assert.equal(artworkAt("/uploads/artwork/a.jpg", 100), "/uploads/artwork/a.jpg");
});
