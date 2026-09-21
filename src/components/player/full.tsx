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
  MoreHorizontal
} from "lucide-react";
import { Cover } from "@/components/cover";
import { LyricsPanel } from "@/components/player/lyrics";
import { QueueList } from "@/components/player/queue";
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
  const queueOpen = usePlayer((s) => s.queueOpen);
  const panelOpen = lyricsOpen || queueOpen;
  
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
        "full-player fixed inset-0 z-50 flex flex-col bg-bg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "data-[open=false]:translate-y-full"
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

            <div className="pointer-events-auto flex md:hidden items-center gap-1 bg-black/20 backdrop-blur-xl rounded-full p-1 shadow-lg border border-white/10">
              <button
                aria-label="Options"
                className="p-1.5 rounded-full text-white/90 hover:text-white transition-colors"
                onClick={() => setQueueOpen(true)}
              >
                <ListMusic className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Main Layout Area */}
          <div className={cn(
            "relative flex-1 flex flex-col md:flex-row px-6 md:px-12 pt-[calc(env(safe-area-inset-top)+80px)] pb-[max(env(safe-area-inset-bottom),32px)] md:pt-12 md:pb-8 overflow-y-auto md:overflow-hidden [scrollbar-width:none] w-full max-w-7xl mx-auto gap-8 md:gap-12 items-center md:items-stretch md:justify-between",
            panelOpen ? "justify-start" : "justify-center"
          )}>
            
            {/* Left Side: Artwork & Info */}
            <div className={cn(
              "flex flex-col w-full transition-all duration-500 md:justify-center min-h-min md:py-4 md:w-1/2 md:max-w-[420px]"
            )}>
              {/* Artwork */}
              <div className="w-[70%] md:w-full aspect-square mt-auto md:mt-0 mb-6 md:mb-8 max-h-[65vh] md:max-w-[360px] md:max-h-[360px] mx-auto rounded-2xl shadow-2xl overflow-hidden relative transition-all duration-500 flex-shrink-0">
                <Cover
                  src={track.artworkLg || track.artwork}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info & Like */}
              <div className="flex items-center justify-between gap-4 mb-6 md:mb-0">
                <div className="min-w-0 flex-1">
                  <h1 className="font-bold text-white truncate mb-1 transition-all text-2xl md:text-3xl">
                    {track.title}
                  </h1>
                  <p className="text-white/60 truncate transition-all text-lg md:text-xl">
                    {track.artist}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    aria-label={liked ? "Unlike" : "Like"}
                    className="p-2.5 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95"
                    onClick={() => toggleLike(track)}
                  >
                    <Heart className={cn("size-5", liked && "fill-white text-white")} strokeWidth={1.5} />
                  </button>
                  <button className="p-2.5 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95 hidden md:block">
                    <MoreHorizontal className="size-5" />
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="w-full">
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
                <div className="flex items-center justify-between w-full max-w-[280px] md:max-w-[300px] mx-auto mb-8">
                  <button
                    className={cn("text-white/60 hover:text-white transition-colors", shuffle && "text-accent")}
                    onClick={toggleShuffle}
                  >
                    <Shuffle className="size-5 md:size-6" strokeWidth={1.5} />
                  </button>
                  <button className="text-white hover:text-white/80 transition-colors" onClick={prev}>
                    <SkipBack className="size-8 fill-current" />
                  </button>
                  <button
                    className="size-16 rounded-full bg-white text-black grid place-items-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
                    onClick={toggle}
                  >
                    {isPlaying ? <Pause className="size-6 fill-current" /> : <Play className="size-6 fill-current ml-1" />}
                  </button>
                  <button className="text-white hover:text-white/80 transition-colors" onClick={next}>
                    <SkipForward className="size-8 fill-current" />
                  </button>
                  <button
                    className={cn("text-white/60 hover:text-white transition-colors", repeat !== "off" && "text-accent")}
                    onClick={cycleRepeat}
                  >
                    {repeat === "one" ? <Repeat1 className="size-5 md:size-6" strokeWidth={1.5} /> : <Repeat className="size-5 md:size-6" strokeWidth={1.5} />}
                  </button>
                </div>

                {/* Action Row - Mobile Only */}
                <div className="flex md:hidden items-center justify-between w-full mt-auto pt-4 border-t border-white/10">
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

            {/* Right Side: Lyrics or Queue */}
            <div className={cn(
              "w-full transition-all duration-500 relative",
              "hidden md:block md:w-1/2 md:h-full md:flex md:flex-col" // Always visible on desktop
            )}>
              {/* Desktop Tabs */}
              <div className="hidden md:flex items-center justify-center mb-6 mt-4">
                <div className="flex bg-white/10 p-1 rounded-full text-sm font-medium shadow-inner">
                  <button
                    className={cn("px-8 py-1.5 rounded-full transition-colors", !lyricsOpen ? "bg-white text-black shadow-md" : "text-white/60 hover:text-white")}
                    onClick={() => { setQueueOpen(true); setLyricsOpen(false); }}
                  >
                    Queue
                  </button>
                  <button
                    className={cn("px-8 py-1.5 rounded-full transition-colors", lyricsOpen ? "bg-white text-black shadow-md" : "text-white/60 hover:text-white")}
                    onClick={() => { setLyricsOpen(true); setQueueOpen(false); }}
                  >
                    Lyrics
                  </button>
                </div>
              </div>

              {lyricsOpen ? <LyricsPanel /> : <QueueList className="hidden md:block !pt-0" />}
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
}
