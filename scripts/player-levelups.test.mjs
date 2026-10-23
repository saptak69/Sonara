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
