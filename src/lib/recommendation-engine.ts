import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Track } from "./types.ts";

// -----------------------------------------------------------------------------
// 1. Scoring: how well a candidate matches the listener's taste
// -----------------------------------------------------------------------------

export interface UserInteractionSignals {
  inFavorites?: boolean;
  completionRate?: number; // 0.0 to 1.0 (listened / duration)
  inPlaylist?: boolean;
  playTimestamps?: number[]; // unix timestamps in ms
  earlySkip?: boolean; // listened < 30s
  explicitSkip?: boolean; // user clicked skip/next
}

export interface SessionContext {
  skippedGenres?: string[];
  currentVibe?: {
    genre?: string;
    avgDuration?: number;
  };
}

const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000; // 14-day half-life
const LN2 = Math.LN2;

/**
 * Affinity score for a candidate track, from the listener's recent history.
 * Runs deterministically in < 0.1ms without external network calls.
 */
export function computeAffinityScore(
  candidate: Track,
  signals: UserInteractionSignals,
  sessionContext?: SessionContext,
  now: number = Date.now(),
): number {
  let score = 0;

  // Positive Signals
  // 1. In User Favorites: +5.0 weight
  if (signals.inFavorites) {
    score += 5.0;
  }

  // 2. High Completion Rate (listened > 70% of duration): +3.0 weight
  if (signals.completionRate != null && signals.completionRate > 0.7) {
    score += 3.0;
  }

  // 3. In User Created Playlist: +4.0 weight
  if (signals.inPlaylist) {
    score += 4.0;
  }

  // 4. Repeated Plays with 14-day exponential half-life decay: +1.0 to +3.0
  if (signals.playTimestamps && signals.playTimestamps.length > 0) {
    let decaySum = 0;
    for (const ts of signals.playTimestamps) {
      const ageMs = Math.max(0, now - ts);
      decaySum += Math.exp((-LN2 * ageMs) / HALF_LIFE_MS);
    }
    // Repeated plays scale from ~+1.0 (single fresh play) up to +3.0 (repeated plays)
    const repeatWeight = Math.min(3.0, decaySum * 1.1);
    score += repeatWeight;
  }

  // Negative Signals
  // 1. Early Skip (< 30s): -3.5 penalty
  if (signals.earlySkip) {
    score -= 3.5;
  }

  // 2. Explicit Skip / Next: -1.5 penalty
  if (signals.explicitSkip) {
    score -= 1.5;
  }

  // Session-level negative contextual signal: demote tracks in genres early-skipped this session
  if (sessionContext?.skippedGenres?.length && candidate.genre) {
    const candGenre = candidate.genre.toLowerCase();
    const isDemoted = sessionContext.skippedGenres.some((g) => {
      const skipped = g.toLowerCase();
      return candGenre.includes(skipped) || skipped.includes(candGenre);
    });
    if (isDemoted) {
      score -= 2.0;
    }
  }

  return Math.round(score * 100) / 100;
}

// -----------------------------------------------------------------------------
// 2. "DISCOVERY STATION" ALGORITHM (Strictly Unheard Music)
// -----------------------------------------------------------------------------

export interface UnheardFilters {
  playedTrackIds: Set<string>;
  favoriteTrackIds: Set<string>;
  playlistTrackIds: Set<string>;
}

/**
 * Filter out any track previously heard, favorited, or added to a playlist.
 */
export function filterUnheardTracks(candidates: Track[], filters: UnheardFilters): Track[] {
  const seenInCandidates = new Set<string>();
  return candidates.filter((track) => {
    if (!track?.id || seenInCandidates.has(track.id)) return false;
    seenInCandidates.add(track.id);

    if (filters.playedTrackIds.has(track.id)) return false;
    if (filters.favoriteTrackIds.has(track.id)) return false;
    if (filters.playlistTrackIds.has(track.id)) return false;

    return true;
  });
}

/**
 * Server Function: Discovery Station
 * Surfaces high-probability discoveries the user has NEVER heard.
 */
export const getDiscoveryStationTracksServerFn = createServerFn({ method: "GET" })
  .validator((data?: { limit?: number }) => z.object({ limit: z.number().optional().default(20) }).parse(data || {}))
  .handler(async ({ data }): Promise<Track[]> => {
    const limit = data.limit || 20;
    const { getSql } = await import("./db");
    const sql = await getSql();

    let userId: string | null = null;
    try {
      const { getSessionUser } = await import("./auth/verify.server");
      const sessionUser = await getSessionUser();
      if (sessionUser?.id) userId = sessionUser.id;
    } catch {
      // Guest
    }

    // Step 1: Query exclusion sets from database
    const playedRows = userId
      ? await sql<{ trackId: string }>`select distinct track_id as "trackId" from "user_play_history" where user_id = ${userId}`
      : await sql<{ trackId: string }>`select distinct track_id as "trackId" from "user_play_history" limit 100`;

    const favRows = userId
      ? await sql<{ trackId: string }>`select track_id as "trackId" from "user_favorite" where user_id = ${userId}`
      : [];

    const playlistRows = userId
      ? await sql<{ trackId: string }>`
          select distinct pt.track_id as "trackId"
          from "playlist_track" pt
          join "user_playlist" up on pt.playlist_id = up.id
          where up.user_id = ${userId}
        `
      : [];

    const playedTrackIds = new Set(playedRows.map((r) => r.trackId));
    const favoriteTrackIds = new Set(favRows.map((r) => r.trackId));
    const playlistTrackIds = new Set(playlistRows.map((r) => r.trackId));

    // Step 2: Determine user's top genres and artists
    const tasteRows = userId
      ? await sql<{ genre: string | null; artist: string }>`
          select genre, artist from (
            select genre, artist, played_at as dt from "user_play_history" where user_id = ${userId}
            union all
            select null as genre, artist, created_at as dt from "user_favorite" where user_id = ${userId}
          ) t
          order by dt desc
          limit 50
        `
      : [];

    const genreCounts = new Map<string, number>();
    const artistCounts = new Map<string, number>();
    for (const r of tasteRows) {
      if (r.genre) {
        genreCounts.set(r.genre, (genreCounts.get(r.genre) || 0) + 1);
      }
      if (r.artist) {
        artistCounts.set(r.artist, (artistCounts.get(r.artist) || 0) + 1);
      }
    }

    const topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    const topArtists = Array.from(artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([a]) => a);

    // Step 3: Candidate Generation (Trending, Curated, and Saavn)
    const { CURATED_TRACKS } = await import("./music-api");
    const rawCandidates: Track[] = [...CURATED_TRACKS];

    try {
      const { getSaavnTrendingServerFn } = await import("./saavn-api");
      const trending = await getSaavnTrendingServerFn({ data: { limit: 40 } });
      rawCandidates.push(...trending);
    } catch {
      // Fallback to local curated
    }

    // Step 4: Strict Filter
    const unheardCandidates = filterUnheardTracks(rawCandidates, {
      playedTrackIds,
      favoriteTrackIds,
      playlistTrackIds,
    });

    // Step 5: Rank remaining candidates by taste-affinity score and popularity
    const ranked = unheardCandidates.map((candidate) => {
      let affinity = 0;
      if (candidate.genre && topGenres.some((g) => candidate.genre?.toLowerCase().includes(g.toLowerCase()))) {
        affinity += 3.5;
      }
      if (topArtists.some((a) => candidate.artist?.toLowerCase().includes(a.toLowerCase()))) {
        affinity += 4.0;
      }
      return {
        track: candidate,
        score: affinity + ((candidate.playCount || 1000) / 10000),
      };
    });

    ranked.sort((a, b) => b.score - a.score);
    return ranked.slice(0, limit).map((r) => r.track);
  });

// -----------------------------------------------------------------------------
// 3. "SMART AUTOPLAY & INFINITY QUEUE" (Spotify BART Contextual Continuity)
// -----------------------------------------------------------------------------

// Known genre affinity cluster map for smooth continuity transitions
const GENRE_COMPATIBILITY_CLUSTERS: Record<string, string[]> = {
  "lo-fi": ["lo-fi", "chillhop", "ambient", "downtempo", "indie pop", "r&b"],
  chillhop: ["chillhop", "lo-fi", "hip-hop", "jazz", "downtempo"],
  pop: ["pop", "dance", "synth-pop", "indie pop", "r&b"],
  "r&b": ["r&b", "soul", "neo-soul", "hip-hop", "pop"],
  "hip-hop": ["hip-hop", "rap", "trap", "r&b", "chillhop"],
  electronic: ["electronic", "house", "techno", "edm", "dance"],
  rock: ["rock", "indie rock", "alternative", "hard rock", "punk"],
  "heavy metal": ["heavy metal", "hard rock", "metal", "rock"],
  ambient: ["ambient", "lo-fi", "meditation", "classical", "downtempo"],
};

function getGenreCompatibility(genreA?: string, genreB?: string): number {
  if (!genreA || !genreB) return 0.5;
  const a = genreA.toLowerCase().trim();
  const b = genreB.toLowerCase().trim();

  if (a === b || a.includes(b) || b.includes(a)) return 1.0;

  for (const [key, cluster] of Object.entries(GENRE_COMPATIBILITY_CLUSTERS)) {
    if (a.includes(key) && cluster.some((c) => b.includes(c))) return 0.8;
    if (b.includes(key) && cluster.some((c) => a.includes(c))) return 0.8;
  }

  // Extreme whiplash penalties (e.g. lo-fi vs metal)
  if (
    (a.includes("lo-fi") || a.includes("ambient")) &&
    (b.includes("metal") || b.includes("heavy"))
  ) {
    return 0.05;
  }

  return 0.3;
}

/**
 * Orders autoplay candidate tracks with pacing & energy continuity,
 * maintaining 70% high-affinity + 30% adjacent exploratory discoveries.
 */
export function orderAutoplayCandidates(
  candidates: Track[],
  sessionHistory: Track[],
  limit: number = 10,
): Track[] {
  if (!candidates.length) return [];
  if (!sessionHistory.length) return candidates.slice(0, limit);

  // Recent 3 tracks rolling context
  const recent = sessionHistory.slice(-3);
  const primaryGenres = recent.map((t) => t.genre || "").filter(Boolean);
  const primaryArtists = new Set(recent.map((t) => t.artist.toLowerCase()));
  const avgDuration =
    recent.reduce((sum, t) => sum + (t.duration || 180), 0) / Math.max(1, recent.length);

  // Score candidates based on continuity with recent context
  const scored = candidates.map((cand) => {
    let genreScore = 0.4;
    if (primaryGenres.length) {
      genreScore = Math.max(
        ...primaryGenres.map((g) => getGenreCompatibility(cand.genre, g)),
      );
    }

    const artistBonus = primaryArtists.has(cand.artist.toLowerCase()) ? 0.3 : 0.0;
    const durationPacing = Math.max(
      0,
      1.0 - Math.abs((cand.duration || 180) - avgDuration) / 300,
    );

    const continuityScore = genreScore * 0.6 + durationPacing * 0.25 + artistBonus * 0.15;
    return { candidate: cand, continuityScore, genreScore };
  });

  // Separate into High-Affinity (>= 0.70 continuity) and Exploratory pools
  const highAffinity = scored
    .filter((s) => s.continuityScore >= 0.65)
    .sort((a, b) => b.continuityScore - a.continuityScore);

  const exploratory = scored
    .filter((s) => s.continuityScore < 0.65 && s.genreScore >= 0.2)
    .sort((a, b) => b.continuityScore - a.continuityScore);

  const highTarget = Math.max(1, Math.round(limit * 0.7));
  const result: Track[] = [];
  const pickedIds = new Set<string>();

  // Pick high affinity first
  for (const item of highAffinity) {
    if (result.length >= highTarget) break;
    if (!pickedIds.has(item.candidate.id)) {
      result.push(item.candidate);
      pickedIds.add(item.candidate.id);
    }
  }

  // Interleave exploratory tracks (30%)
  for (const item of exploratory) {
    if (result.length >= limit) break;
    if (!pickedIds.has(item.candidate.id)) {
      result.push(item.candidate);
      pickedIds.add(item.candidate.id);
    }
  }

  // If still below limit, fill from remaining sorted candidates
  if (result.length < limit) {
    for (const item of scored) {
      if (result.length >= limit) break;
      if (!pickedIds.has(item.candidate.id)) {
        result.push(item.candidate);
        pickedIds.add(item.candidate.id);
      }
    }
  }

  return result.slice(0, limit);
}

const TrackInputSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  artistId: z.string().optional(),
  album: z.string().optional(),
  artwork: z.string().nullable().optional(),
  artworkLg: z.string().nullable().optional(),
  duration: z.number().default(0),
  streamUrl: z.string(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  kind: z.enum(["track", "radio"]).default("track"),
});

/**
 * Server Function: Get Next Autoplay Tracks (Infinity Queue)
 */
export const getNextAutoplayTracksServerFn = createServerFn({ method: "POST" })
  .validator((data: { sessionHistory: z.infer<typeof TrackInputSchema>[]; limit?: number }) =>
    z.object({
      sessionHistory: z.array(TrackInputSchema),
      limit: z.number().optional().default(10),
    }).parse(data)
  )
  .handler(async ({ data }): Promise<Track[]> => {
    const { sessionHistory, limit = 10 } = data;
    if (!sessionHistory.length) return [];

    const lastTrack = sessionHistory[sessionHistory.length - 1];
    const candidates: Track[] = [];

    // Step 1: Candidate Generation via Similar Songs API
    try {
      const { getSimilarSongsServerFn } = await import("./saavn-api");
      const similar = await getSimilarSongsServerFn({
        data: { id: lastTrack.id, limit: limit * 2 },
      });
      if (similar?.length) {
        candidates.push(...similar);
      }
    } catch {
      // ignore network failure
    }

    // Step 2: Fallback with curated / trending matching genre
    if (candidates.length < limit) {
      const { CURATED_TRACKS } = await import("./music-api");
      const matchingGenre = CURATED_TRACKS.filter(
        (t) => getGenreCompatibility(t.genre, lastTrack.genre) >= 0.7,
      );
      candidates.push(...matchingGenre);
    }

    const history: Track[] = sessionHistory.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      artistId: t.artistId,
      album: t.album,
      artwork: t.artwork ?? null,
      artworkLg: t.artworkLg ?? null,
      duration: t.duration,
      streamUrl: t.streamUrl,
      genre: t.genre,
      mood: t.mood,
      kind: t.kind,
    }));

    // Exclude tracks already in session history
    const historyIds = new Set(sessionHistory.map((t) => t.id));
    const unplayedCandidates = candidates.filter((t) => !historyIds.has(t.id));

    // Step 3: Apply Contextual Continuity Ordering
    return orderAutoplayCandidates(unplayedCandidates, history, limit);
  });

// -----------------------------------------------------------------------------
// 4. "INSTANT TRACK RADIO" ALGORITHM
// -----------------------------------------------------------------------------

/**
 * Builds an endless cohesive radio queue seeded from a single selected track.
 * Enforces variety: No more than 2 tracks from the same artist within any 10-song window.
 */
export function buildTrackRadio(seed: Track, candidatePool: Track[], limit: number = 25): Track[] {
  const result: Track[] = [seed];
  const pool = candidatePool.filter((t) => t.id !== seed.id);

  // Rank candidate pool by seed affinity (primary artist, collaborators, genre compatibility)
  const seedArtist = seed.artist.toLowerCase();
  const seedGenre = seed.genre || "";

  pool.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.artist.toLowerCase() === seedArtist) scoreA += 5.0;
    if (b.artist.toLowerCase() === seedArtist) scoreB += 5.0;

    scoreA += getGenreCompatibility(a.genre, seedGenre) * 3.0;
    scoreB += getGenreCompatibility(b.genre, seedGenre) * 3.0;

    return scoreB - scoreA;
  });

  const available = [...pool];

  while (result.length < limit && available.length > 0) {
    const currentWindowStart = Math.max(0, result.length - 9);
    const window = result.slice(currentWindowStart);

    // Count appearances of each artist in the current sliding 10-song window
    const artistCountsInWindow = new Map<string, number>();
    for (const t of window) {
      const art = t.artist.toLowerCase();
      artistCountsInWindow.set(art, (artistCountsInWindow.get(art) || 0) + 1);
    }

    // Find first candidate in sorted pool whose artist count in the window is < 2
    let foundIndex = -1;
    for (let i = 0; i < available.length; i++) {
      const art = available[i].artist.toLowerCase();
      const currentCount = artistCountsInWindow.get(art) || 0;
      if (currentCount < 2) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== -1) {
      const [chosen] = available.splice(foundIndex, 1);
      result.push(chosen);
    } else {
      // If every remaining track in the pool violates the 2-in-10 rule, take the least frequent artist
      let bestIndex = 0;
      let minCount = Infinity;
      for (let i = 0; i < available.length; i++) {
        const art = available[i].artist.toLowerCase();
        const count = artistCountsInWindow.get(art) || 0;
        if (count < minCount) {
          minCount = count;
          bestIndex = i;
        }
      }
      const [chosen] = available.splice(bestIndex, 1);
      result.push(chosen);
    }
  }

  return result;
}

/**
 * Server Function: Get Track Radio
 */
export const getTrackRadioServerFn = createServerFn({ method: "GET" })
  .validator((data: { seedTrackId: string; limit?: number }) =>
    z.object({ seedTrackId: z.string().min(1), limit: z.number().optional().default(25) }).parse(data)
  )
  .handler(async ({ data }): Promise<Track[]> => {
    const { seedTrackId, limit = 25 } = data;

    // 1. Resolve seed track
    const { CURATED_TRACKS, fetchTrack } = await import("./music-api");
    let seedTrack = CURATED_TRACKS.find((t) => t.id === seedTrackId) || null;
    if (!seedTrack) {
      try {
        seedTrack = await fetchTrack(seedTrackId);
      } catch {
        // ignore
      }
    }
    if (!seedTrack) {
      // Fallback to first curated track
      seedTrack = CURATED_TRACKS[0];
    }

    // 2. Fetch candidates from similar songs API and genre recommendations
    const candidatePool: Track[] = [];
    try {
      const { getSimilarSongsServerFn } = await import("./saavn-api");
      const similar = await getSimilarSongsServerFn({
        data: { id: seedTrack.id, limit: 30 },
      });
      if (similar?.length) {
        candidatePool.push(...similar);
      }
    } catch {
      // ignore
    }

    // Add matching curated tracks for depth
    candidatePool.push(...CURATED_TRACKS.filter((t) => t.id !== seedTrack!.id));

    // 3. Build cohesive, clump-free track radio
    return buildTrackRadio(seedTrack, candidatePool, limit);
  });
