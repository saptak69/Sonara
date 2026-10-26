import type { Artist, Playlist, RadioStation, Track } from "./types";
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
  getSimilarSongsServerFn,
  getSaavnTrendingServerFn,
  getSaavnTopPlaylistsServerFn,
} from "./saavn-api";
import {
  searchSoundCloudTracksServerFn,
  getSoundCloudTrackServerFn,
} from "./soundcloud-api";
import { getDatabaseTrendingServerFn } from "./library-service";
import { createServerFn } from "@tanstack/react-start";


const RADIO_NODES = [
  "https://all.api.radio-browser.info/json",
  "https://de1.api.radio-browser.info/json",
];

import { isCoverOrDerivative } from "./music-filter";
export { isCoverOrDerivative };


// High-fidelity fallback music catalog curated for Sonara by Jiko
export const CURATED_TRACKS: Track[] = [
  {
    id: "curated_espresso",
    title: "Espresso",
    artist: "Sabrina Carpenter",
    artwork: "https://c.saavncdn.com/111/Espresso-English-2024-20240412064803-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/111/Espresso-English-2024-20240412064803-500x500.jpg",
    duration: 175,
    streamUrl: "https://aac.saavncdn.com/111/cf81f6eb5b6768fe2e1ddf9335124a5f_320.mp4",
    genre: "Pop",
    mood: "Upbeat",
    kind: "track",
  },
  {
    id: "curated_birds_of_a_feather",
    title: "BIRDS OF A FEATHER",
    artist: "Billie Eilish",
    artwork: "https://c.saavncdn.com/707/HIT-ME-HARD-AND-SOFT-English-2024-20240517063536-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/707/HIT-ME-HARD-AND-SOFT-English-2024-20240517063536-500x500.jpg",
    duration: 210,
    streamUrl: "https://aac.saavncdn.com/707/761fa325ce0600e1463336f0431d82b3_320.mp4",
    genre: "Alternative",
    mood: "Melancholic",
    kind: "track",
  },
  {
    id: "curated_million_dollar_baby",
    title: "MILLION DOLLAR BABY",
    artist: "Tommy Richman",
    artwork: "https://c.saavncdn.com/567/MILLION-DOLLAR-BABY-English-2024-20240604063215-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/567/MILLION-DOLLAR-BABY-English-2024-20240604063215-500x500.jpg",
    duration: 155,
    streamUrl: "https://aac.saavncdn.com/567/0a21433a1e19335c6580ea70297a54c4_320.mp4",
    genre: "Hip-Hop",
    mood: "Energetic",
    kind: "track",
  },
  {
    id: "curated_i_had_some_help",
    title: "I Had Some Help (feat. Morgan Wallen)",
    artist: "Post Malone",
    artwork: "https://c.saavncdn.com/168/I-Had-Some-Help-English-2024-20240510063707-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/168/I-Had-Some-Help-English-2024-20240510063707-500x500.jpg",
    duration: 178,
    streamUrl: "https://aac.saavncdn.com/168/cd86b04270077273602465fcb5ca21f9_320.mp4",
    genre: "Country",
    mood: "Upbeat",
    kind: "track",
  },
  {
    id: "curated_not_like_us",
    title: "Not Like Us",
    artist: "Kendrick Lamar",
    artwork: "https://c.saavncdn.com/974/Not-Like-Us-English-2024-20240505084246-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/974/Not-Like-Us-English-2024-20240505084246-500x500.jpg",
    duration: 274,
    streamUrl: "https://aac.saavncdn.com/974/4a0d062679a537a93da367a9e4b6e3cb_320.mp4",
    genre: "Hip-Hop",
    mood: "Aggressive",
    kind: "track",
  },
  {
    id: "curated_please_please_please",
    title: "Please Please Please",
    artist: "Sabrina Carpenter",
    artwork: "https://c.saavncdn.com/812/Please-Please-Please-English-2024-20240607064757-500x500.jpg",
    artworkLg: "https://c.saavncdn.com/812/Please-Please-Please-English-2024-20240607064757-500x500.jpg",
    duration: 186,
    streamUrl: "https://aac.saavncdn.com/812/1f3b1c54dda25e953e21b534f0def3cd_320.mp4",
    genre: "Pop",
    mood: "Chill",
    kind: "track",
  }
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



export async function fetchTrending(limit = 24, genre?: string): Promise<Track[]> {
  try {
    if (genre) {
      const saavnTracks = await searchSaavnTracksServerFn({ data: { query: `${genre} hits`, limit } }).catch(() => [] as Track[]);
      const clean = saavnTracks.filter((t) => !isCoverOrDerivative(t.title, t.artist));
      return clean.slice(0, limit);
    }

    // Homepage Listen Now: Real DB aggregations + Dynamic Trending Charts
    const dbTrendingPromise = getDatabaseTrendingServerFn({ data: { limit: 6 } }).catch(() => [] as Track[]);
    const liveTrendingPromise = getSaavnTrendingServerFn({ data: { limit } }).catch(() => [] as Track[]);

    const [dbTracks, liveTracks] = await Promise.all([dbTrendingPromise, liveTrendingPromise]);

    if (dbTracks.length > 0 || liveTracks.length > 0) {
      const combined = [...dbTracks, ...liveTracks];
      const seen = new Set<string>();
      const deduped = combined.filter((t) => {
        const key = `${t.title.toLowerCase()}_${t.artist.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (deduped.length > 0) return deduped.slice(0, limit);
    }

    // Fallback if launch data fails
    const [bollyPlRes, globalPlRes, indiePlRes] = await Promise.allSettled([
      searchSaavnPlaylistsServerFn({ data: { query: "Top Bollywood", limit: 1 } }),
      searchSaavnPlaylistsServerFn({ data: { query: "Top English", limit: 1 } }),
      searchSaavnPlaylistsServerFn({ data: { query: "Trending Today", limit: 1 } }),
    ]);

    const trackPromises: Promise<any>[] = [];

    const bollyPl = bollyPlRes.status === "fulfilled" ? bollyPlRes.value[0] : null;
    if (bollyPl) trackPromises.push(getSaavnPlaylistServerFn({ data: { id: bollyPl.id } }));

    const globalPl = globalPlRes.status === "fulfilled" ? globalPlRes.value[0] : null;
    if (globalPl) trackPromises.push(getSaavnPlaylistServerFn({ data: { id: globalPl.id } }));

    const indiePl = indiePlRes.status === "fulfilled" ? indiePlRes.value[0] : null;
    if (indiePl) trackPromises.push(getSaavnPlaylistServerFn({ data: { id: indiePl.id } }));

    trackPromises.push(searchSaavnTracksServerFn({ data: { query: "New Hindi Songs", limit: 6 } }));
    trackPromises.push(searchSaavnTracksServerFn({ data: { query: "Global Pop Hits", limit: 6 } }));

    const results = await Promise.allSettled(trackPromises);

    const allTracks: Track[][] = results.map(res => {
      if (res.status === "fulfilled" && res.value) {
        if (Array.isArray(res.value)) return res.value;
        if (res.value.tracks) return res.value.tracks;
      }
      return [];
    });

    const interleaved: Track[] = [];
    const maxLen = Math.max(...allTracks.map(arr => arr.length));
    
    for (let i = 0; i < maxLen; i++) {
      allTracks.forEach(arr => {
        if (arr[i]) interleaved.push(arr[i]);
      });
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
    const raw = await searchSaavnTracksServerFn({ data: { query: "Indie India Originals", limit } });
    const clean = raw.filter((t) => !isCoverOrDerivative(t.title, t.artist));
    if (clean.length >= 4) return clean.slice(0, limit);
  } catch {
    // fallback
  }
  return [...CURATED_TRACKS].reverse().slice(0, limit);
}

export async function fetchTrendingPlaylists(limit = 16): Promise<Playlist[]> {
  try {
    const topPlaylists = await getSaavnTopPlaylistsServerFn({ data: { limit } });
    if (topPlaylists.length > 0) {
      return topPlaylists;
    }

    const saavnPlaylists = await searchSaavnPlaylistsServerFn({ data: { query: "Bollywood Hollywood Hits", limit: 8 } }).catch(() => [] as Playlist[]);

    const curatedPlaylists: Playlist[] = [
      {
        id: "curated_pl_bollywood_new",
        name: "Bollywood New Releases",
        description: "The latest chartbusters, romantic hits, and dance anthems from Bollywood.",
        artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=480&h=480&fit=crop&q=80",
        artworkLg: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&h=1000&fit=crop&q=85",
        trackCount: 50,
        isAlbum: false,
        owner: "Sonara Curators",
      },
      {
        id: "curated_pl_pop",
        name: "Today's Top Pop Hits",
        description: "Taylor Swift, Sabrina Carpenter, The Weeknd & the biggest global singles.",
        artwork: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&h=480&fit=crop&q=80",
        artworkLg: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&h=1000&fit=crop&q=85",
        trackCount: 45,
        isAlbum: false,
        owner: "Sonara Pop",
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

    const merged = [...curatedPlaylists, ...saavnPlaylists];
    if (merged.length) return merged.slice(0, limit);
  } catch {
    // fallback
  }
  return [
    {
      id: "curated_pl_bollywood_new",
      name: "Bollywood New Releases",
      description: "The latest chartbusters, romantic hits, and dance anthems from Bollywood.",
      artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=480&h=480&fit=crop&q=80",
      artworkLg: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&h=1000&fit=crop&q=85",
      trackCount: 50,
      isAlbum: false,
      owner: "Sonara Curators",
    },
    {
      id: "curated_pl_pop",
      name: "Today's Top Pop Hits",
      description: "Taylor Swift, Sabrina Carpenter, The Weeknd & the biggest global singles.",
      artwork: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&h=480&fit=crop&q=80",
      artworkLg: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&h=1000&fit=crop&q=85",
      trackCount: 45,
      isAlbum: false,
      owner: "Sonara Pop",
    },
  ];
}

export async function searchTracks(query: string, limit = 24): Promise<Track[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  // 1. Primary Sovereign Source: JioSaavn verified original studio recordings
  const saavnTracks = await searchSaavnTracksServerFn({
    data: { query: cleanQ, limit: Math.min(30, limit * 2) },
  }).catch(() => [] as Track[]);

  // Filter out any amateur covers, karaoke, or bootleg derivatives
  const originalSaavn = saavnTracks.filter((t) => !isCoverOrDerivative(t.title, t.artist, cleanQ));

  // If JioSaavn has high-confidence authentic studio releases, return them directly!
  // This guarantees 100% original master quality and prevents feed dilution.
  if (originalSaavn.length > 0) {
    const qLower = cleanQ.toLowerCase();
    const hasStrongMatch = originalSaavn.some(
      (t) => t.title.toLowerCase().includes(qLower) || t.artist.toLowerCase().includes(qLower),
    );
    if (hasStrongMatch || originalSaavn.length >= 3) {
      return originalSaavn.slice(0, limit);
    }
  }

  // 2. Secondary fallback: SoundCloud with STRICT anti-cover filter
  const soundcloudTracks = await searchSoundCloudTracksServerFn({
    data: { query: cleanQ, limit: Math.min(10, limit) },
  }).catch(() => [] as Track[]);

  const originalSoundCloud = soundcloudTracks.filter((t) => !isCoverOrDerivative(t.title, t.artist, cleanQ));

  // Merge: Original studio recordings first, then clean verified SoundCloud tracks
  const combined = [...originalSaavn, ...originalSoundCloud];

  if (combined.length) {
    const seen = new Set<string>();
    return combined
      .filter((t) => {
        const key = `${t.title.toLowerCase().trim()}_${t.artist.toLowerCase().trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);
  }

  // 3. Fallback: curated catalog
  const q = cleanQ.toLowerCase();
  return CURATED_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.genre && t.genre.toLowerCase().includes(q)),
  ).slice(0, limit);
}

export async function generateWeeklyMix(recents: Track[]): Promise<Track[]> {
  try {
    if (!recents || recents.length === 0) {
      return fetchTrending(20);
    }
    
    const artists = new Map<string, number>();
    const genres = new Map<string, number>();
    
    recents.forEach((track, i) => {
      const weight = 1 + (i / recents.length); 
      if (track.artist) {
        const a = track.artist.split(',')[0].trim();
        artists.set(a, (artists.get(a) || 0) + weight);
      }
      if (track.genre) {
        genres.set(track.genre, (genres.get(track.genre) || 0) + weight);
      }
    });

    const topArtists = Array.from(artists.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map(e => e[0]);
    const topGenres = Array.from(genres.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
    
    const mix: Track[] = [];
    const seen = new Set<string>();

    const addTrack = (t: Track) => {
      const key = t.title.toLowerCase().trim() + '_' + (t.artist || '').toLowerCase().trim();
      if (!seen.has(key) && !seen.has(t.id)) {
        seen.add(key);
        seen.add(t.id);
        mix.push(t);
        return true;
      }
      return false;
    };

    const artistResults = await Promise.allSettled(
      topArtists.map(a => searchSaavnTracksServerFn({ data: { query: a + ' hits', limit: 5 } }))
    );
    let artistCount = 0;
    for (const res of artistResults) {
      if (res.status === 'fulfilled' && res.value) {
        for (const t of res.value) {
          if (artistCount < 8 && addTrack(t)) artistCount++;
        }
      }
    }

    const genreResults = await Promise.allSettled(
      topGenres.map(g => searchSaavnTracksServerFn({ data: { query: g + ' popular', limit: 5 } }))
    );
    let genreCount = 0;
    for (const res of genreResults) {
      if (res.status === 'fulfilled' && res.value) {
        for (const t of res.value) {
          if (genreCount < 6 && addTrack(t)) genreCount++;
        }
      }
    }

    const discoveryResults = await Promise.allSettled(
      topArtists.slice(0, 2).map(a => searchSaavnTracksServerFn({ data: { query: a + ' latest', limit: 4 } }))
    );
    let discCount = 0;
    for (const res of discoveryResults) {
      if (res.status === 'fulfilled' && res.value) {
        for (const t of res.value) {
          if (discCount < 4 && addTrack(t)) discCount++;
        }
      }
    }

    const trending = await fetchTrending(5);
    let trendCount = 0;
    for (const t of trending || []) {
      if (trendCount < 2 && addTrack(t)) trendCount++;
    }

    for (let i = mix.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = mix[i];
        mix[i] = mix[j];
        mix[j] = temp;
    }

    return mix.slice(0, 20);
  } catch (error) {
    console.error('Error generating weekly mix', error);
    return fetchTrending(20);
  }
}


export async function fetchRelatedQueue(track: Track, limit = 15, _recents: Track[] = []): Promise<Track[]> {
  try {
    const results: Track[] = [];
    const seen = new Set<string>([track.id]);
    const artistCounts = new Map<string, number>();

    const addTrack = (t: Track) => {
      if (!t.artist || (t.duration && t.duration < 45)) return false;
      const key = t.title.toLowerCase().trim() + '_' + t.artist.toLowerCase().trim();
      const aName = t.artist.toLowerCase().trim();
      const count = artistCounts.get(aName) || 0;
      if (count < 3 && !seen.has(key) && !seen.has(t.id)) {
        artistCounts.set(aName, count + 1);
        seen.add(key);
        seen.add(t.id);
        results.push(t);
        return true;
      }
      return false;
    };

    if (track.id.startsWith('saavn_')) {
      const similar = await getSimilarSongsServerFn({ data: { id: track.id, limit: limit * 2 } });
      if (similar && similar.length > 0) {
        for (const t of similar) {
          if (results.length >= limit) break;
          addTrack(t);
        }
        if (results.length >= limit) return results;
      }
    }

    if (track.artist && results.length < limit) {
      const artistQuery = track.artist.split(',')[0].trim();
      const artistTracks = await searchSaavnTracksServerFn({ data: { query: artistQuery + ' songs', limit: 15 } });
      for (const t of artistTracks) {
        if (results.length >= limit) break;
        if (t.artist?.toLowerCase().includes(artistQuery.toLowerCase())) {
          addTrack(t);
        }
      }
    }

    if (results.length < limit) {
      const langGenre = ((track.genre || '') + ' ' + (track.artist ? track.artist.split(',')[0].trim() : '')).trim();
      if (langGenre) {
        const genreTracks = await searchSaavnTracksServerFn({ data: { query: langGenre + ' popular', limit: 15 } });
        for (const t of genreTracks) {
          if (results.length >= limit) break;
          addTrack(t);
        }
      }
    }

    if (results.length < limit) {
      const trending = await fetchTrending(limit);
      for (const t of trending) {
        if (results.length >= limit) break;
        addTrack(t);
      }
    }

    return results;
  } catch (error) {
    console.error('fetchRelatedQueue error', error);
    return CURATED_TRACKS.filter((t) => t.id !== track.id).slice(0, limit);
  }
}


export async function searchPlaylists(query: string, limit = 12): Promise<Playlist[]> {
  try {
    const saavnPlaylists = await searchSaavnPlaylistsServerFn({ data: { query, limit } });
    if (saavnPlaylists && saavnPlaylists.length) return saavnPlaylists.slice(0, limit);
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
    const saavnArtists = await searchSaavnArtistsServerFn({ data: { query, limit } });
    if (saavnArtists && saavnArtists.length) return saavnArtists.slice(0, limit);
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
  // Someone else's playlist (shared link) — the server only returns it if it's public.
  const { getPlaylistById } = await import("./library-service");
  return getPlaylistById({ data: { id } }).catch(() => null);
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
  return null;
}

export async function fetchArtistTracks(id: string, limit = 40): Promise<Track[]> {
  if (id.startsWith("curated_")) {
    return CURATED_TRACKS;
  }
  if (id.startsWith("saavn_artist_")) {
    return getSaavnArtistTracksServerFn({ data: { id, limit } });
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

  return null;
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

export const fetchLyricsServerFn = createServerFn({ method: "GET" })
  .validator((d: { title: string; artist: string }) => d)
  .handler(async ({ data }) => {
    const { title, artist } = data;
    try {
      const url = new URL("https://lrclib.net/api/search");
      url.searchParams.set("q", `${title} ${artist.replace(/^@/, "")}`);
      
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            "User-Agent": "SonaraMusic/1.0.0 (https://github.com/sonara)",
          },
        });
        if (res.ok) {
          const resData = await res.json();
          // Prioritize tracks with synced lyrics
          let hit = (resData ?? []).find((d: any) => d.syncedLyrics);
          if (!hit) {
            hit = (resData ?? []).find((d: any) => d.plainLyrics || d.instrumental);
          }
          if (hit) {
            return {
              plain: hit.plainLyrics || "",
              synced: parseSynced(hit.syncedLyrics),
              instrumental: Boolean(hit.instrumental),
            };
          }
        }
      } finally {
        clearTimeout(timer);
      }
    } catch {
      // Ignore and fallback
    }

    // Fallback to lyrics.ovh
    try {
      const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist.replace(/^@/, ""))}/${encodeURIComponent(title)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(ovhUrl, { signal: controller.signal });
        if (res.ok) {
          const ovhData = await res.json();
          if (ovhData?.lyrics) {
            return {
              plain: ovhData.lyrics,
              synced: null,
              instrumental: false,
            };
          }
        }
      } finally {
        clearTimeout(timer);
      }
    } catch {
      // Both failed
    }

    return null;
  });

export async function fetchLyrics(title: string, artist: string): Promise<Lyrics | null> {
  return fetchLyricsServerFn({ data: { title, artist } });
}
