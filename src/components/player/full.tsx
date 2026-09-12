import { useEffect, useState } from "react";
import {
  ChevronDown,
  Heart,
  ListMusic,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Cover } from "@/components/cover";
import { LyricsPanel } from "@/components/player/lyrics";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/format";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function FullPlayer() {
  const track = usePlayer((s) => s.queue[s.index]);
  const expanded = usePlayer((s) => s.expanded);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const currentTime = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const likedIds = usePlayer((s) => s.likedIds);
  const liked = Boolean(track && likedIds.includes(track.id));
  const lyricsOpen = usePlayer((s) => s.lyricsOpen);
  
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seekTo = usePlayer((s) => s.seekTo);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const toggleLike = usePlayer((s) => s.toggleLike);
  const setExpanded = usePlayer((s) => s.setExpanded);
  const setQueueOpen = usePlayer((s) => s.setQueueOpen);
  const setLyricsOpen = usePlayer((s) => s.setLyricsOpen);

  const live = track?.kind === "radio";

  return (
    <div
      data-open={expanded}
      className={cn(
        "full-player fixed inset-0 z-50 flex flex-col bg-bg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "md:left-[var(--spacing-sidebar)] md:top-20 md:bottom-[6rem] md:z-20 md:bg-bg/95 md:backdrop-blur-3xl md:border-t md:border-border/50",
        "data-[open=false]:translate-y-full md:data-[open=false]:translate-y-8 md:data-[open=false]:opacity-0 md:data-[open=false]:pointer-events-none"
      )}
      aria-hidden={!expanded}
    >
      {track ? (
        <>
          <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
            {track.artworkLg || track.artwork ? (
              <img
                src={track.artworkLg || track.artwork || ""}
                alt=""
                className="h-full w-full scale-[1.5] object-cover opacity-30 blur-[100px]"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : null}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/80 to-bg" />
          </div>

          {/* Header - Floating over content */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4 pt-[max(env(safe-area-inset-top),16px)] md:px-8 md:py-6 pointer-events-none">
            <button
              aria-label="Close player"
              onClick={() => setExpanded(false)}
              className="pointer-events-auto p-2 bg-black/20 backdrop-blur-xl rounded-full text-white/90 hover:text-white hover:bg-black/40 transition-colors shadow-lg border border-white/10"
            >
              <ChevronDown className="size-7" strokeWidth={1.5} />
            </button>
            
            <p className="pointer-events-auto text-[10px] font-semibold tracking-widest text-white/90 uppercase md:hidden bg-black/20 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-lg truncate max-w-[50%]">
              {track.album || "Now Playing"}
            </p>

            <div className="pointer-events-auto flex items-center gap-1 bg-black/20 backdrop-blur-xl rounded-full p-1 shadow-lg border border-white/10">
              <button
                className={cn("hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors text-white/90 hover:text-white", lyricsOpen && "bg-accent/80 text-white")}
                onClick={() => setLyricsOpen(!lyricsOpen)}
              >
                <Mic2 className="size-4" /> Lyrics
              </button>
              <button
                aria-label="Options"
                className="p-1.5 rounded-full text-white/90 hover:text-white transition-colors md:hidden"
                onClick={() => setQueueOpen(true)}
              >
                <ListMusic className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Main Layout Area */}
          <div className={cn(
            "relative flex-1 flex flex-col md:flex-row px-6 md:px-12 pt-[calc(env(safe-area-inset-top)+80px)] pb-[max(env(safe-area-inset-bottom),32px)] md:pb-12 overflow-y-auto md:overflow-hidden [scrollbar-width:none] w-full max-w-7xl mx-auto gap-8 md:gap-16 items-center",
            lyricsOpen ? "md:justify-between" : "md:justify-center"
          )}>
            
            {/* Left Side: Artwork & Info */}
            <div className={cn(
              "flex flex-col w-full transition-all duration-500",
              lyricsOpen ? "md:w-1/2 md:max-w-md" : "md:w-[600px]"
            )}>
              {/* Artwork */}
              <div className="w-[70%] md:w-full aspect-square mt-auto md:mt-0 mb-6 md:mb-10 max-h-[65vh] md:max-w-[50vh] md:max-h-[50vh] mx-auto rounded-2xl shadow-2xl overflow-hidden relative transition-all duration-500 flex-shrink-0">
                <Cover
                  src={track.artworkLg || track.artwork}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info & Like */}
              <div className="flex items-center justify-between gap-4 mb-6 md:mb-0">
                <div className="min-w-0 flex-1">
                  <h1 className={cn("font-bold text-white truncate mb-1 transition-all", lyricsOpen ? "text-2xl md:text-3xl" : "text-2xl md:text-4xl")}>
                    {track.title}
                  </h1>
                  <p className={cn("text-white/60 truncate transition-all", lyricsOpen ? "text-lg md:text-xl" : "text-lg md:text-2xl")}>
                    {track.artist}
                  </p>
                </div>
                <button
                  aria-label={liked ? "Unlike" : "Like"}
                  className="p-2 -mr-2 text-white/80 hover:text-white transition-transform active:scale-90"
                  onClick={() => toggleLike(track)}
                >
                  <Heart className={cn("size-7 md:size-9", liked && "fill-accent text-accent")} strokeWidth={1.5} />
                </button>
              </div>

              {/* Mobile-Only Controls */}
              <div className="md:hidden w-full">
                {/* Scrubber */}
                <div className="w-full mb-8 mt-6">
                  <Slider
                    value={[live ? 0 : currentTime]}
                    min={0}
                    max={live || !duration || !Number.isFinite(duration) ? 100 : duration}
                    step={0.1}
                    disabled={live || !duration}
                    onValueChange={([val]) => seekTo(val)}
                    className="w-full"
                  />
                  <div className="mt-2 flex justify-between text-xs text-white/50 font-medium">
                    <span>{live ? "LIVE" : formatTime(currentTime)}</span>
                    <span>{live ? "∞" : formatTime(Number.isFinite(duration) ? duration : 0)}</span>
                  </div>
                </div>

                {/* Main Buttons */}
                <div className="flex items-center justify-between w-full max-w-[320px] mx-auto mb-8">
                  <button
                    className={cn("text-white/60 hover:text-white transition-colors", shuffle && "text-accent")}
                    onClick={toggleShuffle}
                  >
                    <Shuffle className="size-6" strokeWidth={1.5} />
                  </button>
                  <button className="text-white hover:text-white/80 transition-colors" onClick={prev}>
                    <SkipBack className="size-10 fill-current" />
                  </button>
                  <button
                    className="size-20 rounded-full bg-white text-black grid place-items-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
                    onClick={toggle}
                  >
                    {isPlaying ? <Pause className="size-8 fill-current" /> : <Play className="size-8 fill-current ml-1" />}
                  </button>
                  <button className="text-white hover:text-white/80 transition-colors" onClick={next}>
                    <SkipForward className="size-10 fill-current" />
                  </button>
                  <button
                    className={cn("text-white/60 hover:text-white transition-colors", repeat !== "off" && "text-accent")}
                    onClick={cycleRepeat}
                  >
                    {repeat === "one" ? <Repeat1 className="size-6" strokeWidth={1.5} /> : <Repeat className="size-6" strokeWidth={1.5} />}
                  </button>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-white/10">
                  <button className="text-white/60 hover:text-white p-2 transition-colors" onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: track.title, text: `Listen to ${track.title} by ${track.artist} on Sonara`, url: window.location.href });
                    }
                  }}>
                    <Share2 className="size-5" />
                  </button>
                  <button 
                    className={cn("flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors", lyricsOpen && "bg-accent/20 text-accent hover:bg-accent/30")}
                    onClick={() => setLyricsOpen(!lyricsOpen)}
                  >
                    <Mic2 className="size-4" /> Lyrics
                  </button>
                  <button className="text-white/60 hover:text-white p-2 transition-colors" onClick={() => setQueueOpen(true)}>
                    <ListMusic className="size-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Lyrics (Desktop) / Bottom Lyrics (Mobile) */}
            <div className={cn(
              "w-full transition-all duration-500",
              lyricsOpen ? "block md:w-1/2 md:h-full md:flex md:flex-col" : "hidden"
            )}>
              <LyricsPanel />
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
}
