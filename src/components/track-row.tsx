import { Heart, MoreVertical, Play, Radio, Pause, CheckCircle2 } from "lucide-react";
import { Cover } from "@/components/cover";
import { Equalizer } from "@/components/equalizer";
import { TrackMenu } from "@/components/track-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatCount, formatTime } from "@/lib/format";
import { usePlayer } from "@/lib/player-store";
import { useOfflineTracks } from "@/lib/offline-cache";
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

  const { isDownloaded } = useOfflineTracks();
  const active = current?.id === track.id;
  const isLiked = likedIds.includes(track.id);
  const downloaded = isDownloaded(track.id);
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
        "group relative grid grid-cols-[auto_minmax(0,1fr)_auto] min-[900px]:grid-cols-[auto_minmax(0,1fr)_minmax(0,220px)_auto] items-center gap-3.5 rounded-xl px-3 py-2.5 transition-all duration-150 select-none",
        active
          ? "bg-white/[0.06]"
          : "hover:bg-white/[0.04]",
      )}
    >
      {/* Clean 2px Left Accent Indicator */}
      {active && (
        <span
          className="absolute left-0 top-2.5 bottom-2.5 w-[2px] rounded-r bg-[#FF5B2E]"
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-3 shrink-0">
        {typeof index === "number" ? (
          <span 
            className="hidden sm:inline-flex items-center justify-center w-6 text-right font-mono text-xs tabular-nums text-white/40 shrink-0 cursor-pointer"
            onClick={handlePlayToggle}
          >
            {active && isPlaying ? (
              <span className="text-[#FF5B2E] flex items-center justify-center">
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
              className="relative size-11 sm:size-12 shrink-0 rounded-lg overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF5B2E] border border-white/[0.08] shadow-sm transition-transform active:scale-95"
              onClick={handlePlayToggle}
            >
              <Cover
                src={track.artwork}
                alt={track.title}
                title={track.title}
                className="size-full rounded-lg object-cover"
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
            "truncate text-[14px] font-medium transition-colors leading-snug",
            active ? "text-[#FF5B2E]" : "text-[#F4EFEA] group-hover:text-white",
          )}
        >
          {track.title}
        </p>
        <p className="truncate text-xs text-[#A9A19B] flex items-center gap-1.5 mt-0.5 leading-snug">
          {downloaded && (
            <span title="Downloaded for offline playback" className="shrink-0">
              <CheckCircle2 className="size-3 text-[#52B58A] fill-[#52B58A]/20" />
            </span>
          )}
          {track.kind === "radio" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#FF5B2E] uppercase tracking-wider bg-[#FF5B2E]/10 px-1.5 py-0.5 rounded">
              <Radio className="size-2.5" /> Live
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

      {/* Desktop-only Album Column */}
      <div className="hidden min-[900px]:block min-w-0 pr-4">
        <p className="truncate text-xs text-white/40 hover:text-white/70 transition-colors">
          {track.album || "Single"}
        </p>
      </div>

      {/* Row Actions: Heart, Duration, Context Menu */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          aria-label={isLiked ? "Unlike" : "Like"}
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          className={cn(
            "p-1.5 rounded-full transition-all shrink-0 active:scale-90 cursor-pointer",
            isLiked
              ? "text-[#FF5B2E] opacity-100"
              : "text-white/40 opacity-70 sm:opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10"
          )}
          title={isLiked ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Heart className={cn("size-4", isLiked && "fill-[#FF5B2E]")} strokeWidth={1.75} />
        </button>

        <span className="hidden w-12 text-right font-mono text-xs tabular-nums text-white/40 sm:block">
          {track.kind === "radio" ? (
            <span className="text-[10px] font-semibold tracking-wider text-[#FF5B2E]">LIVE</span>
          ) : (
            formatTime(track.duration)
          )}
        </span>

        {/* Three dots context menu */}
        <TrackMenu track={track} rest={queue}>
          <button
            type="button"
            aria-label={`Options for ${track.title}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-full transition-all opacity-80 sm:opacity-70 group-hover:opacity-100 hover:bg-white/10 text-white/70 hover:text-white shrink-0 active:scale-90 cursor-pointer"
            title="More options"
          >
            <MoreVertical className="size-4" />
          </button>
        </TrackMenu>
      </div>
    </div>
  );
}
