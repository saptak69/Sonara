import { getCommunityReleasesServerFn } from "@/lib/artist-studio";
import type { Track } from "@/lib/types";

/** Latest releases uploaded by independent artists, as playable tracks. Never throws. */
export async function loadCommunityTracks(limit = 16): Promise<Track[]> {
  try {
    const rows = await getCommunityReleasesServerFn({ data: { limit } });
    return rows.map(
      (r): Track => ({
        id: r.id,
        title: r.title,
        artist: r.artistName || "Independent Artist",
        artistId: r.artistId,
        artwork: r.coverArtUrl,
        artworkLg: r.coverArtUrl,
        duration: r.duration,
        streamUrl: r.audioUrl,
        genre: r.genre || undefined,
        mood: r.mood || undefined,
        description: r.description || undefined,
        lyrics: r.lyrics || undefined,
        playCount: r.playCount,
        kind: "track",
      }),
    );
  } catch {
    return [];
  }
}
