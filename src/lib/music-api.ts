import type { Artist, Playlist, RadioStation, Track } from "./types";

const APP = "sonara_music";

// Multiple Audius discovery nodes for resilient failover
const AUDIUS_NODES = [
  "https://discoveryprovider.audius.co/v1",
  "https://api.audius.co/v1",
];

const RADIO_NODES = [
  "https://de1.api.radio-browser.info/json",
  "https://at1.api.radio-browser.info/json",
];

type ArtworkMap = {
  "150x150"?: string;
  "480x480"?: string;
  "1000x1000"?: string;
} | null;

type AudiusUser = {
  id?: string;
  name?: string;
  handle?: string;
  bio?: string;
  follower_count?: number;
  track_count?: number;
  profile_picture?: ArtworkMap;
};

type AudiusTrack = {
  id?: string;
  title?: string;
  duration?: number;
  genre?: string;
  mood?: string;
  play_count?: number;
  is_streamable?: boolean;
  is_stream_gated?: boolean;
  artwork?: ArtworkMap;
  user?: AudiusUser;
};

type AudiusPlaylist = {
  id?: string;
  playlist_name?: string;
  description?: string;
  track_count?: number;
  is_album?: boolean;
  artwork?: ArtworkMap;
  user?: AudiusUser;
  tracks?: AudiusTrack[];
};

// High-fidelity fallback music catalog curated for Sonara by Jiko
export const CURATED_TRACKS: Track[] = [
  {
    id: "curated_midnight_drive",
    title: "Midnight City Lights",
    artist: "Neon Skyline",
    artwork: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&h=1000&fit=crop&q=85",
    duration: 214,
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=midnight-forest-184304.mp3",
    genre: "Synthwave",
    mood: "Chill",
    playCount: 148200,
    kind: "track",
  },
  {
    id: "curated_lofi_rain",
    title: "Late Night Rain Beats",
    artist: "Aura Chill",
    artwork: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&h=1000&fit=crop&q=85",
    duration: 185,
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3",
    genre: "Lo-Fi",
    mood: "Relaxed",
    playCount: 239400,
    kind: "track",
  },
  {
    id: "curated_cyber_drift",
    title: "Neon Cyber Drift",
    artist: "RetroWave Echo",
    artwork: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1000&h=1000&fit=crop&q=85",
    duration: 230,
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=the-cradle-of-your-soul-15700.mp3",
    genre: "Electronic",
    mood: "Energetic",
    playCount: 195000,
    kind: "track",
  },
  {
    id: "curated_cozy_coffee",
    title: "Sunday Coffee & Vinyl",
    artist: "Komorebi Duo",
    artwork: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1000&h=1000&fit=crop&q=85",
    duration: 198,
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=smoke-143172.mp3",
    genre: "Jazz / Chill",
    mood: "Peaceful",
    playCount: 312000,
    kind: "track",
  },
  {
    id: "curated_stellar_pulse",
    title: "Stellar Journey",
    artist: "Cosmic Odyssey",
    artwork: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&h=1000&fit=crop&q=85",
    duration: 245,
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3527e30de.mp3?filename=space-atmosphere-10612.mp3",
    genre: "Ambient",
    mood: "Dreamy",
    playCount: 88400,
    kind: "track",
  },
  {
    id: "curated_urban_groove",
    title: "Sunset Boulevard",
    artist: "Velvet Groove",
    artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&h=1000&fit=crop&q=85",
    duration: 210,
    streamUrl: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630d7a3f.mp3?filename=watr-fluid-10149.mp3",
    genre: "Pop / R&B",
    mood: "Upbeat",
    playCount: 420000,
    kind: "track",
  },
  {
    id: "curated_tokyo_drift",
    title: "Tokyo Shinjuku Nights",
    artist: "Shibuya Beats",
    artwork: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&h=1000&fit=crop&q=85",
    duration: 178,
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3?filename=electronic-future-beats-117997.mp3",
    genre: "Electronic",
    mood: "Focus",
    playCount: 275000,
    kind: "track",
  },
  {
    id: "curated_golden_hour",
    title: "Golden Hour Glow",
    artist: "Solstice Breeze",
    artwork: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&h=1000&fit=crop&q=85",
    duration: 202,
    streamUrl: "https://cdn.pixabay.com/download/audio/2022/11/06/audio_c896e382b6.mp3?filename=warm-breeze-126298.mp3",
    genre: "Acoustic / Indie",
    mood: "Warm",
    playCount: 164000,
    kind: "track",
  }
];

export const CURATED_RADIO: RadioStation[] = [
  {
    id: "somafm_groovesalad",
    name: "SomaFM Groove Salad",
    artwork: "https://somafm.com/img3/groovesalad-400.jpg",
    streamUrl: "https://ice1.somafm.com/groovesalad-128-mp3",
    tags: "chill,ambient,downtempo,lounge",
    country: "United States",
    bitrate: 128,
  },
  {
    id: "somafm_secretagent",
    name: "SomaFM Secret Agent",
    artwork: "https://somafm.com/img3/secretagent-400.jpg",
    streamUrl: "https://ice1.somafm.com/secretagent-128-mp3",
    tags: "spy,lounge,surf,jazz",
    country: "United States",
    bitrate: 128,
  },
  {
    id: "somafm_dronezone",
    name: "SomaFM Drone Zone",
    artwork: "https://somafm.com/img3/dronezone-400.jpg",
    streamUrl: "https://ice1.somafm.com/dronezone-128-mp3",
    tags: "ambient,space,drone",
    country: "United States",
    bitrate: 128,
  },
  {
    id: "somafm_indiepop",
    name: "SomaFM Indie Pop Rocks!",
    artwork: "https://somafm.com/img3/indiepop-400.jpg",
    streamUrl: "https://ice1.somafm.com/indiepop-128-mp3",
    tags: "indie,pop,rock,alternative",
    country: "United States",
    bitrate: 128,
  },
  {
    id: "smooth_jazz_live",
    name: "Smooth Jazz 24/7",
    artwork: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=480&h=480&fit=crop&q=80",
    streamUrl: "https://smoothjazz.cdnstream1.com/2585_128.mp3",
    tags: "jazz,smooth,relax",
    country: "United States",
    bitrate: 128,
  },
  {
    id: "dance_wave_fm",
    name: "Dance Wave Hits",
    artwork: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=480&h=480&fit=crop&q=80",
    streamUrl: "https://dancewave.online/dance.mp3",
    tags: "dance,club,electronic,edm",
    country: "Hungary",
    bitrate: 128,
  },
];

async function getJson<T>(url: string, timeoutMs = 6000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromAudius<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const query = new URLSearchParams({ app_name: APP, ...params }).toString();
  for (const node of AUDIUS_NODES) {
    try {
      const url = `${node}${path}?${query}`;
      const json = await getJson<{ data?: T } | T>(url, 4500);
      const data = unwrap<T>(json);
      if (data) return data;
    } catch {
      // try next node
    }
  }
  return null;
}

function unwrap<T>(payload: { data?: T } | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function pickArt(art: ArtworkMap, size: keyof NonNullable<ArtworkMap>): string | null {
  if (!art) return null;
  const raw = art[size] || art["480x480"] || art["1000x1000"] || art["150x150"] || null;
  if (!raw) return null;
  return raw.startsWith("http://") ? raw.replace("http://", "https://") : raw;
}

export function trackStreamUrl(id: string): string {
  return `${AUDIUS_NODES[0]}/tracks/${encodeURIComponent(id)}/stream?app_name=${APP}`;
}

export function mapTrack(t: AudiusTrack): Track | null {
  if (!t.id || !t.title) return null;
  if (t.is_streamable === false || t.is_stream_gated) return null;
  const artist = t.user?.name || t.user?.handle || "Unknown artist";
  return {
    id: t.id,
    title: t.title,
    artist,
    artistId: t.user?.id,
    album: undefined,
    artwork: pickArt(t.artwork ?? null, "150x150"),
    artworkLg: pickArt(t.artwork ?? null, "1000x1000") || pickArt(t.artwork ?? null, "480x480"),
    duration: Number(t.duration) || 0,
    streamUrl: trackStreamUrl(t.id),
    genre: t.genre,
    mood: t.mood,
    playCount: t.play_count,
    kind: "track",
  };
}

export function mapPlaylist(p: AudiusPlaylist): Playlist | null {
  if (!p.id || !p.playlist_name) return null;
  const tracks = (p.tracks ?? []).map(mapTrack).filter((x): x is Track => Boolean(x));
  return {
    id: p.id,
    name: p.playlist_name,
    description: p.description || undefined,
    artwork: pickArt(p.artwork ?? null, "480x480"),
    artworkLg: pickArt(p.artwork ?? null, "1000x1000"),
    trackCount: p.track_count ?? tracks.length,
    isAlbum: Boolean(p.is_album),
    owner: p.user?.name,
    ownerId: p.user?.id,
    tracks: tracks.length ? tracks : undefined,
  };
}

export function mapArtist(u: AudiusUser): Artist | null {
  if (!u.id || !u.name) return null;
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    bio: u.bio,
    artwork: pickArt(u.profile_picture ?? null, "480x480"),
    artworkLg: pickArt(u.profile_picture ?? null, "1000x1000"),
    followerCount: u.follower_count,
    trackCount: u.track_count,
  };
}

export async function fetchTrending(limit = 20, genre?: string): Promise<Track[]> {
  try {
    const params: Record<string, string> = { limit: String(limit) };
    if (genre) params.genre = genre;
    const raw = await fetchFromAudius<AudiusTrack[]>("/tracks/trending", params);
    const mapped = (raw ?? []).map(mapTrack).filter((x): x is Track => Boolean(x));
    if (mapped.length >= 4) return mapped;
  } catch {
    // fallback
  }
  return CURATED_TRACKS.slice(0, limit);
}

export async function fetchUnderground(limit = 16): Promise<Track[]> {
  try {
    const raw = await fetchFromAudius<AudiusTrack[]>("/tracks/trending/underground", {
      limit: String(limit),
    });
    const mapped = (raw ?? []).map(mapTrack).filter((x): x is Track => Boolean(x));
    if (mapped.length >= 4) return mapped;
  } catch {
    // fallback
  }
  return [...CURATED_TRACKS].reverse().slice(0, limit);
}

export async function fetchTrendingPlaylists(limit = 16): Promise<Playlist[]> {
  try {
    const raw = await fetchFromAudius<AudiusPlaylist[]>("/playlists/trending", {
      limit: String(limit),
    });
    const mapped = (raw ?? []).map(mapPlaylist).filter((x): x is Playlist => Boolean(x));
    if (mapped.length >= 2) return mapped;
  } catch {
    // fallback
  }
  return [
    {
      id: "curated_pl_chill",
      name: "Jiko's Chill Vibes",
      description: "Atmospheric beats, late night lo-fi and deep melodic chill.",
      artwork: CURATED_TRACKS[1].artwork,
      artworkLg: CURATED_TRACKS[1].artworkLg,
      trackCount: CURATED_TRACKS.length,
      isAlbum: false,
      owner: "Jiko",
      tracks: CURATED_TRACKS,
    },
    {
      id: "curated_pl_synth",
      name: "Cyber & Synthwave Anthems",
      description: "High octane synth and retrofuturistic night rhythms.",
      artwork: CURATED_TRACKS[0].artwork,
      artworkLg: CURATED_TRACKS[0].artworkLg,
      trackCount: CURATED_TRACKS.length,
      isAlbum: false,
      owner: "Jiko",
      tracks: CURATED_TRACKS,
    },
  ];
}

export async function searchTracks(query: string, limit = 24): Promise<Track[]> {
  try {
    const raw = await fetchFromAudius<AudiusTrack[]>("/tracks/search", {
      query,
      limit: String(limit),
    });
    const mapped = (raw ?? []).map(mapTrack).filter((x): x is Track => Boolean(x));
    if (mapped.length) return mapped;
  } catch {
    // fallback search
  }
  const q = query.toLowerCase();
  const matched = CURATED_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.genre && t.genre.toLowerCase().includes(q)),
  );
  return matched.length ? matched : CURATED_TRACKS.slice(0, limit);
}

export async function searchPlaylists(query: string, limit = 12): Promise<Playlist[]> {
  try {
    const raw = await fetchFromAudius<AudiusPlaylist[]>("/playlists/search", {
      query,
      limit: String(limit),
    });
    const mapped = (raw ?? []).map(mapPlaylist).filter((x): x is Playlist => Boolean(x));
    if (mapped.length) return mapped;
  } catch {
    // fallback
  }
  return fetchTrendingPlaylists(limit);
}

export async function searchArtists(query: string, limit = 12): Promise<Artist[]> {
  try {
    const raw = await fetchFromAudius<AudiusUser[]>("/users/search", {
      query,
      limit: String(limit),
    });
    const mapped = (raw ?? []).map(mapArtist).filter((x): x is Artist => Boolean(x));
    if (mapped.length) return mapped;
  } catch {
    // fallback
  }
  return [
    {
      id: "curated_artist_jiko",
      name: "Jiko",
      handle: "jiko",
      bio: "Creator and sound curator of Sonara Music Player.",
      artwork: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&h=480&fit=crop&q=80",
      artworkLg: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&h=1000&fit=crop&q=85",
      followerCount: 9940,
      trackCount: CURATED_TRACKS.length,
    },
    {
      id: "curated_artist_neon",
      name: "Neon Skyline",
      handle: "neonskyline",
      bio: "Retro-synth and atmospheric electronic artist.",
      artwork: CURATED_TRACKS[0].artwork,
      artworkLg: CURATED_TRACKS[0].artworkLg,
      followerCount: 54200,
      trackCount: 12,
    },
  ];
}

export async function fetchPlaylist(id: string): Promise<Playlist | null> {
  if (id.startsWith("curated_pl_")) {
    const playlists = await fetchTrendingPlaylists(10);
    return playlists.find((p) => p.id === id) || playlists[0] || null;
  }
  try {
    const raw = await fetchFromAudius<AudiusPlaylist | AudiusPlaylist[]>(`/playlists/${encodeURIComponent(id)}`);
    const data = Array.isArray(raw) ? raw[0] : raw;
    return data ? mapPlaylist(data) : null;
  } catch {
    return null;
  }
}

export async function fetchArtist(id: string): Promise<Artist | null> {
  if (id === "curated_artist_jiko" || id === "curated_artist_saptak") {
    return {
      id: "curated_artist_jiko",
      name: "Jiko",
      handle: "jiko",
      bio: "Creator and sound curator of Sonara Music Player.",
      artwork: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&h=480&fit=crop&q=80",
      artworkLg: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&h=1000&fit=crop&q=85",
      followerCount: 9940,
      trackCount: CURATED_TRACKS.length,
    };
  }
  try {
    const raw = await fetchFromAudius<AudiusUser | AudiusUser[]>(`/users/${encodeURIComponent(id)}`);
    const data = Array.isArray(raw) ? raw[0] : raw;
    return data ? mapArtist(data) : null;
  } catch {
    return null;
  }
}

export async function fetchArtistTracks(id: string, limit = 40): Promise<Track[]> {
  if (id.startsWith("curated_")) {
    return CURATED_TRACKS;
  }
  try {
    const raw = await fetchFromAudius<AudiusTrack[]>(`/users/${encodeURIComponent(id)}/tracks`, {
      limit: String(limit),
    });
    const mapped = (raw ?? []).map(mapTrack).filter((x): x is Track => Boolean(x));
    if (mapped.length) return mapped;
  } catch {
    // fallback
  }
  return CURATED_TRACKS.slice(0, limit);
}

export async function fetchTrack(id: string): Promise<Track | null> {
  const curated = CURATED_TRACKS.find((t) => t.id === id);
  if (curated) return curated;
  try {
    const raw = await fetchFromAudius<AudiusTrack | AudiusTrack[]>(`/tracks/${encodeURIComponent(id)}`);
    const data = Array.isArray(raw) ? raw[0] : raw;
    return data ? mapTrack(data) : null;
  } catch {
    return null;
  }
}

export function mapRadio(s: {
  stationuuid?: string;
  name?: string;
  favicon?: string;
  url_resolved?: string;
  url?: string;
  tags?: string;
  country?: string;
  bitrate?: number;
}): RadioStation | null {
  const stream = s.url_resolved || s.url;
  if (!s.stationuuid || !s.name || !stream) return null;
  if (stream.startsWith("http://")) return null;
  return {
    id: s.stationuuid,
    name: s.name.trim(),
    artwork: s.favicon || null,
    streamUrl: stream,
    tags: s.tags || "",
    country: s.country || "",
    bitrate: s.bitrate,
  };
}

export function radioToTrack(station: RadioStation): Track {
  return {
    id: `radio:${station.id}`,
    title: station.name,
    artist: station.country || "Live radio",
    artwork: station.artwork,
    artworkLg: station.artwork,
    duration: 0,
    streamUrl: station.streamUrl,
    genre: station.tags.split(",")[0],
    kind: "radio",
  };
}

export async function fetchRadioStations(limit = 24, tag?: string): Promise<RadioStation[]> {
  for (const node of RADIO_NODES) {
    try {
      const url = new URL(`${node}/stations/search`);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("hidebroken", "true");
      url.searchParams.set("order", "clickcount");
      url.searchParams.set("reverse", "true");
      if (tag) url.searchParams.set("tag", tag);
      const data = await getJson<Parameters<typeof mapRadio>[0][]>(url.toString(), 4000);
      const mapped = (data ?? []).map(mapRadio).filter((x): x is RadioStation => Boolean(x));
      if (mapped.length >= 3) {
        const seen = new Set<string>();
        return mapped.filter((s) => {
          const key = s.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
    } catch {
      // try next radio node
    }
  }
  if (tag) {
    const q = tag.toLowerCase();
    const filtered = CURATED_RADIO.filter((r) => r.tags.toLowerCase().includes(q));
    if (filtered.length) return filtered;
  }
  return CURATED_RADIO.slice(0, limit);
}

export async function searchRadio(query: string, limit = 16): Promise<RadioStation[]> {
  for (const node of RADIO_NODES) {
    try {
      const url = new URL(`${node}/stations/search`);
      url.searchParams.set("name", query);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("hidebroken", "true");
      url.searchParams.set("order", "clickcount");
      url.searchParams.set("reverse", "true");
      const data = await getJson<Parameters<typeof mapRadio>[0][]>(url.toString(), 4000);
      const mapped = (data ?? []).map(mapRadio).filter((x): x is RadioStation => Boolean(x));
      if (mapped.length) return mapped;
    } catch {
      // try next
    }
  }
  const q = query.toLowerCase();
  const matched = CURATED_RADIO.filter(
    (s) => s.name.toLowerCase().includes(q) || s.tags.toLowerCase().includes(q),
  );
  return matched.length ? matched : CURATED_RADIO.slice(0, limit);
}

export type Lyrics = {
  plain: string;
  synced: { time: number; text: string }[] | null;
  instrumental: boolean;
};

function parseSynced(raw: string | null | undefined): { time: number; text: string }[] | null {
  if (!raw) return null;
  const lines: { time: number; text: string }[] = [];
  for (const line of raw.split("\n")) {
    const m = line.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)/);
    if (!m) continue;
    const min = Number(m[1]);
    const sec = Number(m[2]);
    const ms = Number((m[3] ?? "0").padEnd(3, "0"));
    lines.push({ time: min * 60 + sec + ms / 1000, text: (m[4] ?? "").trim() });
  }
  return lines.length ? lines : null;
}

export async function fetchLyrics(title: string, artist: string): Promise<Lyrics | null> {
  try {
    const url = new URL("https://lrclib.net/api/search");
    url.searchParams.set("track_name", title);
    url.searchParams.set("artist_name", artist.replace(/^@/, ""));
    const data = await getJson<
      {
        plainLyrics?: string | null;
        syncedLyrics?: string | null;
        instrumental?: boolean;
      }[]
    >(url.toString(), 4000);
    const hit = (data ?? []).find((d) => d.plainLyrics || d.syncedLyrics || d.instrumental);
    if (!hit) return null;
    return {
      plain: hit.plainLyrics || "",
      synced: parseSynced(hit.syncedLyrics),
      instrumental: Boolean(hit.instrumental),
    };
  } catch {
    return null;
  }
}
