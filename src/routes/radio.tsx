import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { RadioCard } from "@/components/cards";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { fetchRadioStations, radioToTrack } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { Cover } from "@/components/cover";
import type { RadioStation } from "@/lib/types";

export const Route = createFileRoute("/radio")({ component: RadioPage });

const TAGS = ["pop", "jazz", "classical", "electronic", "news", "chill"] as const;

function RadioHero({ station }: { station: RadioStation }) {
  const playTrack = usePlayer((s) => s.playTrack);
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const track = radioToTrack(station);
  const active = current?.id === track.id;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-surface/50 p-6 md:p-10 mb-10 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/20 group">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-surface to-background z-10 opacity-90" />
        {active && isPlaying ? (
          <div className="absolute inset-0 z-0 opacity-40 animate-[mesh_10s_ease-in-out_infinite] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent via-surface to-background mix-blend-screen" />
        ) : (
          <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/50 via-surface to-background" />
        )}
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className="relative w-48 shrink-0 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
          <Cover
            src={station.artwork}
            alt={station.name}
            className="aspect-square w-full"
          />
          {active && isPlaying && (
            <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center gap-1">
              <div className="w-1.5 bg-white rounded-t-sm animate-[equalizer_0.8s_ease-in-out_infinite] h-4" />
              <div className="w-1.5 bg-white rounded-t-sm animate-[equalizer_1.2s_ease-in-out_infinite] h-6" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 bg-white rounded-t-sm animate-[equalizer_0.9s_ease-in-out_infinite] h-4" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent uppercase tracking-widest">
            <span className={cn("size-2 rounded-full", active && isPlaying ? "bg-accent animate-pulse" : "bg-accent/50")} />
            Live Broadcast
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">{station.name}</h2>
            <p className="text-muted md:text-lg">{station.country || "Global"} · Premium Radio</p>
          </div>
          
          <Button
            size="lg"
            variant="default"
            className="rounded-full shadow-lg hover:shadow-accent/50 transition-all font-semibold px-8"
            onClick={() => playTrack(track)}
          >
            {active && isPlaying ? "Playing" : "Tune In"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RadioTagRail({ tag }: { tag: string }) {
  const query = useQuery({
    queryKey: ["radio-tag", tag],
    queryFn: () => fetchRadioStations(12, tag),
  });
  const stations = query.data ?? [];
  if (!stations.length) return null;
  return (
    <div className="py-2">
      <Rail title={tag.toUpperCase()} className="tracking-widest">
        {stations.map((s) => (
          <RadioCard key={s.id} station={s} />
        ))}
      </Rail>
    </div>
  );
}

export function RadioContent() {
  const playTracks = usePlayer((s) => s.playTracks);
  const popular = useQuery({
    queryKey: ["radio-popular"],
    queryFn: () => fetchRadioStations(24),
  });

  if (popular.isLoading && !popular.data) return <HomeSkeleton />;

  const all = popular.data ?? [];
  const featured = React.useMemo(() => {
    if (!all.length) return null;
    const randomIndex = Math.floor(Math.random() * Math.min(all.length, 10));
    return all[randomIndex];
  }, [all]);
  const rest = all.filter(s => s?.id !== featured?.id);

  return (
    <div className="space-y-12 md:space-y-14">
      {featured && <RadioHero station={featured} />}

      {rest.length ? (
        <Rail title="Popular stations" className="tracking-wide">
          {rest.map((s) => (
            <RadioCard key={s.id} station={s} />
          ))}
        </Rail>
      ) : null}

      <div className="space-y-12 pt-4">
        {TAGS.map((tag) => (
          <RadioTagRail key={tag} tag={tag} />
        ))}
      </div>
    </div>
  );
}

function RadioPage() {
  return (
    <div className="w-full pb-20 stagger-in">
      {/* Apple Music Style Large Header */}
      <h1 className="font-display text-4xl md:text-[40px] font-bold text-white tracking-tight px-4 md:px-12 pt-12 pb-6">
        Radio
      </h1>

      <div className="px-4 md:px-12 mt-2">
        <RadioContent />
      </div>
    </div>
  );
}
