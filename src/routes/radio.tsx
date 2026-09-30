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
  const track = radioToTrack(station);

  return (
    <button 
      type="button"
      onClick={() => playTrack(track)}
      className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] rounded-[20px] md:rounded-[24px] overflow-hidden group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="absolute inset-0 bg-surface">
        <Cover
          src={station.artwork}
          alt={station.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[0.8s] ease-[cubic-bezier(0.2,0,0.1,1)] group-hover:scale-[1.03]"
        />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex flex-col">
        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-white/80 drop-shadow-md">
          Featured Station
        </span>
      </div>

      <div className="absolute bottom-0 left-0 p-5 md:p-8 z-10">
        <h2 className="text-[28px] md:text-[38px] font-bold text-white tracking-tight leading-tight line-clamp-1 drop-shadow-md">
          {station.name}
        </h2>
        <p className="text-sm md:text-base font-medium text-white/70 mt-1 drop-shadow-sm">
          {station.country || "Global"}
        </p>
      </div>
      
      <div className="absolute bottom-5 right-5 md:bottom-8 md:right-8 z-10">
        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-lg border border-white/20 lg:group-hover:bg-accent transition-colors">
          <Play className="size-5 md:size-6 text-white fill-current ml-1" />
        </div>
      </div>
    </button>
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
      <header className="hidden lg:flex items-center justify-between border-b border-white/10 pb-4">
        <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight text-white">Radio</h1>
      </header>

      <div>
        <RadioContent />
      </div>
    </div>
  );
}
