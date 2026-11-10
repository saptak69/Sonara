import { memo, type CSSProperties } from "react";
import { Cover } from "@/components/cover";
import { Equalizer } from "@/components/equalizer";
import { SectionHeader, ShelfEmpty } from "@/components/rail";
import { TrackMenuButton } from "@/components/track-menu";
import { formatTime } from "@/lib/format";
import { tapFeedback } from "@/lib/haptics";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

const CHART_SIZE = 10;
/** Phones show the top five; wider screens show ten in two columns. */
const PHONE_ROWS = 5;

const ChartRow = memo(function ChartRow({ track, rank, onPlay }: { track: Track; rank: number; onPlay: () => void }) {
  const active = usePlayer((s) => s.queue[s.index]?.id === track.id);
  const playing = usePlayer((s) => s.isPlaying);
  const live = active && playing;

  return (
    <li className={cn("relative min-w-0", rank > PHONE_ROWS && "max-md:hidden")}>
      <button
        type="button"
        onClick={onPlay}
        onPointerDown={() => tapFeedback()}
        aria-label={`Play ${track.title} by ${track.artist}, number ${rank} on the chart`}
        className="tv-card group flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 pr-12 text-left transition-colors hover:bg-hover active:scale-[0.99] tvd:gap-5 tvd:p-3 tvd:pr-16"
      >
        <span className={cn("w-5 shrink-0 text-center text-[15px] font-semibold tabular-nums tvd:w-10 tvd:text-2xl", active ? "text-accent" : "text-subtle")}>
          {rank}
        </span>
        <span className="relative size-12 shrink-0 tvd:size-20">
          <Cover src={track.artwork || track.artworkLg} alt="" title={track.title} px={112} className="size-full rounded-lg border border-border" />
          {live ? (
            <span className="absolute inset-0 grid place-items-center rounded-lg bg-black/55">
              <Equalizer className="h-4" />
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[15px] font-medium transition-colors tvd:text-2xl", active ? "text-accent" : "text-fg group-hover:text-accent")}>
            {track.title}
          </span>
          <span className="block truncate text-[13px] text-muted tvd:text-lg">{track.artist}</span>
        </span>
        {track.duration > 0 ? <span className="hidden shrink-0 text-[13px] text-subtle tabular-nums md:block tvd:text-lg">{formatTime(track.duration)}</span> : null}
      </button>
      <TrackMenuButton track={track} className="absolute top-1/2 right-1 size-9 -translate-y-1/2 tvd:right-3 tvd:size-12" />
    </li>
  );
});

/** The top of the trending chart as a ranked list. Playing a row plays the chart from there. */
export function ChartList({
  tracks,
  loading,
  onRetry,
}: {
  tracks: Track[];
  loading: boolean;
  onRetry: () => void;
}) {
  const playTracks = usePlayer((s) => s.playTracks);
  const chart = tracks.slice(0, CHART_SIZE);

  return (
    <section className="space-y-3">
      <SectionHeader title="Top Songs" subtitle="Trending right now" />
      {loading && chart.length === 0 ? (
        <ul aria-hidden className="grid gap-x-8 md:grid-flow-col md:grid-cols-2 md:grid-rows-5">
          {Array.from({ length: CHART_SIZE }).map((_, i) => (
            <li key={i} className={cn("flex items-center gap-3 p-2", i >= PHONE_ROWS && "max-md:hidden")}>
              <div className="skeleton h-3 w-6 rounded" />
              <div className="skeleton size-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-3/5 rounded" />
                <div className="skeleton h-3 w-2/5 rounded" />
              </div>
            </li>
          ))}
        </ul>
      ) : chart.length === 0 ? (
        <ShelfEmpty message="The chart didn't load. Your library and downloads still work." onRetry={onRetry} />
      ) : (
        <ol
          className="grid gap-x-8 gap-y-0.5 md:grid-flow-col md:grid-cols-2 md:grid-rows-[repeat(var(--rows),auto)]"
          // Split evenly into two columns whatever the count (ten songs: 5 + 5, six songs: 3 + 3).
          style={{ "--rows": Math.ceil(chart.length / 2) } as CSSProperties}
        >
          {chart.map((track, i) => (
            <ChartRow key={track.id} track={track} rank={i + 1} onPlay={() => playTracks(chart, i)} />
          ))}
        </ol>
      )}
    </section>
  );
}
