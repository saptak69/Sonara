import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { i as getSql, t as authMiddleware } from "./middleware-QvGm5jd5.mjs";
import { cn as _enum, dn as boolean, hn as object, mn as number, vn as string } from "../_libs/@better-auth/core+[...].mjs";
import { randomUUID } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/artist-studio-EWZEP9pW.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getOrCreateArtistProfileServerFn_createServerFn_handler = createServerRpc({
	id: "110b24a38fd13c76017a39eab3c958d525d9c2fd2a511b2df4f2ac2971a669bf",
	name: "getOrCreateArtistProfileServerFn",
	filename: "src/lib/artist-studio.ts"
}, (opts) => getOrCreateArtistProfileServerFn.__executeServer(opts));
var getOrCreateArtistProfileServerFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getOrCreateArtistProfileServerFn_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const existing = await sql`
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
	if (existing.length && existing[0]) return existing[0];
	const user = (await sql`
      select name, email, image from "user" where id = ${context.userId} limit 1
    `)[0];
	const rawName = user?.name || "Independent Artist";
	const cleanHandle = (rawName.toLowerCase().replace(/[^a-z0-9]/g, "") || "artist") + "_" + Math.floor(1e3 + Math.random() * 9e3);
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
	return (await sql`
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
    `)[0];
});
var updateArtistProfileServerFn_createServerFn_handler = createServerRpc({
	id: "d65f7f0255fb13f56baa0d5b1a33f91155fa1b89c23246b7d4e87874642c0892",
	name: "updateArtistProfileServerFn",
	filename: "src/lib/artist-studio.ts"
}, (opts) => updateArtistProfileServerFn.__executeServer(opts));
var updateArtistProfileServerFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	return object({
		displayName: string().min(1).max(80),
		handle: string().min(2).max(40).regex(/^[a-zA-Z0-9_]+$/, "Handle must be alphanumeric"),
		bio: string().max(500).optional().nullable(),
		avatarUrl: string().optional().nullable(),
		bannerUrl: string().optional().nullable()
	}).parse(data);
}).handler(updateArtistProfileServerFn_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if ((await sql`
      select id from "artist_profile" where handle = ${data.handle} and user_id != ${context.userId} limit 1
    `).length > 0) throw new Error("This handle is already taken by another artist.");
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
var publishTrackServerFn_createServerFn_handler = createServerRpc({
	id: "c4b4f878a61d581db13f310d02fba378db874717fcc5da8a1bdd9945e9e00b46",
	name: "publishTrackServerFn",
	filename: "src/lib/artist-studio.ts"
}, (opts) => publishTrackServerFn.__executeServer(opts));
var publishTrackServerFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	return object({
		title: string().min(1, "Track title is required").max(120),
		genre: string().optional().nullable(),
		mood: string().optional().nullable(),
		description: string().max(1e3).optional().nullable(),
		lyrics: string().max(1e4).optional().nullable(),
		coverArtUrl: string().optional().nullable(),
		audioUrl: string().min(1, "Audio file is required"),
		storageKey: string().min(1, "Storage key is required"),
		duration: number().nonnegative().default(0),
		fileSize: number().nonnegative().default(0),
		mimeType: string().optional().nullable(),
		status: _enum(["published", "draft"]).default("published"),
		rightsConfirmed: boolean().refine((val) => val === true, { message: "You must confirm you own/control the rights to this recording." })
	}).parse(data);
}).handler(publishTrackServerFn_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	let artistId = (await sql`
      select id from "artist_profile" where user_id = ${context.userId} limit 1
    `)[0]?.id;
	if (!artistId) {
		artistId = `artist_${randomUUID()}`;
		await sql`
        insert into "artist_profile" (id, user_id, display_name, handle, verified)
        values (${artistId}, ${context.userId}, 'Independent Artist', ${"artist_" + Math.floor(1e3 + Math.random() * 9e3)}, false)
      `;
	}
	const trackId = `track_${randomUUID()}`;
	const publishedAt = data.status === "published" ? (/* @__PURE__ */ new Date()).toISOString() : null;
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
        ${data.mimeType ?? "audio/mpeg"},
        0,
        ${data.status},
        CURRENT_TIMESTAMP,
        'v1',
        ${publishedAt}
      )
    `;
	return {
		success: true,
		trackId
	};
});
var getMyArtistTracksServerFn_createServerFn_handler = createServerRpc({
	id: "53fb449ee8d964496d3909ccf7392cdba74c41b03878ae4fa2998be061dde6fe",
	name: "getMyArtistTracksServerFn",
	filename: "src/lib/artist-studio.ts"
}, (opts) => getMyArtistTracksServerFn.__executeServer(opts));
var getMyArtistTracksServerFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMyArtistTracksServerFn_createServerFn_handler, async ({ context }) => {
	return await (await getSql())`
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
});
var deleteArtistTrackServerFn_createServerFn_handler = createServerRpc({
	id: "61732241fa850e89215188ca09463c74f76ab8d3d1c3c05e1b1b1ed827d250d6",
	name: "deleteArtistTrackServerFn",
	filename: "src/lib/artist-studio.ts"
}, (opts) => deleteArtistTrackServerFn.__executeServer(opts));
var deleteArtistTrackServerFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	return object({ trackId: string() }).parse(data);
}).handler(deleteArtistTrackServerFn_createServerFn_handler, async ({ context, data }) => {
	await (await getSql())`
      update "uploaded_tracks"
      set status = 'deleted', deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      where id = ${data.trackId} and user_id = ${context.userId}
    `;
	return { success: true };
});
var recordStreamServerFn_createServerFn_handler = createServerRpc({
	id: "0aa5139c56de2d1d73dee54876bce24d19afac5d63f334e8b49bbbe3708c107d",
	name: "recordStreamServerFn",
	filename: "src/lib/artist-studio.ts"
}, (opts) => recordStreamServerFn.__executeServer(opts));
var recordStreamServerFn = createServerFn({ method: "POST" }).validator((data) => {
	return object({
		trackId: string(),
		sessionId: string().min(8),
		durationPlayed: number().min(30, "Stream must reach 30 seconds threshold")
	}).parse(data);
}).handler(recordStreamServerFn_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	if (!(await sql`
      select id, status from "uploaded_tracks" where id = ${data.trackId} and status = 'published' limit 1
    `).length) return {
		counted: false,
		reason: "track_not_published"
	};
	if ((await sql`
      select id from "track_plays"
      where track_id = ${data.trackId}
        and session_id = ${data.sessionId}
        and played_at > CURRENT_TIMESTAMP - INTERVAL '15 minutes'
      limit 1
    `).length > 0) return {
		counted: false,
		reason: "cooldown_active"
	};
	await sql`
      insert into "track_plays" (id, track_id, session_id, duration_played)
      values (${`play_${randomUUID()}`}, ${data.trackId}, ${data.sessionId}, ${Math.round(data.durationPlayed)})
    `;
	await sql`
      update "uploaded_tracks"
      set play_count = play_count + 1, updated_at = CURRENT_TIMESTAMP
      where id = ${data.trackId}
    `;
	return { counted: true };
});
var getCommunityReleasesServerFn_createServerFn_handler = createServerRpc({
	id: "42dac2dccdec93e92959663d68778ff535f8d26e9cdf520f746e1a71440d85cd",
	name: "getCommunityReleasesServerFn",
	filename: "src/lib/artist-studio.ts"
}, (opts) => getCommunityReleasesServerFn.__executeServer(opts));
var getCommunityReleasesServerFn = createServerFn({ method: "GET" }).validator((data) => {
	return object({
		limit: number().min(1).max(50).default(20),
		genre: string().optional()
	}).optional().parse(data);
}).handler(getCommunityReleasesServerFn_createServerFn_handler, async ({ data }) => {
	return await (await getSql())`
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
      limit ${data?.limit ?? 20}
    `;
});
var getPublicArtistProfileServerFn_createServerFn_handler = createServerRpc({
	id: "78015c7d8b65490bb75e007d6d76449dd3e2719b397a0e9e86ec6f4865c064a7",
	name: "getPublicArtistProfileServerFn",
	filename: "src/lib/artist-studio.ts"
}, (opts) => getPublicArtistProfileServerFn.__executeServer(opts));
var getPublicArtistProfileServerFn = createServerFn({ method: "GET" }).validator((data) => {
	return object({ idOrHandle: string() }).parse(data);
}).handler(getPublicArtistProfileServerFn_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const rows = await sql`
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
	const counts = await sql`
      select
        count(*) as count,
        coalesce(sum(play_count), 0) as plays
      from "uploaded_tracks"
      where artist_id = ${profile.id} and status = 'published'
    `;
	return {
		profile,
		trackCount: Number(counts[0]?.count || 0),
		totalPlays: Number(counts[0]?.plays || 0)
	};
});
var getPublicArtistTracksServerFn_createServerFn_handler = createServerRpc({
	id: "53510ff073fd7ac4bd69b7b9642f75e3cf472b6d3db5c7ce7e37bbaf85e58aee",
	name: "getPublicArtistTracksServerFn",
	filename: "src/lib/artist-studio.ts"
}, (opts) => getPublicArtistTracksServerFn.__executeServer(opts));
var getPublicArtistTracksServerFn = createServerFn({ method: "GET" }).validator((data) => {
	return object({
		artistId: string(),
		limit: number().min(1).max(100).default(50)
	}).parse(data);
}).handler(getPublicArtistTracksServerFn_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const limit = data.limit;
	return await sql`
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
});
//#endregion
export { deleteArtistTrackServerFn_createServerFn_handler, getCommunityReleasesServerFn_createServerFn_handler, getMyArtistTracksServerFn_createServerFn_handler, getOrCreateArtistProfileServerFn_createServerFn_handler, getPublicArtistProfileServerFn_createServerFn_handler, getPublicArtistTracksServerFn_createServerFn_handler, publishTrackServerFn_createServerFn_handler, recordStreamServerFn_createServerFn_handler, updateArtistProfileServerFn_createServerFn_handler };
