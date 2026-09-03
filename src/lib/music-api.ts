import type { Artist, Playlist, RadioStation, Track } from "./types";
import {
  searchDeezerTracksServerFn,
  searchDeezerPlaylistsServerFn,
  searchDeezerArtistsServerFn,
  getDeezerTrackServerFn,
  getDeezerPlaylistServerFn,
  getDeezerArtistServerFn,
  getDeezerArtistTracksServerFn,
} from "./deezer-api";
import {
  searchSaavnTracksServerFn,
  searchSaavnPlaylistsServerFn,
  searchSaavnArtistsServerFn,
  searchSaavnAlbumsServerFn,
  getSaavnTrackServerFn,
  getSaavnPlaylistServerFn,
  getSaavnAlbumServerFn,
  getSaavnArtistServerFn,
  getSaavnArtistTracksServerFn,
  getSaavnArtistAlbumsServerFn,
  resolveFullTrackStreamServerFn,
} from "./saavn-api";
import {
  searchSoundCloudTracksServerFn,
  getSoundCloudTrackServerFn,
} from "./soundcloud-api";

const APP = "sonara_music";

// Multiple Audius discovery nodes for resilient failover
const AUDIUS_NODES = [
  "https://discoveryprovider.audius.co/v1",
  "https://api.audius.co/v1",
];

const RADIO_NODES = [
  "https://all.api.radio-browser.info/json",
  "https://de1.api.radio-browser.info/json",
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
    id: "curated_ekla_cholo",
    title: "Ekla Cholo Re",
    artist: "Rabindra Sangeet · Kishore Kumar",
    artwork: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&h=1000&fit=crop&q=85",
    duration: 215,
    streamUrl: "https://archive.org/download/EklaCholoRe/EklaCholoRe-KishoreKumar.mp3",
    genre: "Rabindra Sangeet",
    mood: "Soulful",
    playCount: 520000,
    kind: "track",
  },
  {
    id: "curated_rabindra_boshonto",
    title: "Aha Aji E Boshonto",
    artist: "Rabindranath Tagore",
    artwork: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1000&h=1000&fit=crop&q=85",
    duration: 232,
    streamUrl: "https://archive.org/download/RabindraSangeet/01.AhaAjiEBoshanto.mp3",
    genre: "Rabindra Sangeet",
    mood: "Poetic",
    playCount: 380000,
    kind: "track",
  },
  {
    id: "curated_mayabono_biharini",
    title: "Mayabono Biharini Horini",
    artist: "Rabindra Sangeet · Somlata Acharyya",
    artwork: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&h=1000&fit=crop&q=85",
    duration: 248,
    streamUrl: "https://archive.org/download/SomlataRabindraSangeet/MayabonoBiharini.mp3",
    genre: "Bengali Contemporary",
    mood: "Melodic",
    playCount: 460000,
    kind: "track",
  },
  {
    id: "curated_tumi_roshik_re",
    title: "Tumi Roshik Re (Baul Folk)",
    artist: "Bengali Folk Traditions",
    artwork: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=480&h=480&fit=crop&q=80",
    artworkLg: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&h=1000&fit=crop&q=85",
    duration: 210,
    streamUrl: "https://archive.org/download/BanglaFolkBaulSongs/TumiRoshikRe.mp3",
    genre: "Bengali Folk",
    mood: "Soulful",
    playCount: 290000,
    kind: "track",
  },
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
  },
];

export const CURATED_RADIO: RadioStation[] = [
  {
    id: "air_fm_gold_kolkata",
    name: "AIR FM Gold Kolkata",
    artwork: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=480&h=480&fit=crop&q=80",
    streamUrl: "https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio057/hlspbaudio05764kbps.m3u8",
    tags: "kolkata,bengali,all india radio,west bengal",
    country: "India",
    bitrate: 64,
  },
  {
    id: "air_kolkata_geetanjali",
    name: "Akashvani Kolkata Geetanjali",
    artwork: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&h=480&fit=crop&q=80",
    streamUrl: "https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio055/hlspbaudio05564kbps.m3u8",
    tags: "kolkata,bengali,classical,west bengal",
    country: "India",
    bitrate: 64,
  },
  {
    id: "air_rainbow_kolkata",
    name: "Akashvani FM Rainbow Kolkata",
    artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=480&h=480&fit=crop&q=80",
    streamUrl: "https://airhlspush.pc.cdn.bitgravity.com/httppush/hlspbaudio058/hlspbaudio05864kbps.m3u8",
    tags: "kolkata,bengali,pop,hits,west bengal",
    country: "India",
    bitrate: 64,
  },
  {
    id: "radio_robichhaya",
    name: "Radio BongOnet Robichhaya (Rabindra Sangeet)",
    artwork: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=480&h=480&fit=crop&q=80",
    streamUrl: "https://stream.radiotreetal.com/listen",
    tags: "rabindrasangeet,bengali,kolkata,west bengal",
    country: "India",
    bitrate: 128,
  },
  {
    id: "ankora_radio_wb",
    name: "Ankora Radio West Bengal",
    artwork: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=480&h=480&fit=crop&q=80",
    streamUrl: "https://stream-153.zeno.fm/xush70b1cbruv",
    tags: "bengali,kolkata,indie,west bengal",
    country: "India",
    bitrate: 128,
  },
  {
    id: "radio_quarantine_kolkata",
    name: "Radio Quarantine Kolkata",
    artwork: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&h=480&fit=crop&q=80",
    streamUrl: "https://stream-173.zeno.fm/krk4kw830tzuv",
    tags: "kolkata,bengali,indie,west bengal",
    country: "India",
    bitrate: 128,
  },
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

export async function fetchTrending(limit = 24, genre?: string): Promise<Track[]> {
  try {
    if (genre) {
      const saavnTracks = await searchSaavnTracksServerFn({ data: { query: `${genre} hits`, limit } });
      if (saavnTracks.length >= 6) return saavnTracks;
      const audius = await fetchFromAudius<AudiusTrack[]>("/tracks/trending", { limit: String(limit), genre });
      const mapped = (audius ?? []).map(mapTrack).filter((x): x is Track => Boolean(x));
      const combined = [...saavnTracks, ...mapped];
      return combined.slice(0, limit);
    }

    // Homepage Listen Now: Real chart hits across Bengali, Bollywood, Progressive Rock, and Pop
    const [bengaliRes, bollywoodRes, rockRes, popRes, scRes] = await Promise.allSettled([
      searchSaavnTracksServerFn({ data: { query: "Arijit Singh Bengali", limit: 8 } }),
      searchSaavnTracksServerFn({ data: { query: "Bollywood Trending", limit: 8 } }),
      searchSaavnTracksServerFn({ data: { query: "Dream Theater Pink Floyd", limit: 8 } }),
      searchSaavnTracksServerFn({ data: { query: "Taylor Swift The Weeknd", limit: 8 } }),
      searchSoundCloudTracksServerFn({ data: { query: "Classic Rock Acoustic", limit: 6 } }),
    ]);

    const bengali = bengaliRes.status === "fulfilled" ? bengaliRes.value : [];
    const bollywood = bollywoodRes.status === "fulfilled" ? bollywoodRes.value : [];
    const rock = rockRes.status === "fulfilled" ? rockRes.value : [];
    const pop = popRes.status === "fulfilled" ? popRes.value : [];
    const scTracks = scRes.status === "fulfilled" ? scRes.value : [];

    const interleaved: Track[] = [];
    const maxLen = Math.max(bengali.length, bollywood.length, rock.length, pop.length, scTracks.length);
    for (let i = 0; i < maxLen; i++) {
      if (bengali[i]) interleaved.push(bengali[i]);
      if (bollywood[i]) interleaved.push(bollywood[i]);
      if (rock[i]) interleaved.push(rock[i]);
      if (pop[i]) interleaved.push(pop[i]);
      if (scTracks[i]) interleaved.push(scTracks[i]);
    }

    if (interleaved.length) {
      const seen = new Set<string>();
      const deduped = interleaved.filter((t) => {
        const key = `${t.title.toLowerCase()}_${t.artist.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (deduped.length >= 4) return deduped.slice(0, limit);
    }
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
    const [saavnPlaylistsRes, audiusPlaylistsRes] = await Promise.allSettled([
      searchSaavnPlaylistsServerFn({ data: { query: "Bollywood Bengali Rock", limit: 8 } }),
      fetchFromAudius<AudiusPlaylist[]>("/playlists/trending", { limit: String(limit) }),
    ]);

    const saavnPlaylists = saavnPlaylistsRes.status === "fulfilled" ? saavnPlaylistsRes.value : [];
    const audiusPlaylists =
      audiusPlaylistsRes.status === "fulfilled" && audiusPlaylistsRes.value
        ? audiusPlaylistsRes.value.map(mapPlaylist).filter((x): x is Playlist => Boolean(x))
        : [];

    const curatedPlaylists: Playlist[] = [
      {
        id: "curated_pl_bengali",
        name: "Bengali Golden Treasures",
        description: "Rabindra Sangeet, modern Bengali melodies & timeless classics.",
        artwork: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=480&h=480&fit=crop&q=80",
        artworkLg: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&h=1000&fit=crop&q=85",
        trackCount: 30,
        isAlbum: false,
        owner: "Sonara Curators",
      },
      {
        id: "curated_pl_rock",
        name: "Progressive Rock & Metal Anthems",
        description: "Dream Theater, Pink Floyd, Queen, Metallica & classic epic solos.",
        artwork: "/genres/rock.jpg",
        artworkLg: "/genres/rock.jpg",
        trackCount: 45,
        isAlbum: false,
        owner: "Sonara Rock",
      },
      {
        id: "curated_pl_bollywood",
        name: "Bollywood Superhits & Romance",
        description: "Arijit Singh, Shreya Ghoshal, Pritam & blockbuster chartbusters.",
        artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=480&h=480&fit=crop&q=80",
        artworkLg: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&h=1000&fit=crop&q=85",
        trackCount: 50,
        isAlbum: false,
        owner: "Bollywood Mix",
      },
      {
        id: "curated_pl_chill",
        name: "Jiko's Chill & Lo-Fi Lounge",
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

    const merged = [...curatedPlaylists, ...saavnPlaylists, ...audiusPlaylists];
    if (merged.length) return merged.slice(0, limit);
  } catch {
    // fallback
  }
  return [
    {
      id: "curated_pl_bengali",
      name: "Bengali Golden Treasures",
      description: "Rabindra Sangeet, modern Bengali melodies & timeless classics.",
      artwork: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=480&h=480&fit=crop&q=80",
      artworkLg: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&h=1000&fit=crop&q=85",
      trackCount: 30,
      isAlbum: false,
      owner: "Sonara Curators",
    },
  ];
}

async function fetchArchiveOrgTracks(query: string, limit = 12): Promise<Track[]> {
  try {
    const cleanQuery = query.trim().replace(/[^\w\s-]/g, "");
    if (!cleanQuery) return [];
    const q = `(${cleanQuery}) AND mediatype:(audio) AND (format:(MP3) OR format:(VBR MP3))`;
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,title,creator,year,description&sort[]=downloads+desc&rows=${limit}&page=1&output=json`;
    const data = await getJson<{
      response?: {
        docs?: Array<{ identifier: string; title?: string; creator?: string; year?: string }>;
      };
    }>(url, 3500);

    const docs = data?.response?.docs ?? [];
    const tracks: Track[] = [];

    await Promise.allSettled(
      docs.slice(0, 8).map(async (doc) => {
        try {
          const meta = await getJson<{
            files?: Array<{ name: string; length?: string; format?: string }>;
          }>(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`, 3000);

          const mp3 = meta?.files?.find(
            (f) => f.name.endsWith(".mp3") && !f.name.includes("_vbr") && !f.name.includes("_sample"),
          );

          if (mp3) {
            const streamUrl = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(mp3.name)}`;
            const artwork = `https://archive.org/services/img/${doc.identifier}`;
            tracks.push({
              id: `archive_${doc.identifier}`,
              title: doc.title || "Classic Audio Track",
              artist: doc.creator || "Classic Master",
              artwork,
              artworkLg: artwork,
              duration: Math.round(Number(mp3.length) || 210),
              streamUrl,
              genre: "Classics",
              kind: "track",
            });
          }
        } catch {
          // ignore individual item failure
        }
      }),
    );

    return tracks;
  } catch {
    return [];
  }
}

export async function searchTracks(query: string, limit = 24): Promise<Track[]> {
  const [saavnRes, deezerRes, soundcloudRes, audiusRes, archiveRes] = await Promise.allSettled([
    searchSaavnTracksServerFn({ data: { query, limit: Math.min(20, limit) } }),
    searchDeezerTracksServerFn({ data: { query, limit: Math.min(12, limit) } }),
    searchSoundCloudTracksServerFn({ data: { query, limit: Math.min(10, limit) } }),
    fetchFromAudius<AudiusTrack[]>("/tracks/search", { query, limit: String(Math.min(6, limit)) }),
    fetchArchiveOrgTracks(query, Math.min(4, limit)),
  ]);

  const saavnTracks =
    saavnRes.status === "fulfilled" && saavnRes.value ? saavnRes.value : [];

  const deezerTracks =
    deezerRes.status === "fulfilled" && deezerRes.value ? deezerRes.value : [];

  const soundcloudTracks =
    soundcloudRes.status === "fulfilled" && soundcloudRes.value ? soundcloudRes.value : [];

  const audiusTracks =
    audiusRes.status === "fulfilled" && audiusRes.value
      ? audiusRes.value.map(mapTrack).filter((x): x is Track => Boolean(x))
      : [];

  const archiveTracks =
    archiveRes.status === "fulfilled" && archiveRes.value ? archiveRes.value : [];

  // Priority: Full-length 320kbps master tracks first, then SoundCloud, Deezer, Archive
  const combined = [...saavnTracks, ...soundcloudTracks, ...deezerTracks, ...audiusTracks, ...archiveTracks];

  if (combined.length) {
    const seen = new Set<string>();
    return combined.filter((t) => {
      const key = `${t.title.toLowerCase()}_${t.artist.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
  }

  const q = query.toLowerCase();
  const matched = CURATED_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.genre && t.genre.toLowerCase().includes(q)),
  );
  if (matched.length) return matched.slice(0, limit);

  return CURATED_TRACKS.slice(0, limit);
}

/**
 * Intelligent Next-Track / Queue Recommendation Algorithm
 * Analyzes the played song's artist, genre, and acoustic vibe to queue matching songs.
 * Ensures Rock stays with Rock/Metal, Bengali stays with Bengali, and prevents random EDM/DJ mixes!
 */
export async function fetchRelatedQueue(track: Track, limit = 15): Promise<Track[]> {
  try {
    const artist = track.artist?.toLowerCase() || "";
    const title = track.title?.toLowerCase() || "";
    const genre = track.genre?.toLowerCase() || "";
    const blob = `${artist} ${title} ${genre}`;

    // 1. Rock / Prog Rock / Metal
    const isRockOrMetal =
      genre.includes("rock") ||
      genre.includes("metal") ||
      genre.includes("prog") ||
      /dream theater|pink floyd|queen|metallica|rush|porcupine tree|tool|opeth|iron maiden|led zeppelin|ac\/dc|guns n' roses|nirvana|linkin park|foo fighters|deep purple|black sabbath|fossils|cactus|steven wilson|judas priest|megadeth/.test(
        blob,
      );

    // 2. Bengali Music
    const isBengali =
      genre.includes("bengali") ||
      genre.includes("bangla") ||
      /arijit singh|anupam roy|fossils|rupam islam|cactus|rabindra|shreya ghoshal|nachiketa|somlata|silajit|hemanta|manna dey|kishore kumar|moheener ghoraguli/.test(
        blob,
      );

    // 3. Bollywood / Hindi Melodic
    const isBollywood =
      genre.includes("hindi") ||
      genre.includes("bollywood") ||
      /arijit singh|atif aslam|pritam|shreya ghoshal|mohit chauhan|kk|sonu nigam|jubin nautiyal|darshan raval|sachin-jigar|ar rahman|vishal mishra/.test(
        blob,
      );

    // 4. Pop / Western Contemporary
    const isPop =
      genre.includes("pop") ||
      /taylor swift|the weeknd|billie eilish|olivia rodrigo|coldplay|daft punk|dua lipa|ed sheeran|bruno mars|sabrina carpenter|ariana grande|adele|charlie puth/.test(
        blob,
      );

    let queries: string[] = [];

    if (isRockOrMetal) {
      if (isBengali) {
        queries = ["Fossils Bangla Rock", "Cactus Bengali Band", "Rupam Islam Rock", "Lakkhichhara"];
      } else {
        queries = [
          `${track.artist} greatest hits`,
          "Dream Theater Pink Floyd",
          "Progressive Rock Metal Anthems",
          "Rush Porcupine Tree",
          "Classic Rock Metal",
        ];
      }
    } else if (isBengali) {
      queries = [
        `${track.artist} Bengali`,
        "Bengali Golden Treasures",
        "Anupam Roy Hits",
        "Arijit Singh Bengali Songs",
      ];
    } else if (isBollywood) {
      queries = [
        `${track.artist} Superhits`,
        "Bollywood Romance Melody",
        "Arijit Singh Atif Aslam",
        "Pritam Bollywood Hits",
      ];
    } else if (isPop) {
      queries = [
        `${track.artist} top hits`,
        "Pop Anthems Hits",
        "The Weeknd Taylor Swift",
        "Coldplay Pop Rock",
      ];
    } else {
      queries = [`${track.artist} songs`, `${track.genre || track.artist} popular`];
    }

    const results: Track[] = [];
    const seen = new Set<string>([track.id]);

    const [saavnRes, scRes] = await Promise.allSettled([
      Promise.allSettled(
        queries.slice(0, 3).map((q) => searchSaavnTracksServerFn({ data: { query: q, limit: 8 } })),
      ),
      isRockOrMetal
        ? searchSoundCloudTracksServerFn({ data: { query: `${track.artist} rock`, limit: 6 } })
        : Promise.resolve([]),
    ]);

    if (saavnRes.status === "fulfilled") {
      for (const res of saavnRes.value) {
        if (res.status === "fulfilled" && res.value) {
          for (const t of res.value) {
            const key = `${t.title.toLowerCase()}_${t.artist.toLowerCase()}`;
            if (!seen.has(key) && !seen.has(t.id)) {
              seen.add(key);
              seen.add(t.id);
              results.push(t);
            }
          }
        }
      }
    }

    if (scRes.status === "fulfilled" && Array.isArray(scRes.value)) {
      for (const t of scRes.value) {
        const key = `${t.title.toLowerCase()}_${t.artist.toLowerCase()}`;
        if (!seen.has(key) && !seen.has(t.id)) {
          seen.add(key);
          seen.add(t.id);
          results.push(t);
        }
      }
    }

    if (results.length >= 3) {
      return results.slice(0, limit);
    }
  } catch {
    // fallback
  }

  return CURATED_TRACKS.filter((t) => t.id !== track.id).slice(0, limit);
}

export async function searchPlaylists(query: string, limit = 12): Promise<Playlist[]> {
  try {
    const [saavnRes, deezerRes, audiusRes] = await Promise.allSettled([
      searchSaavnPlaylistsServerFn({ data: { query, limit } }),
      searchDeezerPlaylistsServerFn({ data: { query, limit } }),
      fetchFromAudius<AudiusPlaylist[]>("/playlists/search", {
        query,
        limit: String(limit),
      }),
    ]);

    const saavnPlaylists =
      saavnRes.status === "fulfilled" && saavnRes.value ? saavnRes.value : [];

    const deezerPlaylists =
      deezerRes.status === "fulfilled" && deezerRes.value ? deezerRes.value : [];

    const audiusPlaylists =
      audiusRes.status === "fulfilled" && audiusRes.value
        ? audiusRes.value.map(mapPlaylist).filter((x): x is Playlist => Boolean(x))
        : [];

    const merged = [...saavnPlaylists, ...deezerPlaylists, ...audiusPlaylists];
    if (merged.length) return merged.slice(0, limit);
  } catch {
    // fallback
  }
  return fetchTrendingPlaylists(limit);
}

export const FEATURED_ALBUMS: Playlist[] = [
  {
    id: "saavn_album_10970045",
    name: "1989",
    description: "Album by Taylor Swift · 2014",
    artwork: "https://c.saavncdn.com/886/1989-English-2014-20240119005634-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/886/1989-English-2014-20240119005634-500x500.jpg",
    trackCount: 16,
    isAlbum: true,
    owner: "Taylor Swift",
  },
  {
    id: "saavn_album_16276424",
    name: "Images and Words",
    description: "Album by Dream Theater · 1992",
    artwork: "https://c.saavncdn.com/867/Images-and-Words-English-1992-20260827073616-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/867/Images-and-Words-English-1992-20260827073616-500x500.jpg",
    trackCount: 8,
    isAlbum: true,
    owner: "Dream Theater",
  },
  {
    id: "saavn_album_1122874",
    name: "Master Of Puppets",
    description: "Album by Metallica · 1986",
    artwork: "https://c.saavncdn.com/127/Master-Of-Puppets-1992-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/127/Master-Of-Puppets-1992-500x500.jpg",
    trackCount: 8,
    isAlbum: true,
    owner: "Metallica",
  },
  {
    id: "saavn_album_17037435",
    name: "Lover",
    description: "Album by Taylor Swift · 2019",
    artwork: "https://c.saavncdn.com/228/Lover-English-2019-20250731010741-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/228/Lover-English-2019-20250731010741-500x500.jpg",
    trackCount: 18,
    isAlbum: true,
    owner: "Taylor Swift",
  },
  {
    id: "saavn_album_16271967",
    name: "Black Clouds & Silver Linings",
    description: "Album by Dream Theater · 2009",
    artwork: "https://c.saavncdn.com/308/Black-Clouds-Silver-Linings-English-2009-20190607050635-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/308/Black-Clouds-Silver-Linings-English-2009-20190607050635-500x500.jpg",
    trackCount: 6,
    isAlbum: true,
    owner: "Dream Theater",
  },
  {
    id: "saavn_album_1707513",
    name: "The Dark Side of the Moon",
    description: "Album by Pink Floyd · 1973",
    artwork: "https://c.saavncdn.com/261/The-Dark-Side-of-the-Moon-Unknown-2016-20250916233240-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/261/The-Dark-Side-of-the-Moon-Unknown-2016-20250916233240-500x500.jpg",
    trackCount: 10,
    isAlbum: true,
    owner: "Pink Floyd",
  },
  {
    id: "saavn_album_16264220",
    name: "Fear of the Dark",
    description: "Album by Iron Maiden · 1992",
    artwork: "https://c.saavncdn.com/142/Fear-Of-The-Dark-2015-Remaster--English-2017-20190607041844-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/142/Fear-Of-The-Dark-2015-Remaster--English-2017-20190607041844-500x500.jpg",
    trackCount: 12,
    isAlbum: true,
    owner: "Iron Maiden",
  },
  {
    id: "saavn_album_1285399",
    name: "Back In Black",
    description: "Album by AC/DC · 1980",
    artwork: "https://c.saavncdn.com/841/Back-In-Black-English-1980-20200720182610-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/841/Back-In-Black-English-1980-20200720182610-500x500.jpg",
    trackCount: 10,
    isAlbum: true,
    owner: "AC/DC",
  },
  {
    id: "saavn_album_77003454",
    name: "A Night At The Opera",
    description: "Album by Queen · 1975",
    artwork: "https://c.saavncdn.com/264/A-Night-At-The-Opera-English-2026-20260617043345-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/264/A-Night-At-The-Opera-English-2026-20260617043345-500x500.jpg",
    trackCount: 12,
    isAlbum: true,
    owner: "Queen",
  },
  {
    id: "saavn_album_1139549",
    name: "Aashiqui 2",
    description: "Album by Mithoon, Ankit Tiwari, Jeet Gannguli · 2013",
    artwork: "https://c.saavncdn.com/430/Aashiqui-2-Hindi-2013-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/430/Aashiqui-2-Hindi-2013-500x500.jpg",
    trackCount: 11,
    isAlbum: true,
    owner: "Aashiqui 2",
  },
  {
    id: "saavn_album_3084994",
    name: "Starboy",
    description: "Album by The Weeknd · 2016",
    artwork: "https://c.saavncdn.com/372/Starboy-English-2016-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/372/Starboy-English-2016-500x500.jpg",
    trackCount: 18,
    isAlbum: true,
    owner: "The Weeknd",
  },
  {
    id: "saavn_album_1045274",
    name: "Rockstar",
    description: "Album by A.R. Rahman · 2011",
    artwork: "https://c.saavncdn.com/408/Rockstar-Hindi-2011-20221212023139-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/408/Rockstar-Hindi-2011-20221212023139-500x500.jpg",
    trackCount: 14,
    isAlbum: true,
    owner: "A.R. Rahman",
  },
];

export async function fetchFeaturedAlbums(limit = 12): Promise<Playlist[]> {
  return FEATURED_ALBUMS.slice(0, limit);
}

export async function searchAlbums(query: string, limit = 16): Promise<Playlist[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return FEATURED_ALBUMS.slice(0, limit);

  try {
    const [saavnRes, artistsRes] = await Promise.allSettled([
      searchSaavnAlbumsServerFn({ data: { query: cleanQ, limit } }),
      searchSaavnArtistsServerFn({ data: { query: cleanQ, limit: 3 } }),
    ]);

    const directAlbums =
      saavnRes.status === "fulfilled" && saavnRes.value ? saavnRes.value : [];

    const artists =
      artistsRes.status === "fulfilled" && artistsRes.value ? artistsRes.value : [];

    let artistAlbums: Playlist[] = [];
    const topArtist = artists[0];
    if (topArtist && topArtist.id.startsWith("saavn_artist_")) {
      const qLower = cleanQ.toLowerCase();
      const aLower = topArtist.name.toLowerCase();
      if (aLower.includes(qLower) || qLower.includes(aLower)) {
        try {
          artistAlbums = await getSaavnArtistAlbumsServerFn({
            data: { id: topArtist.id, limit: 20 },
          });
        } catch {
          // ignore
        }
      }
    }

    const qLower = cleanQ.toLowerCase();
    const curatedMatches = FEATURED_ALBUMS.filter(
      (a) =>
        a.name.toLowerCase().includes(qLower) ||
        (a.owner && a.owner.toLowerCase().includes(qLower)),
    );

    const merged = [...artistAlbums, ...directAlbums, ...curatedMatches];
    const seen = new Set<string>();
    const deduped: Playlist[] = [];

    for (const a of merged) {
      const normKey = a.name.toLowerCase().replace(/[^\w]/g, "");
      if (!seen.has(normKey) && !seen.has(a.id)) {
        seen.add(normKey);
        seen.add(a.id);
        deduped.push(a);
      }
    }

    if (deduped.length) return deduped.slice(0, limit);
  } catch {
    // fallback
  }
  return [];
}

export async function searchArtists(query: string, limit = 12): Promise<Artist[]> {
  try {
    const [saavnRes, deezerRes, audiusRes] = await Promise.allSettled([
      searchSaavnArtistsServerFn({ data: { query, limit } }),
      searchDeezerArtistsServerFn({ data: { query, limit } }),
      fetchFromAudius<AudiusUser[]>("/users/search", {
        query,
        limit: String(limit),
      }),
    ]);

    const saavnArtists =
      saavnRes.status === "fulfilled" && saavnRes.value ? saavnRes.value : [];

    const deezerArtists =
      deezerRes.status === "fulfilled" && deezerRes.value ? deezerRes.value : [];

    const audiusArtists =
      audiusRes.status === "fulfilled" && audiusRes.value
        ? audiusRes.value.map(mapArtist).filter((x): x is Artist => Boolean(x))
        : [];

    const merged = [...saavnArtists, ...deezerArtists, ...audiusArtists];
    if (merged.length) return merged.slice(0, limit);
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
  if (id.startsWith("saavn_album_")) {
    return getSaavnAlbumServerFn({ data: { id } });
  }
  if (id.startsWith("saavn_pl_")) {
    return getSaavnPlaylistServerFn({ data: { id } });
  }
  if (id.startsWith("deezer_pl_")) {
    return getDeezerPlaylistServerFn({ data: { id } });
  }
  try {
    const raw = await fetchFromAudius<AudiusPlaylist | AudiusPlaylist[]>(`/playlists/${encodeURIComponent(id)}`);
    const data = Array.isArray(raw) ? raw[0] : raw;
    return data ? mapPlaylist(data) : null;
  } catch {
    return null;
  }
}

export async function fetchArtistAlbums(id: string, limit = 20): Promise<Playlist[]> {
  if (id.startsWith("saavn_artist_")) {
    return getSaavnArtistAlbumsServerFn({ data: { id, limit } });
  }
  return [];
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
  if (id.startsWith("saavn_artist_")) {
    return getSaavnArtistServerFn({ data: { id } });
  }
  if (id.startsWith("deezer_artist_")) {
    return getDeezerArtistServerFn({ data: { id } });
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
  if (id.startsWith("saavn_artist_")) {
    return getSaavnArtistTracksServerFn({ data: { id, limit } });
  }
  if (id.startsWith("deezer_artist_")) {
    return getDeezerArtistTracksServerFn({ data: { id, limit } });
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

  if (id.startsWith("saavn_")) {
    return getSaavnTrackServerFn({ data: { id } });
  }

  if (id.startsWith("soundcloud_")) {
    return getSoundCloudTrackServerFn({ data: { id } });
  }

  if (id.startsWith("deezer_")) {
    const track = await getDeezerTrackServerFn({ data: { id } });
    if (track) {
      try {
        const full = await resolveFullTrackStreamServerFn({
          data: { title: track.title, artist: track.artist },
        });
        if (full?.streamUrl) {
          return {
            ...track,
            streamUrl: full.streamUrl,
            duration: full.duration,
          };
        }
      } catch {
        // use base track
      }
    }
    return track;
  }

  if (id.startsWith("archive_")) {
    const identifier = id.replace("archive_", "");
    try {
      const meta = await getJson<{
        metadata?: { title?: string; creator?: string };
        files?: Array<{ name: string; length?: string }>;
      }>(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, 4000);

      const mp3 = meta?.files?.find((f) => f.name.endsWith(".mp3") && !f.name.includes("_vbr"));
      if (mp3) {
        const streamUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(mp3.name)}`;
        const artwork = `https://archive.org/services/img/${identifier}`;
        return {
          id,
          title: meta?.metadata?.title || "Audio Track",
          artist: meta?.metadata?.creator || "Classic Master",
          artwork,
          artworkLg: artwork,
          duration: Math.round(Number(mp3.length) || 210),
          streamUrl,
          genre: "Classics",
          kind: "track",
        };
      }
    } catch {
      return null;
    }
  }

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
  state?: string;
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
    country: s.state ? `${s.state}, ${s.country || "India"}` : s.country || "",
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

export async function fetchRadioStations(limit = 32, tag?: string): Promise<RadioStation[]> {
  const curatedMatches = tag
    ? CURATED_RADIO.filter((r) => r.tags.toLowerCase().includes(tag.toLowerCase()))
    : CURATED_RADIO;

  for (const node of RADIO_NODES) {
    try {
      const url = new URL(`${node}/stations/search`);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("hidebroken", "true");
      url.searchParams.set("order", "clickcount");
      url.searchParams.set("reverse", "true");
      if (tag) url.searchParams.set("tag", tag);

      const [generalRes, regionalRes] = await Promise.allSettled([
        getJson<Parameters<typeof mapRadio>[0][]>(url.toString(), 3500),
        !tag
          ? getJson<Parameters<typeof mapRadio>[0][]>(
              `${node}/stations/bylanguage/bengali?limit=16&hidebroken=true`,
              3500,
            )
          : Promise.resolve([]),
      ]);

      const general = (generalRes.status === "fulfilled" ? generalRes.value : []) ?? [];
      const regional = (regionalRes.status === "fulfilled" ? regionalRes.value : []) ?? [];

      const combined = [
        ...curatedMatches,
        ...regional.map(mapRadio).filter((x): x is RadioStation => Boolean(x)),
        ...general.map(mapRadio).filter((x): x is RadioStation => Boolean(x)),
      ];

      const seen = new Set<string>();
      const deduped = combined.filter((s) => {
        const key = s.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (deduped.length >= 3) {
        return deduped.slice(0, limit);
      }
    } catch {
      // try next radio node
    }
  }

  return curatedMatches.slice(0, limit);
}

export async function searchRadio(query: string, limit = 20): Promise<RadioStation[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return fetchRadioStations(limit);

  const q = cleanQ.toLowerCase();
  const curatedMatches = CURATED_RADIO.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.tags.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q),
  );

  for (const node of RADIO_NODES) {
    try {
      const [byNameRes, byTagRes, byLangRes] = await Promise.allSettled([
        getJson<Parameters<typeof mapRadio>[0][]>(
          `${node}/stations/search?name=${encodeURIComponent(cleanQ)}&limit=${limit}&hidebroken=true&order=clickcount&reverse=true`,
          3500,
        ),
        getJson<Parameters<typeof mapRadio>[0][]>(
          `${node}/stations/search?tag=${encodeURIComponent(cleanQ)}&limit=${limit}&hidebroken=true&order=clickcount&reverse=true`,
          3500,
        ),
        getJson<Parameters<typeof mapRadio>[0][]>(
          `${node}/stations/bylanguage/${encodeURIComponent(cleanQ)}?limit=${limit}&hidebroken=true`,
          3500,
        ),
      ]);

      const list1 = (byNameRes.status === "fulfilled" ? byNameRes.value : []) ?? [];
      const list2 = (byTagRes.status === "fulfilled" ? byTagRes.value : []) ?? [];
      const list3 = (byLangRes.status === "fulfilled" ? byLangRes.value : []) ?? [];

      const merged = [
        ...curatedMatches,
        ...[...list1, ...list2, ...list3].map(mapRadio).filter((x): x is RadioStation => Boolean(x)),
      ];

      if (merged.length) {
        const seen = new Set<string>();
        return merged.filter((s) => {
          const key = s.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, limit);
      }
    } catch {
      // try next
    }
  }

  return curatedMatches.length ? curatedMatches : CURATED_RADIO.slice(0, limit);
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
