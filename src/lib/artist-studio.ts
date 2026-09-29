import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export type ArtistProfile = {
  id: string;
  userId: string;
  displayName: string;
  handle: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UploadedTrack = {
  id: string;
  artistId: string;
  userId: string;
  title: string;
  genre: string | null;
  mood: string | null;
  description: string | null;
  lyrics: string | null;
  coverArtUrl: string | null;
  audioUrl: string;
  storageKey: string;
  duration: number;
  fileSize: number;
  mimeType: string | null;
  playCount: number;
  status: "published" | "draft" | "processing" | "unlisted" | "deleted";
  rightsConfirmedAt: string;
  rightsConfirmationVersion: string;
  createdAt: string;
  publishedAt: string | null;
  updatedAt: string;
  // Join fields
  artistName?: string;
  artistHandle?: string;
  artistAvatar?: string | null;
  artistVerified?: boolean;
};

// 1. Get or initialize Artist Profile for current user
export const getOrCreateArtistProfileServerFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ArtistProfile> => {
    const sql = await getSql();
    const existing = await sql<ArtistProfile>`
      select
        id,
        user_id as "userId",
        display_name as "displayName",
        handle,
        bio,
        avatar_url as "avatarUrl",
        banner_url as "bannerUrl",
        verified,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from "artist_profile"
      where user_id = ${context.userId}
      limit 1
    `;

    if (existing.length && existing[0]) {
      return existing[0];
    }

    // Get user info to seed initial artist profile
    const users = await sql<{ name: string; email: string; image: string | null }>`
      select name, email, image from "user" where id = ${context.userId} limit 1
    `;
    const user = users[0];
    const rawName = user?.name || "Independent Artist";
    const cleanHandle = (rawName.toLowerCase().replace(/[^a-z0-9]/g, "") || "artist") + "_" + Math.floor(1000 + Math.random() * 9000);
    const profileId = `artist_${randomUUID()}`;

    await sql`
      insert into "artist_profile" (
        id, user_id, display_name, handle, bio, avatar_url, verified
      ) values (
        ${profileId},
        ${context.userId},
        ${rawName},
        ${cleanHandle},
        'Independent music creator on Sonara.',
        ${user?.image || null},
        false
      )
    `;

    const created = await sql<ArtistProfile>`
      select
        id,
        user_id as "userId",
        display_name as "displayName",
        handle,
        bio,
        avatar_url as "avatarUrl",
        banner_url as "bannerUrl",
        verified,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from "artist_profile"
      where id = ${profileId}
      limit 1
    `;

    return created[0];
  });

// 2. Update Artist Profile
export const updateArtistProfileServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    return z
      .object({
        displayName: z.string().min(1).max(80),
        handle: z.string().min(2).max(40).regex(/^[a-zA-Z0-9_]+$/, "Handle must be alphanumeric"),
        bio: z.string().max(500).optional().nullable(),
        avatarUrl: z.string().optional().nullable(),
        bannerUrl: z.string().optional().nullable(),
      })
      .parse(data);
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    // Check if handle is taken by another artist
    const checkHandle = await sql<{ id: string }>`
      select id from "artist_profile" where handle = ${data.handle} and user_id != ${context.userId} limit 1
    `;
    if (checkHandle.length > 0) {
      throw new Error("This handle is already taken by another artist.");
    }

    await sql`
      update "artist_profile"
      set
        display_name = ${data.displayName},
        handle = ${data.handle},
        bio = ${data.bio ?? null},
        avatar_url = ${data.avatarUrl ?? null},
        banner_url = ${data.bannerUrl ?? null},
        updated_at = CURRENT_TIMESTAMP
      where user_id = ${context.userId}
    `;

    return { success: true };
  });

// 3. Publish or Save Draft Track
export const publishTrackServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    return z
      .object({
        title: z.string().min(1, "Track title is required").max(120),
        genre: z.string().optional().nullable(),
        mood: z.string().optional().nullable(),
        description: z.string().max(1000).optional().nullable(),
        lyrics: z.string().max(10000).optional().nullable(),
        coverArtUrl: z.string().optional().nullable(),
        audioUrl: z.string().min(1, "Audio file is required"),
        storageKey: z.string().min(1, "Storage key is required"),
        duration: z.number().nonnegative().default(0),
        fileSize: z.number().nonnegative().default(0),
        mimeType: z.string().optional().nullable(),
        status: z.enum(["published", "draft"]).default("published"),
        rightsConfirmed: z.boolean().refine((val) => val === true, {
          message: "You must confirm you own/control the rights to this recording.",
        }),
      })
      .parse(data);
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();

    // Ensure artist profile exists
    const artists = await sql<{ id: string }>`
      select id from "artist_profile" where user_id = ${context.userId} limit 1
    `;
    let artistId = artists[0]?.id;
    if (!artistId) {
      artistId = `artist_${randomUUID()}`;
      await sql`
        insert into "artist_profile" (id, user_id, display_name, handle, verified)
        values (${artistId}, ${context.userId}, 'Independent Artist', ${'artist_' + Math.floor(1000 + Math.random() * 9000)}, false)
      `;
    }

    const trackId = `track_${randomUUID()}`;
    const publishedAt = data.status === "published" ? new Date().toISOString() : null;

    await sql`
      insert into "uploaded_tracks" (
        id,
        artist_id,
        user_id,
        title,
        genre,
        mood,
        description,
        lyrics,
        cover_art_url,
        audio_url,
        storage_key,
        duration,
        file_size,
        mime_type,
        play_count,
        status,
        rights_confirmed_at,
        rights_confirmation_version,
        published_at
      ) values (
        ${trackId},
        ${artistId},
        ${context.userId},
        ${data.title},
        ${data.genre ?? null},
        ${data.mood ?? null},
        ${data.description ?? null},
        ${data.lyrics ?? null},
        ${data.coverArtUrl ?? null},
        ${data.audioUrl},
        ${data.storageKey},
        ${Math.round(data.duration)},
        ${data.fileSize},
        ${data.mimeType ?? 'audio/mpeg'},
        0,
        ${data.status},
        CURRENT_TIMESTAMP,
        'v1',
        ${publishedAt}
      )
    `;

    return { success: true, trackId };
  });

// 4. Get My Artist Tracks (including drafts & stats)
export const getMyArtistTracksServerFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<UploadedTrack[]> => {
    const sql = await getSql();
    const rows = await sql<UploadedTrack>`
      select
        t.id,
        t.artist_id as "artistId",
        t.user_id as "userId",
        t.title,
        t.genre,
        t.mood,
        t.description,
        t.lyrics,
        t.cover_art_url as "coverArtUrl",
        t.audio_url as "audioUrl",
        t.storage_key as "storageKey",
        t.duration,
        t.file_size as "fileSize",
        t.mime_type as "mimeType",
        t.play_count as "playCount",
        t.status,
        t.rights_confirmed_at as "rightsConfirmedAt",
        t.rights_confirmation_version as "rightsConfirmationVersion",
        t.created_at as "createdAt",
        t.published_at as "publishedAt",
        t.updated_at as "updatedAt",
        a.display_name as "artistName",
        a.handle as "artistHandle",
        a.avatar_url as "artistAvatar",
        a.verified as "artistVerified"
      from "uploaded_tracks" t
      join "artist_profile" a on t.artist_id = a.id
      where t.user_id = ${context.userId} and t.status != 'deleted'
      order by t.created_at desc
    `;
    return rows;
  });

// 5. Delete an uploaded track (Soft-delete)
export const deleteArtistTrackServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    return z.object({ trackId: z.string() }).parse(data);
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update "uploaded_tracks"
      set status = 'deleted', deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      where id = ${data.trackId} and user_id = ${context.userId}
    `;
    return { success: true };
  });

// 6. Record Verified 30s Stream with Anti-Spam Cooldown
export const recordStreamServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    return z
      .object({
        trackId: z.string(),
        sessionId: z.string().min(8),
        durationPlayed: z.number().min(30, "Stream must reach 30 seconds threshold"),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    const sql = await getSql();

    // Verify track is published and exists
    const tracks = await sql<{ id: string; status: string }>`
      select id, status from "uploaded_tracks" where id = ${data.trackId} and status = 'published' limit 1
    `;
    if (!tracks.length) {
      return { counted: false, reason: "track_not_published" };
    }

    // Check if this session already counted this track within the 15-minute cooldown
    const recentPlays = await sql<{ id: string }>`
      select id from "track_plays"
      where track_id = ${data.trackId}
        and session_id = ${data.sessionId}
        and played_at > CURRENT_TIMESTAMP - INTERVAL '15 minutes'
      limit 1
    `;

    if (recentPlays.length > 0) {
      return { counted: false, reason: "cooldown_active" };
    }

    const playId = `play_${randomUUID()}`;
    await sql`
      insert into "track_plays" (id, track_id, session_id, duration_played)
      values (${playId}, ${data.trackId}, ${data.sessionId}, ${Math.round(data.durationPlayed)})
    `;

    await sql`
      update "uploaded_tracks"
      set play_count = play_count + 1, updated_at = CURRENT_TIMESTAMP
      where id = ${data.trackId}
    `;

    return { counted: true };
  });

// 7. Get Community Releases (Public Feed for Home/Explore/Search)
export const getCommunityReleasesServerFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    return z
      .object({
        limit: z.number().min(1).max(50).default(20),
        genre: z.string().optional(),
      })
      .optional()
      .parse(data);
  })
  .handler(async ({ data }): Promise<UploadedTrack[]> => {
    const sql = await getSql();
    const limit = data?.limit ?? 20;

    const rows = await sql<UploadedTrack>`
      select
        t.id,
        t.artist_id as "artistId",
        t.user_id as "userId",
        t.title,
        t.genre,
        t.mood,
        t.description,
        t.lyrics,
        t.cover_art_url as "coverArtUrl",
        t.audio_url as "audioUrl",
        t.storage_key as "storageKey",
        t.duration,
        t.file_size as "fileSize",
        t.mime_type as "mimeType",
        t.play_count as "playCount",
        t.status,
        t.rights_confirmed_at as "rightsConfirmedAt",
        t.rights_confirmation_version as "rightsConfirmationVersion",
        t.created_at as "createdAt",
        t.published_at as "publishedAt",
        t.updated_at as "updatedAt",
        a.display_name as "artistName",
        a.handle as "artistHandle",
        a.avatar_url as "artistAvatar",
        a.verified as "artistVerified"
      from "uploaded_tracks" t
      join "artist_profile" a on t.artist_id = a.id
      where t.status = 'published'
      order by t.created_at desc
      limit ${limit}
    `;

    return rows;
  });

// 8. Get Public Artist Profile by ID or Handle
export const getPublicArtistProfileServerFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    return z.object({ idOrHandle: z.string() }).parse(data);
  })
  .handler(async ({ data }): Promise<{ profile: ArtistProfile; trackCount: number; totalPlays: number } | null> => {
    const sql = await getSql();
    const rows = await sql<ArtistProfile>`
      select
        id,
        user_id as "userId",
        display_name as "displayName",
        handle,
        bio,
        avatar_url as "avatarUrl",
        banner_url as "bannerUrl",
        verified,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from "artist_profile"
      where id = ${data.idOrHandle} or handle = ${data.idOrHandle}
      limit 1
    `;

    if (!rows.length || !rows[0]) return null;
    const profile = rows[0];

    const counts = await sql<{ count: string | number; plays: string | number }>`
      select
        count(*) as count,
        coalesce(sum(play_count), 0) as plays
      from "uploaded_tracks"
      where artist_id = ${profile.id} and status = 'published'
    `;

    const trackCount = Number(counts[0]?.count || 0);
    const totalPlays = Number(counts[0]?.plays || 0);

    return { profile, trackCount, totalPlays };
  });

// 9. Get Public Published Tracks by Artist ID or Handle
export const getPublicArtistTracksServerFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    return z
      .object({
        artistId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
      .parse(data);
  })
  .handler(async ({ data }): Promise<UploadedTrack[]> => {
    const sql = await getSql();
    const limit = data.limit;

    const rows = await sql<UploadedTrack>`
      select
        t.id,
        t.artist_id as "artistId",
        t.user_id as "userId",
        t.title,
        t.genre,
        t.mood,
        t.description,
        t.lyrics,
        t.cover_art_url as "coverArtUrl",
        t.audio_url as "audioUrl",
        t.storage_key as "storageKey",
        t.duration,
        t.file_size as "fileSize",
        t.mime_type as "mimeType",
        t.play_count as "playCount",
        t.status,
        t.rights_confirmed_at as "rightsConfirmedAt",
        t.rights_confirmation_version as "rightsConfirmationVersion",
        t.created_at as "createdAt",
        t.published_at as "publishedAt",
        t.updated_at as "updatedAt",
        a.display_name as "artistName",
        a.handle as "artistHandle",
        a.avatar_url as "artistAvatar",
        a.verified as "artistVerified"
      from "uploaded_tracks" t
      join "artist_profile" a on t.artist_id = a.id
      where (t.artist_id = ${data.artistId} or a.handle = ${data.artistId})
        and t.status = 'published'
      order by t.created_at desc
      limit ${limit}
    `;

    return rows;
  });
