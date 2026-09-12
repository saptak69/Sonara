import { MoreVertical, Play, Pause, Radio } from "lucide-react";
import { Cover } from "@/components/cover";
import { Equalizer } from "@/components/equalizer";
import { TrackMenu } from "@/components/track-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatCount, formatTime } from "@/lib/format";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export function TrackRow({
  track,
  index,
  queue,
  showPlays,
}: {
  track: Track;
  index?: number;
  queue: Track[];
  showPlays?: boolean;
}) {
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playTracks = usePlayer((s) => s.playTracks);
  const toggle = usePlayer((s) => s.toggle);
  const active = current?.id === track.id;
  const startIndex = Math.max(0, queue.findIndex((t) => t.id === track.id));

  const handlePlayToggle = () => {
    if (active) toggle();
    else playTracks(queue.length ? queue : [track], startIndex < 0 ? 0 : startIndex);
  };

  return (
    <div
      className={cn(
        "group relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-lg px-3 py-2 transition-all duration-150 select-none",
        "border transition-colors",
        active
          ? "bg-[var(--color-hover)] border-brass/40"
          : "border-transparent hover:border-brass/20 hover:bg-[var(--color-surface)]/70",
      )}
    >
      {/* Active verdigris ping indicator on far left */}
      {active && (
        <span
          className="absolute left-1.5 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-verdigris shadow-[0_0_6px_#4a8f7f] animate-pulse"
          aria-hidden="true"
        />
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={active && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            className="relative size-12 shrink-0 rounded-md overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass/60 border border-brass/15"
            onClick={handlePlayToggle}
          >
            <Cover
              src={track.artwork}
              alt={track.title}
              title={track.title}
              className="size-12 rounded-md"
            />
            <span
              className={cn(
                "absolute inset-0 grid place-items-center bg-black/60 transition-opacity duration-150",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              {active && isPlaying ? (
                <Equalizer />
              ) : (
                <Play className="size-5 fill-paper text-paper ml-0.5" />
              )}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {active && isPlaying ? "Pause" : "Play"}
        </TooltipContent>
      </Tooltip>

      <div
        className="min-w-0 cursor-pointer"
        onClick={handlePlayToggle}
      >
        <div className="flex items-center gap-2">
          {typeof index === "number" ? (
            <span className="w-5 text-right font-mono text-xs tabular-nums text-brass-dim shrink-0">
              {String(index + 1).padStart(2, "0")}
            </span>
          ) : null}
          <p
            className={cn(
              "truncate text-sm font-medium transition-colors",
              active ? "text-brass font-medium" : "text-paper group-hover:text-brass",
            )}
          >
            {track.title}
          </p>
        </div>
        <p className="truncate text-xs text-brass-dim flex items-center gap-1.5 pl-0.5 mt-0.5 font-mono text-[11px]">
          {track.kind === "radio" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-verdigris uppercase tracking-wider">
              <Radio className="size-2.5 animate-pulse" /> Live
            </span>
          )}
          {track.artistId ? (
            <Link
              to="/artist/$id"
              params={{ id: track.artistId }}
              className="hover:text-paper hover:underline transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {track.artist}
            </Link>
          ) : (
            <span>{track.artist}</span>
          )}
          {showPlays && track.playCount ? (
            <span className="text-brass-dim/70 font-mono text-[10px]">
              · {formatCount(track.playCount)} soundings
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden w-12 text-right font-mono text-xs tabular-nums text-brass-dim sm:block">
          {track.kind === "radio" ? (
            <span className="text-[10px] font-bold tracking-widest text-verdigris">LIVE</span>
          ) : (
            formatTime(track.duration)
          )}
        </span>

        <TrackMenu track={track} rest={queue}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="icon"
                size="iconSm"
                aria-label={`Options for ${track.title}`}
                className="opacity-70 group-hover:opacity-100 transition-opacity hover:bg-brass/10 hover:text-paper"
              >
                <MoreVertical className="size-4 text-brass-dim" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">More options</TooltipContent>
          </Tooltip>
        </TrackMenu>
      </div>
    </div>
  );
}
