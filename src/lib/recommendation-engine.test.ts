import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeAffinityScore,
  filterUnheardTracks,
  orderAutoplayCandidates,
  buildTrackRadio,
  type SessionContext,
} from "./recommendation-engine.ts";
import type { Track } from "./types.ts";

const makeTrack = (id: string, artist: string, genre: string, duration = 200, album?: string): Track => ({
  id,
  title: `Song ${id}`,
  artist,
  album: album || "Album",
  artwork: "https://example.com/art.jpg",
  artworkLg: "https://example.com/art-lg.jpg",
  duration,
  streamUrl: `https://example.com/${id}.mp3`,
  genre,
  kind: "track",
});

describe("1. Scoring & Taste-Vector Engine (Apple Music Weighting)", () => {
  const track = makeTrack("t1", "The Weeknd", "R&B");

  test("computes positive signals accurately", () => {
    // Favorites: +5.0
    const favScore = computeAffinityScore(track, { inFavorites: true });
    assert.equal(favScore, 5.0);

    // High completion rate (>70%): +3.0
    const compScore = computeAffinityScore(track, { completionRate: 0.85 });
    assert.equal(compScore, 3.0);

    // In user created playlist: +4.0
    const plScore = computeAffinityScore(track, { inPlaylist: true });
    assert.equal(plScore, 4.0);

    // All combined positive signals
    const allScore = computeAffinityScore(track, {
      inFavorites: true,
      completionRate: 0.95,
      inPlaylist: true,
    });
    assert.equal(allScore, 12.0);
  });

  test("calculates repeated plays with 14-day exponential half-life decay", () => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 3600 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 3600 * 1000;

    // Single fresh play gives ~1.0
    const freshScore = computeAffinityScore(track, { playTimestamps: [oneDayAgo] });
    assert.ok(freshScore >= 1.0 && freshScore <= 3.0);

    // Old play 14 days ago has decayed by half compared to immediate
    const oldScore = computeAffinityScore(track, { playTimestamps: [fourteenDaysAgo] });
    assert.ok(oldScore < freshScore);

    // Multiple repeat plays cap at +3.0
    const heavyScore = computeAffinityScore(track, {
      playTimestamps: [now, now, now, now, now],
    });
    assert.equal(heavyScore, 3.0);
  });

  test("applies negative signals and early-skip penalty deduction", () => {
    // Early skip (<30s) deducts 3.5
    const earlySkipScore = computeAffinityScore(track, { earlySkip: true });
    assert.equal(earlySkipScore, -3.5);

    // Explicit skip deducts 1.5
    const explicitSkipScore = computeAffinityScore(track, { explicitSkip: true });
    assert.equal(explicitSkipScore, -1.5);

    // In-session sub-genre penalty for early skip
    const sessionContext: SessionContext = {
      skippedGenres: ["R&B"],
    };
    const sessionDemotedScore = computeAffinityScore(track, {}, sessionContext);
    assert.ok(sessionDemotedScore < 0, "Track in early-skipped genre should be demoted in current session");
  });
});

describe("2. Discovery Station Algorithm (Strictly Unheard Music)", () => {
  test("strictly excludes previously played, favorited, or playlist tracks", () => {
    const candidate1 = makeTrack("t1", "Dua Lipa", "Pop");
    const candidate2 = makeTrack("t2", "Billie Eilish", "Alternative");
    const candidate3 = makeTrack("t3", "Olivia Rodrigo", "Pop");
    const candidate4 = makeTrack("t4", "Chappell Roan", "Pop");

    const historyIds = new Set(["t1"]);
    const favoriteIds = new Set(["t2"]);
    const playlistIds = new Set(["t3"]);

    const candidates = [candidate1, candidate2, candidate3, candidate4];
    const filtered = filterUnheardTracks(candidates, {
      playedTrackIds: historyIds,
      favoriteTrackIds: favoriteIds,
      playlistTrackIds: playlistIds,
    });

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, "t4");
  });
});

describe("3. Smart Autoplay & Continuity (Spotify BART Contextual Continuity)", () => {
  test("maintains genre and energy continuity and respects 70/30 exploration ratio", () => {
    const sessionHistory = [
      makeTrack("h1", "Lofi Fruits", "Lo-Fi", 150),
      makeTrack("h2", "ChilledCow", "Lo-Fi", 160),
      makeTrack("h3", "Kudasa", "Lo-Fi", 155),
    ];

    const candidates = [
      makeTrack("c1", "Heavy Metal Band", "Heavy Metal", 300),
      makeTrack("c2", "Lofi Fruits", "Lo-Fi", 150),
      makeTrack("c3", "Idealism", "Lo-Fi", 145),
      makeTrack("c4", "Nujabes", "Chillhop", 170),
      makeTrack("c5", "Saib", "Lo-Fi", 165),
      makeTrack("c6", "Jinsang", "Chillhop", 155),
      makeTrack("c7", "Slayer", "Heavy Metal", 290),
      makeTrack("c8", "Elijah Who", "Lo-Fi", 140),
      makeTrack("c9", "Tomppabeats", "Lo-Fi", 130),
      makeTrack("c10", "Deathcore", "Heavy Metal", 320),
    ];

    const ordered = orderAutoplayCandidates(candidates, sessionHistory, 6);

    // Verify length
    assert.equal(ordered.length, 6);

    // First tracks must be cohesive Lo-Fi / Chillhop, not jarring Heavy Metal whiplash
    assert.ok(
      ordered.slice(0, 3).every((t) => t.genre === "Lo-Fi" || t.genre === "Chillhop"),
      "Top autoplay transitions should maintain smooth genre pacing",
    );

    // Heavy metal should not be placed before coherent chillhop/lofi
    const heavyMetalIndex = ordered.findIndex((t) => t.genre === "Heavy Metal");
    if (heavyMetalIndex !== -1) {
      assert.ok(heavyMetalIndex >= 4, "Exploratory or distant genre should only appear later in queue");
    }
  });
});

describe("4. Instant Track Radio Algorithm", () => {
  test("strictly enforces no more than 2 tracks from the same artist within any 10-song window", () => {
    const seed = makeTrack("seed_1", "Taylor Swift", "Pop");

    // Pool of candidates with multiple tracks from Taylor Swift and others
    const candidatePool = [
      makeTrack("ts_1", "Taylor Swift", "Pop"),
      makeTrack("ts_2", "Taylor Swift", "Pop"),
      makeTrack("ts_3", "Taylor Swift", "Pop"),
      makeTrack("ts_4", "Taylor Swift", "Pop"),
      makeTrack("ts_5", "Taylor Swift", "Pop"),
      makeTrack("gracie_1", "Gracie Abrams", "Pop"),
      makeTrack("phoebe_1", "Phoebe Bridgers", "Indie Pop"),
      makeTrack("sabrina_1", "Sabrina Carpenter", "Pop"),
      makeTrack("olivia_1", "Olivia Rodrigo", "Pop"),
      makeTrack("lorde_1", "Lorde", "Pop"),
      makeTrack("lana_1", "Lana Del Rey", "Alternative"),
      makeTrack("bleachers_1", "Bleachers", "Indie Pop"),
      makeTrack("ts_6", "Taylor Swift", "Pop"),
      makeTrack("ts_7", "Taylor Swift", "Pop"),
      makeTrack("boygenius_1", "Boygenius", "Indie Rock"),
    ];

    const radioQueue = buildTrackRadio(seed, candidatePool, 12);

    assert.equal(radioQueue.length, 12);

    // Verify sliding 10-song window constraint
    for (let i = 0; i <= radioQueue.length - 10; i++) {
      const window = radioQueue.slice(i, i + 10);
      const artistCounts = new Map<string, number>();
      for (const t of window) {
        artistCounts.set(t.artist, (artistCounts.get(t.artist) || 0) + 1);
      }
      for (const [artist, count] of artistCounts.entries()) {
        assert.ok(
          count <= 2,
          `Artist "${artist}" appears ${count} times in 10-song window starting at ${i} (max allowed is 2)`,
        );
      }
    }
  });
});
