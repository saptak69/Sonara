/**
 * Song radio: what plays after a song you picked on its own (from search, a share
 * link, a track page). It continues the song's mood with similar songs and more
 * from the same artist, and never brings back the same title in another version
 * or by another artist.
 */
import type { Track } from "../types";
import { baseTitle, identityKey, splitArtists } from "./match.ts";

export type RadioSeed = Pick<Track, "id" | "title" | "artist"> & Partial<Pick<Track, "genre" | "duration" | "source">>;
export type RadioExclude = Pick<Track, "id" | "title" | "artist">;

/** Most songs by the seed's own artist in any run of 5. */
const MAX_SAME_ARTIST_PER_5 = 2;

/** Title used to spot "the same song": no brackets, versions or leading article. */
export function titleKey(title: string): string {
  return baseTitle(title).replace(/^(the|a|an) /, "");
}

export function sharesArtist(a: string, b: string): boolean {
  const left = splitArtists(a);
  const right = splitArtists(b);
  return left.some((x) => right.includes(x));
}

/**
 * Drops the seed itself, anything already queued, and every song whose title
 * matches one already queued — the "five different songs called X" problem.
 */
export function filterRadioCandidates(seed: RadioSeed, candidates: Track[], exclude: RadioExclude[] = []): Track[] {
  const ids = new Set([seed.id, ...exclude.map((t) => t.id)]);
  const titles = new Set([titleKey(seed.title), ...exclude.map((t) => titleKey(t.title))]);
  const keys = new Set<string>();
  const out: Track[] = [];
  for (const track of candidates) {
    if (track.kind === "radio" || ids.has(track.id)) continue;
    const title = titleKey(track.title);
    if (!title || titles.has(title)) continue;
    const key = identityKey(track);
    if (keys.has(key)) continue;
    keys.add(key);
    titles.add(title);
    ids.add(track.id);
    out.push(track);
  }
  return out;
}

/**
 * Interleaves the three pools: mostly similar songs, regularly one from the seed's
 * artist, and genre picks to fill gaps. The seed's artist never takes over the queue.
 */
export function orderRadio(seed: RadioSeed, similar: Track[], sameArtist: Track[], fill: Track[], limit: number): Track[] {
  const pools = [similar, sameArtist, fill].map((p) => [...p]);
  const pattern = [0, 1, 0, 0, 1, 2]; // similar, artist, similar, similar, artist, fill
  const out: Track[] = [];
  const recentIsSeedArtist: boolean[] = [];
  let step = 0;
  let idle = 0;

  while (out.length < limit && pools.some((p) => p.length) && idle < pattern.length * 2) {
    const preferred = pattern[step % pattern.length];
    step += 1;
    const order = [preferred, ...[0, 1, 2].filter((i) => i !== preferred)];
    let placed = false;
    for (const poolIndex of order) {
      const pool = pools[poolIndex];
      const at = pool.findIndex((t) => {
        const seedArtist = sharesArtist(seed.artist, t.artist);
        return !seedArtist || recentIsSeedArtist.slice(-4).filter(Boolean).length < MAX_SAME_ARTIST_PER_5;
      });
      if (at < 0) continue;
      const [track] = pool.splice(at, 1);
      out.push(track);
      recentIsSeedArtist.push(sharesArtist(seed.artist, track.artist));
      placed = true;
      break;
    }
    if (placed) {
      idle = 0;
    } else {
      // Only seed-artist songs remain and the window is full: let one other slot pass.
      recentIsSeedArtist.push(false);
      idle += 1;
    }
  }
  return out;
}

/**
 * 30-second previews break the flow of a radio. Use full-length songs only, unless
 * there aren't enough of them to fill it.
 */
export function preferFullStreams(pools: Track[][], limit: number): Track[][] {
  const full = pools.map((pool) => pool.filter((t) => !t.preview));
  const fullCount = full.reduce((sum, pool) => sum + pool.length, 0);
  return fullCount >= Math.min(limit, 10) ? full : pools;
}
