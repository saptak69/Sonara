import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { usePlayer } from "@/lib/player-store";
import { generateWeeklyMix } from "@/lib/music-api";
import type { Track } from "@/lib/types";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/weekly-mix")({
  component: WeeklyMixPage,
});

function WeeklyMixPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const recents = usePlayer((s) => s.recents);
  const playTracks = usePlayer((s) => s.playTracks);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const mix = await generateWeeklyMix(recents);
      if (mounted) {
        setTracks(mix);
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [recents]);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTracks(tracks, 0);
    }
  };

  return (
    <div className="min-h-dvh pb-32 animate-in fade-in duration-500">
      <div className="px-4 py-8 md:px-8">
        <div className="flex flex-col items-start gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-fg">Your Weekly Mix</h1>
            <p className="text-muted text-sm">
              Freshly generated based on what you've been listening to. Updated every Monday.
            </p>
          </div>
          
          <Button 
            onClick={handlePlayAll}
            disabled={loading || tracks.length === 0}
            className="rounded-full px-6 py-6 font-semibold bg-accent text-white hover:bg-accent/90"
          >
            <Play className="size-5 mr-2 fill-current" />
            Play Mix
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Loader2 className="size-8 animate-spin mb-4" />
            <p className="text-sm font-medium">Curating your mix...</p>
          </div>
        ) : tracks.length > 0 ? (
          <div className="flex flex-col">
            {tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i}
                queue={tracks}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted">
            <p>Could not generate a mix right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
