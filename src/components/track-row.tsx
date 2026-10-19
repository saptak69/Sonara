import { Heart, MoreVertical, Play, Radio, Pause } from "lucide-react";
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
  const likedIds = usePlayer((s) => s.likedIds);
  const toggleLike = usePlayer((s) => s.toggleLike);

  const active = current?.id === track.id;
  const isLiked = likedIds.includes(track.id);
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
        "group relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-xl px-3 py-2.5 transition-all duration-150 select-none",
        active
          ? "bg-white/[0.07] shadow-sm"
          : "hover:bg-white/[0.04]",
      )}
    >
      {/* Active Glowing Left Accent Indicator */}
      {active && (
        <span
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-accent shadow-[0_0_10px_rgba(255,74,58,0.8)]"
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-3 shrink-0">
        {typeof index === "number" ? (
          <span 
            className="hidden sm:inline-flex items-center justify-center w-6 text-right font-mono text-xs tabular-nums text-white/50 shrink-0 cursor-pointer"
            onClick={handlePlayToggle}
          >
            {active && isPlaying ? (
              <span className="text-accent flex items-center justify-center">
                <Equalizer />
              </span>
            ) : (
              <>
                <span className="group-hover:hidden">{String(index + 1).padStart(2, "0")}</span>
                <Play className="size-3.5 fill-white text-white hidden group-hover:block ml-0.5" />
              </>
            )}
          </span>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={active && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
              className="relative size-12 shrink-0 rounded-lg overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 border border-white/10 shadow-sm transition-transform active:scale-95"
              onClick={handlePlayToggle}
            >
              <Cover
                src={track.artwork}
                alt={track.title}
                title={track.title}
                className="size-12 rounded-lg object-cover"
              />
              <span
                className={cn(
                  "absolute inset-0 grid place-items-center bg-black/60 transition-opacity duration-150",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
              >
                {active && isPlaying ? (
                  <Pause className="size-5 fill-white text-white" />
                ) : (
                  <Play className="size-5 fill-white text-white ml-0.5" />
                )}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {active && isPlaying ? "Pause" : "Play"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        className="min-w-0 cursor-pointer"
        onClick={handlePlayToggle}
      >
        <p
          className={cn(
            "truncate text-[14px] font-semibold transition-colors leading-snug",
            active ? "text-accent drop-shadow-[0_0_8px_rgba(255,74,58,0.3)]" : "text-white group-hover:text-white",
          )}
        >
          {track.title}
        </p>
        <p className="truncate text-xs text-white/55 flex items-center gap-1.5 mt-0.5 leading-snug">
          {track.kind === "radio" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-wider bg-accent/15 px-1.5 py-0.5 rounded">
              <Radio className="size-2.5 animate-pulse" /> Live
            </span>
          )}
          {track.artistId ? (
            <Link
              to="/artist/$id"
              params={{ id: track.artistId }}
              className="hover:text-white hover:underline transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {track.artist}
            </Link>
          ) : (
            <span>{track.artist}</span>
          )}
          {showPlays && track.playCount ? (
            <span className="text-white/40 text-[11px]">
              · {formatCount(track.playCount)} plays
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick Like Button on Row Hover or when Liked */}
        <button
          type="button"
          aria-label={isLiked ? "Unlike" : "Like"}
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          className={cn(
            "p-1.5 rounded-full transition-all shrink-0 active:scale-90",
            isLiked
              ? "text-accent opacity-100"
              : "text-white/40 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10"
          )}
          title={isLiked ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Heart className={cn("size-4", isLiked && "fill-accent drop-shadow-[0_0_8px_rgba(255,74,58,0.6)]")} strokeWidth={1.75} />
        </button>

        <span className="hidden w-12 text-right font-mono text-xs tabular-nums text-white/50 sm:block">
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
                className="opacity-70 group-hover:opacity-100 transition-opacity hover:bg-white/10 text-white/70 hover:text-white rounded-full size-8"
              >
                <MoreVertical className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">More options</TooltipContent>
          </Tooltip>
        </TrackMenu>
      </div>
    </div>
  );
}
