import { useEffect, useState } from "react";
import {
  ChevronDown,
  Heart,
  ListMusic,
  Mic2,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  MoreHorizontal
} from "lucide-react";
import { PlayPauseButton } from "./play-pause-button";
import { Cover } from "@/components/cover";
import { MarqueeText } from "@/components/marquee-text";
import { LyricsPanel } from "@/components/player/lyrics";
import { QueueList } from "@/components/player/queue";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/format";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
                className={cn(
                  "h-full w-full scale-[1.5] object-cover opacity-30 blur-[100px] transition-transform duration-[20s] ease-in-out",
                  isPlaying && "scale-[1.8] rotate-3"
                )}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : null}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Immersive Waveform Visualizer */}
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 h-1/3 mix-blend-screen opacity-40 flex items-end justify-between px-8 lg:px-32 gap-1 lg:gap-2">
                 {Array.from({length: 40}).map((_, i) => (
                    <div 
                       key={i} 
                       className={cn("flex-1 bg-accent/50 rounded-t-full origin-bottom", i >= 16 ? "hidden lg:block" : "block")}
                       style={{ 
                          animation: `equalizer ${0.8 + (i % 3) * 0.3}s ease-in-out infinite alternate`,
                          animationDelay: `${(i % 5) * 0.2}s`,
                          maxHeight: `${30 + (i % 7) * 10}%`
                       }}
                    />
                 ))}
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/80 to-bg" />
          </div>

          {/* Header - Floating over content */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4 pt-[max(env(safe-area-inset-top),16px)] lg:px-8 lg:py-6 pointer-events-none">
            <button
              aria-label="Close player"
              onClick={() => setExpanded(false)}
              className="pointer-events-auto p-2 sonara-glass-strong rounded-full text-white/90 hover:text-white hover:brightness-110 transition-all"
            >
              <ChevronDown className="size-7" strokeWidth={1.5} />
            </button>
            
            <p className="pointer-events-auto text-[10px] font-semibold tracking-widest text-white/90 uppercase lg:hidden sonara-glass px-4 py-1.5 rounded-full truncate max-w-[50%]">
              {track.album || "Now Playing"}
            </p>

            <div className="pointer-events-auto flex lg:hidden items-center gap-1 sonara-glass rounded-full p-1">
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
            "relative flex-1 flex flex-col lg:flex-row px-6 lg:px-12 pt-[calc(env(safe-area-inset-top)+80px)] pb-[max(env(safe-area-inset-bottom),32px)] lg:pt-8 lg:pb-6 overflow-y-auto [scrollbar-width:none] w-full max-w-7xl mx-auto gap-8 lg:gap-12 items-center lg:items-stretch lg:justify-between",
            panelOpen ? "justify-start" : "justify-center"
          )}>
            
            {/* Left Side: Artwork & Info */}
            <div className={cn(
              "flex flex-col w-full transition-all duration-500 lg:justify-center min-h-min lg:py-2 lg:w-1/2 lg:max-w-[420px]"
            )}>
              {/* Artwork */}
              <div className="w-[min(76vw,320px)] lg:w-full aspect-square mt-auto lg:mt-0 mb-6 lg:mb-6 max-h-[42vh] lg:max-w-[340px] lg:max-h-[min(340px,40vh)] mx-auto rounded-2xl shadow-2xl overflow-hidden relative transition-all duration-500 flex-shrink-0">
                <Cover
                  src={track.artworkLg || track.artwork}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info & Controls Panel */}
              <div className="w-full sonara-glass-strong rounded-t-3xl lg:rounded-3xl border-t lg:border border-white/10 p-6 max-lg:-mx-6 max-lg:px-6 max-lg:w-[100vw] mt-auto lg:mt-0 flex-shrink-0">
                {/* Info & Like */}
                <div className="flex items-center justify-between gap-4 mb-4 lg:mb-6">
                    <div className="min-w-0 flex-1">
                    <MarqueeText text={track.title} className="font-bold text-white mb-1 transition-all text-2xl lg:text-3xl" />
                    <MarqueeText text={track.artist} className="text-white/60 transition-all text-lg lg:text-xl" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    aria-label={liked ? "Unlike" : "Like"}
                    className="p-2.5 rounded-full sonara-glass-light text-white/80 hover:text-white hover:brightness-110 transition-all active:scale-95"
                    onClick={() => toggleLike(track)}
                  >
                    <Heart className={cn("size-5", liked && "fill-accent text-accent")} strokeWidth={1.5} />
                  </button>
                  <button className="p-2.5 rounded-full sonara-glass-light text-white/80 hover:text-white hover:brightness-110 transition-all active:scale-95 hidden lg:block">
                    <MoreHorizontal className="size-5" />
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="w-full">
                {/* Scrubber */}
                <div className="w-full mb-6 mt-4">
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
                <div className="flex items-center justify-between w-full max-w-[280px] lg:max-w-[300px] mx-auto mb-6">
                  <button
                    className={cn("text-white/60 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", shuffle && "text-accent")}
                    onClick={toggleShuffle}
                  >
                    <Shuffle className="size-5 lg:size-6" strokeWidth={1.5} />
                  </button>
                  <button className="text-white hover:text-white/80 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={prev}>
                    <SkipBack className="size-8 fill-current" />
                  </button>
                  <PlayPauseButton
                    isPlaying={isPlaying}
                    onClick={toggle}
                    className="size-16 rounded-full bg-white text-black hover:scale-105 shadow-lg flex items-center justify-center"
                    iconClassName="size-7"
                  />
                  <button className="text-white hover:text-white/80 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={next}>
                    <SkipForward className="size-8 fill-current" />
                  </button>
                  <button
                    className={cn("text-white/60 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", repeat !== "off" && "text-accent")}
                    onClick={cycleRepeat}
                  >
                    {repeat === "one" ? <Repeat1 className="size-5 lg:size-6" strokeWidth={1.5} /> : <Repeat className="size-5 lg:size-6" strokeWidth={1.5} />}
                  </button>
                </div>

                {/* Action Row - Mobile Only */}
                <div className="flex lg:hidden items-center justify-between w-full mt-auto pt-4 border-t border-white/10">
                  <button className="text-white/60 hover:text-white p-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: track.title, text: `Listen to ${track.title} by ${track.artist} on Sonara`, url: window.location.href });
                    }
                  }}>
                    <Share2 className="size-5" />
                  </button>
                  <button 
                    className={cn("flex items-center gap-2 px-4 py-1.5 rounded-full sonara-glass-light hover:brightness-110 text-sm font-medium transition-colors min-h-[44px]", lyricsOpen && "bg-accent/20 text-accent hover:bg-accent/30")}
                    onClick={() => setLyricsOpen(!lyricsOpen)}
                  >
                    <Mic2 className="size-4" /> Lyrics
                  </button>
                  <button className="text-white/60 hover:text-white p-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => setQueueOpen(true)}>
                    <ListMusic className="size-5" />
                  </button>
                </div>
              </div>
              </div>
            </div>

            {/* Right Side: Lyrics or Queue */}
            <div className={cn(
              "w-full transition-all duration-500 relative",
              "hidden lg:block lg:w-1/2 lg:h-full lg:flex lg:flex-col" // Always visible on desktop
            )}>
              {/* Desktop Tabs */}
              <div className="hidden lg:flex items-center justify-center mb-6 mt-4">
                <div className="flex sonara-glass-light p-1 rounded-full text-sm font-medium">
                  <button
                    className="group relative isolate px-8 py-1.5 rounded-full transition-colors text-white/60 hover:text-white"
                    onClick={() => { setQueueOpen(true); setLyricsOpen(false); }}
                  >
                    {!lyricsOpen && (
                      <motion.div
                        layoutId="player-tab-glow"
                        className="absolute inset-0 z-[-1] rounded-full bg-white/15 border border-white/10 shadow-md"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className={cn("relative z-10 transition-colors", !lyricsOpen ? "text-white font-semibold" : "text-white/60")}>Queue</span>
                  </button>
                  <button
                    className="group relative isolate px-8 py-1.5 rounded-full transition-colors text-white/60 hover:text-white"
                    onClick={() => { setLyricsOpen(true); setQueueOpen(false); }}
                  >
                    {lyricsOpen && (
                      <motion.div
                        layoutId="player-tab-glow"
                        className="absolute inset-0 z-[-1] rounded-full bg-white/15 border border-white/10 shadow-md"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className={cn("relative z-10 transition-colors", lyricsOpen ? "text-white font-semibold" : "text-white/60")}>Lyrics</span>
                  </button>
                </div>
              </div>

              {lyricsOpen ? <LyricsPanel /> : <QueueList className="hidden lg:block !pt-0" />}
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
}
