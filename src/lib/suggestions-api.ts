import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverCache, CACHE_TTL } from "./cache.server";

export type SuggestionMatch = {
  id: string;
  title: string;
  subtitle: string;
  artwork: string;
  type: "song" | "artist" | "album";
  entityId?: string;
};

export type SearchSuggestionResult = {
  queries: string[];
  topMatches: SuggestionMatch[];
};

const EMPTY: SearchSuggestionResult = { queries: [], topMatches: [] };

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

type SaavnItem = { id: string; title: string; image?: string; type?: string; description?: string };
type SaavnAutocomplete = {
  topquery?: { data?: SaavnItem[] };
  songs?: { data?: SaavnItem[] };
  artists?: { data?: SaavnItem[] };
  albums?: { data?: SaavnItem[] };
};

function cleanHtml(str?: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

const bigger = (url?: string) => (url ? url.replace("50x50", "150x150") : "");

async function fetchYoutubeCompletions(q: string): Promise<string[]> {
  const res = await fetch(
    `https://suggestqueries.google.com/complete/search?client=chrome&ds=yt&q=${encodeURIComponent(q)}`,
    { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(2500) },
  );
  if (!res.ok) throw new Error(`suggest ${res.status}`);
  const json = (await res.json()) as unknown;
  const list = Array.isArray(json) ? json[1] : null;
  return Array.isArray(list) ? list.filter((s): s is string => typeof s === "string") : [];
}

async function fetchSaavnAutocomplete(q: string): Promise<SaavnAutocomplete> {
  const res = await fetch(
    `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&query=${encodeURIComponent(q)}`,
    {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        "X-Forwarded-For": "106.51.72.10",
        "CF-Connecting-IP": "106.51.72.10",
        Cookie: "L=english%2Chindi%2Cbengali; geo=IN;",
      },
      signal: AbortSignal.timeout(2500),
    },
  );
  if (!res.ok) throw new Error(`autocomplete ${res.status}`);
  return JSON.parse((await res.text()).trim()) as SaavnAutocomplete;
}

function buildMatches(saavn: SaavnAutocomplete | null): SuggestionMatch[] {
  if (!saavn) return [];
  const out: SuggestionMatch[] = [];
  const seen = new Set<string>();

  const add = (item: SaavnItem | undefined, type: SuggestionMatch["type"], fallbackSubtitle: string) => {
    if (!item?.id || !item.title) return;
    const title = cleanHtml(item.title);
    const key = `${type}:${title.toLowerCase()}`;
    if (!title || seen.has(key)) return;
    seen.add(key);
    const prefix = type === "artist" ? "saavn_artist_" : type === "album" ? "saavn_album_" : "saavn_";
    out.push({
      id: `${type}_${item.id}`,
      title,
      subtitle: cleanHtml(item.description) || fallbackSubtitle,
      artwork: bigger(item.image),
      type,
      entityId: `${prefix}${item.id}`,
    });
  };

  const top = saavn.topquery?.data?.[0];
  if (top) {
    const type = top.type === "artist" ? "artist" : top.type === "album" ? "album" : "song";
    add(top, type, type === "artist" ? "Artist" : type === "album" ? "Album" : "Song");
  }
  for (const a of (saavn.artists?.data ?? []).slice(0, 2)) add(a, "artist", "Artist");
  for (const al of (saavn.albums?.data ?? []).slice(0, 2)) add(al, "album", "Album");
  for (const s of (saavn.songs?.data ?? []).slice(0, 3)) add(s, "song", "Song");

  return out.slice(0, 5);
}

/**
 * Server Function: real-time search suggestions (query completions + top matches).
 * Never throws: if the upstream services are down the caller just gets an empty
 * result, and failures are not cached.
 */
export const fetchSearchSuggestionsServerFn = createServerFn({ method: "GET" })
  .validator((data: { query: string }) => z.object({ query: z.string().default("") }).parse(data))
  .handler(async ({ data }): Promise<SearchSuggestionResult> => {
    const q = data.query.trim().toLowerCase().slice(0, 80);
    if (q.length < 2) return EMPTY;

    const cacheKey = `sugg_${q}`;
    const cached = serverCache.get<SearchSuggestionResult>(cacheKey);
    if (cached) return cached;

    const [ytRes, saavnRes] = await Promise.allSettled([fetchYoutubeCompletions(q), fetchSaavnAutocomplete(q)]);
    const completions = ytRes.status === "fulfilled" ? ytRes.value : [];
    const saavn = saavnRes.status === "fulfilled" ? saavnRes.value : null;

    if (ytRes.status === "rejected" && saavnRes.status === "rejected") {
      console.warn("[suggestions] both sources failed:", ytRes.reason, saavnRes.reason);
      return EMPTY; // not cached, so the next keystroke retries
    }

    const topMatches = buildMatches(saavn);

    // Query completions come from the web suggester; fall back to match titles if it is empty.
    const matchTitles = new Set(topMatches.map((m) => m.title.toLowerCase()));
    const seen = new Set<string>();
    const queries: string[] = [];
    for (const raw of completions) {
      const clean = cleanHtml(raw);
      const key = clean.toLowerCase();
      if (!clean || seen.has(key) || matchTitles.has(key)) continue;
      seen.add(key);
      queries.push(clean);
      if (queries.length >= 6) break;
    }
    if (queries.length === 0) {
      for (const m of topMatches) {
        const key = m.title.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          queries.push(m.title);
        }
      }
    }

    const result: SearchSuggestionResult = { queries, topMatches };
    serverCache.set(cacheKey, result, CACHE_TTL.SUGGESTIONS);
    return result;
  });
