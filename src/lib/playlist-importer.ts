import { createServerFn } from "@tanstack/react-start";
import { searchTracks } from "./music-api";
import type { Track } from "./types";

export type RawImportItem = {
  title: string;
  artist: string;
  duration?: number;
};

export type ParseImportResult = {
  ok: boolean;
  name: string;
  coverUrl: string | null;
  tracks: RawImportItem[];
  error?: string;
};

/**
 * Server-side extractor for public Spotify playlist and album URLs.
 * Extracts metadata and tracklist without requiring Spotify developer credentials.
 */
export const parseSpotifyUrlServerFn = createServerFn({ method: "POST" })
  .validator((d: { url: string }) => d)
  .handler(async ({ data }): Promise<ParseImportResult> => {
    const rawUrl = (data?.url || "").trim();
    if (!rawUrl) {
      return { ok: false, name: "", coverUrl: null, tracks: [], error: "URL cannot be empty" };
    }

    const match = rawUrl.match(/(?:spotify\.com\/(?:intl-[a-z]{2}\/)?|spotify:)(playlist|album)[/:]([a-zA-Z0-9]+)/i);
    if (!match) {
      return {
        ok: false,
        name: "",
        coverUrl: null,
        tracks: [],
        error: "Please enter a valid Spotify playlist or album URL (e.g. https://open.spotify.com/playlist/...)",
      };
    }

    const [, type, id] = match;
    const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;

    try {
      const res = await fetch(embedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!res.ok) {
        return {
          ok: false,
          name: "",
          coverUrl: null,
          tracks: [],
          error: `Spotify returned status ${res.status}. Make sure the playlist or album is public.`,
        };
      }

      const html = await res.text();
      const nextDataMatch = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
      );

      if (!nextDataMatch || !nextDataMatch[1]) {
        return {
          ok: false,
          name: "",
          coverUrl: null,
          tracks: [],
          error: "Could not parse playlist information from Spotify.",
        };
      }

      const parsed = JSON.parse(nextDataMatch[1]);
      const entity = parsed.props?.pageProps?.state?.data?.entity;

      if (!entity) {
        return {
          ok: false,
          name: "",
          coverUrl: null,
          tracks: [],
          error: "No tracklist found in this Spotify link.",
        };
      }

      const name: string = entity.name || (type === "album" ? "Imported Album" : "Imported Playlist");
      const coverUrl: string | null =
        entity.coverArt?.sources?.[0]?.url ||
        entity.images?.[0]?.url ||
        entity.visualIdentity?.image?.[0]?.url ||
        null;

      const rawTrackList: Array<any> = entity.trackList || [];
      const tracks: RawImportItem[] = rawTrackList.map((t) => ({
        title: (t.title || "").trim(),
        artist: (t.subtitle || t.artist || "Unknown Artist").replace(/\u00a0/g, " ").trim(),
        duration: t.duration ? Math.round(t.duration / 1000) : undefined,
      })).filter((t) => t.title.length > 0);

      return {
        ok: true,
        name,
        coverUrl,
        tracks,
      };
    } catch (e: any) {
      return {
        ok: false,
        name: "",
        coverUrl: null,
        tracks: [],
        error: e?.message || "Failed to connect to Spotify.",
      };
    }
  });

/**
 * Parses user-provided text tracklists (e.g. copied from Apple Music, YouTube Music, or text notes).
 * Supports lines like:
 * - "1. Blinding Lights - The Weeknd"
 * - "Espresso by Sabrina Carpenter"
 * - "Daft Punk - Get Lucky"
 */
export function parseTextTracklist(text: string): RawImportItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: RawImportItem[] = [];

  for (const line of lines) {
    // Strip leading track numbering: "1.", "01 -", "[1]", "1 "
    const cleaned = line
      .replace(/^\[?\d+\]?[\s.\-_–—)]+/, "")
      .trim();

    if (!cleaned) continue;

    // Try splitting by standard delimiters: " - ", " – ", " — "
    const dashMatch = cleaned.split(/\s+[-–—]\s+/);
    if (dashMatch.length >= 2) {
      const part1 = dashMatch[0].trim();
      const part2 = dashMatch.slice(1).join(" - ").trim();
      // Assume "Title - Artist" or "Artist - Title"
      results.push({
        title: part1,
        artist: part2,
      });
      continue;
    }

    // Try "by" separator: "Espresso by Sabrina Carpenter"
    const byMatch = cleaned.split(/\s+by\s+/i);
    if (byMatch.length === 2) {
      const candidateArtist = byMatch[1].trim();
      const stopWords = new Set(["me", "you", "him", "her", "us", "them", "myself", "yourself", "step", "chance", "night", "day"]);
      if (!stopWords.has(candidateArtist.toLowerCase())) {
        results.push({
          title: byMatch[0].trim(),
          artist: candidateArtist,
        });
        continue;
      }
    }

    // Fallback: entire line as title with generic search
    results.push({
      title: cleaned,
      artist: "",
    });
  }

  return results;
}

/**
 * Concurrently matches imported track items to Sonara's streaming catalog.
 */
export async function matchImportedTracks(
  items: RawImportItem[],
  onProgress?: (matchedCount: number, total: number) => void,
): Promise<{ matched: Track[]; unmatched: RawImportItem[] }> {
  const matched: Track[] = [];
  const unmatched: RawImportItem[] = [];

  const CONCURRENCY = 4;
  let cursor = 0;
  const total = items.length;

  async function worker() {
    while (cursor < total) {
      const index = cursor++;
      const item = items[index];
      if (!item) break;

      const query = item.artist ? `${item.title} ${item.artist}` : item.title;
      try {
        const results = await searchTracks(query, 5);
        if (results.length > 0) {
          // Find best title match
          const itemTitleNorm = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
          const best = results.find((r) => {
            const rTitleNorm = r.title.toLowerCase().replace(/[^a-z0-9]/g, "");
            return rTitleNorm.includes(itemTitleNorm) || itemTitleNorm.includes(rTitleNorm);
          }) || results[0];

          matched.push(best);
        } else {
          unmatched.push(item);
        }
      } catch {
        unmatched.push(item);
      }

      onProgress?.(matched.length + unmatched.length, total);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker());
  await Promise.all(workers);

  return { matched, unmatched };
}
