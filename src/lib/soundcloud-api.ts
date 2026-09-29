import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Track } from "./types";

// Known reliable public client IDs with dynamic fallback
const SOUNDCLOUD_CLIENT_IDS = [
  "Pb72ranhoyt6gw7hM7TkzUItXlMWSNSo",
  "2t9loNfh0ekOfbnfq6VBesetl3kKuwnT",
  "a3e059563d7fd3372b49b37f00a00bcf",
  "iZIs9mchVcX5lhVR1OiZAkGCU2jKqXO8",
];

let cachedClientId: string = SOUNDCLOUD_CLIENT_IDS[0];
let lastClientIdCheck = 0;

async function getSoundCloudClientId(): Promise<string> {
  const now = Date.now();
  if (cachedClientId && now - lastClientIdCheck < 1000 * 60 * 60) {
    return cachedClientId;
  }

  try {
    const res = await fetch("https://soundcloud.com", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(4000),
    });
    const html = await res.text();
    const scriptUrls = [...html.matchAll(/<script[^>]+src="([^">]+\.js)"/g)].map((m) => m[1]);

    for (const url of scriptUrls.slice(-6)) {
      try {
        const jsRes = await fetch(url, { signal: AbortSignal.timeout(3000) });
        const jsText = await jsRes.text();
        const clientMatch = jsText.match(/client_id[:=]\s*["']([a-zA-Z0-9]{32})["']/);
        if (clientMatch) {
          cachedClientId = clientMatch[1];
          lastClientIdCheck = now;
          return cachedClientId;
        }
      } catch {
        // try next
      }
    }
  } catch {
    // fallback
  }

  lastClientIdCheck = now;
  return SOUNDCLOUD_CLIENT_IDS[0];
}

type SoundCloudTranscoding = {
  url: string;
  preset?: string;
  duration?: number;
  format?: {
    protocol?: string;
    mime_type?: string;
  };
  quality?: string;
};

type SoundCloudRawTrack = {
  id: number;
  title: string;
  duration: number; // in ms
  artwork_url?: string;
  avatar_url?: string;
  genre?: string;
  playback_count?: number;
  likes_count?: number;
  user?: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  media?: {
    transcodings?: SoundCloudTranscoding[];
  };
  streamable?: boolean;
};

async function resolveDirectStream(
  transcodings: SoundCloudTranscoding[],
  clientId: string,
): Promise<string | null> {
  if (!transcodings.length) return null;

  // Prefer progressive mp3 (standard http mp3 streaming without HLS chunks)
  const progressive = transcodings.find((t) => t.format?.protocol === "progressive");
  const candidate = progressive || transcodings[0];
  if (!candidate?.url) return null;

  try {
    const res = await fetch(`${candidate.url}?client_id=${clientId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { url?: string };
    return json.url || null;
  } catch {
    return null;
  }
}

function mapSoundCloudTrack(t: SoundCloudRawTrack, streamUrl: string): Track {
  const artwork =
    t.artwork_url?.replace("-large", "-t500x500") ||
    t.user?.avatar_url?.replace("-large", "-t500x500") ||
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&h=480&fit=crop&q=80";

  return {
    id: `soundcloud_${t.id}`,
    title: t.title || "SoundCloud Track",
    artist: t.user?.username || "SoundCloud Artist",
    artwork,
    artworkLg: artwork,
    duration: Math.round((t.duration || 180000) / 1000),
    streamUrl,
    genre: t.genre || "SoundCloud Music",
    playCount: t.playback_count || t.likes_count,
    kind: "track",
  };
}

/**
 * Server Function: Search tracks on SoundCloud with direct playable CDN audio
 */
export const searchSoundCloudTracksServerFn = createServerFn({ method: "GET" })
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
      const clientId = await getSoundCloudClientId();
      const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(data.query)}&client_id=${clientId}&limit=${Math.min(data.limit * 2, 20)}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) return [];
      const json = (await res.json()) as { collection?: SoundCloudRawTrack[] };
      const items = json.collection || [];

      // Filter to full-length tracks (over 45 seconds) with streamable media
      const valid = items.filter(
        (t) => (t.duration || 0) >= 45000 && t.media?.transcodings?.length,
      );

      const resolved: Track[] = [];
      await Promise.allSettled(
        valid.slice(0, data.limit).map(async (t) => {
          const streamUrl = await resolveDirectStream(t.media!.transcodings!, clientId);
          if (streamUrl) {
            resolved.push(mapSoundCloudTrack(t, streamUrl));
          }
        }),
      );

      return resolved;
    } catch {
      return [];
    }
  });

/**
 * Server Function: Resolve individual SoundCloud track by ID
 */
export const getSoundCloudTrackServerFn = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => {
    return z.object({ id: z.string() }).parse(data);
  })
  .handler(async ({ data }) => {
    try {
      const trackId = data.id.replace("soundcloud_", "");
      const clientId = await getSoundCloudClientId();
      const url = `https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${clientId}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) return null;
      const track = (await res.json()) as SoundCloudRawTrack;
      if (!track.media?.transcodings?.length) return null;

      const streamUrl = await resolveDirectStream(track.media.transcodings, clientId);
      if (!streamUrl) return null;

      return mapSoundCloudTrack(track, streamUrl);
    } catch {
      return null;
    }
  });
