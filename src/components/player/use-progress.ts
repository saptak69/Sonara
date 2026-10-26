import { usePlayer } from "@/lib/player-store";

/** Playback position for the current song (a live radio stream has no known length). */
export function useProgress() {
  const track = usePlayer((s) => s.queue[s.index]);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const live = track?.kind === "radio";
  const known = !live && Number.isFinite(duration) && duration > 0;
  return { live, known, currentTime, duration, percent: known ? Math.min(100, (currentTime / duration) * 100) : 0 };
}
