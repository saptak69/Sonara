import {
  Heart,
  ListMusic,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { CSSProperties } from "react";
import { Cover } from "@/components/cover";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/format";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

function IconSwap({
  on,
  OnIcon,
  OffIcon,
}: {
  on: boolean;
  OnIcon: typeof Play;
  OffIcon: typeof Pause;
}) {
  return (
    <span className="relative grid size-5 place-items-center">
      <OnIcon
        className={cn(
          "absolute size-5 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          on ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-[4px]",
        )}
      />
      <OffIcon
        className={cn(
          "size-5 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          on ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none",
        )}
      />
    </span>
  );
}

export function PlayerBar() {
  const track = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const likedIds = usePlayer((s) => s.likedIds);
  const liked = Boolean(track && likedIds.includes(track.id));
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seekTo = usePlayer((s) => s.seekTo);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const toggleLike = usePlayer((s) => s.toggleLike);
  const setExpanded = usePlayer((s) => s.setExpanded);
  const setQueueOpen = usePlayer((s) => s.setQueueOpen);
  const setLyricsOpen = usePlayer((s) => s.setLyricsOpen);
  const queueOpen = usePlayer((s) => s.queueOpen);
  const lyricsOpen = usePlayer((s) => s.lyricsOpen);

  const live = track?.kind === "radio";
  const progress =
    live || !duration || !Number.isFinite(duration) ? 0 : (currentTime / duration) * 100;

  if (!track) {
    return (
      <div className="pointer-events-none hidden h-player md:block" aria-hidden />
    );
  }

  return (
    <div className="border-t border-white/10 bg-black/60 backdrop-blur-3xl shadow-2xl">
      {/* Mobile slim track progress line */}
      {!live && duration > 0 ? (
        <div className="h-0.5 w-full bg-white/10 md:hidden">
          <div
            className="h-full bg-accent transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      <div className="flex h-player items-center gap-2.5 px-3 md:gap-6 md:px-6">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left md:max-w-xs lg:max-w-sm active:scale-98 transition-transform"
          onClick={() => setExpanded(true)}
        >
          <Cover
            src={track.artwork}
            alt={track.title}
            title={track.title}
            className="size-11 md:size-12 shrink-0 rounded-lg shadow-sm"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs md:text-sm font-semibold text-fg">
              {track.title}
            </span>
            {track.artistId ? (
              <Link
                to="/artist/$id"
                params={{ id: track.artistId }}
                className="block truncate text-[11px] md:text-xs text-muted hover:text-fg hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {track.artist}
              </Link>
            ) : (
              <span className="block truncate text-[11px] md:text-xs text-muted">
                {track.artist}
              </span>
            )}
          </span>
        </button>

        <Button
          variant="icon"
          size="iconSm"
          aria-label={liked ? "Unlike" : "Like"}
          className="grid shrink-0 text-muted hover:text-fg"
          onClick={() => toggleLike(track)}
        >
          <Heart className={cn("size-4 md:size-4.5", liked && "fill-accent text-accent")} />
        </Button>

        <div className="flex shrink-0 md:min-w-0 md:flex-[1.4] flex-col items-center gap-1">
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="icon"
              size="iconSm"
              aria-label="Shuffle"
              className={cn("hidden md:grid", shuffle && "text-accent")}
              onClick={toggleShuffle}
            >
              <Shuffle className="size-4" />
            </Button>
            <Button variant="icon" size="iconSm" aria-label="Previous" onClick={prev}>
              <SkipBack className="size-5 fill-current" />
            </Button>
            <Button
              variant="solid"
              size="icon"
              aria-label={isPlaying ? "Pause" : "Play"}
              className="size-10"
              onClick={toggle}
            >
              <IconSwap on={isPlaying} OnIcon={Pause} OffIcon={Play} />
            </Button>
            <Button variant="icon" size="iconSm" aria-label="Next" onClick={next}>
              <SkipForward className="size-5 fill-current" />
            </Button>
            <Button
              variant="icon"
              size="iconSm"
              aria-label="Repeat"
              className={cn("hidden md:grid", repeat !== "off" && "text-accent")}
              onClick={cycleRepeat}
            >
              {repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
            </Button>
          </div>
          <div className="hidden w-full max-w-xl items-center gap-2 md:flex">
            <span className="w-10 text-right text-[11px] tabular-nums text-subtle">
              {live ? "LIVE" : formatTime(currentTime)}
            </span>
            <input
              className="player-range"
              type="range"
              min={0}
              max={live || !duration ? 0 : duration}
              step={0.1}
              value={live ? 0 : currentTime}
              disabled={live}
              style={{ "--progress": `${progress}%` } as CSSProperties}
              onChange={(e) => seekTo(Number(e.target.value))}
              aria-label="Seek"
            />
            <span className="w-10 text-[11px] tabular-nums text-subtle">
              {live ? "" : formatTime(Number.isFinite(duration) ? duration : 0)}
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          <Button
            variant="icon"
            size="iconSm"
            aria-label="Lyrics"
            className={cn(lyricsOpen && "text-accent")}
            onClick={() => {
              setExpanded(true);
              setLyricsOpen(!lyricsOpen);
            }}
          >
            <Mic2 className="size-4" />
          </Button>
          <Button
            variant="icon"
            size="iconSm"
            aria-label="Queue"
            className={cn(queueOpen && "text-accent")}
            onClick={() => setQueueOpen(!queueOpen)}
          >
            <ListMusic className="size-4" />
          </Button>
          <div className="group/vol flex items-center">
            <Button
              variant="icon"
              size="iconSm"
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={toggleMute}
            >
              <IconSwap on={muted || volume === 0} OnIcon={VolumeX} OffIcon={Volume2} />
            </Button>
            <input
              className="player-range w-0 opacity-0 transition-[width,opacity] duration-200 group-hover/vol:w-24 group-hover/vol:opacity-100"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              style={{ "--progress": `${(muted ? 0 : volume) * 100}%` } as CSSProperties}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
