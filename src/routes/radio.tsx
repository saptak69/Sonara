import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { RadioCard } from "@/components/cards";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { fetchRadioStations, radioToTrack } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Cover } from "@/components/cover";
import type { RadioStation } from "@/lib/types";

export const Route = createFileRoute("/radio")({ component: RadioPage });

const TAGS = ["pop", "jazz", "classical", "electronic", "news", "chill"] as const;

function RadioHero({ station }: { station: RadioStation }) {
  const playTrack = usePlayer((s) => s.playTrack);
  const track = radioToTrack(station);

  return (
    <div className="radio-hero relative isolate flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 p-6 md:p-8 rounded-2xl overflow-hidden border border-white/[0.08] bg-surface">
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0 opacity-[0.12] blur-[80px] pointer-events-none mix-blend-screen">
        <Cover
          src={station.artwork}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content (Left side) */}
      <div className="w-full md:flex-1 relative z-10 flex flex-col items-start text-left max-w-xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/80 text-xs font-medium tracking-normal mb-3">
          <span className="size-1.5 rounded-full bg-accent" />
          <span>Live Broadcast</span>
        </div>
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2 leading-tight line-clamp-2">
          {station.name}
        </h2>
        
        <p className="text-sm text-muted max-w-[42ch] mb-6 leading-relaxed line-clamp-2 font-normal">
          {station.country ? `Broadcasting live from ${station.country}. ` : ""}
          Tune in to the world's best live radio stations streaming 24/7.
        </p>
        
        <Button 
          onClick={() => playTrack(track)}
          className="h-11 px-7 rounded-full bg-white text-black font-semibold hover:bg-white/90 active:scale-95 transition-all text-sm shadow-sm"
        >
          <Play className="size-4 mr-2 fill-current" strokeWidth={0} />
          Listen Live
        </Button>
      </div>

      {/* Artwork (Right side) */}
      <div className="w-full md:w-auto shrink-0 relative z-10 flex justify-center md:justify-end">
        <div className="size-36 sm:size-44 md:size-52 lg:size-60 rounded-xl overflow-hidden shadow-xl border border-white/[0.08] bg-surface-2">
          <Cover
            src={station.artwork}
            alt={station.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-105"
          />
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
      <Rail title={tag.charAt(0).toUpperCase() + tag.slice(1)}>
        {stations.map((s) => (
          <RadioCard key={s.id} station={s} />
        ))}
      </Rail>
    </div>
  );
}

export function RadioContent() {
  const popular = useQuery({
    queryKey: ["radio-popular"],
    queryFn: () => fetchRadioStations(24),
  });

  const popularData = popular.data;
  const featured = React.useMemo(() => {
    if (!popularData || !popularData.length) return null;
    const randomIndex = Math.floor(Math.random() * Math.min(popularData.length, 10));
    return popularData[randomIndex];
  }, [popularData]);
  const rest = (popularData ?? []).filter((s: RadioStation) => s?.id !== featured?.id);

  if (popular.isLoading && !popular.data) return <HomeSkeleton />;

  return (
    <div className="space-y-10 md:space-y-12">
      {featured && <RadioHero station={featured} />}

      {rest.length ? (
        <Rail title="Popular Stations">
          {rest.map((s) => (
            <RadioCard key={s.id} station={s} />
          ))}
        </Rail>
      ) : null}

      <div className="space-y-10 pt-2">
        {TAGS.map((tag) => (
          <RadioTagRail key={tag} tag={tag} />
        ))}
      </div>
    </div>
  );
}

function RadioPage() {
  return (
    <div className="w-full space-y-10 md:space-y-12 px-4 md:px-10 pt-6 md:pt-8 pb-32">
      <header className="flex items-center justify-between pb-1">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">Radio</h1>
      </header>

      <div>
        <RadioContent />
      </div>
    </div>
  );
}
