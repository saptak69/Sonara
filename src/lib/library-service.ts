/**
 * Server functions for a listener's library: playlists, liked songs, listening
 * history and playback settings. Every write is idempotent (safe to retry),
 * because the client queues changes made offline and replays them later.
 */
import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware, optionalAuthMiddleware } from "@/lib/auth/middleware";
import type { Playlist, Track } from "@/lib/types";

// ── Validation ────────────────────────────────────────────────────────────────

const TrackInput = z.object({
  id: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  artist: z.string().min(1).max(300),
  artistId: z.string().max(200).optional(),
  album: z.string().max(300).optional(),
  artwork: z.string().max(2000).nullable().optional(),
  artworkLg: z.string().max(2000).nullable().optional(),
  duration: z.number().nonnegative().default(0),
  streamUrl: z.string().min(1).max(4000),
  genre: z.string().max(100).optional(),
  mood: z.string().max(100).optional(),
  kind: z.enum(["track", "radio"]).default("track"),
});
type TrackInput = z.infer<typeof TrackInput>;

// Client-generated ids, e.g. "pl_3f2c…". Restricting the alphabet keeps them URL-safe.
const PlaylistId = z.string().regex(/^[A-Za-z0-9_-]{6,80}$/, "Invalid playlist id");

const SettingsInput = z
  .object({
    autoplay: z.boolean(),
    volumeNormalization: z.boolean(),
    equalizerEnabled: z.boolean(),
    equalizerBands: z.array(z.number().min(-12).max(12)).length(5),
    bassBoost: z.number().min(0).max(10),
    equalizerPreset: z.string().max(40),
    playbackRate: z.number().min(0.5).max(3),
  })
  .partial();
export type LibrarySettings = z.infer<typeof SettingsInput>;

// ── Row mapping ───────────────────────────────────────────────────────────────

type TrackRow = {
  trackId: string;
  title: string;
  artist: string;
  artwork: string | null;
  artworkLg: string | null;
  duration: number;
  streamUrl: string;
  genre?: string | null;
};

function toTrack(row: TrackRow): Track {
  return {
    id: row.trackId,
    title: row.title,
    artist: row.artist,
    artwork: row.artwork,
    artworkLg: row.artworkLg ?? row.artwork,
    duration: Number(row.duration) || 0,
    streamUrl: row.streamUrl,
    genre: row.genre ?? undefined,
    kind: "track",
  };
}

const TRACK_COLUMNS = `
  track_id as "trackId", title, artist, artwork, artwork_lg as "artworkLg",
  duration, stream_url as "streamUrl"`;

// ── Reads ─────────────────────────────────────────────────────────────────────

export type LibrarySnapshot = {
  playlists: Array<{ id: string; name: string; description: string | null; createdAt: number; tracks: Track[] }>;
  likedTracks: Track[];
  recentlyPlayed: Track[];
  settings: LibrarySettings | null;
};

/** Everything the app needs to restore a user's library on a new device. */
export const getLibrarySnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LibrarySnapshot> => {
    const sql = await getSql();
    const userId = context.userId;

    const [playlistRows, likedRows, recentRows, settingsRows] = await Promise.all([
      sql<{ id: string; name: string; description: string | null; createdAt: string }>`
        select id, name, description, created_at as "createdAt"
        from "user_playlist" where user_id = ${userId}
        order by created_at desc`,
      sql.query<TrackRow>(
        `select ${TRACK_COLUMNS} from "user_favorite" where user_id = $1 order by created_at desc limit 2000`,
        [userId],
      ),
      // Latest play of each track, newest first.
      sql.query<TrackRow>(
        `select ${TRACK_COLUMNS}, genre from (
           select distinct on (track_id) * from "user_play_history"
           where user_id = $1 and stream_url not like 'blob:%'
           order by track_id, played_at desc
         ) latest
         order by played_at desc limit 40`,
        [userId],
      ),
      sql<{ settings: LibrarySettings }>`select settings from "user_settings" where user_id = ${userId}`,
    ]);

    const ids = playlistRows.map((p) => p.id);
    const trackRows = ids.length
      ? await sql.query<TrackRow & { playlistId: string }>(
          `select playlist_id as "playlistId", ${TRACK_COLUMNS}, genre
           from "playlist_track" where playlist_id = any($1)
           order by position asc, added_at asc`,
          [ids],
        )
      : [];

    const byPlaylist = new Map<string, Track[]>();
    for (const row of trackRows) {
      const list = byPlaylist.get(row.playlistId) ?? [];
      list.push(toTrack(row));
      byPlaylist.set(row.playlistId, list);
    }

    return {
      playlists: playlistRows.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: new Date(p.createdAt).getTime(),
        tracks: byPlaylist.get(p.id) ?? [],
      })),
      likedTracks: likedRows.map(toTrack),
      recentlyPlayed: recentRows.map(toTrack),
      settings: settingsRows[0]?.settings ?? null,
    };
  });

/** A playlist page. Only the owner can see it unless it has been made public. */
export const getPlaylistById = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data, context }): Promise<Playlist | null> => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      description: string | null;
      userId: string;
      isPublic: boolean;
      ownerName: string | null;
    }>`
      select p.id, p.name, p.description, p.user_id as "userId", p.is_public as "isPublic", u.name as "ownerName"
      from "user_playlist" p left join "user" u on u.id = p.user_id
      where p.id = ${data.id} limit 1`;

    const playlist = rows[0];
    if (!playlist) return null;
    if (!playlist.isPublic && playlist.userId !== context.userId) return null;

    const tracks = (
      await sql.query<TrackRow>(
        `select ${TRACK_COLUMNS}, genre from "playlist_track"
         where playlist_id = $1 order by position asc, added_at asc`,
        [playlist.id],
      )
    ).map(toTrack);

    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description ?? undefined,
      artwork: tracks[0]?.artwork ?? null,
      artworkLg: tracks[0]?.artworkLg ?? null,
      trackCount: tracks.length,
      isAlbum: false,
      owner: playlist.ownerName ?? undefined,
      ownerId: playlist.userId,
      tracks,
    };
  });

// ── Writes ────────────────────────────────────────────────────────────────────

async function assertOwnsPlaylist(playlistId: string, userId: string) {
  const sql = await getSql();
  const rows = await sql`select 1 from "user_playlist" where id = ${playlistId} and user_id = ${userId}`;
  if (!rows.length) throw new Error("Playlist not found");
}

/** JSON payload for the batched inserts below (one round trip, however many tracks). */
function tracksJson(tracks: TrackInput[]): string {
  return JSON.stringify(
    tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      artwork: t.artwork ?? null,
      artworkLg: t.artworkLg ?? null,
      duration: Math.round(t.duration),
      streamUrl: t.streamUrl,
      genre: t.genre ?? null,
    })),
  );
}

// Expands the JSON array into rows `t` with fields and a 1-based position `n`.
const TRACK_ROWS = `
  (select e.n,
          e.v->>'id' as id, e.v->>'title' as title, e.v->>'artist' as artist,
          e.v->>'artwork' as artwork, e.v->>'artworkLg' as "artworkLg",
          (e.v->>'duration')::int as duration, e.v->>'streamUrl' as "streamUrl",
          e.v->>'genre' as genre
   from jsonb_array_elements($2::jsonb) with ordinality as e(v, n)) t`;

async function insertPlaylistTracks(playlistId: string, tracks: TrackInput[]) {
  if (!tracks.length) return;
  const sql = await getSql();
  // New tracks go after the current last position, in the order given.
  await sql.query(
    `insert into "playlist_track"
       (id, playlist_id, track_id, title, artist, artwork, artwork_lg, duration, stream_url, genre, position)
     select 'plt_' || gen_random_uuid()::text, $1::text, t.id, t.title, t.artist, t.artwork, t."artworkLg",
            coalesce(t.duration, 0), t."streamUrl", t.genre,
            (select coalesce(max(position), -1) from "playlist_track" where playlist_id = $1::text) + t.n::int
     from ${TRACK_ROWS}
     on conflict (playlist_id, track_id) do nothing`,
    [playlistId, tracksJson(tracks)],
  );
}

/** `tracks` newest first; timestamps are staggered so that order survives. */
async function insertFavorites(userId: string, tracks: TrackInput[]) {
  if (!tracks.length) return;
  const sql = await getSql();
  await sql.query(
    `insert into "user_favorite"
       (id, user_id, track_id, title, artist, artwork, artwork_lg, duration, stream_url, created_at)
     select 'fav_' || gen_random_uuid()::text, $1::text, t.id, t.title, t.artist, t.artwork, t."artworkLg",
            coalesce(t.duration, 0), t."streamUrl", now() - (t.n::float8 * interval '1 millisecond')
     from ${TRACK_ROWS}
     on conflict (user_id, track_id) do nothing`,
    [userId, tracksJson(tracks)],
  );
}

export const createPlaylist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: { id: string; name: string; tracks?: TrackInput[] }) =>
    z
      .object({
        id: PlaylistId,
        name: z.string().trim().min(1).max(100),
        tracks: z.array(TrackInput).max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`
      insert into "user_playlist" (id, user_id, name)
      values (${data.id}, ${context.userId}, ${data.name})
      on conflict (id) do nothing`;
    // If the id already existed it must be ours; otherwise this throws.
    await assertOwnsPlaylist(data.id, context.userId);
    await insertPlaylistTracks(data.id, data.tracks ?? []);
    return { id: data.id };
  });

export const renamePlaylist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: { id: string; name: string }) =>
    z.object({ id: PlaylistId, name: z.string().trim().min(1).max(100) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`
      update "user_playlist" set name = ${data.name}, updated_at = now()
      where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true };
  });

export const deletePlaylist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: { id: string }) => z.object({ id: PlaylistId }).parse(data))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`delete from "user_playlist" where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true };
  });

export const addTrackToPlaylist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: { playlistId: string; track: TrackInput }) =>
    z.object({ playlistId: PlaylistId, track: TrackInput }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertOwnsPlaylist(data.playlistId, context.userId);
    await insertPlaylistTracks(data.playlistId, [data.track]);
    const sql = await getSql();
    await sql`update "user_playlist" set updated_at = now() where id = ${data.playlistId}`;
    return { ok: true };
  });

export const removeTrackFromPlaylist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: { playlistId: string; trackId: string }) =>
    z.object({ playlistId: PlaylistId, trackId: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertOwnsPlaylist(data.playlistId, context.userId);
    const sql = await getSql();
    await sql`delete from "playlist_track" where playlist_id = ${data.playlistId} and track_id = ${data.trackId}`;
    return { ok: true };
  });

/** Like or unlike. Takes the desired state rather than toggling, so retries are harmless. */
export const setTrackLiked = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: { track: TrackInput; liked: boolean }) =>
    z.object({ track: TrackInput, liked: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const { track } = data;
    if (data.liked) {
      await insertFavorites(context.userId, [track]);
    } else {
      await sql`delete from "user_favorite" where user_id = ${context.userId} and track_id = ${track.id}`;
    }
    return { liked: data.liked };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: LibrarySettings) => SettingsInput.parse(data))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`
      insert into "user_settings" (user_id, settings, updated_at)
      values (${context.userId}, ${JSON.stringify(data)}::jsonb, now())
      on conflict (user_id) do update
        set settings = "user_settings".settings || excluded.settings, updated_at = now()`;
    return { ok: true };
  });

/**
 * Called once right after someone signs in on a device where they had been
 * listening as a guest: their guest playlists and likes join their account.
 */
export const importGuestLibrary = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    (data: { playlists: Array<{ id: string; name: string; tracks: TrackInput[] }>; likedTracks: TrackInput[] }) =>
      z
        .object({
          playlists: z
            .array(z.object({ id: PlaylistId, name: z.string().trim().min(1).max(100), tracks: z.array(TrackInput).max(500) }))
            .max(100),
          likedTracks: z.array(TrackInput).max(2000),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const userId = context.userId;

    for (const playlist of data.playlists) {
      // Devices from before sync existed may hold copies of playlists the account
      // already has; a same-named playlist is treated as the same one.
      const inserted = await sql<{ id: string }>`
        insert into "user_playlist" (id, user_id, name)
        select ${playlist.id}, ${userId}, ${playlist.name}
        where not exists (
          select 1 from "user_playlist" where user_id = ${userId} and lower(name) = lower(${playlist.name})
        )
        on conflict (id) do nothing
        returning id`;
      // Only fill playlists we just created; never touch someone else's.
      if (inserted.length) await insertPlaylistTracks(playlist.id, playlist.tracks);
    }

    await insertFavorites(userId, data.likedTracks);
    return { ok: true };
  });

// ── Listening history ─────────────────────────────────────────────────────────

export const recordPlayHistoryServerFn = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .inputValidator(
    (data: {
      track: TrackInput;
      sessionId: string;
      durationPlayed?: number;
      completed?: boolean;
      skipped?: boolean;
      earlySkip?: boolean;
      explicitSkip?: boolean;
    }) =>
      z
        .object({
          track: TrackInput,
          sessionId: z.string().min(1).max(100),
          durationPlayed: z.number().nonnegative().max(60 * 60 * 6).optional(),
          completed: z.boolean().optional(),
          skipped: z.boolean().optional(),
          earlySkip: z.boolean().optional(),
          explicitSkip: z.boolean().optional(),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const { track } = data;
    await sql`
      insert into "user_play_history" (
        id, user_id, session_id, track_id, title, artist, artwork, artwork_lg, duration, stream_url,
        duration_played, completed, skipped, early_skip, genre
      ) values (
        ${`hist_${randomUUID()}`}, ${context.userId}, ${data.sessionId}, ${track.id}, ${track.title},
        ${track.artist}, ${track.artwork ?? null}, ${track.artworkLg ?? null}, ${Math.round(track.duration)},
        ${track.streamUrl}, ${Math.round(data.durationPlayed ?? 0)}, ${Boolean(data.completed)},
        ${Boolean(data.skipped || data.earlySkip || data.explicitSkip)}, ${Boolean(data.earlySkip)},
        ${track.genre ?? null}
      )`;
    return { success: true };
  });

/** Most played tracks across all listeners. */
export const getDatabaseTrendingServerFn = createServerFn({ method: "GET" })
  .inputValidator((data: { limit?: number }) =>
    z.object({ limit: z.number().int().min(1).max(50).optional() }).parse(data),
  )
  .handler(async ({ data }): Promise<Track[]> => {
    const sql = await getSql();
    const rows = await sql.query<TrackRow & { playCount: number }>(
      `select ${TRACK_COLUMNS}, count(*)::int as "playCount"
       from "user_play_history"
       where played_at > now() - interval '30 days'
       group by track_id, title, artist, artwork, artwork_lg, duration, stream_url
       order by "playCount" desc, max(played_at) desc
       limit $1`,
      [data.limit ?? 12],
    );
    return rows.map((row) => ({ ...toTrack(row), playCount: row.playCount }));
  });
