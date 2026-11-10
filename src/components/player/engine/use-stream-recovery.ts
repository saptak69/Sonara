import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { getNextIndex, usePlayer } from "@/lib/player-store";
import { nextRecoveryStep } from "@/lib/playback-recovery";
import { getOfflineAudioUrl } from "@/lib/offline-cache";
import { resolveFullTrackStreamServerFn } from "@/lib/saavn-api";
import { resolvePlayableUrl } from "./playable-url";
import { replaceStreamInQueue } from "./replace-stream";
import type { Deck } from "./use-deck";

/**
 * What happens when a stream fails. Each song gets one pass through the fallbacks
 * (downloaded copy, lower bitrate, proxy, another source), picking up where it stopped,
 * and then the player says so and moves on. A lock stops overlapping error events
 * from racing each other.
 */
export function useStreamRecovery(deck: Deck) {
  const stateRef = useRef<{ trackId: string | null; tried: Set<string>; busy: boolean }>({
    trackId: null,
    tried: new Set(),
    busy: false,
  });

  return useCallback(
    async (audioIndex: 1 | 2) => {
      const track = usePlayer.getState().current();
      const audio = deck.elementAt(audioIndex);
      if (!track || !audio) return;

      const rec = stateRef.current;
      if (rec.trackId !== track.id) {
        rec.trackId = track.id;
        rec.tried = new Set();
        rec.busy = false;
      }
      if (rec.busy) return;
      rec.busy = true;

      const stillCurrent = () =>
        usePlayer.getState().current()?.id === track.id && deck.activeIndexRef.current === audioIndex;
      const wantsPlay = () => usePlayer.getState().isPlaying;
      const resumeAt =
        track.kind === "radio" ? 0 : Math.max(audio.currentTime || 0, usePlayer.getState().currentTime || 0);

      const load = (src: string) => {
        audio.src = src;
        audio.load();
        if (resumeAt > 1) {
          audio.addEventListener(
            "loadedmetadata",
            () => {
              try {
                audio.currentTime = resumeAt;
              } catch {
                // Not seekable.
              }
            },
            { once: true },
          );
        }
        if (wantsPlay()) audio.play().catch(() => {});
      };

      try {
        if (!rec.tried.has("offline")) {
          rec.tried.add("offline");
          const offline = await getOfflineAudioUrl(track.id).catch(() => null);
          if (!stillCurrent()) return;
          if (offline && audio.src !== offline) {
            load(offline);
            toast.success("Playing your downloaded copy", { id: "fallback" });
            return;
          }
        }

        const step = nextRecoveryStep({
          streamUrl: track.streamUrl,
          currentSrc: audio.currentSrc || audio.src,
          tried: rec.tried,
          isRadio: track.kind === "radio",
        });

        if (step.kind === "src") {
          rec.tried.add(step.key);
          load(step.src);
          return;
        }

        if (step.kind === "resolve") {
          rec.tried.add(step.key);
          toast.loading(`Finding another source for "${track.title}"…`, { id: "fallback" });
          const full = await resolveFullTrackStreamServerFn({
            data: { title: track.title, artist: track.artist },
          }).catch(() => null);
          if (!stillCurrent()) return;
          if (full?.streamUrl && full.streamUrl !== track.streamUrl) {
            replaceStreamInQueue(track.id, full.streamUrl, full.duration);
            // A fresh source gets its own pass through the cheap fallbacks.
            rec.tried = new Set(["offline", "resolve"]);
            load(resolvePlayableUrl({ ...track, streamUrl: full.streamUrl }));
            toast.success("Found another source", { id: "fallback" });
            return;
          }
        }

        toast.error(`Couldn't play "${track.title}"`, { id: "fallback" });
        if (wantsPlay()) {
          const s = usePlayer.getState();
          if (getNextIndex(s) != null) s.next();
          else s.setPlaying(false);
        }
      } finally {
        rec.busy = false;
      }
    },
    [deck],
  );
}
