import React from "react";
import { Heart, ListMusic, Mic2, MonitorSpeaker, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { PlayPauseButton } from "./play-pause-button";
import { Cover } from "@/components/cover";
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
      <div className="lg:hidden mx-2 relative sonara-glass-strong rounded-[1.5rem] overflow-hidden mb-[env(safe-area-inset-bottom,0px)]">
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
            <div className={cn("relative size-10 shrink-0", isPlaying && "animate-[spin_8s_linear_infinite]")}>
              <Cover
                src={track.artwork}
                alt={track.title}
                title={track.title}
                className="size-full rounded-full shadow-sm"
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1 justify-center">
              <span className="truncate text-sm font-medium text-fg flex items-center gap-2">
                {track.title}
                <Equalizer isPlaying={isPlaying} />
              </span>
              <span className="truncate text-xs text-muted">
                {track.artist}
              </span>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-4 px-2">
            <PlayPauseButton
              isPlaying={isPlaying}
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="text-fg"
              iconClassName="size-6"
            />
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

      {/* Desktop Bottom Bar - Apple Music Style */}
      <div className="hidden lg:flex h-[60px] w-[740px] max-w-[95%] mx-auto items-center justify-between px-6 sonara-glass-strong rounded-full mb-[env(safe-area-inset-bottom,0px)]">
        
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-5 w-[200px]">
          <button
            className={cn("text-muted hover:text-fg transition-colors", shuffle && "text-accent")}
            onClick={toggleShuffle}
          >
            <Shuffle className="size-[15px]" strokeWidth={2} />
          </button>
          <button className="text-fg hover:text-accent transition-colors" onClick={prev}>
            <SkipBack className="size-5 fill-current" />
          </button>
          <PlayPauseButton
            isPlaying={isPlaying}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            className="text-fg hover:scale-105"
            iconClassName="size-6"
          />
          <button className="text-fg hover:text-accent transition-colors" onClick={next}>
            <SkipForward className="size-5 fill-current" />
          </button>
          <button
            className={cn("text-muted hover:text-fg transition-colors", repeat !== "off" && "text-accent")}
            onClick={cycleRepeat}
          >
            {repeat === "one" ? <Repeat1 className="size-[15px]" strokeWidth={2} /> : <Repeat className="size-[15px]" strokeWidth={2} />}
          </button>
        </div>

        {/* Center: LCD Screen */}
        <div 
          className="flex-1 h-[40px] bg-black/20 dark:bg-white/5 rounded-md flex items-center px-1.5 relative group overflow-hidden border border-white/5 shadow-inner cursor-pointer mx-2"
          onClick={() => setExpanded(true)}
        >
          <div className={cn("shrink-0 mr-3 pointer-events-none transition-transform duration-500", isPlaying && "scale-105")}>
            <Cover src={track.artwork} alt={track.title} className="size-[28px] rounded-[4px] shadow-md" />
          </div>
          
          <div className="flex flex-col min-w-0 flex-1 justify-center z-10 pointer-events-none">
            <span className="flex items-center gap-2 font-semibold text-fg text-[12px] leading-tight">
              <span className="truncate">{track.title}</span>
              <Equalizer isPlaying={isPlaying} />
            </span>
            <span className="truncate text-[10px] text-muted leading-tight mt-0.5">
              {track.artist}
            </span>
          </div>

          {live && (
            <span className="text-[9px] font-bold tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded mr-2 z-10 pointer-events-none">
              LIVE
            </span>
          )}

          {/* Scrubber Line (Bottom Edge) */}
          {!live && duration > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 group-hover:h-[4px] transition-all">
              <div 
                className="h-full bg-fg rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-5 w-[200px]">
          <button 
            className="text-muted hover:text-fg transition-colors"
            onClick={() => {
              setExpanded(true);
              setTimeout(() => setLyricsOpen(true), 50);
            }}
          >
            <Mic2 className="size-[17px]" strokeWidth={2} />
          </button>
          <button 
            className="text-muted hover:text-fg transition-colors"
            onClick={() => {
              setExpanded(true);
              setTimeout(() => setLyricsOpen(false), 50);
            }}
          >
            <ListMusic className="size-[17px]" strokeWidth={2} />
          </button>
          <button className="text-muted hover:text-fg transition-colors">
            <Volume2 className="size-[17px]" strokeWidth={2} />
          </button>
        </div>

      </div>
    </>
  );
}
