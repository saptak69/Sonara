import { useEffect } from "react";
import { usePlayer } from "@/lib/player-store";
import type { Deck } from "./use-deck";

/** Lock-screen and notification controls: the Android app's native session and the browser's. */
export function useMediaSession(deck: Deck) {
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const setPlaying = usePlayer((s) => s.setPlaying);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);

  useEffect(() => {
    if (!current?.id || !current?.title || typeof window === "undefined") return;

    const artworkSrc = current.artworkLg || current.artwork;
    const artwork = artworkSrc ? [{ src: artworkSrc, sizes: "512x512", type: "image/jpeg" }] : [];
    const metadata = {
      title: current.title,
      artist: current.artist || "Unknown Artist",
      album: current.album || "Single",
      artwork,
    };
    const seekBy = (seconds: number) => {
      const audio = deck.getActive();
      if (!audio) return;
      // Live streams have no length to skip within.
      if (seconds > 0 && !Number.isFinite(audio.duration)) return;
      const limit = Number.isFinite(audio.duration) ? audio.duration : Number.POSITIVE_INFINITY;
      audio.currentTime = Math.min(limit, Math.max(0, audio.currentTime + seconds));
    };

    void import("@capgo/capacitor-media-session")
      .then(({ MediaSession }) => {
        MediaSession.setMetadata(metadata).catch(() => {});
        MediaSession.setPlaybackState({ playbackState: isPlaying ? "playing" : "paused" }).catch(() => {});
        MediaSession.setActionHandler({ action: "play" }, () => setPlaying(true));
        MediaSession.setActionHandler({ action: "pause" }, () => setPlaying(false));
        MediaSession.setActionHandler({ action: "nexttrack" }, () => next());
        MediaSession.setActionHandler({ action: "previoustrack" }, () => prev());
        MediaSession.setActionHandler({ action: "seekforward" }, () => seekBy(10));
        MediaSession.setActionHandler({ action: "seekbackward" }, () => seekBy(-10));
      })
      .catch(() => {});

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata(metadata);
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
      try {
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          const audio = deck.getActive();
          if (audio && details.seekTime != null) audio.currentTime = details.seekTime;
        });
      } catch {
        // "seekto" isn't supported in every browser.
      }
    }
  }, [
    current?.id,
    current?.title,
    current?.artist,
    current?.album,
    current?.artwork,
    current?.artworkLg,
    isPlaying,
    next,
    prev,
    setPlaying,
    deck,
  ]);
}
