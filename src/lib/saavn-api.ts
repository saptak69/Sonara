import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";
import { serverCache, CACHE_TTL } from "./cache.server";
import type { Artist, Playlist, Track } from "./types";

export type RawSaavnSong = {
  id: string;
  title?: string;
  song?: string;
  singers?: string;
  primary_artists?: string;
  music?: string;
  starring?: string;
  album?: string;
  album_id?: string;
  year?: string;
  duration?: string | number;
  image?: string;
  encrypted_media_url?: string;
  media_preview_url?: string;
  language?: string;
  play_count?: string | number;
  copyright_text?: string;
};

export type RawSaavnPlaylist = {
  id: string;
  title?: string;
  listname?: string;
  image?: string;
  firstname?: string;
  follower_count?: string | number;
  count?: string | number;
  more_info?: {
    song_count?: string | number;
    firstname?: string;
  };
};

export type RawSaavnArtist = {
  id?: string;
  artistId?: string;
  name?: string;
  title?: string;
  image?: string;
  follower_count?: string | number;
  role?: string;
};

export type RawSaavnAlbum = {
  id?: string;
  albumid?: string;
  title?: string;
  name?: string;
  album?: string;
  subtitle?: string;
  header_desc?: string;
  type?: string;
  image?: string;
  imageUrl?: string;
  language?: string;
  year?: string | number;
  play_count?: string | number;
  list_count?: string | number;
  numSongs?: string | number;
  primary_artists?: string;
  primaryArtists?: string;
  artist?: string | string[];
  songs?: RawSaavnSong[];
  list?: RawSaavnSong[];
  more_info?: {
    song_count?: string | number;
    artistMap?: {
      primary_artists?: { id: string; name: string }[];
    };
  };
};

/**
 * Decrypts JioSaavn encrypted media URLs using 3DES ECB (key 38346591)
 * Returns direct 320kbps / 160kbps CDN stream URL
 */
export function decryptSaavnMediaUrl(encryptedUrl?: string): string | null {
  if (!encryptedUrl) return null;
  try {
    const key = Buffer.from("383465913834659138346591", "utf-8");
    const decipher = crypto.createDecipheriv("des-ede3-ecb", key, null);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encryptedUrl, "base64", "utf-8");
    decrypted += decipher.final("utf-8");
    // Request highest quality 320kbps MP4/AAC stream, upgrading from 48, 96, 160 or 320 preview URLs
    return decrypted.replace(/_(?:48|96|160|320)\.(mp4|m4a)/, "_320.mp4");
  } catch {
    return null;
  }
}

function cleanHtmlEntities(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function formatArtwork(rawImage?: string): { artwork: string; artworkLg: string } {
  if (!rawImage) {
    const fallback = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&h=480&fit=crop&q=80";
    return { artwork: fallback, artworkLg: fallback };
  }
  const base = rawImage.replace("http://", "https://");
  const artwork = base.replace(/150x150|50x50/, "500x500");
  const artworkLg = base.replace(/150x150|50x50/, "500x500");
  return { artwork, artworkLg };
}

export function mapSaavnTrack(s: RawSaavnSong): Track | null {
  if (!s.id) return null;
  const streamUrl = decryptSaavnMediaUrl(s.encrypted_media_url);
  if (!streamUrl) return null;

  const title = cleanHtmlEntities(s.song || s.title || "Full Audio Track");
  const artist = cleanHtmlEntities(s.primary_artists || s.singers || s.music || "Popular Artist");
  const { artwork, artworkLg } = formatArtwork(s.image);
  const duration = Math.round(Number(s.duration) || 210);

  return {
    id: `saavn_${s.id}`,
    title,
    artist,
    artwork,
    artworkLg,
    duration,
    streamUrl,
    genre: s.language ? `${s.language} Music` : "Full Music",
    playCount: Number(s.play_count) || undefined,
    kind: "track",
  };
}

export function mapSaavnPlaylist(p: RawSaavnPlaylist): Playlist | null {
  if (!p.id) return null;
  const name = cleanHtmlEntities(p.title || p.listname || "Curated Playlist");
  const { artwork, artworkLg } = formatArtwork(p.image);
  const trackCount = Number(p.count || p.more_info?.song_count) || 20;
  const owner = cleanHtmlEntities(p.firstname || p.more_info?.firstname || "Music Editor");

  return {
    id: `saavn_pl_${p.id}`,
    name,
    artwork,
    artworkLg,
    trackCount,
    isAlbum: false,
    owner,
  };
}

export function mapSaavnArtist(a: RawSaavnArtist): Artist | null {
  const id = a.id || a.artistId;
  if (!id) return null;
  const name = cleanHtmlEntities(a.name || a.title || "Artist");
  const { artwork, artworkLg } = formatArtwork(a.image);

  return {
    id: `saavn_artist_${id}`,
    name,
    handle: name.toLowerCase().replace(/[^\w]/g, "_"),
    bio: `Top artist with over ${(Number(a.follower_count) || 50000).toLocaleString()} listeners.`,
    artwork,
    artworkLg,
    followerCount: Number(a.follower_count) || 50000,
    trackCount: 40,
  };
}

export function mapSaavnAlbum(a: RawSaavnAlbum): Playlist | null {
  const id = a.id || a.albumid;
  if (!id) return null;
  const name = cleanHtmlEntities(a.title || a.name || a.album || "Untitled Album");
  const rawImage = a.image || a.imageUrl;
  const { artwork, artworkLg } = formatArtwork(rawImage);
  const rawArtist =
    (typeof a.primary_artists === "string" ? a.primary_artists : "") ||
    (typeof a.primaryArtists === "string" ? a.primaryArtists : "") ||
    (typeof a.artist === "string" ? a.artist : "") ||
    (typeof a.subtitle === "string" ? a.subtitle : "");
  const artistName = cleanHtmlEntities(rawArtist);
  const trackCount = Number(
    a.list_count || a.numSongs || a.more_info?.song_count || a.songs?.length || a.list?.length || 0,
  );

  const rawSongs = a.songs || a.list || [];
  const tracks = rawSongs.length
    ? rawSongs.map(mapSaavnTrack).filter((x): x is Track => Boolean(x))
    : undefined;

  return {
    id: `saavn_album_${id}`,
    name,
    description: artistName
      ? `Album by ${artistName}${a.year ? ` · ${a.year}` : ""}`
      : a.year
        ? `Album · ${a.year}`
        : "Album",
    artwork,
    artworkLg,
    trackCount: tracks?.length || trackCount || 0,
    isAlbum: true,
    owner: artistName || undefined,
    tracks,
  };
}

const SAAVN_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9,hi;q=0.8,bn;q=0.7",
  "X-Forwarded-For": "106.51.72.10",
  "X-Real-IP": "106.51.72.10",
  "Client-IP": "106.51.72.10",
  "CF-Connecting-IP": "106.51.72.10",
  Cookie: "L=english%2Chindi%2Cbengali; geo=IN;",
};

async function fetchSaavnJson<T>(params: Record<string, string>, timeoutMs = 6000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = new URL("https://www.jiosaavn.com/api.php");
    url.searchParams.set("_format", "json");
    url.searchParams.set("_marker", "0");
    url.searchParams.set("cc", "in");
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString(), { headers: SAAVN_HEADERS, signal: controller.signal });
    if (!res.ok) return null;
    const text = await res.text();
    return JSON.parse(text.trim()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Server Function: Resolve Full-Length 320kbps Stream for Any Song (Taylor Swift, Rock, Pop, etc.)
 */
export const resolveFullTrackStreamServerFn = createServerFn({ method: "GET" })
  .validator((data: { title: string; artist?: string }) => {
    return z.object({ title: z.string(), artist: z.string().optional() }).parse(data);
  })
  .handler(async ({ data }) => {
    const q = `${data.title} ${data.artist || ""}`.trim().toLowerCase();
    return serverCache.getOrFetch(`stream_res_${q}`, CACHE_TTL.STREAM_URL, async () => {
      try {
        const json = await fetchSaavnJson<{ results?: RawSaavnSong[] }>({
          __call: "search.getResults",
          q,
          n: "5",
          p: "1",
        });

        const songs = json?.results ?? [];
        for (const s of songs) {
          const streamUrl = decryptSaavnMediaUrl(s.encrypted_media_url);
          if (streamUrl) {
            const duration = Math.round(Number(s.duration) || 200);
            return {
              streamUrl,
              duration,
            };
          }
        }
        return null;
      } catch {
        return null;
      }
    });
  });

/**
 * Server Function: Search Full Length Songs with 320kbps Audio
 */
export const searchSaavnTracksServerFn = createServerFn({ method: "GET" })
  .validator((data: { query: string; limit?: number }) => {
    return z
      .object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    const key = `saavn_search_t_${data.query.trim().toLowerCase()}_${data.limit}`;
    return serverCache.getOrFetch(key, CACHE_TTL.SEARCH_RESULTS, async () => {
      try {
        const json = await fetchSaavnJson<{ results?: RawSaavnSong[] }>({
          __call: "search.getResults",
          q: data.query.trim(),
          n: String(data.limit),
          p: "1",
        });

        const songs = json?.results ?? [];
        const mapped = songs.map(mapSaavnTrack).filter((x): x is Track => Boolean(x));
        return mapped.slice(0, data.limit);
      } catch {
        return [];
      }
    });
  });

/**
 * Server Function: Search Playlists
 */
export const searchSaavnPlaylistsServerFn = createServerFn({ method: "GET" })
  .validator((data: { query: string; limit?: number }) => {
    return z
      .object({
        query: z.string().min(1),
        limit: z.number().min(1).max(30).default(12),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    const key = `saavn_search_pl_${data.query.trim().toLowerCase()}_${data.limit}`;
    return serverCache.getOrFetch(key, CACHE_TTL.SEARCH_RESULTS, async () => {
      try {
        const json = await fetchSaavnJson<{ results?: RawSaavnPlaylist[] }>({
          __call: "search.getPlaylistResults",
          q: data.query.trim(),
          n: String(data.limit),
          p: "1",
        });

        const playlists = json?.results ?? [];
        return playlists.map(mapSaavnPlaylist).filter((x): x is Playlist => Boolean(x));
      } catch {
        return [];
      }
    });
  });

/**
 * Server Function: Search Artists
 */
export const searchSaavnArtistsServerFn = createServerFn({ method: "GET" })
  .validator((data: { query: string; limit?: number }) => {
    return z
      .object({
        query: z.string().min(1),
        limit: z.number().min(1).max(30).default(12),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    const key = `saavn_search_art_${data.query.trim().toLowerCase()}_${data.limit}`;
    return serverCache.getOrFetch(key, CACHE_TTL.SEARCH_RESULTS, async () => {
      try {
        const json = await fetchSaavnJson<{ results?: RawSaavnArtist[] }>({
          __call: "search.getArtistResults",
          q: data.query.trim(),
          n: String(data.limit),
          p: "1",
        });

        const artists = json?.results ?? [];
        return artists.map(mapSaavnArtist).filter((x): x is Artist => Boolean(x));
      } catch {
        return [];
      }
    });
  });

/**
 * Server Function: Get Full Song Details by ID
 */
export const getSaavnTrackServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    return z.object({ id: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    const rawId = data.id.replace("saavn_", "");
    return serverCache.getOrFetch(`saavn_song_${rawId}`, CACHE_TTL.STREAM_URL, async () => {
      try {
        const json = await fetchSaavnJson<{ songs?: RawSaavnSong[] }>({
          __call: "song.getDetails",
          pids: rawId,
        });

        const song = json?.songs?.[0];
        return song ? mapSaavnTrack(song) : null;
      } catch {
        return null;
      }
    });
  });

/**
 * Server Function: Get Playlist Details & Full Tracks
 */
export const getSaavnPlaylistServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    return z.object({ id: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    const rawId = data.id.replace("saavn_pl_", "");
    return serverCache.getOrFetch(`saavn_pl_${rawId}`, CACHE_TTL.ALBUM_DETAILS, async () => {
      try {
        const json = await fetchSaavnJson<RawSaavnPlaylist & { list?: RawSaavnSong[]; songs?: RawSaavnSong[] }>({
          __call: "playlist.getDetails",
          listid: rawId,
        });

        if (!json) return null;
        const base = mapSaavnPlaylist(json);
        if (!base) return null;

        const rawSongs = json.list || json.songs || [];
        const tracks = rawSongs.map(mapSaavnTrack).filter((x): x is Track => Boolean(x));
        return {
          ...base,
          tracks: tracks.length ? tracks : undefined,
          trackCount: tracks.length || base.trackCount,
        };
      } catch {
        return null;
      }
    });
  });

/**
 * Server Function: Get Artist Profile & Top Songs
 */
export const getSaavnArtistServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    return z.object({ id: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    const rawId = data.id.replace("saavn_artist_", "");
    return serverCache.getOrFetch(`saavn_artist_${rawId}`, CACHE_TTL.ARTIST_PROFILE, async () => {
      try {
        const json = await fetchSaavnJson<RawSaavnArtist>({
          __call: "artist.getArtistPageDetails",
          artistId: rawId,
        });

        return json ? mapSaavnArtist(json) : null;
      } catch {
        return null;
      }
    });
  });

/**
 * Server Function: Get Artist Top Tracks
 */
export const getSaavnArtistTracksServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string; limit?: number }) => {
    return z.object({ id: z.string(), limit: z.number().default(40) }).parse(data);
  })
  .handler(async ({ data }) => {
    const rawId = data.id.replace("saavn_artist_", "");
    const key = `saavn_art_tr_${rawId}_${data.limit || 40}`;
    return serverCache.getOrFetch(key, CACHE_TTL.ARTIST_PROFILE, async () => {
      try {
        const json = await fetchSaavnJson<{
          topSongs?: RawSaavnSong[] | { songs?: RawSaavnSong[] };
        }>({
          __call: "artist.getArtistPageDetails",
          artistId: rawId,
          n_song: String(data.limit || 40),
        });

        const songs = Array.isArray(json?.topSongs)
          ? json.topSongs
          : (json?.topSongs?.songs || []);

        return songs.map(mapSaavnTrack).filter((x): x is Track => Boolean(x));
      } catch {
        return [];
      }
    });
  });

/**
 * Server Function: Get Artist Albums
 */
export const getSaavnArtistAlbumsServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string; limit?: number }) => {
    return z.object({ id: z.string(), limit: z.number().default(20) }).parse(data);
  })
  .handler(async ({ data }) => {
    const rawId = data.id.replace("saavn_artist_", "");
    const key = `saavn_art_alb_${rawId}_${data.limit || 20}`;
    return serverCache.getOrFetch(key, CACHE_TTL.ARTIST_PROFILE, async () => {
      try {
        const json = await fetchSaavnJson<{
          topAlbums?: RawSaavnAlbum[] | { albums?: RawSaavnAlbum[] };
        }>({
          __call: "artist.getArtistPageDetails",
          artistId: rawId,
          n_album: String(data.limit || 20),
        });

        const albums = Array.isArray(json?.topAlbums)
          ? json.topAlbums
          : (json?.topAlbums?.albums || []);

        return albums.map(mapSaavnAlbum).filter((x): x is Playlist => Boolean(x));
      } catch {
        return [];
      }
    });
  });

/**
 * Server Function: Search Albums
 */
export const searchSaavnAlbumsServerFn = createServerFn({ method: "GET" })
  .validator((data: { query: string; limit?: number }) => {
    return z
      .object({
        query: z.string().min(1),
        limit: z.number().min(1).max(30).default(12),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    const key = `saavn_search_alb_${data.query.trim().toLowerCase()}_${data.limit}`;
    return serverCache.getOrFetch(key, CACHE_TTL.SEARCH_RESULTS, async () => {
      try {
        const json = await fetchSaavnJson<{ results?: RawSaavnAlbum[] }>({
          __call: "search.getAlbumResults",
          q: data.query.trim(),
          n: String(data.limit),
          p: "1",
        });

        const albums = json?.results ?? [];
        return albums.map(mapSaavnAlbum).filter((x): x is Playlist => Boolean(x));
      } catch {
        return [];
      }
    });
  });

/**
 * Server Function: Get Album Details & Full Tracks
 */
export const getSaavnAlbumServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    return z.object({ id: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    const rawId = data.id.replace("saavn_album_", "");
    return serverCache.getOrFetch(`saavn_album_${rawId}`, CACHE_TTL.ALBUM_DETAILS, async () => {
      try {
        const json = await fetchSaavnJson<RawSaavnAlbum & { list?: RawSaavnSong[]; songs?: RawSaavnSong[] }>({
          __call: "content.getAlbumDetails",
          albumid: rawId,
        });

        if (!json) return null;
        return mapSaavnAlbum(json);
      } catch {
        return null;
      }
    });
  });

