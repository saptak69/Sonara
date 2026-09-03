import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type SuggestionMatch = {
  id: string;
  title: string;
  subtitle: string;
  artwork: string;
  type: "song" | "artist" | "album" | "query";
  entityId?: string;
};

export type SearchSuggestionResult = {
  queries: string[];
  topMatches: SuggestionMatch[];
};

function cleanHtml(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Server Function: Fetch real-time search suggestions & autocomplete matches
 */
export const fetchSearchSuggestionsServerFn = createServerFn({ method: "GET" })
  .validator((data: { query: string }) => {
    return z.object({ query: z.string().default("") }).parse(data);
  })
  .handler(async ({ data }): Promise<SearchSuggestionResult> => {
    const q = data.query.trim().toLowerCase();
    if (!q || q.length < 2) {
      return { queries: [], topMatches: [] };
    }

    const [ytRes, saavnRes] = await Promise.allSettled([
      // 1. YouTube / Google Music Suggestions
      fetch(
        `https://suggestqueries.google.com/complete/search?client=chrome&ds=yt&q=${encodeURIComponent(q)}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(2500),
        },
      ).then(async (r) => {
        if (!r.ok) return [];
        const json = (await r.json()) as [string, string[]];
        return Array.isArray(json?.[1]) ? json[1] : [];
      }),

      // 2. JioSaavn Autocomplete (top artists, songs, albums)
      fetch(
        `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&query=${encodeURIComponent(q)}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "application/json",
            "X-Forwarded-For": "106.51.72.10",
            "CF-Connecting-IP": "106.51.72.10",
            Cookie: "L=english%2Chindi%2Cbengali; geo=IN;",
          },
          signal: AbortSignal.timeout(2500),
        },
      ).then(async (r) => {
        if (!r.ok) return null;
        const text = await r.text();
        return JSON.parse(text.trim()) as {
          topquery?: { data?: Array<{ id: string; title: string; image: string; type: string; description: string }> };
          songs?: { data?: Array<{ id: string; title: string; image: string; description: string }> };
          artists?: { data?: Array<{ id: string; title: string; image: string; description: string }> };
          albums?: { data?: Array<{ id: string; title: string; image: string; description: string }> };
        };
      }),
    ]);

    const ytQueries = ytRes.status === "fulfilled" ? ytRes.value : [];
    const saavnData = saavnRes.status === "fulfilled" ? saavnRes.value : null;

    const topMatches: SuggestionMatch[] = [];
    const querySet = new Set<string>();

    // Add JioSaavn top match entity
    const topItem = saavnData?.topquery?.data?.[0];
    if (topItem && topItem.title) {
      const title = cleanHtml(topItem.title);
      const isArtist = topItem.type === "artist";
      const isAlbum = topItem.type === "album";
      const itemType = isArtist ? "artist" : isAlbum ? "album" : "song";
      const entityId = isArtist
        ? `saavn_artist_${topItem.id}`
        : isAlbum
          ? `saavn_album_${topItem.id}`
          : `saavn_${topItem.id}`;

      topMatches.push({
        id: `top_${topItem.id}`,
        title,
        subtitle: cleanHtml(topItem.description || topItem.type),
        artwork: topItem.image?.replace("50x50", "150x150") || "",
        type: itemType,
        entityId,
      });
      querySet.add(title.toLowerCase());
    }

    // Add matching artists
    for (const a of (saavnData?.artists?.data || []).slice(0, 2)) {
      const title = cleanHtml(a.title);
      if (!topMatches.some((m) => m.title.toLowerCase() === title.toLowerCase())) {
        topMatches.push({
          id: `artist_${a.id}`,
          title,
          subtitle: cleanHtml(a.description || "Artist"),
          artwork: a.image?.replace("50x50", "150x150") || "",
          type: "artist",
          entityId: `saavn_artist_${a.id}`,
        });
      }
      querySet.add(title.toLowerCase());
    }

    // Add matching albums
    for (const al of (saavnData?.albums?.data || []).slice(0, 2)) {
      const title = cleanHtml(al.title);
      if (!topMatches.some((m) => m.title.toLowerCase() === title.toLowerCase())) {
        topMatches.push({
          id: `album_${al.id}`,
          title,
          subtitle: cleanHtml(al.description || "Album"),
          artwork: al.image?.replace("50x50", "150x150") || "",
          type: "album",
          entityId: `saavn_album_${al.id}`,
        });
      }
      querySet.add(title.toLowerCase());
    }

    // Add matching songs
    for (const s of (saavnData?.songs?.data || []).slice(0, 3)) {
      const title = cleanHtml(s.title);
      if (!topMatches.some((m) => m.title.toLowerCase() === title.toLowerCase())) {
        topMatches.push({
          id: `song_${s.id}`,
          title,
          subtitle: cleanHtml(s.description || "Song"),
          artwork: s.image?.replace("50x50", "150x150") || "",
          type: "song",
          entityId: `saavn_${s.id}`,
        });
      }
      querySet.add(title.toLowerCase());
    }

    // Collect query completions
    for (const query of ytQueries) {
      const clean = cleanHtml(query).trim();
      if (clean && !querySet.has(clean.toLowerCase())) {
        querySet.add(clean.toLowerCase());
      }
    }

    const queries = Array.from(querySet).slice(0, 6);
    return {
      queries,
      topMatches: topMatches.slice(0, 4),
    };
  });
