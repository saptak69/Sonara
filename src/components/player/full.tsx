import { useEffect, useState, useRef, useCallback } from "react";
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

/* ────────────────────────────────────────────────
   Extract dominant color from artwork using canvas
   Cached per-URL for performance
   ──────────────────────────────────────────────── */
const colorCache = new Map<string, string>();

function extractDominantColor(url: string): Promise<string> {
  if (colorCache.has(url)) return Promise.resolve(colorCache.get(url)!);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve("rgba(20,9,8,0.9)"); return; }
        ctx.drawImage(img, 0, 0, 8, 8);
        const data = ctx.getImageData(0, 0, 8, 8).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i+1]; b += data[i+2]; count++;
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        const color = `rgb(${r},${g},${b})`;
        colorCache.set(url, color);
        resolve(color);
      } catch {
        resolve("rgba(20,9,8,0.9)");
      }
    };
    img.onerror = () => resolve("rgba(20,9,8,0.9)");
    img.src = url;
  });
}

function useArtworkColor(artworkUrl?: string) {
  const [color, setColor] = useState("rgba(20,9,8,0.9)");
  useEffect(() => {
    if (!artworkUrl) return;
    extractDominantColor(artworkUrl).then(setColor);
  }, [artworkUrl]);
  return color;
}

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
  const dominantColor = useArtworkColor(track?.artworkLg || track?.artwork);

  return (
    <div
      data-open={expanded}
      className={cn(
        "full-player fixed inset-0 z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "data-[open=false]:translate-y-full"
      )}
      aria-hidden={!expanded}
    >
      {track ? (
        <>
          {/* ─── Dynamic Artwork Background ─── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
            {/* Solid color base derived from artwork */}
            <div
              className="absolute inset-0 transition-colors duration-1000 ease-out"
              style={{ backgroundColor: dominantColor }}
            />
            {/* Blurred artwork overlay for richness */}
            {(track.artworkLg || track.artwork) && (
              <img
                src={track.artworkLg || track.artwork || ""}
                alt=""
                className="h-full w-full scale-[1.3] object-cover opacity-60 blur-[80px] saturate-125 transition-all duration-1000 ease-out"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            {/* Subtle gradient to ensure text readability without a heavy black tint */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none mix-blend-multiply" />
          </div>

          {/* ─── Header ─── */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4 pt-[max(env(safe-area-inset-top),16px)] lg:px-8 lg:py-5 pointer-events-none">
            <button
              aria-label="Close player"
              onClick={() => setExpanded(false)}
              className="pointer-events-auto p-2.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20 hover:text-white transition-all"
            >
              <ChevronDown className="size-6" strokeWidth={2} />
            </button>
            
            <p className="pointer-events-auto text-[11px] font-semibold tracking-widest text-white/80 uppercase lg:hidden truncate max-w-[50%]">
              {track.album || "Now Playing"}
            </p>

            <div className="pointer-events-auto flex lg:hidden items-center gap-1">
              <button
                aria-label="Queue"
                className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20 transition-all"
                onClick={() => setQueueOpen(true)}
              >
                <ListMusic className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* ─── Main Layout ─── */}
          <div className={cn(
            "relative flex-1 flex flex-col lg:flex-row px-6 lg:px-16 pt-[calc(env(safe-area-inset-top)+72px)] pb-[max(env(safe-area-inset-bottom),24px)] lg:pt-10 lg:pb-8 overflow-y-auto [scrollbar-width:none] w-full max-w-6xl mx-auto gap-6 lg:gap-16 items-center lg:items-center lg:justify-center",
            panelOpen ? "justify-start" : "justify-center"
          )}>
            
            {/* ─── Left: Artwork & Controls ─── */}
            <div className="flex flex-col w-full transition-all duration-500 lg:justify-center lg:w-[45%] lg:max-w-[440px]">
              
              {/* Artwork — large, centered, with shadow */}
              <div className="w-[min(80vw,340px)] lg:w-full aspect-square mx-auto rounded-xl shadow-[0_24px_80px_rgba(0,0,0,0.5)] overflow-hidden relative transition-all duration-500 flex-shrink-0 mb-8 lg:mb-10">
                <Cover
                  src={track.artworkLg || track.artwork}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Track Info */}
              <div className="w-full max-w-[340px] lg:max-w-none mx-auto">
                <div className="flex items-start justify-between gap-3 mb-5 overflow-hidden">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <MarqueeText text={track.title} className="font-bold text-white text-xl lg:text-2xl leading-tight" />
                    <MarqueeText text={track.artist} className="text-white/60 text-base lg:text-lg mt-1" />
                  </div>
                  <button
                    aria-label={liked ? "Unlike" : "Like"}
                    className="p-2 rounded-full text-white/70 hover:text-white transition-colors shrink-0 active:scale-90"
                    onClick={() => toggleLike(track)}
                  >
                    <Heart className={cn("size-6", liked && "fill-accent text-accent")} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Scrubber */}
                <div className="w-full mb-4">
                  <Slider
                    value={[live ? 0 : currentTime]}
                    min={0}
                    max={live || !duration || !Number.isFinite(duration) ? 100 : duration}
                    step={0.1}
                    disabled={live || !duration}
                    onValueChange={([val]) => seekTo(val)}
                    className="w-full"
                  />
                  <div className="mt-1.5 flex justify-between text-[11px] text-white/40 font-medium tabular-nums">
                    <span>{live ? "LIVE" : formatTime(currentTime)}</span>
                    <span>{live ? "∞" : `-${formatTime(Number.isFinite(duration) ? Math.max(0, duration - currentTime) : 0)}`}</span>
                  </div>
                </div>

                {/* Transport Controls */}
                <div className="flex items-center justify-between w-full max-w-[300px] mx-auto mb-4">
                  <button
                    className={cn("text-white/50 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", shuffle && "text-accent")}
                    onClick={toggleShuffle}
                  >
                    <Shuffle className="size-5" strokeWidth={2} />
                  </button>
                  <button className="text-white hover:text-white/70 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90" onClick={prev}>
                    <SkipBack className="size-8 fill-current" />
                  </button>
                  <PlayPauseButton
                    isPlaying={isPlaying}
                    onClick={toggle}
                    className="size-16 rounded-full bg-white text-black hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center transition-transform"
                    iconClassName="size-7"
                  />
                  <button className="text-white hover:text-white/70 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90" onClick={next}>
                    <SkipForward className="size-8 fill-current" />
                  </button>
                  <button
                    className={cn("text-white/50 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", repeat !== "off" && "text-accent")}
                    onClick={cycleRepeat}
                  >
                    {repeat === "one" ? <Repeat1 className="size-5" strokeWidth={2} /> : <Repeat className="size-5" strokeWidth={2} />}
                  </button>
                </div>

                {/* Action Row — Mobile */}
                <div className="flex lg:hidden items-center justify-center w-full gap-6 pt-2">
                  <button className="text-white/50 hover:text-white p-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: track.title, text: `Listen to ${track.title} by ${track.artist} on Sonara`, url: window.location.href });
                    }
                  }}>
                    <Share2 className="size-5" />
                  </button>
                  <button
                    className={cn("flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all min-h-[44px]", lyricsOpen ? "bg-white/20 text-white" : "text-white/50 hover:text-white")}
                    onClick={() => setLyricsOpen(!lyricsOpen)}
                  >
                    <Mic2 className="size-4" /> Lyrics
                  </button>
                  <button className="text-white/50 hover:text-white p-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => setQueueOpen(true)}>
                    <ListMusic className="size-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Right: Lyrics or Queue (Desktop) ─── */}
            <div className={cn(
              "w-full transition-all duration-500 relative",
              "hidden lg:block lg:w-[45%] lg:h-full lg:flex lg:flex-col"
            )}>
              {/* Desktop Tabs */}
              <div className="hidden lg:flex items-center justify-center mb-6 mt-2">
                <div className="flex bg-white/10 backdrop-blur-sm p-1 rounded-full text-sm font-medium">
                  <button
                    className="group relative isolate px-7 py-1.5 rounded-full transition-colors"
                    onClick={() => { setQueueOpen(true); setLyricsOpen(false); }}
                  >
                    {!lyricsOpen && (
                      <motion.div
                        layoutId="player-tab-glow"
                        className="absolute inset-0 z-[-1] rounded-full bg-white/15 shadow-sm"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className={cn("relative z-10 transition-colors", !lyricsOpen ? "text-white font-semibold" : "text-white/50 hover:text-white/70")}>Queue</span>
                  </button>
                  <button
                    className="group relative isolate px-7 py-1.5 rounded-full transition-colors"
                    onClick={() => { setLyricsOpen(true); setQueueOpen(false); }}
                  >
                    {lyricsOpen && (
                      <motion.div
                        layoutId="player-tab-glow"
                        className="absolute inset-0 z-[-1] rounded-full bg-white/15 shadow-sm"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className={cn("relative z-10 transition-colors", lyricsOpen ? "text-white font-semibold" : "text-white/50 hover:text-white/70")}>Lyrics</span>
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
