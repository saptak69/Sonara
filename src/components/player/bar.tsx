import { Heart, Mic2, MonitorSpeaker, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Cover } from "@/components/cover";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { formatTime } from "@/lib/format";
import { Slider } from "@/components/ui/slider";

export function PlayerBar() {
  const track = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seekTo = usePlayer((s) => s.seekTo);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const setExpanded = usePlayer((s) => s.setExpanded);
  const setLyricsOpen = usePlayer((s) => s.setLyricsOpen);
  const likedIds = usePlayer((s) => s.likedIds);
  const toggleLike = usePlayer((s) => s.toggleLike);

  const live = track?.kind === "radio";
  const progress =
    live || !duration || !Number.isFinite(duration) ? 0 : (currentTime / duration) * 100;
  
  const liked = Boolean(track && likedIds.includes(track.id));

  if (!track) {
    return null;
  }

  return (
    <>
      {/* Mobile Bar */}
      <div className="md:hidden mx-2 mb-2 relative bg-surface/90 backdrop-blur-xl rounded-xl border border-border/50 shadow-2xl overflow-hidden">
        {/* Mobile slim track progress line - removed transition to make it smooth */}
        {!live && duration > 0 ? (
          <div className="h-0.5 w-full bg-surface absolute top-0 left-0">
            <div
              className="h-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
        
        <div className="flex h-14 items-center gap-3 px-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.98] transition-transform"
            onClick={() => setExpanded(true)}
          >
            <div className="relative size-10 shrink-0">
              <Cover
                src={track.artwork}
                alt={track.title}
                title={track.title}
                className="size-full rounded-md shadow-sm"
              />
            </div>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg">
                {track.title}
              </span>
              <span className="block truncate text-xs text-muted">
                {track.artist}
              </span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-4 px-2">
            <button
              type="button"
              aria-label={isPlaying ? "Pause" : "Play"}
              className="active:scale-90 transition-transform text-fg"
              onClick={toggle}
            >
              {isPlaying ? <Pause className="size-6 fill-current" /> : <Play className="size-6 fill-current ml-0.5" />}
            </button>
            <button
              type="button"
              aria-label="Next"
              className="active:scale-90 transition-transform text-fg"
              onClick={next}
            >
              <SkipForward className="size-6 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Bottom Bar */}
      <div className="hidden md:flex h-24 w-full items-center justify-between px-6 bg-surface/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        
        {/* Left: Track Info */}
        <div className="flex w-[30%] items-center gap-4 min-w-0">
          <button onClick={() => setExpanded(true)} className="group relative shrink-0 overflow-hidden rounded-md shadow-md hover:opacity-90 transition-opacity">
            <Cover src={track.artwork} alt={track.title} className="size-14" />
          </button>
          <div className="flex flex-col min-w-0 flex-1 justify-center">
            <span className="truncate font-medium text-fg text-sm hover:underline cursor-pointer" onClick={() => setExpanded(true)}>
              {track.title}
            </span>
            <span className="truncate text-xs text-muted hover:underline cursor-pointer mt-0.5">
              {track.artist}
            </span>
          </div>
          <button
            onClick={() => toggleLike(track)}
            className="shrink-0 p-2 text-muted hover:text-fg transition-transform active:scale-90 ml-2"
          >
            <Heart className={cn("size-5", liked && "fill-accent text-accent")} strokeWidth={1.5} />
          </button>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="flex w-[40%] flex-col items-center justify-center max-w-[600px]">
          <div className="flex items-center gap-6 mb-2">
            <button
              className={cn("text-muted hover:text-fg transition-colors", shuffle && "text-accent")}
              onClick={toggleShuffle}
            >
              <Shuffle className="size-[18px]" strokeWidth={2} />
            </button>
            <button className="text-fg hover:text-accent transition-colors" onClick={prev}>
              <SkipBack className="size-6 fill-current" />
            </button>
            <button
              className="size-10 rounded-full bg-fg text-bg grid place-items-center hover:scale-105 active:scale-95 transition-transform shadow-md"
              onClick={toggle}
            >
              {isPlaying ? <Pause className="size-[18px] fill-current" /> : <Play className="size-[18px] fill-current ml-0.5" />}
            </button>
            <button className="text-fg hover:text-accent transition-colors" onClick={next}>
              <SkipForward className="size-6 fill-current" />
            </button>
            <button
              className={cn("text-muted hover:text-fg transition-colors", repeat !== "off" && "text-accent")}
              onClick={cycleRepeat}
            >
              {repeat === "one" ? <Repeat1 className="size-[18px]" strokeWidth={2} /> : <Repeat className="size-[18px]" strokeWidth={2} />}
            </button>
          </div>

          <div className="flex w-full items-center gap-3">
            <span className="w-10 text-right text-[11px] font-medium text-muted tabular-nums">
              {live ? "LIVE" : formatTime(currentTime)}
            </span>
            <Slider
              value={[live ? 0 : currentTime]}
              min={0}
              max={live || !duration || !Number.isFinite(duration) ? 100 : duration}
              step={0.1}
              disabled={live || !duration}
              onValueChange={([val]) => seekTo(val)}
              className="flex-1"
            />
            <span className="w-10 text-[11px] font-medium text-muted tabular-nums">
              {live ? "∞" : formatTime(Number.isFinite(duration) ? duration : 0)}
            </span>
          </div>
        </div>

        {/* Right: Actions & Volume */}
        <div className="flex w-[30%] items-center justify-end gap-4 min-w-0">
          <button 
            className="text-muted hover:text-fg transition-colors"
            onClick={() => {
              setExpanded(true);
              setTimeout(() => setLyricsOpen(true), 50);
            }}
          >
            <Mic2 className="size-[18px]" strokeWidth={2} />
          </button>
          <button className="text-muted hover:text-fg transition-colors hidden lg:block">
            <MonitorSpeaker className="size-[18px]" strokeWidth={2} />
          </button>
          <div className="flex items-center gap-2 ml-2 w-28 group">
            <Volume2 className="size-[18px] text-muted group-hover:text-fg transition-colors" strokeWidth={2} />
            <div className="relative flex-1 h-1.5 bg-border/50 rounded-full overflow-hidden cursor-pointer">
              <div className="absolute top-0 left-0 h-full bg-fg w-2/3" />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
