import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";
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
  id: string;
  name?: string;
  title?: string;
  image?: string;
  follower_count?: string | number;
  role?: string;
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
    // Request highest quality 320kbps MP4/AAC stream
    return decrypted.replace(/_96\.(mp4|m4a)/, "_320.mp4");
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
  if (!a.id) return null;
  const name = cleanHtmlEntities(a.name || a.title || "Artist");
  const { artwork, artworkLg } = formatArtwork(a.image);

  return {
    id: `saavn_artist_${a.id}`,
    name,
    handle: name.toLowerCase().replace(/[^\w]/g, "_"),
    bio: `Top artist with over ${(Number(a.follower_count) || 50000).toLocaleString()} listeners.`,
    artwork,
    artworkLg,
    followerCount: Number(a.follower_count) || 50000,
    trackCount: 40,
  };
}

const SAAVN_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

async function fetchSaavnJson<T>(params: Record<string, string>, timeoutMs = 5500): Promise<T | null> {
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

/**
 * Server Function: Get Full Song Details by ID
 */
export const getSaavnTrackServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    return z.object({ id: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const rawId = data.id.replace("saavn_", "");
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

/**
 * Server Function: Get Playlist Details & Full Tracks
 */
export const getSaavnPlaylistServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    return z.object({ id: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const rawId = data.id.replace("saavn_pl_", "");
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

/**
 * Server Function: Get Artist Profile & Top Songs
 */
export const getSaavnArtistServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    return z.object({ id: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const rawId = data.id.replace("saavn_artist_", "");
      const json = await fetchSaavnJson<RawSaavnArtist>({
        __call: "artist.getArtistPageDetails",
        artistId: rawId,
      });

      return json ? mapSaavnArtist(json) : null;
    } catch {
      return null;
    }
  });

/**
 * Server Function: Get Artist Top Tracks
 */
export const getSaavnArtistTracksServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string; limit?: number }) => {
    return z.object({ id: z.string(), limit: z.number().default(30) }).parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const rawId = data.id.replace("saavn_artist_", "");
      const json = await fetchSaavnJson<{ topSongs?: { songs?: RawSaavnSong[] } }>({
        __call: "artist.getArtistPageDetails",
        artistId: rawId,
        n_song: String(data.limit),
      });

      const songs = json?.topSongs?.songs || [];
      return songs.map(mapSaavnTrack).filter((x): x is Track => Boolean(x));
    } catch {
      return [];
    }
  });
