import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Compass, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LIKED_PLAYLIST_ID, usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";
import { CollageCover, RadioCover, TrackCover } from "./covers";

export type Pick = {
  key: string;
  kicker: string;
  title: string;
  subtitle: string;
  cover: ReactNode;
  onSelect: () => void;
  /** This card's song is the one in the player. */
  active?: boolean;
};

function firstArtist(track: Track): string {
  return track.artist.split(/,|&/)[0].trim().toLowerCase();
}

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Discovery Station: a queue of songs the listener hasn't heard yet. */
function useDiscoveryStation() {
  const playTracks = usePlayer((s) => s.playTracks);
  const [tuning, setTuning] = useState(false);

  const start = async () => {
    if (tuning) return;
    setTuning(true);
    try {
      const { getDiscoveryStationTracksServerFn } = await import("@/lib/recommendation-engine");
      const tracks = await getDiscoveryStationTracksServerFn({ data: { limit: 20 } });
      if (tracks.length) {
        playTracks(tracks, 0);
        toast.success("Discovery Station", { description: "Only songs you haven't heard yet" });
      } else {
        toast("No new songs to discover right now. Try again later.");
      }
    } catch {
      toast.error("Discovery Station isn't available right now.");
    } finally {
      setTuning(false);
    }
  };
  return { start, tuning };
}

/**
 * The cards for the big row at the top of the page. Everything here is made from what
 * the listener actually plays: the song in the player, a radio from it, mixes of their
 * own covers, their liked songs, and the top of the chart. Empty until `ready`.
 */
export function useTopPicks(chart: Track[], ready: boolean): Pick[] {
  const navigate = useNavigate();
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const recents = usePlayer((s) => s.recents);
  const likedTracks = usePlayer((s) => s.playlists.find((p) => p.id === LIKED_PLAYLIST_ID)?.tracks);
  const toggle = usePlayer((s) => s.toggle);
  const playTracks = usePlayer((s) => s.playTracks);
  const startSongRadio = usePlayer((s) => s.startSongRadio);
  const discovery = useDiscoveryStation();

  if (!ready) return [];

  const liked = likedTracks ?? [];
  // Radio comes from a song other than the one playing (by a different artist if there is one),
  // so the row doesn't show the same cover twice.
  const nowPlaying = current && current.kind === "track" ? current : undefined;
  const earlier = recents.filter((t) => t.kind === "track" && t.id !== nowPlaying?.id);
  const seed = earlier.find((t) => !nowPlaying || firstArtist(t) !== firstArtist(nowPlaying)) ?? earlier[0] ?? nowPlaying;
  const picks: Pick[] = [];

  if (current) {
    picks.push({
      key: "resume",
      kicker: isPlaying ? "Now playing" : "Continue listening",
      title: current.title,
      subtitle: current.artist,
      cover: <TrackCover track={current} priority />,
      onSelect: toggle,
      active: true,
    });
  }

  if (seed) {
    const artist = seed.artist.split(/,|&/)[0].trim();
    picks.push({
      key: "radio",
      kicker: "Radio",
      title: `${seed.title} Radio`,
      subtitle: `Similar songs and more by ${artist}`,
      cover: <RadioCover track={seed} name={`${artist} Radio`} />,
      onSelect: () => startSongRadio(seed),
    });
  }

  picks.push({
    key: "weekly",
    kicker: "Made for you",
    title: "Weekly Mix",
    subtitle: "Updated every Monday",
    cover: <CollageCover tracks={recents.length >= 4 ? recents : [...recents, ...chart]} hue={10} title="Weekly Mix" icon={Sparkles} />,
    onSelect: () => void navigate({ to: "/weekly-mix" }),
  });

  if (liked.length > 0) {
    picks.push({
      key: "liked",
      kicker: "Your library",
      title: "Liked Songs",
      subtitle: `${liked.length} ${liked.length === 1 ? "song" : "songs"}, shuffled`,
      cover: <CollageCover tracks={liked} hue={350} title="Liked Songs" icon={Heart} />,
      onSelect: () => playTracks(shuffled(liked), 0),
    });
  }

  picks.push({
    key: "discovery",
    kicker: "Smart mix",
    title: discovery.tuning ? "Tuning in…" : "Discovery Station",
    subtitle: "Songs you haven't heard",
    cover: <CollageCover tracks={[]} hue={28} title="Discovery" icon={Compass} />,
    onSelect: () => void discovery.start(),
  });

  if (chart[0]) {
    picks.push({
      key: "chart",
      kicker: "Trending now",
      title: chart[0].title,
      subtitle: chart[0].artist,
      cover: <TrackCover track={chart[0]} />,
      onSelect: () => playTracks(chart.slice(0, 10), 0),
    });
  }

  return picks;
}
