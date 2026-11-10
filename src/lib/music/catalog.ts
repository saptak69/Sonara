/**
 * Server functions over all music providers: merged search, trending from free
 * sources, and track lookup for Audius and iTunes ids.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Track } from "../types";
import { isCoverOrDerivative } from "../music-filter";
import { confidence, mergeTracks, rankTracks } from "./match.ts";
import { filterRadioCandidates, orderRadio, preferFullStreams, sharesArtist, type RadioExclude, type RadioSeed } from "./radio.ts";
import { createCircuitBreaker, withTimeout } from "./resilience.ts";
import { audius, deezer, itunes, legacySourcesEnabled, type TrackSearchProvider } from "./providers.ts";

const breaker = createCircuitBreaker({ threshold: 3, cooldownMs: 30_000 });

/** Runs one provider call with its timeout and the circuit breaker. Failures become empty results. */
async function guarded<T>(provider: string, timeoutMs: number, fallback: T, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  if (breaker.isOpen(provider)) return fallback;
  try {
    const result = await withTimeout(provider, timeoutMs, run);
    breaker.success(provider);
    return result;
  } catch (err) {
    breaker.failure(provider);
    console.warn(`[music] ${err instanceof Error ? err.message : err}`);
    return fallback;
  }
}

async function searchProviders(): Promise<TrackSearchProvider[]> {
  const providers: TrackSearchProvider[] = [
    {
      id: "studio",
      priority: 0,
      timeoutMs: 3000,
      searchTracks: async (query, limit) => {
        const [{ searchCommunityReleasesServerFn }, { uploadToTrack }] = await Promise.all([
          import("../artist-studio"),
          import("../community-tracks"),
        ]);
        const rows = await searchCommunityReleasesServerFn({ data: { query, limit: Math.min(limit, 20) } });
        return rows.map(uploadToTrack);
      },
    },
    { id: "audius", priority: 2, timeoutMs: 3500, searchTracks: audius.search },
    { id: "itunes", priority: 4, timeoutMs: 3000, searchTracks: itunes.search },
  ];
  if (legacySourcesEnabled()) {
    const { searchSaavnTracksServerFn } = await import("../saavn-api");
    const { searchSoundCloudTracksServerFn } = await import("../soundcloud-api");
    providers.push(
      {
        id: "saavn",
        priority: 1,
        timeoutMs: 4000,
        legacy: true,
        searchTracks: async (query, limit) =>
          (await searchSaavnTracksServerFn({ data: { query, limit } })).map((t) => ({ ...t, source: "saavn" })),
      },
      {
        id: "soundcloud",
        priority: 3,
        timeoutMs: 4000,
        legacy: true,
        searchTracks: async (query, limit) =>
          (await searchSoundCloudTracksServerFn({ data: { query, limit } })).map((t) => ({ ...t, source: "soundcloud" })),
      },
    );
  }
  return providers.sort((a, b) => a.priority - b.priority);
}

export async function searchAllTracks(query: string, limit: number): Promise<Track[]> {
  const q = query.trim();
  if (!q) return [];
  const providers = await searchProviders();
  const lists = await Promise.all(
    providers.map((p) => guarded(p.id, p.timeoutMs, [] as Track[], (signal) => p.searchTracks(q, Math.min(25, limit + 5), signal))),
  );
  const clean = lists.map((list) => list.filter((t) => !isCoverOrDerivative(t.title, t.artist, q)));
  return rankTracks(mergeTracks(clean), q).slice(0, limit);
}

export const searchCatalogTracksServerFn = createServerFn({ method: "GET" })
  .validator((d: { query: string; limit?: number }) =>
    z.object({ query: z.string().max(200), limit: z.number().int().min(1).max(50).default(24) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { serverCache, CACHE_TTL } = await import("../cache.server");
    return serverCache.getOrFetch(`catalog:search:${data.query.trim().toLowerCase()}:${data.limit}`, CACHE_TTL.SEARCH_RESULTS, () =>
      searchAllTracks(data.query, data.limit),
    );
  });

/** Trending on Audius this week: independent artists, full-length and free to stream. */
export async function audiusTrending(limit: number, genre?: string): Promise<Track[]> {
  return guarded("audius", 4000, [] as Track[], (signal) => audius.trending(limit, signal, genre));
}

export const getIndependentTrendingServerFn = createServerFn({ method: "GET" })
  .validator((d: { limit?: number; genre?: string }) =>
    z.object({ limit: z.number().int().min(1).max(50).default(20), genre: z.string().max(40).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { serverCache, CACHE_TTL } = await import("../cache.server");
    return serverCache.getOrFetch(`catalog:audius-trending:${data.genre ?? ""}:${data.limit}`, CACHE_TTL.TRENDING, () =>
      audiusTrending(data.limit, data.genre),
    );
  });

export const getCatalogTrackServerFn = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => z.object({ id: z.string().regex(/^(audius|itunes)_[\w-]+$/) }).parse(d))
  .handler(async ({ data }): Promise<Track | null> => {
    const [provider, ...rest] = data.id.split("_");
    const id = rest.join("_");
    if (provider === "audius") return guarded("audius", 4000, null, (signal) => audius.track(id, signal));
    return guarded("itunes", 4000, null, (signal) => itunes.track(id, signal));
  });

const RadioTrackSchema = z.object({
  id: z.string().max(200),
  title: z.string().max(300),
  artist: z.string().max(300),
});

type RadioPools = { similar: Track[]; sameArtist: Track[]; fill: Track[] };

/** Candidate pools for a song radio, gathered in parallel. Cached per song, filtered per request. */
async function radioPools(seed: RadioSeed): Promise<RadioPools> {
  const artist = splitArtistsForSearch(seed.artist);

  // Songs JioSaavn lists as similar (legacy source; found by matching the recording).
  const saavnSimilarTask = (async (): Promise<Track[]> => {
    if (!legacySourcesEnabled()) return [];
    const { getSimilarSongsServerFn, searchSaavnTracksServerFn } = await import("../saavn-api");
    let saavnId = seed.id.startsWith("saavn_") ? seed.id : null;
    if (!saavnId) {
      const found = await guarded("saavn", 4000, [] as Track[], () =>
        searchSaavnTracksServerFn({ data: { query: `${seed.title} ${artist}`, limit: 5 } }),
      );
      saavnId = found.find((t) => confidence(t, { ...seed, duration: seed.duration ?? 0 }) >= 0.95)?.id ?? null;
    }
    if (!saavnId) return [];
    const id = saavnId;
    return guarded("saavn", 5000, [] as Track[], () => getSimilarSongsServerFn({ data: { id, limit: 40 } }));
  })();

  // Top songs by the artists Deezer lists as related, found through the merged search.
  const relatedArtistsTask = (async (): Promise<Track[]> => {
    if (!artist) return [];
    const related = await guarded("deezer", 4000, [] as { name: string }[], async (signal) => {
      const match = await deezer.findArtist(artist, signal);
      return match ? deezer.relatedArtists(match.id, 8, signal) : [];
    });
    const perArtist = await Promise.all(
      related.slice(0, 6).map(async (r) =>
        (await searchAllTracks(r.name, 10)).filter((t) => sharesArtist(r.name, t.artist)).slice(0, 3),
      ),
    );
    // Round-robin so one related artist doesn't come in a block.
    const out: Track[] = [];
    for (let i = 0; i < 3; i += 1) for (const list of perArtist) if (list[i]) out.push(list[i]);
    return out;
  })();

  const sameArtistTask = artist
    ? searchAllTracks(artist, 30).then((list) => list.filter((t) => sharesArtist(seed.artist, t.artist)))
    : Promise.resolve([] as Track[]);

  const [saavnSimilar, relatedArtists, sameArtist] = await Promise.all([saavnSimilarTask, relatedArtistsTask, sameArtistTask]);

  // Interleave the two "similar" sources.
  const similar: Track[] = [];
  for (let i = 0; i < Math.max(saavnSimilar.length, relatedArtists.length); i += 1) {
    if (relatedArtists[i]) similar.push(relatedArtists[i]);
    if (saavnSimilar[i]) similar.push(saavnSimilar[i]);
  }

  // Trending fill only when it can match the mood: an Audius seed (same genre), or almost nothing else found.
  const needFill = seed.source === "audius" || similar.length + sameArtist.length < 8;
  const fill = needFill ? await audiusTrending(30, seed.source === "audius" ? seed.genre : undefined) : [];
  return { similar, sameArtist, fill };
}

function splitArtistsForSearch(artist: string): string {
  return artist.replace(/^@/, "").split(/,|&| feat\.? | ft\.? /i)[0].trim();
}

/**
 * What plays after a song picked on its own: similar songs mixed with more from the
 * same artist. Never repeats the song's title, and skips everything in `exclude`
 * (the current queue), so it can be called again to extend the radio.
 */
export const getSongRadioServerFn = createServerFn({ method: "POST" })
  .validator((d: { seed: RadioSeed; exclude?: RadioExclude[]; limit?: number }) =>
    z
      .object({
        seed: RadioTrackSchema.extend({
          genre: z.string().max(80).optional(),
          duration: z.number().optional(),
          source: z.string().max(40).optional(),
        }),
        exclude: z.array(RadioTrackSchema).max(300).default([]),
        limit: z.number().int().min(1).max(50).default(20),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<Track[]> => {
    const { serverCache } = await import("../cache.server");
    const pools = await serverCache.getOrFetch(`radio:pools:v2:${data.seed.id}`, 600, () => radioPools(data.seed));
    const exclude = data.exclude;
    const similar = filterRadioCandidates(data.seed, pools.similar, exclude);
    const sameArtist = filterRadioCandidates(data.seed, pools.sameArtist, [...exclude, ...similar]);
    const fill = filterRadioCandidates(data.seed, pools.fill, [...exclude, ...similar, ...sameArtist]);
    const [similarFull, sameArtistFull, fillFull] = preferFullStreams([similar, sameArtist, fill], data.limit);
    return orderRadio(data.seed, similarFull, sameArtistFull, fillFull, data.limit);
  });

export type ProviderStatus = {
  id: string;
  ok: boolean;
  ms: number;
  results: number;
  legacy: boolean;
  error?: string;
};

/** Asks every search provider for a few results, from this server, and reports how each answered. */
export async function probeProviders(): Promise<{ region: string; legacyEnabled: boolean; providers: ProviderStatus[] }> {
  const providers = await searchProviders();
  const statuses = await Promise.all(
    providers.map(async (p): Promise<ProviderStatus> => {
      const started = Date.now();
      try {
        const tracks = await withTimeout(p.id, p.timeoutMs, (signal) => p.searchTracks("love", 5, signal));
        return { id: p.id, ok: tracks.length > 0, ms: Date.now() - started, results: tracks.length, legacy: Boolean(p.legacy) };
      } catch (err) {
        return {
          id: p.id,
          ok: false,
          ms: Date.now() - started,
          results: 0,
          legacy: Boolean(p.legacy),
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );
  return {
    region: process.env.VERCEL_REGION ?? process.env.AWS_REGION ?? "local",
    legacyEnabled: legacySourcesEnabled(),
    providers: statuses,
  };
}
