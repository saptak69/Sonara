import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Play, Pause, Radio as RadioIcon } from "lucide-react";
import { RadioCard, RadioTile } from "@/components/cards";
import { Cover } from "@/components/cover";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { TrackMenuButton } from "@/components/track-menu";
import { fetchRadioStations, radioToTrack } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import type { RadioStation } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/radio")({ component: RadioPage });

const TAGS = ["pop", "jazz", "classical", "electronic", "news", "chill"] as const;
type Filter = "all" | (typeof TAGS)[number];

const GRID = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "On air now": the big featured station. */
function OnAir({ station }: { station: RadioStation }) {
  const playTrack = usePlayer((s) => s.playTrack);
  const toggle = usePlayer((s) => s.toggle);
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const track = radioToTrack(station);
  const active = current?.id === track.id;
  const tags = station.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <section
      aria-label="On air now"
      className="relative isolate overflow-hidden rounded-3xl border border-border bg-surface p-5 sm:p-7 lg:p-9"
    >
      {/* Soft colour wash taken from the station artwork */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden>
        <Cover src={station.artwork} alt="" className="size-full scale-125 object-cover blur-3xl saturate-150" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-bg/90 via-bg/70 to-bg/30" aria-hidden />

      <div className="flex items-center gap-4 sm:gap-6 lg:gap-9">
        <div className="size-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:size-36 lg:size-48">
          <Cover src={station.artwork} alt={station.name} title={station.name} className="size-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            On air now
          </span>

          <h2 className="mt-2.5 line-clamp-2 text-xl font-semibold leading-tight tracking-tight text-fg sm:text-3xl lg:text-4xl">
            {station.name}
          </h2>
          <p className="mt-1 truncate text-sm text-muted sm:text-base">
            {[station.country, station.bitrate ? `${station.bitrate} kbps` : ""].filter(Boolean).join(" · ") || "Live radio"}
          </p>

          {tags.length > 0 && (
            <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
              {tags.map((t) => (
                <span key={t} className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-xs text-fg/80">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => (active ? toggle() : playTrack(track))}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-fg px-6 text-sm font-semibold text-bg transition active:scale-95"
            >
              {active && isPlaying ? <Pause className="size-4 fill-current" strokeWidth={0} /> : <Play className="size-4 fill-current" strokeWidth={0} />}
              {active && isPlaying ? "Pause" : "Listen live"}
            </button>
            <TrackMenuButton track={track} className="size-11 border border-white/10 bg-white/[0.06]" />
          </div>
        </div>
      </div>

      {/* Phone: full-width actions under the artwork row */}
      <div className="mt-5 flex items-center gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => (active ? toggle() : playTrack(track))}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-fg text-sm font-semibold text-bg transition active:scale-95"
        >
          {active && isPlaying ? <Pause className="size-4 fill-current" strokeWidth={0} /> : <Play className="size-4 fill-current" strokeWidth={0} />}
          {active && isPlaying ? "Pause" : "Listen live"}
        </button>
        <TrackMenuButton track={track} className="size-12 border border-white/10 bg-white/[0.06]" />
      </div>
    </section>
  );
}

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

  // Deterministic pick (no Math.random) so the server and the browser render the same page.
  const featured = useMemo(() => (data && data.length ? data[0] : null), [data]);
  const rest = useMemo(() => (data ?? []).filter((s) => s.id !== featured?.id), [data, featured]);

  if (popular.isLoading && !data) return <HomeSkeleton />;

  return (
    <div className="space-y-8 md:space-y-10">
      <FilterChips value={filter} onChange={setFilter} />

      {filter === "all" ? (
        <>
          {featured && <OnAir station={featured} />}

          {rest.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-[22px]">Popular stations</h2>
              <div className={GRID}>
                {rest.slice(0, 12).map((s) => (
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
