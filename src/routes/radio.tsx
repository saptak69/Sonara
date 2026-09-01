import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RadioCard } from "@/components/cards";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { fetchRadioStations, radioToTrack } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/radio")({ component: RadioPage });

const TAGS = ["pop", "jazz", "classical", "electronic", "news", "chill"] as const;

function RadioTagRail({ tag }: { tag: string }) {
  const query = useQuery({
    queryKey: ["radio-tag", tag],
    queryFn: () => fetchRadioStations(12, tag),
  });
  const stations = query.data ?? [];
  if (!stations.length) return null;
  return (
    <Rail title={tag[0]!.toUpperCase() + tag.slice(1)}>
      {stations.map((s) => (
        <RadioCard key={s.id} station={s} />
      ))}
    </Rail>
  );
}

function RadioPage() {
  const playTracks = usePlayer((s) => s.playTracks);
  const popular = useQuery({
    queryKey: ["radio-popular"],
    queryFn: () => fetchRadioStations(24),
  });

  if (popular.isLoading && !popular.data) return <HomeSkeleton />;

  const all = popular.data ?? [];

  return (
    <div className="stagger-in space-y-10 px-4 py-6 md:px-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">On air</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Radio</h1>
        </div>
        {all.length ? (
          <Button
            variant="chip"
            size="sm"
            onClick={() => playTracks(all.map(radioToTrack), 0)}
          >
            Play popular
          </Button>
        ) : null}
      </header>

      {all.length ? (
        <Rail title="Popular stations">
          {all.map((s) => (
            <RadioCard key={s.id} station={s} />
          ))}
        </Rail>
      ) : (
        <p className="text-sm text-muted">No stations right now.</p>
      )}

      {TAGS.map((tag) => (
        <RadioTagRail key={tag} tag={tag} />
      ))}
    </div>
  );
}
