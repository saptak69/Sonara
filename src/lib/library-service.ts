import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { Playlist, Track } from "@/lib/types";

// Schema validations
const TrackSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(250),
  artist: z.string().min(1).max(250),
  artistId: z.string().optional(),
  album: z.string().optional(),
  artwork: z.string().nullable().optional(),
  artworkLg: z.string().nullable().optional(),
  duration: z.number().default(0),
  streamUrl: z.string().min(1),
  genre: z.string().optional(),
  mood: z.string().optional(),
  kind: z.enum(["track", "radio"]).default("track"),
});

const CreatePlaylistSchema = z.object({
  name: z.string().trim().min(1, "Playlist name is required").max(100),
  description: z.string().trim().max(500).optional(),
});

const AddToPlaylistSchema = z.object({
  playlistId: z.string(),
  track: TrackSchema,
});

const RemoveFromPlaylistSchema = z.object({
  playlistId: z.string(),
  trackId: z.string(),
});

// 1. Fetch user playlists with their tracks
export const getUserPlaylistsServerFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Playlist[]> => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      description: string | null;
      coverArtUrl: string | null;
      createdAt: string;
    }>`
      select
        id,
        name,
        description,
        cover_art_url as "coverArtUrl",
        created_at as "createdAt"
      from "user_playlist"
      where user_id = ${context.userId}
      order by created_at desc
    `;

    if (!rows.length) return [];

    const playlistIds = rows.map((r) => r.id);
    const tracks = await sql<{
      id: string;
      playlistId: string;
      trackId: string;
      title: string;
      artist: string;
      artwork: string | null;
      artworkLg: string | null;
      duration: number;
      streamUrl: string;
      genre: string | null;
      position: number;
    }>`
      select
        id,
        playlist_id as "playlistId",
        track_id as "trackId",
        title,
        artist,
        artwork,
        artwork_lg as "artworkLg",
        duration,
        stream_url as "streamUrl",
        genre,
        position
      from "playlist_track"
      where playlist_id = any(${playlistIds})
      order by position asc, added_at asc
    `;

    const trackMap = new Map<string, Track[]>();
    for (const t of tracks) {
      const list = trackMap.get(t.playlistId) || [];
      list.push({
        id: t.trackId,
        title: t.title,
        artist: t.artist,
        artwork: t.artwork,
        artworkLg: t.artworkLg,
        duration: t.duration,
        streamUrl: t.streamUrl,
        genre: t.genre || undefined,
        kind: "track",
      });
      trackMap.set(t.playlistId, list);
    }

    return rows.map((p) => {
      const pTracks = trackMap.get(p.id) || [];
      const art = p.coverArtUrl || pTracks[0]?.artwork || null;
      const artLg = p.coverArtUrl || pTracks[0]?.artworkLg || art;
      return {
        id: p.id,
        name: p.name,
        description: p.description || undefined,
        artwork: art,
        artworkLg: artLg,
        trackCount: pTracks.length,
        isAlbum: false,
        tracks: pTracks,
      };
    });
  });

// 2. Fetch single playlist by ID (public or user-owned)
export const getPlaylistByIdServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }): Promise<Playlist | null> => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      description: string | null;
      coverArtUrl: string | null;
      userId: string;
      createdAt: string;
    }>`
      select
        id,
        name,
        description,
        cover_art_url as "coverArtUrl",
        user_id as "userId",
        created_at as "createdAt"
      from "user_playlist"
      where id = ${data.id}
      limit 1
    `;

    if (!rows.length) return null;
    const p = rows[0];

    const tracks = await sql<{
      trackId: string;
      title: string;
      artist: string;
      artwork: string | null;
      artworkLg: string | null;
      duration: number;
      streamUrl: string;
      genre: string | null;
    }>`
      select
        track_id as "trackId",
        title,
        artist,
        artwork,
        artwork_lg as "artworkLg",
        duration,
        stream_url as "streamUrl",
        genre
      from "playlist_track"
      where playlist_id = ${p.id}
      order by position asc, added_at asc
    `;

    const mappedTracks: Track[] = tracks.map((t) => ({
      id: t.trackId,
      title: t.title,
      artist: t.artist,
      artwork: t.artwork,
      artworkLg: t.artworkLg,
      duration: t.duration,
      streamUrl: t.streamUrl,
      genre: t.genre || undefined,
      kind: "track",
    }));

    return {
      id: p.id,
      name: p.name,
      description: p.description || undefined,
      artwork: p.coverArtUrl || mappedTracks[0]?.artwork || null,
      artworkLg: p.coverArtUrl || mappedTracks[0]?.artworkLg || null,
      trackCount: mappedTracks.length,
      isAlbum: false,
      ownerId: p.userId,
      tracks: mappedTracks,
    };
  });

// 3. Create a new user playlist
export const createUserPlaylistServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: z.infer<typeof CreatePlaylistSchema>) => CreatePlaylistSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ id: string; name: string }> => {
    const sql = await getSql();
    const id = "pl_" + randomUUID();
    const sanitizedName = data.name.trim();
    const sanitizedDesc = data.description?.trim() || null;

    await sql`
      insert into "user_playlist" (id, user_id, name, description)
      values (${id}, ${context.userId}, ${sanitizedName}, ${sanitizedDesc})
    `;

    return { id, name: sanitizedName };
  });

// 4. Add track to playlist
export const addTrackToPlaylistServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: z.infer<typeof AddToPlaylistSchema>) => AddToPlaylistSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ success: boolean }> => {
    const sql = await getSql();

    // Verify ownership
    const playlist = await sql`
      select id from "user_playlist"
      where id = ${data.playlistId} and user_id = ${context.userId}
      limit 1
    `;
    if (!playlist.length) throw new Error("Playlist not found or permission denied");

    // Get max position
    const posRow = await sql<{ maxPos: number | null }>`
      select max(position) as "maxPos"
      from "playlist_track"
      where playlist_id = ${data.playlistId}
    `;
    const nextPos = (posRow[0]?.maxPos ?? -1) + 1;

    const id = "plt_" + randomUUID();
    await sql`
      insert into "playlist_track" (
        id, playlist_id, track_id, title, artist, artwork, artwork_lg, duration, stream_url, genre, position
      ) values (
        ${id},
        ${data.playlistId},
        ${data.track.id},
        ${data.track.title},
        ${data.track.artist},
        ${data.track.artwork || null},
        ${data.track.artworkLg || null},
        ${data.track.duration || 0},
        ${data.track.streamUrl},
        ${data.track.genre || null},
        ${nextPos}
      )
    `;

    return { success: true };
  });

// 5. Remove track from playlist
export const removeTrackFromPlaylistServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: z.infer<typeof RemoveFromPlaylistSchema>) => RemoveFromPlaylistSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ success: boolean }> => {
    const sql = await getSql();
    const playlist = await sql`
      select id from "user_playlist"
      where id = ${data.playlistId} and user_id = ${context.userId}
      limit 1
    `;
    if (!playlist.length) throw new Error("Playlist not found or permission denied");

    await sql`
      delete from "playlist_track"
      where playlist_id = ${data.playlistId} and track_id = ${data.trackId}
    `;

    return { success: true };
  });

// 6. Delete user playlist
export const deleteUserPlaylistServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }): Promise<{ success: boolean }> => {
    const sql = await getSql();
    await sql`
      delete from "user_playlist"
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { success: true };
  });

// 7. Get user favorites (likes)
export const getUserFavoritesServerFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Track[]> => {
    const sql = await getSql();
    const rows = await sql<{
      trackId: string;
      title: string;
      artist: string;
      artwork: string | null;
      artworkLg: string | null;
      duration: number;
      streamUrl: string;
    }>`
      select
        track_id as "trackId",
        title,
        artist,
        artwork,
        artwork_lg as "artworkLg",
        duration,
        stream_url as "streamUrl"
      from "user_favorite"
      where user_id = ${context.userId}
      order by created_at desc
    `;

    return rows.map((r) => ({
      id: r.trackId,
      title: r.title,
      artist: r.artist,
      artwork: r.artwork,
      artworkLg: r.artworkLg,
      duration: r.duration,
      streamUrl: r.streamUrl,
      kind: "track",
    }));
  });

// 8. Toggle user favorite
export const toggleUserFavoriteServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { track: z.infer<typeof TrackSchema> }) =>
    z.object({ track: TrackSchema }).parse(data)
  )
  .handler(async ({ data, context }): Promise<{ liked: boolean }> => {
    const sql = await getSql();
    const existing = await sql<{ id: string }>`
      select id from "user_favorite"
      where user_id = ${context.userId} and track_id = ${data.track.id}
      limit 1
    `;

    if (existing.length) {
      await sql`
        delete from "user_favorite"
        where user_id = ${context.userId} and track_id = ${data.track.id}
      `;
      return { liked: false };
    }

    const id = "fav_" + randomUUID();
    await sql`
      insert into "user_favorite" (
        id, user_id, track_id, title, artist, artwork, artwork_lg, duration, stream_url
      ) values (
        ${id},
        ${context.userId},
        ${data.track.id},
        ${data.track.title},
        ${data.track.artist},
        ${data.track.artwork || null},
        ${data.track.artworkLg || null},
        ${data.track.duration || 0},
        ${data.track.streamUrl}
      )
    `;
    return { liked: true };
  });

// 9. Record play history in database
export const recordPlayHistoryServerFn = createServerFn({ method: "POST" })
  .validator((data: {
    track: z.infer<typeof TrackSchema>;
    sessionId: string;
    durationPlayed?: number;
    completed?: boolean;
    skipped?: boolean;
    earlySkip?: boolean;
    explicitSkip?: boolean;
  }) =>
    z.object({
      track: TrackSchema,
      sessionId: z.string().min(1),
      durationPlayed: z.number().optional(),
      completed: z.boolean().optional(),
      skipped: z.boolean().optional(),
      earlySkip: z.boolean().optional(),
      explicitSkip: z.boolean().optional(),
    }).parse(data)
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const sql = await getSql();
    const id = "hist_" + randomUUID();

    // Check optional authenticated user
    let userId: string | null = null;
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const sessionUser = await getSessionUser();
      if (sessionUser?.id) userId = sessionUser.id;
    } catch {
      // Unauthenticated / guest play
    }

    const durationPlayed = Math.round(data.durationPlayed || 0);
    const completed = Boolean(data.completed);
    const skipped = Boolean(data.skipped || data.earlySkip || data.explicitSkip);
    const earlySkip = Boolean(data.earlySkip);
    const genre = data.track.genre || null;

    await sql`
      insert into "user_play_history" (
        id, user_id, session_id, track_id, title, artist, artwork, artwork_lg, duration, stream_url,
        duration_played, completed, skipped, early_skip, genre
      ) values (
        ${id},
        ${userId},
        ${data.sessionId},
        ${data.track.id},
        ${data.track.title},
        ${data.track.artist},
        ${data.track.artwork || null},
        ${data.track.artworkLg || null},
        ${data.track.duration || 0},
        ${data.track.streamUrl},
        ${durationPlayed},
        ${completed},
        ${skipped},
        ${earlySkip},
        ${genre}
      )
    `;

    return { success: true };
  });

// 10. Fetch real aggregated trending tracks from database play history
export const getDatabaseTrendingServerFn = createServerFn({ method: "GET" })
  .validator((data: { limit?: number }) => z.object({ limit: z.number().optional() }).parse(data))
  .handler(async ({ data }): Promise<Track[]> => {
    const sql = await getSql();
    const limit = data.limit || 12;

    const rows = await sql<{
      trackId: string;
      title: string;
      artist: string;
      artwork: string | null;
      artworkLg: string | null;
      duration: number;
      streamUrl: string;
      playCount: number;
    }>`
      select
        track_id as "trackId",
        title,
        artist,
        artwork,
        artwork_lg as "artworkLg",
        duration,
        stream_url as "streamUrl",
        count(*)::int as "playCount"
      from "user_play_history"
      group by track_id, title, artist, artwork, artwork_lg, duration, stream_url
      order by "playCount" desc, max(played_at) desc
      limit ${limit}
    `;

    return rows.map((r) => ({
      id: r.trackId,
      title: r.title,
      artist: r.artist,
      artwork: r.artwork,
      artworkLg: r.artworkLg,
      duration: r.duration,
      streamUrl: r.streamUrl,
      playCount: r.playCount,
      kind: "track",
    }));
  });
