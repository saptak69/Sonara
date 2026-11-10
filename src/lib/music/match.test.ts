import { test } from "node:test";
import assert from "node:assert/strict";
import type { Track } from "../types";
import { baseTitle, confidence, identityKey, mergeTracks, norm, rankTracks, splitArtists, versionOf, MIN_CONFIDENCE } from "./match.ts";
import { createCircuitBreaker, withTimeout } from "./resilience.ts";

function t(over: Partial<Track>): Track {
  return { id: "x", title: "", artist: "", artwork: null, artworkLg: null, duration: 200, streamUrl: "https://a/b.mp3", kind: "track", ...over };
}

test("normalises accents, punctuation and keeps non-Latin scripts", () => {
  assert.equal(norm("Beyoncé — Halo!"), "beyonce halo");
  assert.equal(norm("Tum Hi Ho"), "tum hi ho");
  assert.equal(norm("তোমার জন্য"), "তোমার জন্য");
  assert.equal(norm("Simon & Garfunkel"), "simon and garfunkel");
});

test("detects versions and strips decorations", () => {
  assert.equal(versionOf("Levitating (Remix)"), "remix");
  assert.equal(versionOf("Hotel California - Live"), "live");
  assert.equal(versionOf("Live Forever"), "orig");
  assert.equal(versionOf("Song (Slowed + Reverb)"), "slowed");
  assert.equal(versionOf("Bohemian Rhapsody - Remastered 2011"), "orig");
  assert.equal(baseTitle('Tum Hi Ho (From "Aashiqui 2")'), "tum hi ho");
  assert.equal(baseTitle("Bohemian Rhapsody - Remastered 2011"), "bohemian rhapsody");
});

test("splits artist credits joined in different ways", () => {
  assert.deepEqual(splitArtists("Erykah Badu & The Alchemist"), ["erykah badu", "the alchemist"]);
  assert.deepEqual(splitArtists("Arijit Singh, Shreya Ghoshal"), ["arijit singh", "shreya ghoshal"]);
  assert.deepEqual(splitArtists("Calvin Harris feat. Dua Lipa"), ["calvin harris", "dua lipa"]);
});

test("confidence gate: both artist and title must agree", () => {
  const original = t({ title: "Yesterday", artist: "The Beatles", duration: 125 });
  assert.ok(confidence(original, t({ title: "Yesterday - Remastered 2009", artist: "The Beatles", duration: 126 })) >= 0.95);
  assert.ok(confidence(original, t({ title: "Yesterday", artist: "Boyz II Men" })) < MIN_CONFIDENCE);
  assert.ok(confidence(original, t({ title: "Yesterday (Live)", artist: "The Beatles" })) < MIN_CONFIDENCE);
  assert.equal(confidence(t({ isrc: "GBAYE0601477" }), t({ isrc: "gbaye0601477", title: "other" })), 1);
});

test("identity keys collapse the same recording and keep versions apart", () => {
  const a = identityKey(t({ title: "Halo", artist: "Beyoncé" }));
  assert.equal(a, identityKey(t({ title: "Halo", artist: "Beyonce, Someone" })));
  assert.notEqual(a, identityKey(t({ title: "Halo (Remix)", artist: "Beyoncé" })));
});

test("merge keeps one entry per recording and prefers full streams", () => {
  const preview = t({ id: "itunes_1", title: "Halo", artist: "Beyoncé", preview: true, isrc: "USSM10804556" });
  const full = t({ id: "saavn_1", title: "Halo", artist: "Beyonce" });
  const merged = mergeTracks([[preview], [full, t({ id: "saavn_2", title: "Halo (Live)", artist: "Beyoncé" })]]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, "saavn_1");
  assert.equal(merged[0].isrc, "USSM10804556");
});

test("ranking puts the original above remixes and previews", () => {
  const ranked = rankTracks(
    [
      t({ id: "remix", title: "Blinding Lights (Remix)", artist: "The Weeknd" }),
      t({ id: "preview", title: "Blinding Lights", artist: "The Weeknd", preview: true }),
      t({ id: "other", title: "Lights", artist: "Ellie Goulding" }),
      t({ id: "orig", title: "Blinding Lights", artist: "The Weeknd" }),
    ],
    "blinding lights the weeknd",
  );
  assert.equal(ranked[0].id, "orig");
  assert.equal(ranked.at(-1)?.id, "other");
  assert.equal(rankTracks([t({ id: "r", title: "Song (Remix)", artist: "A" }), t({ id: "o", title: "Song", artist: "A" })], "song remix")[0].id, "r");
  // An artist named like the song doesn't lift a preview over a full stream.
  const lofi = rankTracks(
    [
      t({ id: "preview", title: "Lofi Chill", artist: "Lofi Blissful Music, LoFi Chill", preview: true }),
      t({ id: "full", title: "LoFi Chill", artist: "Lofi Sleep Chill & Study" }),
    ],
    "lofi chill",
  );
  assert.equal(lofi[0].id, "full");
});

test("circuit breaker opens after repeated failures and closes after cooldown", () => {
  const breaker = createCircuitBreaker({ threshold: 2, cooldownMs: 1000 });
  breaker.failure("p", 0);
  assert.equal(breaker.isOpen("p", 1), false);
  breaker.failure("p", 1);
  assert.equal(breaker.isOpen("p", 2), true);
  assert.equal(breaker.isOpen("p", 1002), false);
});

test("timeouts reject and abort the call", async () => {
  let aborted = false;
  await assert.rejects(
    withTimeout("slow", 20, (signal) => new Promise((resolve) => {
      signal.addEventListener("abort", () => { aborted = true; });
      setTimeout(resolve, 200);
    })),
    /no answer/,
  );
  assert.equal(aborted, true);
});
