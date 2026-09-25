import React from "react";
import { Heart, ListMusic, Mic2, MonitorSpeaker, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { PlayPauseButton } from "./play-pause-button";
import { Cover } from "@/components/cover";
import { MarqueeText } from "@/components/marquee-text";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { formatTime } from "@/lib/format";
import { Slider } from "@/components/ui/slider";

const Equalizer = React.memo(function Equalizer({ isPlaying }: { isPlaying: boolean }) {
  if (!isPlaying) return null;
  return (
    <div className="flex items-end gap-0.5 h-3">
      <div className="w-1 bg-accent rounded-t-sm animate-[equalizer_0.8s_ease-in-out_infinite]" />
      <div className="w-1 bg-accent rounded-t-sm animate-[equalizer_1.2s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }} />
      <div className="w-1 bg-accent rounded-t-sm animate-[equalizer_0.9s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }} />
    </div>
  );
});

export function PlayerBar({ desktopTop = false }: { desktopTop?: boolean }) {
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
      <div className="lg:hidden relative rounded-[24px] bg-black/40 backdrop-blur-3xl saturate-[200%] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Dynamic Artwork Background */}
        <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
          <img
            src={track.artwork}
            alt=""
            className="w-full h-full object-cover opacity-50 saturate-[150%] blur-3xl transform scale-150"
            aria-hidden="true"
          />
        </div>

        {/* Mobile slim track progress line - removed transition to make it smooth */}
        {!live && duration > 0 ? (
          <div className="h-0.5 w-full bg-surface absolute top-0 left-0">
            <div
              className="h-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
        
        <div className="flex h-[76px] items-center gap-4 px-4">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3.5 text-left active:scale-[0.98] transition-transform"
            onClick={() => setExpanded(true)}
          >
            <div className="relative size-[52px] shrink-0 rounded-[10px] overflow-hidden shadow-sm">
              <Cover
                src={track.artwork}
                alt={track.title}
                title={track.title}
                className="size-full"
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1 justify-center overflow-hidden">
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <MarqueeText text={track.title} className="text-[15px] font-semibold text-fg flex-1 min-w-0" />
                <Equalizer isPlaying={isPlaying} />
              </div>
              <span className="truncate text-[13px] text-white/70">
                {track.artist}
              </span>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-5 px-2">
            <PlayPauseButton
              isPlaying={isPlaying}
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="text-fg active:scale-90 transition-transform"
              iconClassName="size-7"
            />
            <button
              type="button"
              aria-label="Next"
              className="active:scale-90 transition-transform text-fg"
              onClick={next}
            >
              <SkipForward className="size-7 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Bottom/Top Bar - Apple Music Style */}
      <div className={cn("hidden lg:flex relative items-center justify-between overflow-hidden", desktopTop ? "h-[54px] w-full px-6 sonara-glass border-b border-white/5 bg-surface/80 backdrop-blur-3xl" : "h-[60px] w-[740px] max-w-[95%] mx-auto px-6 sonara-glass-strong rounded-full mb-[env(safe-area-inset-bottom,0px)]")}>
        
        {/* Dynamic Artwork Background (Only for the floating pill version if not desktopTop) */}
        {!desktopTop && (
          <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none rounded-full">
            <img
              src={track.artwork}
              alt=""
              className="w-full h-full object-cover opacity-20 saturate-200 blur-3xl transform scale-150"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Left: Playback Controls */}
        <div className="flex items-center gap-6 w-[240px]">
          <button
            className={cn("text-muted hover:text-fg transition-colors", shuffle && "text-accent")}
            onClick={toggleShuffle}
          >
            <Shuffle className="size-[16px]" strokeWidth={2} />
          </button>
          <button className="text-fg hover:text-accent transition-colors" onClick={prev}>
            <SkipBack className="size-[22px] fill-current" />
          </button>
          <PlayPauseButton
            isPlaying={isPlaying}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            className="text-fg hover:scale-105"
            iconClassName="size-[28px]"
          />
          <button className="text-fg hover:text-accent transition-colors" onClick={next}>
            <SkipForward className="size-[22px] fill-current" />
          </button>
          <button
            className={cn("text-muted hover:text-fg transition-colors", repeat !== "off" && "text-accent")}
            onClick={cycleRepeat}
          >
            {repeat === "one" ? <Repeat1 className="size-[16px]" strokeWidth={2} /> : <Repeat className="size-[16px]" strokeWidth={2} />}
          </button>
        </div>

        {/* Center: LCD Screen (Apple Music Web Style) */}
        <div 
          className={cn("flex-1 h-[40px] flex items-center px-2 relative group overflow-hidden cursor-pointer mx-4 max-w-[500px]", desktopTop ? "bg-black/10 dark:bg-white-[0.02] border border-black/5 dark:border-white/5 rounded-md shadow-inner" : "bg-black/20 dark:bg-white/5 rounded-md border border-white/5 shadow-inner")}
          onClick={() => setExpanded(true)}
        >
          <div className={cn("shrink-0 mr-3 pointer-events-none transition-transform duration-500", isPlaying && "scale-105")}>
            <Cover src={track.artwork} alt={track.title} className="size-[28px] rounded-[4px] shadow-sm border border-white/10" />
          </div>
          
          <div className="flex flex-col min-w-0 flex-1 justify-center z-10 pointer-events-none overflow-hidden pb-0.5">
            <div className="flex items-center justify-between w-full">
              <MarqueeText text={track.title} className="font-semibold text-fg text-[12px] leading-tight truncate mr-2" />
              {!live && (
                <span className="text-[10px] text-muted font-medium font-mono tabular-nums tracking-tighter shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[11px] text-muted leading-none">
                {track.artist}
              </span>
              <Equalizer isPlaying={isPlaying} />
            </div>
          </div>

          {live && (
            <span className="text-[9px] font-bold tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded mr-2 z-10 pointer-events-none">
              LIVE
            </span>
          )}

          {/* Scrubber Line (Apple Music Style at the very top of LCD) */}
          {!live && duration > 0 && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-black/10 dark:bg-white/10 group-hover:h-[4px] transition-all">
              <div 
                className="h-full bg-fg shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Right: Actions & Volume */}
        <div className="flex items-center justify-end gap-5 w-[240px]">
          <button 
            className={cn("transition-colors", desktopTop ? "text-muted hover:text-fg" : "text-muted hover:text-fg")}
            onClick={() => {
              setExpanded(true);
              setTimeout(() => setLyricsOpen(true), 50);
            }}
          >
            <Mic2 className="size-[18px]" strokeWidth={2.5} />
          </button>
          <button 
            className={cn("transition-colors", desktopTop ? "text-muted hover:text-fg" : "text-muted hover:text-fg")}
            onClick={() => {
              setExpanded(true);
              setTimeout(() => setLyricsOpen(false), 50);
            }}
          >
            <ListMusic className="size-[18px]" strokeWidth={2.5} />
          </button>
          
          <div className="flex items-center gap-2 group w-24">
            <MonitorSpeaker className="size-[18px] text-muted group-hover:text-fg transition-colors shrink-0" strokeWidth={2.5} />
            <div className="flex-1 h-1 bg-black/10 dark:bg-white/10 rounded-full relative overflow-hidden group-hover:h-1.5 transition-all">
              <div className="absolute left-0 top-0 bottom-0 bg-fg w-2/3 rounded-full" />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
