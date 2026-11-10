import { useEffect, useRef } from "react";
import { getNextIndex, usePlayer } from "@/lib/player-store";
import { getOfflineAudioUrl, isTrackDownloaded } from "@/lib/offline-cache";
import { resolveFullTrackStreamServerFn } from "@/lib/saavn-api";
import { resolvePlayableUrl } from "./playable-url";
import { replaceStreamInQueue } from "./replace-stream";
import type { Deck } from "./use-deck";
import type { PlayTelemetry } from "./use-play-telemetry";

function isPreviewClip(track: { streamUrl?: string; duration?: number }): boolean {
  return Boolean(
    track.streamUrl?.includes("dzcdn.net") ||
      track.streamUrl?.includes("pixabay.com") ||
      (track.duration && track.duration <= 35),
  );
}

/**
 * Loads and starts the current song on the active element, swaps to the preloaded
 * element when the next song is ready, and upgrades short preview clips to full tracks.
 */
export function useTrackPlayback(deck: Deck, telemetry: PlayTelemetry) {
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const setPlaying = usePlayer((s) => s.setPlaying);
  const setDuration = usePlayer((s) => s.setDuration);

  const loadedTrackIdRef = useRef<string | null>(null);
  const preloadedTrackIdRef = useRef<string | null>(null);

  const playActive = (audio: HTMLAudioElement) => {
    audio.play().catch((err) => {
      if (err.name !== "AbortError") setPlaying(false);
    });
  };

  useEffect(() => {
    if (!current) {
      [deck.audio1Ref.current, deck.audio2Ref.current].forEach((audio) => {
        if (!audio) return;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      });
      loadedTrackIdRef.current = null;
      telemetry.trackChanged(null);
      return;
    }

    const active = deck.getActive();
    const inactive = deck.getInactive();
    if (!active || !inactive) return;

    if (loadedTrackIdRef.current === current.id) {
      if (isPlaying) playActive(active);
      else active.pause();
      return;
    }

    telemetry.trackChanged(current);
    loadedTrackIdRef.current = current.id;

    if (preloadedTrackIdRef.current === current.id) {
      deck.swap();
      inactive.pause();
      inactive.removeAttribute("src");
      const nowActive = deck.getActive();
      if (nowActive && isPlaying) playActive(nowActive);
      return;
    }

    active.pause();
    try {
      active.currentTime = 0;
    } catch {
      // Nothing loaded yet.
    }

    const startOnline = () => {
      const el = deck.getActive();
      if (!el) return;
      el.src = resolvePlayableUrl(current);
      el.load();
      if (usePlayer.getState().isPlaying) playActive(el);
    };

    if (isTrackDownloaded(current.id)) {
      void getOfflineAudioUrl(current.id).then((blobUrl) => {
        if (loadedTrackIdRef.current !== current.id) return;
        const el = deck.getActive();
        if (!el) return;
        if (blobUrl) {
          el.src = blobUrl;
          el.load();
          if (usePlayer.getState().isPlaying) el.play().catch(() => {});
        } else {
          startOnline();
        }
      });
      return;
    }

    active.src = resolvePlayableUrl(current);
    active.load();
    if (isPlaying) playActive(active);

    // A copy saved without up-to-date metadata still wins over the network.
    void getOfflineAudioUrl(current.id).then((blobUrl) => {
      if (!blobUrl || loadedTrackIdRef.current !== current.id) return;
      const el = deck.getActive();
      if (!el || el.src === blobUrl) return;
      const position = el.currentTime;
      const wasPlaying = !el.paused;
      el.src = blobUrl;
      try {
        el.currentTime = position;
      } catch {
        // Not seekable yet.
      }
      if (wasPlaying || usePlayer.getState().isPlaying) el.play().catch(() => {});
    });
    // The effect reacts to the song and the play state only; the rest is read live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.streamUrl, isPlaying, setPlaying]);

  // Preload the next song on the idle element so the change is instant.
  useEffect(() => {
    return usePlayer.subscribe((state) => {
      const playing = state.queue[state.index];
      if (!playing) return;
      const nextIndex = getNextIndex(state);
      const upcoming = nextIndex != null ? state.queue[nextIndex] : null;
      if (!upcoming || upcoming.id === preloadedTrackIdRef.current || upcoming.id === playing.id) return;

      const idle = deck.getInactive();
      if (!idle) return;
      if (isTrackDownloaded(upcoming.id)) {
        void getOfflineAudioUrl(upcoming.id).then((blobUrl) => {
          if (!blobUrl) return;
          idle.src = blobUrl;
          idle.load();
          preloadedTrackIdRef.current = upcoming.id;
        });
      } else {
        idle.src = resolvePlayableUrl(upcoming);
        idle.load();
        preloadedTrackIdRef.current = upcoming.id;
      }
    });
  }, [deck]);

  // Swap a 30-second preview clip for the full-length stream when one exists.
  useEffect(() => {
    if (!current?.id || !current?.title || !isPreviewClip(current)) return;

    let cancelled = false;
    void resolveFullTrackStreamServerFn({ data: { title: current.title, artist: current.artist } })
      .then((full) => {
        if (cancelled || !full?.streamUrl) return;
        const audio = deck.getActive();
        if (!audio || loadedTrackIdRef.current !== current.id) return;
        const position = audio.currentTime;
        const wasPlaying = !audio.paused;

        replaceStreamInQueue(current.id, full.streamUrl, full.duration);
        audio.src = resolvePlayableUrl({ ...current, streamUrl: full.streamUrl });
        try {
          audio.currentTime = position;
        } catch {
          // Not seekable yet.
        }
        if (wasPlaying) audio.play().catch(() => {});
        setDuration(full.duration);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [current, deck, setDuration]);
}
