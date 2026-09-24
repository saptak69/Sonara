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
  const playTrack = usePlayer((s) => s.playTrack);
  const toggle = usePlayer((s) => s.toggle);
  const active = current?.id === track.id;
  const startIndex = Math.max(0, queue.findIndex((t) => t.id === track.id));

  const handlePlayToggle = () => {
    if (active) {
      toggle();
    } else if (queue.length === 0) {
      playTrack(track, []);
    } else {
      playTracks(queue, startIndex < 0 ? 0 : startIndex);
    }
  };

  return (
    <div
      className={cn(
        "group relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-2xl px-3 py-2 transition-all duration-150 select-none",
        "border lg:hover:scale-[1.02] active:scale-[0.98]",
        active
          ? "bg-white/[0.06] border-accent/30"
          : "border-transparent lg:hover:border-white/5 lg:hover:bg-white/[0.04]",
      )}
    >
      {/* Active verdigris ping indicator on far left */}
      {active && (
        <span
          className="absolute left-1.5 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(255,74,58,0.5)] animate-pulse"
          aria-hidden="true"
        />
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={active && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            className="relative size-12 shrink-0 rounded-md overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/60 border border-white/10"
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
                active ? "opacity-100" : "opacity-0 lg:group-hover:opacity-100",
              )}
            >
              {active && isPlaying ? (
                <Equalizer />
              ) : (
                <Play className="size-5 fill-fg text-fg ml-0.5" />
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
            <span className="hidden lg:inline-block w-5 text-right font-mono text-xs tabular-nums text-muted shrink-0">
              {String(index + 1).padStart(2, "0")}
            </span>
          ) : null}
          <p
            className={cn(
              "truncate text-sm font-medium transition-colors",
              active ? "text-accent font-medium" : "text-fg lg:group-hover:text-accent",
            )}
          >
            {track.title}
          </p>
        </div>
        <p className="truncate text-xs text-muted flex items-center gap-1.5 pl-0.5 mt-0.5 font-mono text-[11px]">
          {track.kind === "radio" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent uppercase tracking-wider">
              <Radio className="size-2.5 animate-pulse" /> Live
            </span>
          )}
          {track.artistId ? (
            <Link
              to="/artist/$id"
              params={{ id: track.artistId }}
              className="lg:hover:text-fg lg:hover:underline transition-colors"
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
        <span className="hidden w-12 text-right font-mono text-xs tabular-nums text-muted sm:block">
          {track.kind === "radio" ? (
            <span className="text-[10px] font-bold tracking-widest text-accent">LIVE</span>
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
                className="opacity-70 lg:group-hover:opacity-100 transition-opacity lg:hover:bg-accent/10 lg:hover:text-fg"
              >
                <MoreVertical className="size-4 text-muted" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">More options</TooltipContent>
          </Tooltip>
        </TrackMenu>
      </div>
    </div>
  );
}
