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
import { Radio } from "lucide-react";

export const Route = createFileRoute("/radio")({ component: RadioPage });

const TAGS = ["pop", "jazz", "classical", "electronic", "news", "chill"] as const;

function RadioHero({ station }: { station: RadioStation }) {
  const playTrack = usePlayer((s) => s.playTrack);
  const track = radioToTrack(station);

  return (
    <div className="relative isolate flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-16 p-5 md:p-12 rounded-[24px] md:rounded-[32px] overflow-hidden border border-border/50 bg-surface/50">
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0 opacity-[0.15] blur-[80px] saturate-200 pointer-events-none mix-blend-screen">
        <Cover
          src={station.artwork}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Artwork (Right side on desktop, compact Left on mobile) */}
      <div className="w-full md:w-[45%] lg:w-[40%] shrink-0 relative z-10 order-1 md:order-2 flex flex-row items-center gap-5 md:block">
        <div className="size-24 sm:size-32 md:size-full md:aspect-square md:max-w-[400px] shrink-0 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
          <Cover
            src={station.artwork}
            alt={station.name}
            className="w-full h-full object-cover md:scale-105 md:hover:scale-100 transition-transform duration-700 ease-out"
          />
        </div>
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex flex-col min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-semibold uppercase tracking-widest mb-2 w-max">
            <Radio className="size-3 text-accent" />
            <span>Live</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-white leading-tight truncate w-full">
            {station.name}
          </h2>
        </div>
      </div>

      {/* Content (Left side on desktop, Bottom on mobile) */}
      <div className="w-full md:flex-1 relative z-10 order-2 md:order-1 flex flex-col items-start text-left">
        <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-semibold uppercase tracking-widest mb-6">
          <Radio className="size-3.5 text-accent" />
          <span>Live Broadcast</span>
        </div>
        
        <h2 className="hidden md:block text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-white mb-4 leading-[1.1] text-balance">
          {station.name}
        </h2>
        
        <p className="text-sm md:text-lg text-muted max-w-[45ch] mb-6 md:mb-8 leading-relaxed">
          {station.country ? `Broadcasting live from ${station.country}. ` : ""}
          Tune in to the world's best tracks, streaming 24/7 in high fidelity.
        </p>
        
        <Button 
          onClick={() => playTrack(track)}
          className="h-12 md:h-14 w-full md:w-auto px-8 md:px-10 rounded-full bg-white text-black font-semibold hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all text-base"
        >
          <Play className="size-5 mr-2 fill-current" strokeWidth={0} />
          Listen Live
        </Button>
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
      <Rail title={tag.charAt(0).toUpperCase() + tag.slice(1)}>
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

  const all = popular.data ?? [];
  const featured = React.useMemo(() => {
    if (!all.length) return null;
    const randomIndex = Math.floor(Math.random() * Math.min(all.length, 10));
    return all[randomIndex];
  }, [all]);
  const rest = all.filter(s => s?.id !== featured?.id);

  if (popular.isLoading && !popular.data) return <HomeSkeleton />;

  return (
    <div className="space-y-12 md:space-y-14">
      {featured && <RadioHero station={featured} />}

      {rest.length ? (
        <Rail title="Popular Stations">
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
    <div className="w-full stagger-in space-y-12 md:space-y-14 px-4 md:px-12 pt-10 md:pt-12 pb-32">
      {/* Apple Music Style Large Header */}
      <header className="hidden lg:flex items-center justify-between pb-2">
        <h1 className="text-4xl font-bold tracking-tighter text-white">Radio</h1>
      </header>

      <div>
        <RadioContent />
      </div>
    </div>
  );
}
