/**
 * Music providers behind one contract. Each adapter turns one API's answers into
 * Sonara's Track shape; the catalogue (catalog.ts) decides which ones to ask.
 *
 * Free and sanctioned: Audius (full streams, open API), iTunes Search (30 s
 * previews and metadata). Legacy: JioSaavn and SoundCloud, kept running behind
 * SONARA_LEGACY_SOURCES=off so they can be switched off without code changes.
 */
import type { Track } from "../types";
import { fetchJson } from "./resilience.ts";

export type ProviderId = "studio" | "saavn" | "audius" | "soundcloud" | "itunes";

export type TrackSearchProvider = {
  id: ProviderId;
  /** Lower is preferred when two providers have the same recording. */
  priority: number;
  timeoutMs: number;
  legacy?: boolean;
  searchTracks(query: string, limit: number, signal: AbortSignal): Promise<Track[]>;
};

export const AUDIUS_APP = "sonara";
const AUDIUS_API = "https://api.audius.co/v1";

type AudiusTrack = {
  id: string;
  title: string;
  duration: number;
  genre?: string;
  mood?: string;
  play_count?: number;
  is_streamable?: boolean;
  is_stream_gated?: boolean;
  stream_conditions?: unknown;
  access?: { stream?: boolean };
  artwork?: Record<string, string> | null;
  user: { id: string; name: string; handle?: string };
};

export function audiusStreamUrl(id: string): string {
  // The API answers with a redirect to a fresh signed file each time, so this URL never goes stale.
  return `${AUDIUS_API}/tracks/${encodeURIComponent(id)}/stream?app_name=${AUDIUS_APP}`;
}

export function mapAudiusTrack(t: AudiusTrack): Track | null {
  const playable = t.is_streamable !== false && !t.is_stream_gated && !t.stream_conditions && t.access?.stream !== false;
  if (!t.id || !t.title || !playable) return null;
  const art = t.artwork ?? {};
  return {
    id: `audius_${t.id}`,
    title: t.title,
    artist: t.user?.name ?? "Unknown artist",
    artwork: art["480x480"] ?? art["150x150"] ?? null,
    artworkLg: art["1000x1000"] ?? art["480x480"] ?? null,
    duration: Math.round(t.duration || 0),
    streamUrl: audiusStreamUrl(t.id),
    genre: t.genre || undefined,
    mood: t.mood || undefined,
    playCount: t.play_count,
    kind: "track",
    source: "audius",
  };
}

export const audius = {
  async search(query: string, limit: number, signal: AbortSignal): Promise<Track[]> {
    const url = `${AUDIUS_API}/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=${AUDIUS_APP}`;
    const json = await fetchJson<{ data?: AudiusTrack[] }>("audius", url, signal);
    return (json.data ?? []).map(mapAudiusTrack).filter((t): t is Track => t !== null);
  },
  async trending(limit: number, signal: AbortSignal, genre?: string): Promise<Track[]> {
    const g = genre ? `&genre=${encodeURIComponent(genre)}` : "";
    const url = `${AUDIUS_API}/tracks/trending?limit=${limit}&time=week${g}&app_name=${AUDIUS_APP}`;
    const json = await fetchJson<{ data?: AudiusTrack[] }>("audius", url, signal);
    return (json.data ?? []).map(mapAudiusTrack).filter((t): t is Track => t !== null);
  },
  async track(id: string, signal: AbortSignal): Promise<Track | null> {
    const json = await fetchJson<{ data?: AudiusTrack }>("audius", `${AUDIUS_API}/tracks/${encodeURIComponent(id)}?app_name=${AUDIUS_APP}`, signal);
    return json.data ? mapAudiusTrack(json.data) : null;
  },
};

type ItunesTrack = {
  kind?: string;
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  primaryGenreName?: string;
  trackExplicitness?: string;
};

export function mapItunesTrack(t: ItunesTrack): Track | null {
  if (t.kind !== "song" || !t.trackId || !t.trackName || !t.previewUrl) return null;
  const art = (size: number) => t.artworkUrl100?.replace(/\/\d+x\d+bb\./, `/${size}x${size}bb.`) ?? null;
  return {
    id: `itunes_${t.trackId}`,
    title: t.trackName,
    artist: t.artistName ?? "Unknown artist",
    album: t.collectionName,
    artwork: art(500),
    artworkLg: art(1000),
    duration: Math.round((t.trackTimeMillis ?? 0) / 1000),
    streamUrl: t.previewUrl,
    genre: t.primaryGenreName,
    kind: "track",
    source: "itunes",
    preview: true,
    explicit: t.trackExplicitness === "explicit",
  };
}

export const itunes = {
  async search(query: string, limit: number, signal: AbortSignal): Promise<Track[]> {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}`;
    const json = await fetchJson<{ results?: ItunesTrack[] }>("itunes", url, signal);
    return (json.results ?? []).map(mapItunesTrack).filter((t): t is Track => t !== null);
  },
  async track(id: string, signal: AbortSignal): Promise<Track | null> {
    const json = await fetchJson<{ results?: ItunesTrack[] }>("itunes", `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&entity=song`, signal);
    return json.results?.map(mapItunesTrack).find(Boolean) ?? null;
  },
};

export function legacySourcesEnabled(): boolean {
  return (process.env.SONARA_LEGACY_SOURCES ?? "on").toLowerCase() !== "off";
}

type DeezerArtist = { id: number; name: string; nb_fan?: number };

/** Deezer: used only for artist relationships ("fans also like") in song radio. No key needed. */
export const deezer = {
  async findArtist(name: string, signal: AbortSignal): Promise<DeezerArtist | null> {
    const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=5`;
    const json = await fetchJson<{ data?: DeezerArtist[] }>("deezer", url, signal);
    const wanted = name.trim().toLowerCase();
    return json.data?.find((a) => a.name.trim().toLowerCase() === wanted) ?? null;
  },
  async relatedArtists(id: number, limit: number, signal: AbortSignal): Promise<DeezerArtist[]> {
    const json = await fetchJson<{ data?: DeezerArtist[] }>("deezer", `https://api.deezer.com/artist/${id}/related?limit=${limit}`, signal);
    return json.data ?? [];
  },
};
