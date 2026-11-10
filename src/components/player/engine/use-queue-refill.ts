import { useEffect, useRef } from "react";
import { usePlayer } from "@/lib/player-store";

/**
 * Keeps the queue from running dry.
 * - A song radio tops itself up when three songs remain, whatever the Autoplay setting.
 * - Otherwise, with Autoplay on, similar songs are added when the last song starts.
 */
export function useQueueRefill() {
  const current = usePlayer((s) => s.queue[s.index]);
  const queueLength = usePlayer((s) => s.queue.length);
  const queueIndex = usePlayer((s) => s.index);
  const autoplay = usePlayer((s) => s.autoplay);
  const recents = usePlayer((s) => s.recents);
  const radioActive = usePlayer((s) => s.radio !== null);
  const requestedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!current?.id || queueLength === 0) return;

    if (radioActive) {
      if (queueIndex >= queueLength - 3) usePlayer.getState().extendSongRadio();
      return;
    }
    if (!autoplay) return;

    if (queueIndex >= queueLength - 1 && requestedForRef.current !== current.id) {
      requestedForRef.current = current.id;
      // Oldest first, so the server reads the last entry as the song playing now.
      const history = recents.length ? recents.slice(0, 5).reverse() : [current];
      void import("@/lib/recommendation-engine").then(({ getNextAutoplayTracksServerFn }) => {
        void getNextAutoplayTracksServerFn({ data: { sessionHistory: history, limit: 10 } })
          .then((tracks) => {
            if (tracks?.length) usePlayer.getState().appendQueue(tracks);
          })
          .catch(() => {});
      });
    }
  }, [current, queueLength, queueIndex, autoplay, recents, radioActive]);
}
