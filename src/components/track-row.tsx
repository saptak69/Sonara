import { MoreVertical, Play } from "lucide-react";
import { Cover } from "@/components/cover";
import { Equalizer } from "@/components/equalizer";
import { TrackMenu } from "@/components/track-menu";
import { Button } from "@/components/ui/button";
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

  return (
    <div
      className={cn(
        "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-150",
        "hover:bg-white/10 hover:backdrop-blur-md border border-transparent hover:border-white/10",
        active && "bg-white/15 border-white/15 backdrop-blur-md shadow-sm",
      )}
    >
      <button
        type="button"
        className="relative size-12 shrink-0"
        onClick={() => {
          if (active) toggle();
          else playTracks(queue.length ? queue : [track], startIndex < 0 ? 0 : startIndex);
        }}
      >
        <Cover
          src={track.artwork}
          alt={track.title}
          title={track.title}
          className="size-12"
        />
        <span className="absolute inset-0 grid place-items-center rounded-md bg-bg/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {active && isPlaying ? (
            <Equalizer />
          ) : (
            <Play className="size-5 fill-fg text-fg" style={{ marginLeft: 2 }} />
          )}
        </span>
        {active && isPlaying ? (
          <span className="absolute inset-0 grid place-items-center rounded-md bg-bg/35 group-hover:opacity-0">
            <Equalizer />
          </span>
        ) : null}
      </button>
      <div
        className="min-w-0 cursor-pointer select-none"
        onClick={() => {
          if (active) toggle();
          else playTracks(queue.length ? queue : [track], startIndex < 0 ? 0 : startIndex);
        }}
      >
        <p className={cn("truncate text-sm font-medium", active ? "text-accent" : "text-fg")}>
          {typeof index === "number" ? (
            <span className="mr-2 tabular-nums text-subtle">{index + 1}</span>
          ) : null}
          {track.title}
        </p>
        <p className="truncate text-xs text-muted">
          {track.artistId ? (
            <Link
              to="/artist/$id"
              params={{ id: track.artistId }}
              className="hover:text-fg hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {track.artist}
            </Link>
          ) : (
            track.artist
          )}
          {showPlays && track.playCount ? ` · ${formatCount(track.playCount)} plays` : null}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <span className="hidden w-10 text-right text-xs tabular-nums text-subtle sm:block">
          {track.kind === "radio" ? "LIVE" : formatTime(track.duration)}
        </span>
        <TrackMenu track={track} rest={queue}>
          <Button variant="icon" size="iconSm" aria-label="More">
            <MoreVertical className="size-4" />
          </Button>
        </TrackMenu>
      </div>
    </div>
  );
}
