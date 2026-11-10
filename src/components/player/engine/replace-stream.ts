import { usePlayer } from "@/lib/player-store";

/** Points the queue entry for `trackId` at a new stream. Does nothing if that song is no longer in place. */
export function replaceStreamInQueue(trackId: string, streamUrl: string, duration?: number) {
  usePlayer.setState((state) => {
    const entry = state.queue[state.index];
    if (!entry || entry.id !== trackId) return {};
    const queue = [...state.queue];
    queue[state.index] = { ...entry, streamUrl, duration: duration || entry.duration };
    return { queue, duration: duration || state.duration };
  });
}
