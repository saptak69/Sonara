import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Artist, Playlist, Track } from "./types";

export type RawDeezerTrack = {
  id: number | string;
  title: string;
  title_short?: string;
  duration?: number;
  preview?: string;
  artist?: {
    id: number | string;
    name: string;
    picture?: string;
    picture_medium?: string;
    picture_big?: string;
    picture_xl?: string;
  };
  album?: {
    id: number | string;
    title: string;
    cover?: string;
    cover_medium?: string;
    cover_big?: string;
    cover_xl?: string;
  };
};

export type RawDeezerPlaylist = {
  id: number | string;
  title: string;
  description?: string;
  picture_medium?: string;
  picture_big?: string;
  picture_xl?: string;
  nb_tracks?: number;
  user?: {
    id: number | string;
    name: string;
  };
  creator?: {
    id: number | string;
    name: string;
  };
  tracks?: {
    data: RawDeezerTrack[];
  };
};

export type RawDeezerArtist = {
  id: number | string;
  name: string;
  link?: string;
  picture_medium?: string;
  picture_big?: string;
  picture_xl?: string;
  nb_album?: number;
  nb_fan?: number;
};

export function mapDeezerTrack(t: RawDeezerTrack): Track | null {
  if (!t.id || !t.title || !t.preview) return null;
  const artwork =
    t.album?.cover_medium ||
    t.album?.cover_big ||
    t.artist?.picture_medium ||
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&h=480&fit=crop&q=80";
  const artworkLg =
    t.album?.cover_xl ||
    t.album?.cover_big ||
    t.artist?.picture_xl ||
    artwork;

  return {
    id: `deezer_${t.id}`,
    title: t.title_short || t.title,
    artist: t.artist?.name || "Various Artists",
    artistId: t.artist?.id ? `deezer_artist_${t.artist.id}` : undefined,
    artwork,
    artworkLg,
    duration: t.duration || 30,
    streamUrl: t.preview,
    genre: "Deezer Music",
    kind: "track",
  };
}

export function mapDeezerPlaylist(p: RawDeezerPlaylist): Playlist | null {
  if (!p.id || !p.title) return null;
  const artwork =
    p.picture_medium ||
    p.picture_big ||
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=480&h=480&fit=crop&q=80";
  const artworkLg = p.picture_xl || p.picture_big || artwork;
  const tracks = p.tracks?.data ? p.tracks.data.map(mapDeezerTrack).filter((x): x is Track => Boolean(x)) : undefined;

  return {
    id: `deezer_pl_${p.id}`,
    name: p.title,
    description: p.description || undefined,
    artwork,
    artworkLg,
    trackCount: p.nb_tracks || (tracks ? tracks.length : 0),
    isAlbum: false,
    owner: p.user?.name || p.creator?.name || "Deezer Curator",
    tracks,
  };
}

export function mapDeezerArtist(a: RawDeezerArtist): Artist | null {
  if (!a.id || !a.name) return null;
  const artwork =
    a.picture_medium ||
    a.picture_big ||
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&h=480&fit=crop&q=80";
  const artworkLg = a.picture_xl || a.picture_big || artwork;

  return {
    id: `deezer_artist_${a.id}`,
    name: a.name,
    handle: a.name.toLowerCase().replace(/\s+/g, "_"),
    bio: `Popular artist on Deezer with over ${(a.nb_fan || 0).toLocaleString()} fans worldwide.`,
    artwork,
    artworkLg,
    followerCount: a.nb_fan || 0,
    trackCount: (a.nb_album || 1) * 10,
  };
}

const deezerHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

async function fetchDeezerJson<T>(url: string, timeoutMs = 5000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: deezerHeaders, signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Server Function: Search Deezer tracks across playlists and artist catalogs
 */
export const searchDeezerTracksServerFn = createServerFn({ method: "GET" })
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
      const q = encodeURIComponent(data.query.trim());
      // Query matching playlists & artists
      const [plRes, artRes] = await Promise.allSettled([
        fetchDeezerJson<{ data?: RawDeezerPlaylist[] }>(`https://api.deezer.com/search/playlist?q=${q}&limit=4`),
        fetchDeezerJson<{ data?: RawDeezerArtist[] }>(`https://api.deezer.com/search/artist?q=${q}&limit=3`),
      ]);

      const playlists = plRes.status === "fulfilled" && plRes.value?.data ? plRes.value.data : [];
      const artists = artRes.status === "fulfilled" && artRes.value?.data ? artRes.value.data : [];

      const tracks: Track[] = [];

      // Fetch tracks from matched playlists
      await Promise.allSettled(
        playlists.slice(0, 3).map(async (pl) => {
          const detail = await fetchDeezerJson<RawDeezerPlaylist>(`https://api.deezer.com/playlist/${pl.id}`);
          if (detail?.tracks?.data) {
            for (const t of detail.tracks.data) {
              const mapped = mapDeezerTrack(t);
              if (mapped) tracks.push(mapped);
            }
          }
        }),
      );

      // Fetch tracks from matched artists if needed
      if (tracks.length < data.limit && artists.length) {
        await Promise.allSettled(
          artists.slice(0, 2).map(async (art) => {
            const artDetail = await fetchDeezerJson<{ data?: RawDeezerTrack[] }>(
              `https://api.deezer.com/artist/${art.id}/top?limit=10`,
            );
            if (artDetail?.data) {
              for (const t of artDetail.data) {
                const mapped = mapDeezerTrack(t);
                if (mapped) tracks.push(mapped);
              }
            }
          }),
        );
      }

      // Deduplicate by title + artist
      const seen = new Set<string>();
      return tracks
        .filter((t) => {
          const key = `${t.title.toLowerCase()}_${t.artist.toLowerCase()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, data.limit);
    } catch {
      return [];
    }
  });

/**
 * Server Function: Search Deezer Playlists
 */
export const searchDeezerPlaylistsServerFn = createServerFn({ method: "GET" })
  .validator((data: { query: string; limit?: number }) => {
    return z
      .object({
        query: z.string().min(1),
        limit: z.number().min(1).max(30).default(10),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const q = encodeURIComponent(data.query.trim());
      const res = await fetchDeezerJson<{ data?: RawDeezerPlaylist[] }>(
        `https://api.deezer.com/search/playlist?q=${q}&limit=${data.limit}`,
      );
      if (!res?.data) return [];
      return res.data.map(mapDeezerPlaylist).filter((x): x is Playlist => Boolean(x));
    } catch {
      return [];
    }
  });

/**
 * Server Function: Search Deezer Artists
 */
export const searchDeezerArtistsServerFn = createServerFn({ method: "GET" })
  .validator((data: { query: string; limit?: number }) => {
    return z
      .object({
        query: z.string().min(1),
        limit: z.number().min(1).max(30).default(10),
      })
      .parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const q = encodeURIComponent(data.query.trim());
      const res = await fetchDeezerJson<{ data?: RawDeezerArtist[] }>(
        `https://api.deezer.com/search/artist?q=${q}&limit=${data.limit}`,
      );
      if (!res?.data) return [];
      return res.data.map(mapDeezerArtist).filter((x): x is Artist => Boolean(x));
    } catch {
      return [];
    }
  });

/**
 * Server Function: Fetch individual track by Deezer ID
 */
export const getDeezerTrackServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    return z.object({ id: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const rawId = data.id.replace("deezer_", "");
      const res = await fetchDeezerJson<RawDeezerTrack>(`https://api.deezer.com/track/${rawId}`);
      return res ? mapDeezerTrack(res) : null;
    } catch {
      return null;
    }
  });

/**
 * Server Function: Fetch Playlist by Deezer Playlist ID
 */
export const getDeezerPlaylistServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    return z.object({ id: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const rawId = data.id.replace("deezer_pl_", "");
      const res = await fetchDeezerJson<RawDeezerPlaylist>(`https://api.deezer.com/playlist/${rawId}`);
      return res ? mapDeezerPlaylist(res) : null;
    } catch {
      return null;
    }
  });

/**
 * Server Function: Fetch Artist by Deezer Artist ID
 */
export const getDeezerArtistServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    return z.object({ id: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const rawId = data.id.replace("deezer_artist_", "");
      const res = await fetchDeezerJson<RawDeezerArtist>(`https://api.deezer.com/artist/${rawId}`);
      return res ? mapDeezerArtist(res) : null;
    } catch {
      return null;
    }
  });

/**
 * Server Function: Fetch Artist Top Tracks
 */
export const getDeezerArtistTracksServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string; limit?: number }) => {
    return z.object({ id: z.string(), limit: z.number().default(25) }).parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const rawId = data.id.replace("deezer_artist_", "");
      const res = await fetchDeezerJson<{ data?: RawDeezerTrack[] }>(
        `https://api.deezer.com/artist/${rawId}/top?limit=${data.limit}`,
      );
      if (!res?.data) return [];
      return res.data.map(mapDeezerTrack).filter((x): x is Track => Boolean(x));
    } catch {
      return [];
    }
  });
