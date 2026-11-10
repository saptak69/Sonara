import { test } from "node:test";
import assert from "node:assert/strict";
import type { Track } from "../types";
import { filterRadioCandidates, orderRadio, preferFullStreams, sharesArtist } from "./radio.ts";

let n = 0;
function t(title: string, artist: string, over: Partial<Track> = {}): Track {
  n += 1;
  return { id: `t${n}`, title, artist, artwork: null, artworkLg: null, duration: 200, streamUrl: "https://a/b.mp3", kind: "track", ...over };
}

const seed = t("The Count of Tuscany", "Dream Theater");

test("never queues another song with the picked song's title", () => {
  const candidates = [
    t("The Count of Tuscany", "Dream Theater"),
    t("The Count of Tuscany (Live)", "Dream Theater"),
    t("Count of Tuscany", "Some Cover Band"),
    t("Pull Me Under", "Dream Theater"),
    t("Pull Me Under - Remastered", "Dream Theater"),
    t("Metropolis", "Dream Theater"),
  ];
  const kept = filterRadioCandidates(seed, candidates).map((x) => x.title);
  assert.deepEqual(kept, ["Pull Me Under", "Metropolis"]);
});

test("skips songs already queued, by id and by title", () => {
  const queued = t("Panic Attack", "Dream Theater");
  const kept = filterRadioCandidates(seed, [t("Panic Attack", "Dream Theater"), queued, t("Octavarium", "Dream Theater")], [queued]);
  assert.deepEqual(kept.map((x) => x.title), ["Octavarium"]);
});

test("mixes similar songs with the artist without letting the artist take over", () => {
  const similar = ["Ytse Jam", "Starless", "Xanadu", "Hemispheres", "Close to the Edge", "Supper's Ready"].map((s, i) =>
    t(s, ["Rush", "King Crimson", "Rush", "Rush", "Yes", "Genesis"][i]),
  );
  const own = ["Pull Me Under", "Metropolis", "Octavarium", "Panic Attack", "Breaking All Illusions"].map((s) => t(s, "Dream Theater"));
  const radio = orderRadio(seed, similar, own, [], 10);
  assert.equal(radio.length, 10);
  for (let i = 0; i + 5 <= radio.length; i += 1) {
    const window = radio.slice(i, i + 5).filter((x) => sharesArtist("Dream Theater", x.artist)).length;
    assert.ok(window <= 2, `window at ${i} has ${window} Dream Theater songs`);
  }
  assert.ok(radio.some((x) => x.artist === "Dream Theater"), "includes the artist");
});

test("falls back to the artist when nothing similar is known", () => {
  const own = ["A", "B", "C"].map((s) => t(s, "Dream Theater"));
  assert.equal(orderRadio(seed, [], own, [], 10).length, 3);
});

test("leaves previews out when there are enough full songs", () => {
  const fullSongs = Array.from({ length: 12 }, (_, i) => t(`Song ${i}`, "Rush"));
  const preview = t("Clip", "Yes", { preview: true });
  assert.equal(preferFullStreams([[preview, ...fullSongs]], 20)[0].includes(preview), false);
  assert.equal(preferFullStreams([[preview, fullSongs[0]]], 20)[0].includes(preview), true);
});
