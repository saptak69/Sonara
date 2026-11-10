import { useEffect } from "react";
import { toast } from "sonner";
import { fetchTrack } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";

/** Opening a link with ?track=… or ?play=… starts that song. */
export function useSharedLink() {
  const playTrack = usePlayer((s) => s.playTrack);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URL(window.location.href).searchParams;
    const trackId = params.get("track") || params.get("play");
    if (!trackId) return;

    void (async () => {
      try {
        const track = await fetchTrack(trackId);
        if (!track) return;
        playTrack(track);
        toast.success(`Playing shared song: "${track.title}"`, { description: `by ${track.artist}`, duration: 4000 });
      } catch (error) {
        console.error("Failed to play the shared song:", error);
      }
    })();
  }, [playTrack]);
}
