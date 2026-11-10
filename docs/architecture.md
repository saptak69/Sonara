# Sonara architecture (Phase 2)

This is the target design for Sonara's music layer, and the plan for getting there
in small, deployable steps. It builds on the Phase 1 audit. Anything not listed
under "Changes" stays as it is.

## Ground rules

- **Zero cost.** Only free tiers and keyless or free-key APIs. Hosting stays on Vercel Hobby and Neon free.
- **Sanctioned sources only for new work.** New features use APIs whose terms allow this use. The existing
  JioSaavn adapter (decrypted media URLs) and SoundCloud adapter (scraped client ids) keep running, but sit
  behind a switch (`SONARA_LEGACY_SOURCES`, on by default for now) and nothing new depends on them.
- **No fake data.** When a provider fails, show an honest empty state with a retry button. Never show invented songs or playlists.
- **Licences.** Parachord is MIT, so its code may be adapted with attribution. Nuclear and muffon are AGPL-3.0:
  learn from their patterns, copy no code.

## Free providers

| Provider | Key | Gives | Plays | Limits |
| --- | --- | --- | --- | --- |
| Audius | none (`app_name` param) | search, tracks, artists, playlists, trending | full streams | public API, attribution |
| Deezer API | none | search, albums, artists, related artists, charts, **ISRC** | 30 s previews | ~50 req / 5 s |
| iTunes Search | none | search, albums, ISRC-free metadata | 30 s previews | ~20 req / min |
| MusicBrainz | none (UA required) | canonical ids, ISRC → recording, release groups | — | 1 req / s |
| Wikipedia / Wikidata | none | artist bios, images, external links | — | polite UA |
| LRCLIB | none | synced and plain lyrics | — | polite UA |
| Internet Archive | none | live recordings, public-domain audio | full streams | — |
| radio-browser | none | live stations | live streams | — |
| Jamendo | free client id | CC-licensed catalogue | full streams | non-commercial |
| Studio uploads | Vercel Blob free tier | artists' own songs | full streams | 1 GB storage |
| Legacy: JioSaavn, SoundCloud | — | existing catalogue | full streams | behind the switch |

## Module layout

All provider traffic moves server-side under `src/server/music/`. The UI keeps calling server functions with
the same names and shapes, which become thin wrappers.

```
src/server/music/
  model.ts          Track, ArtistRef, AlbumRef, SourceRef, StreamCandidate (zod schemas + types)
  normalize.ts      title/artist normalisation, version tags (remix, live, acoustic, clean, sped up)
  match.ts          identity key + confidence scoring (Parachord's gate, re-implemented)
  registry.ts       provider list, priority, enable switches, health
  limiter.ts        per-provider concurrency, min gap, cooldown; foreground and background lanes
  providers/
    audius.ts deezer.ts itunes.ts musicbrainz.ts wikipedia.ts lrclib.ts archive.ts radio-browser.ts
    studio.ts            Sonara's own uploads (Postgres)
    legacy-saavn.ts      wraps today's saavn-api.ts unchanged
    legacy-soundcloud.ts wraps today's soundcloud-api.ts unchanged
  search.ts         fan-out search with a time budget, merge, rank
  resolve.ts        track -> ordered stream candidates
  discovery.ts      home feed, radio sessions, "up next"
```

## Provider contract

```ts
type Capability = "search" | "track" | "artist" | "album" | "related" | "stream" | "lyrics" | "charts";

type MusicProvider = {
  id: string;                     // "audius", "deezer", ...
  capabilities: Capability[];
  priority: number;               // lower plays first
  limits: { concurrency: number; minGapMs: number; timeoutMs: number };
  enabled(): boolean;             // env switch + health
  search?(q: SearchQuery, signal: AbortSignal): Promise<SearchPage>;
  getTrack?(id: string, signal: AbortSignal): Promise<Track | null>;
  getArtist?(id: string, signal: AbortSignal): Promise<ArtistPage | null>;
  getAlbum?(id: string, signal: AbortSignal): Promise<AlbumPage | null>;
  related?(track: Track, signal: AbortSignal): Promise<Track[]>;
  streams?(track: Track, signal: AbortSignal): Promise<StreamCandidate[]>;
};
```

Every call goes through the registry, which adds the timeout, the limiter lane and error normalisation
(`ProviderError { provider, kind: "timeout" | "rate-limited" | "not-found" | "upstream" }`). After
three rate-limit errors in a row a provider cools down for 30 s and drops out of fan-out until then.

## Music model

```ts
type SourceRef = { provider: string; id: string; url?: string };

type Track = {
  key: string;            // stable identity, see below
  title: string;          // display title
  artists: { name: string; source?: SourceRef }[];
  album?: { title: string; source?: SourceRef };
  durationMs?: number;
  isrc?: string;          // upper-case, [A-Z]{2}[A-Z0-9]{3}\d{7}
  explicit?: boolean;
  version?: "remix" | "live" | "acoustic" | "instrumental" | "sped-up" | "slowed" | "radio-edit";
  artwork?: { url: string; size: number }[];
  sources: SourceRef[];   // every provider that has this recording
  limitedPlayback?: boolean; // only previews available
};

type StreamCandidate = {
  source: SourceRef;
  url: string;            // resolved on demand, never stored in Postgres
  kind: "full" | "preview" | "live";
  confidence: number;     // 0..1 from match.ts
  failed?: boolean;
};
```

The client keeps using today's flat `Track` type while Phase 3 runs. An adapter converts between the two, so
the store, the queue and the offline cache keep working unchanged.

**Identity key.** `isrc:<ISRC>` when an ISRC is known. Otherwise
`n:<normalised primary artist>|<normalised title>|<version or "orig">`. Two results with the same key are the
same recording; their `sources` are merged.

## Matching

Adapted from Parachord's confidence gate (MIT):

1. Same ISRC (or MusicBrainz recording id): **1.0**.
2. Both the artist and the title match after normalisation, and the durations are within 3 s
   (or unknown): **0.95**.
3. Both match but the length differs by more than 10 s, or the version tags differ: **0.7**.
   A live recording or a remix is a different recording.
4. Only one of artist or title matches: **0.5**.

Candidates below **0.6** are dropped *before* sorting. The rest are sorted by: full stream before preview,
then provider priority, then confidence. This way a wrong-artist match from a higher-priority provider can
never win.

Normalisation: NFKD, strip accents, lower-case, drop brackets that hold soundtrack notes ("From …") or
featuring credits, treat `&`, `and`, `x`, `,` and `feat.` as artist separators, collapse whitespace. Tested
against a table of example credits and titles (`match.test.ts`).

## Stream resolution and playback

Following Nuclear's queue-item state machine:

```
idle -> resolving -> ready -> playing
           |           |
           +-> failed  +-> (stream error) try next candidate -> ... -> failed -> skip
```

- `resolve(track)` returns candidates in the order above: the downloaded copy first, then full streams, then previews.
- A new play cancels the resolution in progress (`AbortController`). Stale results are ignored.
- The engine keeps one record of tried fallbacks per track (done in Phase 3a, `src/lib/playback-recovery.ts`).
  Phase 3c swaps its fixed steps for the candidate list.
- The audio controller moves out of React into a plain class (`src/lib/audio/controller.ts`) with one owned
  pair of `<audio>` elements. React only renders state. `currentTime` moves to its own small store so the
  library store stops waking up four times a second.
- Optional crossfade (0–12 s) uses gain ramps across the two elements. It is off by default and turned off
  for live radio.

## Data (migration 0006, additive)

```
track          (key pk, title, primary_artist, album, duration_ms, isrc, version, explicit, artwork, updated_at)
track_source   (track_key fk, provider, provider_id, url, pk(track_key, provider))
saved_album    (user_id, provider, album_id, title, artist, artwork, created_at)
saved_artist   (user_id, provider, artist_id, name, artwork, created_at)
provider_cache (key pk, value jsonb, expires_at)   -- album, artist and match results; never stream URLs
```

Existing tables gain a nullable `track_key`, filled in from existing rows. `stream_url` stays
until every reader uses `track_key`, then becomes nullable (a later migration, never dropped in the same
release).

## Caching

| What | Where | TTL |
| --- | --- | --- |
| Search results | in-memory LRU (per instance) | 5 min |
| Album / artist pages | memory + `provider_cache` | 24 h |
| Match results (track key → sources) | `provider_cache` | 7 days |
| Lyrics | memory | 24 h (misses cached too) |
| Stream URLs | never persisted; per-play only | — |

Identical requests in flight are merged by `serverCache.getOrFetch` (already in place).

## Search

`search(q)` fans out to every enabled provider with a search capability, with a 2.5 s total budget. Late
providers are dropped from this response, not waited on. Results are merged by identity key and ranked by:

1. exact normalised title or artist match
2. original version over remix, live or cover
3. playable full stream over preview
4. popularity (provider play counts, normalised per provider)

The client renders tracks first, then albums and artists, so results appear as they're ready.

## Changes, step by step

| Step | What | Status |
| --- | --- | --- |
| 3a | Proxy lockdown, recovery state, single autoplay path, shuffle by id, lyrics by duration, Blob uploads | done |
| 3b | Music core in `src/lib/music/` (match, resilience, providers, catalog), legacy switch `SONARA_LEGACY_SOURCES` | done |
| 3c | Audius + iTunes + Deezer + Studio adapters; merged, ranked search; Audius trending rail; no fake fallbacks; `/api/providers` status page | done (MusicBrainz next) |
| 3d | Audio engine split into `components/player/engine/*` hooks | done (candidate resolver and crossfade next) |
| 4  | Migration 0006, saved albums and artists, radio sessions, artist and album pages, listening timeline | |
| 5  | Visual pass, starting with the player | |
| 6  | QA: Playwright smoke at phone, tablet and desktop sizes, provider-failure tests | |
| 7  | Final audit against the Phase 1 matrix | |

## What stays

Better Auth and `check:auth`; the offline edit queue in `library-sync.ts`; the SSRF guard; the recommendation
scoring engine and its tests; the search-suggestion race handling; TV remote navigation; design tokens in
`src/styles.css`; Kysely, the SQL migrations and PGLite for local use.
