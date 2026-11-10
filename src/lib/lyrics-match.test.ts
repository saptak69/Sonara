import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanTitleForLyrics, pickLyricsEntry, primaryArtist } from "./lyrics-match.ts";

const radio = { trackName: "Song", duration: 200, syncedLyrics: "[00:01.00]radio", plainLyrics: "radio" };
const extended = { trackName: "Song", duration: 320, syncedLyrics: "[00:01.00]extended", plainLyrics: "extended" };
const plainOnly = { trackName: "Song", duration: 201, plainLyrics: "plain" };

test("prefers the synced entry whose length matches", () => {
  assert.equal(pickLyricsEntry([extended, radio], 321), extended);
  assert.equal(pickLyricsEntry([extended, plainOnly, radio], 200.5), radio);
});

test("drops synced lines when no version has the right length", () => {
  const picked = pickLyricsEntry([radio, extended], 260);
  assert.equal(picked?.syncedLyrics, null);
  assert.equal(picked?.plainLyrics, "radio");
});

test("without a duration, any synced entry wins", () => {
  assert.equal(pickLyricsEntry([plainOnly, extended]), extended);
  assert.equal(pickLyricsEntry([]), null);
});

test("cleans titles and artists for lookup", () => {
  assert.equal(cleanTitleForLyrics('Tum Hi Ho (From "Aashiqui 2")'), "Tum Hi Ho");
  assert.equal(cleanTitleForLyrics("Song (feat. Someone)"), "Song");
  assert.equal(cleanTitleForLyrics("Bohemian Rhapsody - Remastered 2011"), "Bohemian Rhapsody");
  assert.equal(primaryArtist("Arijit Singh, Shreya Ghoshal"), "Arijit Singh");
  assert.equal(primaryArtist("Erykah Badu & The Alchemist"), "Erykah Badu");
});
