import { TrackMenuButton } from "@/components/track-menu";
import { memo, useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  ListMusic,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Cover } from "@/components/cover";
import { MarqueeText } from "@/components/marquee-text";
import { formatTime } from "@/lib/format";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";

const NowPlayingBars = memo(function NowPlayingBars() {
  return (
    <span className="eq shrink-0" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
});

function useProgress() {
  const track = usePlayer((s) => s.queue[s.index]);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const live = track?.kind === "radio";
  const known = !live && Number.isFinite(duration) && duration > 0;
  return { live, known, currentTime, duration, percent: known ? Math.min(100, (currentTime / duration) * 100) : 0 };
}

// ── Mini player (phones, landscape, TV) ───────────────────────────────────────

export function MiniPlayer() {
  const track = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const setExpanded = usePlayer((s) => s.setExpanded);
  const { known, percent } = useProgress();

  if (!track) return null;

  return (
    <div className="sonara-glass-strong relative overflow-hidden rounded-2xl">
      <div className="flex h-16 items-center gap-3 pr-2 pl-2 short:h-14">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition-transform active:scale-[0.98]"
          aria-label={`Now playing: ${track.title} by ${track.artist}. Open player`}
        >
          <Cover
            src={track.artwork}
            alt=""
            title={track.title}
            className="size-12 shrink-0 rounded-xl short:size-10"
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <MarqueeText text={track.title} className="text-[15px] leading-tight font-semibold text-fg" />
            <span className="mt-0.5 truncate text-[13px] text-muted">{track.artist}</span>
          </span>
        </button>

        <TrackMenuButton track={track} className="size-10 text-fg/80" />
        <button
          type="button"
          onClick={toggle}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-fg text-bg transition active:scale-90"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="size-5 fill-current" strokeWidth={0} /> : <Play className="ml-0.5 size-5 fill-current" strokeWidth={0} />}
        </button>
        <button
          type="button"
          onClick={next}
          className="grid size-11 shrink-0 place-items-center rounded-full text-fg/85 transition hover:text-fg active:scale-90"
          aria-label="Next song"
        >
          <SkipForward className="size-5 fill-current" />
        </button>
      </div>

      {known && (
        <div className="pointer-events-none absolute inset-x-3 bottom-0 h-0.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-accent transition-[width] duration-300 ease-linear" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}

// ── Desktop player bar ────────────────────────────────────────────────────────

export function DesktopPlayerBar() {
  const track = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const setExpanded = usePlayer((s) => s.setExpanded);
  const setLyricsOpen = usePlayer((s) => s.setLyricsOpen);
  const toggleEqualizer = usePlayer((s) => s.toggleEqualizer);
  const equalizerEnabled = usePlayer((s) => s.equalizerEnabled);
  const { live, known, currentTime, duration } = useProgress();

  if (!track) return null;

  const iconButton = "grid size-9 place-items-center rounded-full text-muted transition hover:bg-hover hover:text-fg active:scale-90";

  return (
    <div className="fixed right-6 bottom-5 left-[calc(var(--spacing-sidebar)+1.5rem)] z-40 hidden desk:block">
      <div className="sonara-glass-strong relative mx-auto flex h-[76px] max-w-[960px] items-center gap-4 rounded-[22px] px-4">
        {known && (
          <SeekBar currentTime={currentTime} duration={duration} className="absolute inset-x-5 -top-[5px]" />
        )}

        {/* Now playing */}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-[260px] min-w-0 shrink items-center gap-3 rounded-xl text-left"
          aria-label="Open player"
        >
          <Cover src={track.artwork} alt="" title={track.title} className="size-12 shrink-0 rounded-[10px]" />
          <span className="flex min-w-0 flex-col">
            <span className="flex min-w-0 items-center gap-2">
              {live && (
                <span className="shrink-0 rounded-sm border border-accent/40 bg-accent-soft px-1 text-[9px] font-bold tracking-wider text-accent">
                  LIVE
                </span>
              )}
              <MarqueeText text={track.title} className="min-w-0 flex-1 text-sm font-semibold text-fg" />
              {isPlaying && <NowPlayingBars />}
            </span>
            <span className="mt-0.5 truncate text-xs text-muted">{track.artist}</span>
          </span>
        </button>

        {/* Transport */}
        <div className="flex flex-1 items-center justify-center gap-3">
          <button
            type="button"
            onClick={toggleShuffle}
            className={cn(iconButton, shuffle && "text-accent hover:text-accent")}
            aria-label="Shuffle"
            aria-pressed={shuffle}
          >
            <Shuffle className="size-[18px]" strokeWidth={2.2} />
          </button>
          <button type="button" onClick={prev} className={cn(iconButton, "text-fg")} aria-label="Previous song">
            <SkipBack className="size-5 fill-current" />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="grid size-12 place-items-center rounded-full bg-fg text-bg shadow-lg transition hover:scale-105 active:scale-95"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="size-5 fill-current" strokeWidth={0} /> : <Play className="ml-0.5 size-5 fill-current" strokeWidth={0} />}
          </button>
          <button type="button" onClick={next} className={cn(iconButton, "text-fg")} aria-label="Next song">
            <SkipForward className="size-5 fill-current" />
          </button>
          <button
            type="button"
            onClick={cycleRepeat}
            className={cn(iconButton, repeat !== "off" && "text-accent hover:text-accent")}
            aria-label={`Repeat: ${repeat}`}
          >
            {repeat === "one" ? <Repeat1 className="size-[18px]" strokeWidth={2.2} /> : <Repeat className="size-[18px]" strokeWidth={2.2} />}
          </button>
        </div>

        {/* Extras */}
        <div className="flex w-[260px] min-w-0 shrink items-center justify-end gap-1">
          {known && (
            <span className="mr-1 font-mono text-xs text-subtle tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
          <TrackMenuButton track={track} className="size-9" />
          <button
            type="button"
            className={iconButton}
            onClick={() => {
              setExpanded(true);
              setLyricsOpen(true);
            }}
            aria-label="Lyrics"
          >
            <Mic2 className="size-[18px]" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => {
              setExpanded(true);
              setLyricsOpen(false);
            }}
            aria-label="Queue"
          >
            <ListMusic className="size-[18px]" />
          </button>
          <button
            type="button"
            className={cn(iconButton, equalizerEnabled && "text-accent hover:text-accent")}
            onClick={toggleEqualizer}
            aria-label="Equalizer"
          >
            <SlidersHorizontal className="size-[18px]" />
          </button>
          <VolumeControl />
        </div>
      </div>
    </div>
  );
}

// ── Seek + volume ─────────────────────────────────────────────────────────────

function useHorizontalDrag(onValue: (fraction: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const fractionAt = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const handlers = {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      onValue(fractionAt(event.clientX));
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (dragging.current) onValue(fractionAt(event.clientX));
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
      dragging.current = false;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    },
  };

  return { ref, handlers, fractionAt };
}

export function SeekBar({ currentTime, duration, className }: { currentTime: number; duration: number; className?: string }) {
  const seekTo = usePlayer((s) => s.seekTo);
  const [hover, setHover] = useState<{ x: number; time: number } | null>(null);
  const { ref, handlers, fractionAt } = useHorizontalDrag(
    useCallback((fraction: number) => seekTo(fraction * duration), [seekTo, duration]),
  );
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 30 : 5;
    if (event.key === "ArrowRight") seekTo(Math.min(duration, currentTime + step));
    else if (event.key === "ArrowLeft") seekTo(Math.max(0, currentTime - step));
    else if (event.key === "Home") seekTo(0);
    else return;
    event.preventDefault();
  };

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
      onKeyDown={onKeyDown}
      onMouseMove={(event) => {
        const fraction = fractionAt(event.clientX);
        const width = ref.current?.clientWidth ?? 0;
        setHover({ x: fraction * width, time: fraction * duration });
      }}
      onMouseLeave={() => setHover(null)}
      {...handlers}
      className={cn("group/seek relative h-2.5 cursor-pointer touch-none py-1 outline-none", className)}
    >
      <div className="relative h-[3px] rounded-full bg-white/15 transition-[height] group-hover/seek:h-[5px] group-focus-visible/seek:h-[5px]">
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg opacity-0 shadow transition-opacity group-hover/seek:opacity-100 group-focus-visible/seek:opacity-100"
          style={{ left: `${percent}%` }}
        />
      </div>
      {hover && (
        <span
          className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-full border border-border bg-bg px-2 py-0.5 font-mono text-[11px] text-fg"
          style={{ left: hover.x }}
        >
          {formatTime(hover.time)}
        </span>
      )}
    </div>
  );
}

function VolumeControl() {
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const { ref, handlers } = useHorizontalDrag(setVolume);
  const level = muted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;

  return (
    <div className="ml-1 flex w-[120px] items-center gap-2">
      <button
        type="button"
        onClick={toggleMute}
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:text-fg"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        <Icon className="size-[18px]" />
      </button>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(level * 100)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") setVolume(Math.min(1, level + 0.05));
          else if (event.key === "ArrowLeft" || event.key === "ArrowDown") setVolume(Math.max(0, level - 0.05));
          else return;
          event.preventDefault();
        }}
        {...handlers}
        className="group/vol flex h-6 flex-1 cursor-pointer touch-none items-center outline-none"
      >
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/15 transition-[height] group-hover/vol:h-1.5">
          <div className="h-full rounded-full bg-fg" style={{ width: `${level * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
