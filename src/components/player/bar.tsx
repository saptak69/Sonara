import React from "react";
import { Heart, ListMusic, Mic2, MonitorSpeaker, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, RadioTower, Play, Pause } from "lucide-react";
import { Cover } from "@/components/cover";
import { MarqueeText } from "@/components/marquee-text";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { formatTime } from "@/lib/format";

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
  const lastfmUsername = usePlayer((s) => s.lastfmUsername);

  const live = track?.kind === "radio";
  const progress =
    live || !duration || !Number.isFinite(duration) ? 0 : (currentTime / duration) * 100;
  
  const liked = Boolean(track && likedIds.includes(track.id));

  if (!track) {
    return null;
  }

  return (
    <>
      {/* Mobile Bar (Unchanged) */}
      {/* Mobile Player Pill (Apple Music iOS Style) */}
      <div className="w-full lg:hidden relative rounded-[32px] bg-background/80 dark:bg-black/60 backdrop-blur-3xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Dynamic Artwork Background */}
        <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
          <img
            src={track.artwork}
            alt=""
            className="w-full h-full object-cover opacity-[0.25] saturate-[200%] blur-3xl transform scale-150"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="flex h-[56px] items-center gap-3 px-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.98] transition-transform"
            onClick={() => setExpanded(true)}
          >
            <div className="relative size-[40px] shrink-0 rounded-[8px] overflow-hidden shadow-sm">
              <Cover
                src={track.artwork}
                alt={track.title}
                title={track.title}
                className="size-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1 justify-center overflow-hidden">
              <div className="flex items-center gap-2 overflow-hidden w-full">
                {lastfmUsername && isPlaying && (
                  <span className="shrink-0 text-[#fa243c] animate-pulse">
                    <RadioTower className="size-[10px]" />
                  </span>
                )}
                <MarqueeText text={track.title} className="text-[14px] font-semibold text-fg tracking-tight flex-1 min-w-0 leading-tight" />
              </div>
              <span className="truncate text-[12px] text-fg/70 leading-tight mt-[1px] tracking-tight">
                {track.artist}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-3 shrink-0 pr-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="text-fg active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="size-6 fill-current" />
              ) : (
                <Play className="size-6 fill-current ml-[1px]" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="text-fg active:scale-95 transition-transform"
            >
              <SkipForward className="size-6 fill-current" />
            </button>
          </div>
        </div>
        
        {/* Scrubber Background (Spans very bottom edge of pill) */}
        {!live && duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-10 pointer-events-none">
            <div 
              className="h-full bg-fg shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Desktop Bar - Apple Music Floating Pill Style */}
      <div className="hidden lg:flex fixed bottom-8 left-1/2 -translate-x-1/2 h-[72px] bg-background/80 dark:bg-black/60 backdrop-blur-3xl border border-border/50 items-center justify-between px-6 z-50 rounded-full shadow-2xl min-w-[800px] overflow-hidden group">
        
        {/* Scrubber Background (Spans top edge of pill) */}
        {!live && duration > 0 && (
          <div 
            className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 group-hover:h-[4px] transition-all cursor-pointer z-10"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              seekTo(pos * duration);
            }}
          >
            <div 
              className="h-full bg-fg shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all ease-linear relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 size-2 bg-fg rounded-full opacity-0 group-hover:opacity-100 transform translate-x-1/2" />
            </div>
          </div>
        )}

        {/* Dynamic Background Blur inside Pill */}
        <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none rounded-full">
          <img
            src={track.artwork}
            alt=""
            className="w-full h-full object-cover opacity-20 saturate-200 blur-3xl transform scale-[2]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Left: Track Info */}
        <div className="flex items-center gap-3 w-[260px] min-w-0" onClick={() => setExpanded(true)}>
          <div className="h-[48px] aspect-square rounded-[8px] overflow-hidden shadow-sm shrink-0">
            <Cover
              src={track.artwork}
              alt={track.title}
              className="size-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0 cursor-pointer">
            <div className="flex items-center gap-1.5 overflow-hidden w-full">
              {live && (
                <span className="text-[8px] font-bold tracking-wider text-red-500 border border-red-500/50 px-1 py-0.5 rounded-sm shrink-0">
                  LIVE
                </span>
              )}
              {lastfmUsername && isPlaying && (
                <span className="shrink-0 text-[#d51007] animate-pulse">
                  <RadioTower className="size-3" />
                </span>
              )}
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <MarqueeText text={track.title} className="font-semibold text-fg text-[14px] leading-tight flex-1 min-w-0" />
                <Equalizer isPlaying={isPlaying} />
              </div>
            </div>
            <span className="truncate text-muted text-[12px] leading-tight mt-0.5">
              {track.artist}
            </span>
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="flex items-center gap-6">
            <button
              className={cn("text-muted hover:text-fg transition-colors active:scale-95", shuffle && "text-accent hover:text-accent/80")}
              onClick={toggleShuffle}
            >
              <Shuffle className="size-4" strokeWidth={2.5} />
            </button>
            <button className="text-fg hover:opacity-80 transition-opacity active:scale-95" onClick={prev}>
              <SkipBack className="size-6 fill-current" />
            </button>
            <button
              onClick={toggle}
              className="text-fg hover:scale-105 transition-transform active:scale-95 flex items-center justify-center bg-fg/10 size-11 rounded-full backdrop-blur-md border border-white/5"
            >
              {isPlaying ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 fill-current ml-0.5" />
              )}
            </button>
            <button className="text-fg hover:opacity-80 transition-opacity active:scale-95" onClick={next}>
              <SkipForward className="size-6 fill-current" />
            </button>
            <button
              className={cn("text-muted hover:text-fg transition-colors active:scale-95", repeat !== "off" && "text-accent hover:text-accent/80")}
              onClick={cycleRepeat}
            >
              {repeat === "one" ? <Repeat1 className="size-4" strokeWidth={2.5} /> : <Repeat className="size-4" strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-5 w-[260px] min-w-0">
          {!live && duration > 0 && (
            <span className="text-[11px] font-medium text-muted font-mono tracking-tighter mr-2">
              -{formatTime(duration - currentTime)}
            </span>
          )}
          <button 
            className="text-muted hover:text-fg transition-colors active:scale-95"
            onClick={() => {
              setExpanded(true);
              setTimeout(() => setLyricsOpen(true), 50);
            }}
          >
            <Mic2 className="size-[18px]" strokeWidth={2} />
          </button>
          <button 
            className="text-muted hover:text-fg transition-colors active:scale-95"
            onClick={() => {
              setExpanded(true);
              setTimeout(() => setLyricsOpen(false), 50);
            }}
          >
            <ListMusic className="size-[18px]" strokeWidth={2} />
          </button>
          
          <div className="flex items-center gap-2 group/vol w-[100px]">
            <MonitorSpeaker className="size-[18px] text-muted group-hover/vol:text-fg transition-colors shrink-0" strokeWidth={2} />
            <div className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden group-hover/vol:h-2 transition-all cursor-pointer">
              <div className="absolute left-0 top-0 bottom-0 bg-fg w-[80%] rounded-full" />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
