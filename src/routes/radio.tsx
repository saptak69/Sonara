import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Radio as RadioIcon } from "lucide-react";
import { RadioCard, RadioTile } from "@/components/cards";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { fetchRadioStations } from "@/lib/music-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/radio")({ component: RadioPage });

const TAGS = ["pop", "jazz", "classical", "electronic", "news", "chill"] as const;
type Filter = "all" | (typeof TAGS)[number];

const GRID = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function FilterChips({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const options: Filter[] = ["all", ...TAGS];
  return (
    <div
      role="tablist"
      aria-label="Station genre"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:-mx-10 md:px-10 [&::-webkit-scrollbar]:hidden"
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition active:scale-95",
            value === o
              ? "border-fg bg-fg text-bg"
              : "border-border bg-surface text-muted hover:border-border-strong hover:text-fg",
          )}
        >
          {o === "all" ? "All stations" : titleCase(o)}
        </button>
      ))}
    </div>
  );
}

function TagShelf({ tag }: { tag: string }) {
  const query = useQuery({ queryKey: ["radio-tag", tag], queryFn: () => fetchRadioStations(12, tag) });
  const stations = query.data ?? [];
  if (!stations.length) return null;
  return (
    <Rail title={titleCase(tag)}>
      {stations.map((s) => (
        <RadioCard key={s.id} station={s} />
      ))}
    </Rail>
  );
}

function TagGrid({ tag }: { tag: Filter }) {
  const query = useQuery({
    queryKey: ["radio-tag-grid", tag],
    queryFn: () => fetchRadioStations(36, tag === "all" ? undefined : tag),
  });
  if (query.isLoading) return <HomeSkeleton />;
  const stations = query.data ?? [];
  if (!stations.length) {
    return <p className="py-16 text-center text-sm text-muted">No stations found right now. Try another genre.</p>;
  }
  return (
    <div className={GRID}>
      {stations.map((s) => (
        <RadioTile key={s.id} station={s} />
      ))}
    </div>
  );
}

export function RadioContent() {
  const [filter, setFilter] = useState<Filter>("all");
  const popular = useQuery({ queryKey: ["radio-popular"], queryFn: () => fetchRadioStations(24) });
  const data = popular.data;

  const stations = data ?? [];

  if (popular.isLoading && !data) return <HomeSkeleton />;

  return (
    <div className="space-y-8 md:space-y-10">
      <FilterChips value={filter} onChange={setFilter} />

      {filter === "all" ? (
        <>
          {stations.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-[22px]">Popular stations</h2>
              <div className={GRID}>
                {stations.slice(0, 12).map((s) => (
                  <RadioTile key={s.id} station={s} />
                ))}
              </div>
            </section>
          )}

          <div className="space-y-9">
            {TAGS.map((tag) => (
              <TagShelf key={tag} tag={tag} />
            ))}
          </div>
        </>
      ) : (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-[22px]">{titleCase(filter)} stations</h2>
          <TagGrid tag={filter} />
        </section>
      )}
    </div>
  );
}

function RadioPage() {
  return (
    <div className="w-full space-y-6 px-4 pb-32 pt-6 md:px-10 md:pt-8">
      <header className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent">
          <RadioIcon className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl md:text-4xl">Radio</h1>
          <p className="text-sm text-muted">Live stations from around the world, 24/7</p>
        </div>
      </header>

      <RadioContent />
    </div>
  );
}
