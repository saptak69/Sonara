import assert from "node:assert/strict";
import { test } from "node:test";

test("Queue reordering logic: accurately shifts items without mutating surrounding queue", () => {
  const queue = [
    { id: "trk_0", title: "Current Playing" },
    { id: "trk_1", title: "Upcoming 1" },
    { id: "trk_2", title: "Upcoming 2" },
    { id: "trk_3", title: "Upcoming 3" },
  ];

  // Moving upcoming index 1 (Upcoming 2) up to index 0
  const currentIndex = 0;
  const fromIdx = 1; // Upcoming 2 (actual queue index 2)
  const toIdx = 0;   // Upcoming 1 (actual queue index 1)

  const actualFrom = currentIndex + 1 + fromIdx;
  const actualTo = currentIndex + 1 + toIdx;

  const copy = [...queue];
  const [moved] = copy.splice(actualFrom, 1);
  copy.splice(actualTo, 0, moved);

  assert.equal(copy[0].id, "trk_0", "Current playing track remained untouched");
  assert.equal(copy[1].id, "trk_2", "Upcoming 2 successfully moved up to first in upcoming");
  assert.equal(copy[2].id, "trk_1", "Upcoming 1 shifted down");
  assert.equal(copy[3].id, "trk_3", "Upcoming 3 untouched");
});

test("Recent searches removal: eliminates target query without affecting order of remaining items", () => {
  const recentSearches = ["Taylor Swift", "Metallica", "Pink Floyd", "Daft Punk"];

  const removeQuery = (list, query) => list.filter((s) => s !== query);

  const updated = removeQuery(recentSearches, "Metallica");
  assert.deepEqual(updated, ["Taylor Swift", "Pink Floyd", "Daft Punk"]);
  assert.equal(updated.includes("Metallica"), false);

  const removedNonExistent = removeQuery(updated, "Radiohead");
  assert.deepEqual(removedNonExistent, ["Taylor Swift", "Pink Floyd", "Daft Punk"]);
});

test("Volume normalization math: caps output volume below clipping threshold", () => {
  const calculateEffectiveVolume = (baseVolume, normalizationEnabled) => {
    return normalizationEnabled ? Math.min(1.0, baseVolume * 0.88) : baseVolume;
  };

  assert.equal(calculateEffectiveVolume(1.0, false), 1.0);
  assert.equal(calculateEffectiveVolume(1.0, true), 0.88);
  assert.equal(calculateEffectiveVolume(0.5, true), 0.44);
});

test("Spotify & Apple Music playlist importer text parser: handles varied input formats", () => {
  const parseTextTracklist = (text) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const results = [];
    for (const line of lines) {
      const cleaned = line.replace(/^\[?\d+\]?[\s.\-_–—)]+/, "").trim();
      if (!cleaned) continue;
      const dashMatch = cleaned.split(/\s+[-–—]\s+/);
      if (dashMatch.length >= 2) {
        results.push({ title: dashMatch[0].trim(), artist: dashMatch.slice(1).join(" - ").trim() });
        continue;
      }
      const byMatch = cleaned.split(/\s+by\s+/i);
      if (byMatch.length === 2) {
        const candidateArtist = byMatch[1].trim();
        const stopWords = new Set(["me", "you", "him", "her", "us", "them", "myself", "yourself", "step", "chance", "night", "day"]);
        if (!stopWords.has(candidateArtist.toLowerCase())) {
          results.push({ title: byMatch[0].trim(), artist: candidateArtist });
          continue;
        }
      }
      results.push({ title: cleaned, artist: "" });
    }
    return results;
  };

  const rawInput = `
    01. Espresso - Sabrina Carpenter
    2) BIRDS OF A FEATHER by Billie Eilish
    3 - Blinding Lights — The Weeknd
    Daft Punk - Get Lucky
    Stand By Me
  `;

  const parsed = parseTextTracklist(rawInput);
  assert.equal(parsed.length, 5);
  assert.deepEqual(parsed[0], { title: "Espresso", artist: "Sabrina Carpenter" });
  assert.deepEqual(parsed[1], { title: "BIRDS OF A FEATHER", artist: "Billie Eilish" });
  assert.deepEqual(parsed[2], { title: "Blinding Lights", artist: "The Weeknd" });
  assert.deepEqual(parsed[3], { title: "Daft Punk", artist: "Get Lucky" });
  assert.deepEqual(parsed[4], { title: "Stand By Me", artist: "" });
});

test("Equalizer DSP presets: guarantees 5 bands and safe dB ranges", () => {
  const EQUALIZER_PRESETS = {
    "Flat": { bands: [0, 0, 0, 0, 0], bassBoost: 0 },
    "Bass Boost": { bands: [5, 3, 0, 0, 1], bassBoost: 6 },
    "Vocal": { bands: [-2, 0, 4, 3, 1], bassBoost: 0 },
    "Rock": { bands: [4, 2, -1, 2, 4], bassBoost: 2 },
    "EDM": { bands: [5, 3, -1, 2, 4], bassBoost: 5 },
    "Acoustic": { bands: [2, 1, 2, 3, 2], bassBoost: 0 },
    "Treble Boost": { bands: [-2, 0, 1, 4, 6], bassBoost: 0 },
    "Late Night": { bands: [-3, -1, 0, -2, -4], bassBoost: 0 },
  };

  for (const [name, preset] of Object.entries(EQUALIZER_PRESETS)) {
    assert.equal(preset.bands.length, 5, `${name} has exactly 5 bands`);
    assert.ok(preset.bassBoost >= 0 && preset.bassBoost <= 10, `${name} bassBoost within 0-10dB`);
    for (const gain of preset.bands) {
      assert.ok(gain >= -12 && gain <= 12, `${name} band gain ${gain} within -12 to +12 dB`);
    }
  }
});

test("Offline Cache: metadata deduplication and retrieval simulation", () => {
  let metadata = [
    { id: "song_1", title: "Track One" },
    { id: "song_2", title: "Track Two" },
  ];

  const addTrack = (track) => {
    metadata = [track, ...metadata.filter((t) => t.id !== track.id)];
  };

  const removeTrack = (id) => {
    metadata = metadata.filter((t) => t.id !== id);
  };

  // Add new track
  addTrack({ id: "song_3", title: "Track Three" });
  assert.equal(metadata.length, 3);
  assert.equal(metadata[0].id, "song_3");

  // Re-add existing track (moves to top without duplicates)
  addTrack({ id: "song_2", title: "Track Two" });
  assert.equal(metadata.length, 3);
  assert.equal(metadata[0].id, "song_2");

  // Remove track
  removeTrack("song_1");
  assert.equal(metadata.length, 2);
  assert.equal(metadata.some((t) => t.id === "song_1"), false);
});

test("Offline Download Strategy: multi-tier candidate generation with bitrates & proxy fallback", () => {
  const getCandidateUrls = (directUrl, origin = "https://sonara-murex.vercel.app") => {
    const candidates = [directUrl];
    if (directUrl.includes("saavncdn.com") && directUrl.includes("_320.mp4")) {
      candidates.push(directUrl.replace("_320.mp4", "_160.mp4"));
      candidates.push(directUrl.replace("_320.mp4", "_96.mp4"));
    }
    const proxyUrl = `${origin}/api/stream?url=${encodeURIComponent(directUrl)}`;
    candidates.push(proxyUrl);
    return candidates;
  };

  const saavn320 = "https://aac.saavncdn.com/123/song_320.mp4";
  const saavnCandidates = getCandidateUrls(saavn320);
  assert.equal(saavnCandidates.length, 4);
  assert.equal(saavnCandidates[0], "https://aac.saavncdn.com/123/song_320.mp4");
  assert.equal(saavnCandidates[1], "https://aac.saavncdn.com/123/song_160.mp4");
  assert.equal(saavnCandidates[2], "https://aac.saavncdn.com/123/song_96.mp4");
  assert.ok(saavnCandidates[3].includes("/api/stream?url="));

  const standardUrl = "https://example.com/audio.mp3";
  const standardCandidates = getCandidateUrls(standardUrl);
  assert.equal(standardCandidates.length, 2);
  assert.equal(standardCandidates[0], standardUrl);
  assert.ok(standardCandidates[1].includes("/api/stream?url="));
});
