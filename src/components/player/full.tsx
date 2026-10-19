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
  const dominantColor = useArtworkColor(track?.artworkLg || track?.artwork || undefined);

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
                className="h-full w-full scale-[1.35] object-cover opacity-65 blur-3xl saturate-150 transition-all duration-1000 ease-out"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            {/* Vignette & subtle film grain for rich cinematic depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none mix-blend-multiply" />
            <div 
              className="absolute inset-0 opacity-[0.04] pointer-events-none" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
              }}
            />
          </div>

          {/* ─── Header ─── */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4 pt-[max(env(safe-area-inset-top),16px)] lg:px-8 lg:py-5 pointer-events-none">
            <button
              aria-label="Close player"
              onClick={() => setExpanded(false)}
              className="pointer-events-auto p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white/90 hover:bg-white/20 hover:text-white transition-all active:scale-90 border border-white/10 shadow-lg"
            >
              <ChevronDown className="size-6" strokeWidth={2} />
            </button>
            
            <p className="pointer-events-auto text-[11px] font-semibold tracking-widest text-white/80 uppercase lg:hidden truncate max-w-[50%]">
              {track.album || "Now Playing"}
            </p>

            <div className="pointer-events-auto flex lg:hidden items-center gap-1">
              <button
                aria-label="Queue"
                className="p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white/90 hover:bg-white/20 transition-all active:scale-90 border border-white/10 shadow-lg"
                onClick={() => setQueueOpen(true)}
              >
                <ListMusic className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* ─── Main Layout ─── */}
          <div className={cn(
            "full-player-main relative flex-1 flex flex-col lg:flex-row px-6 lg:px-12 xl:px-20 pt-[calc(env(safe-area-inset-top)+64px)] pb-[max(env(safe-area-inset-bottom),20px)] lg:py-8 overflow-y-auto lg:overflow-hidden [scrollbar-width:none] w-full max-w-6xl mx-auto gap-4 sm:gap-6 lg:gap-12 xl:gap-20 items-center lg:justify-center",
            panelOpen ? "justify-start" : "justify-center"
          )}>
            
            {/* ─── Left: Artwork & Controls ─── */}
            <div className="full-player-left-col flex flex-col w-full transition-all duration-500 lg:justify-center items-center lg:items-stretch lg:w-[44%] lg:max-w-[390px] xl:max-w-[420px] flex-shrink-0">
              
              {/* Artwork — elegant, responsive, elevated depth */}
              <div className="full-player-artwork-box w-[min(72vw,280px)] sm:w-[min(78vw,320px)] lg:w-[min(38vh,300px)] xl:w-[min(42vh,340px)] aspect-square mx-auto rounded-[24px] sm:rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.65)] ring-1 ring-white/15 overflow-hidden relative transition-all duration-500 flex-shrink-0 mb-4 sm:mb-6 lg:mb-6 group/art">
                <Cover
                  src={track.artworkLg || track.artwork}
                  alt={track.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/art:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10 pointer-events-none" />
              </div>

              {/* Track Info */}
              <div className="full-player-info-box w-full max-w-[340px] sm:max-w-[380px] lg:max-w-none mx-auto">
                <div className="flex items-start justify-between gap-3 mb-2 lg:mb-3 overflow-hidden">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <MarqueeText text={track.title} className="full-player-title font-extrabold text-white text-[22px] sm:text-2xl lg:text-[26px] leading-tight tracking-tight" />
                    <MarqueeText text={track.artist} className="full-player-artist text-white/70 font-semibold text-base lg:text-lg mt-0.5" />
                    
                    {/* Hi-Res Lossless Pill */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white/80 tracking-wide">
                        <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                        <span>Lossless · 24-bit / 48kHz</span>
                      </div>
                      {live && (
                        <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 text-[10px] font-bold tracking-wider uppercase">
                          Live Radio
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    aria-label={liked ? "Unlike" : "Like"}
                    whileTap={{ scale: 0.75 }}
                    whileHover={{ scale: 1.15 }}
                    className="p-2.5 rounded-full text-white/70 hover:text-white transition-colors shrink-0 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] shadow-md mt-1"
                    onClick={() => toggleLike(track)}
                  >
                    <Heart className={cn("size-6 transition-all duration-300", liked && "fill-accent text-accent drop-shadow-[0_0_12px_rgba(255,74,58,0.7)]")} strokeWidth={1.75} />
                  </motion.button>
                </div>

                {/* Scrubber */}
                <div className="full-player-scrubber w-full mb-3 lg:mb-4">
                  <Slider
                    value={[live ? 0 : currentTime]}
                    min={0}
                    max={live || !duration || !Number.isFinite(duration) ? 100 : duration}
                    step={0.1}
                    disabled={live || !duration}
                    onValueChange={([val]) => seekTo(val)}
                    className="w-full"
                  />
                  <div className="mt-1.5 flex justify-between text-[11px] text-white/50 font-medium tabular-nums font-mono">
                    <span>{live ? "LIVE" : formatTime(currentTime)}</span>
                    <span>{live ? "∞" : `-${formatTime(Number.isFinite(duration) ? Math.max(0, duration - currentTime) : 0)}`}</span>
                  </div>
                </div>

                {/* Transport Controls */}
                <div className="full-player-controls flex items-center justify-between w-full max-w-[320px] mx-auto mb-2 lg:mb-3 py-1">
                  <button
                    className={cn(
                      "text-white/50 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 rounded-full",
                      shuffle && "text-accent hover:text-accent drop-shadow-[0_0_8px_rgba(255,74,58,0.5)]"
                    )}
                    onClick={toggleShuffle}
                    title={shuffle ? "Shuffle On" : "Shuffle Off"}
                  >
                    <Shuffle className="size-5" strokeWidth={2.5} />
                  </button>
                  <button 
                    className="text-white hover:text-white/80 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90" 
                    onClick={prev}
                    title="Previous"
                  >
                    <SkipBack className="size-8 sm:size-9 fill-current" />
                  </button>
                  <PlayPauseButton
                    isPlaying={isPlaying}
                    onClick={toggle}
                    className="full-player-play-btn size-16 sm:size-[68px] rounded-full bg-white text-black hover:scale-105 active:scale-95 shadow-[0_12px_32px_rgba(255,255,255,0.25)] flex items-center justify-center transition-transform"
                    iconClassName="size-7"
                  />
                  <button 
                    className="text-white hover:text-white/80 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90" 
                    onClick={next}
                    title="Next"
                  >
                    <SkipForward className="size-8 sm:size-9 fill-current" />
                  </button>
                  <button
                    className={cn(
                      "text-white/50 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 rounded-full",
                      repeat !== "off" && "text-accent hover:text-accent drop-shadow-[0_0_8px_rgba(255,74,58,0.5)]"
                    )}
                    onClick={cycleRepeat}
                    title={`Repeat: ${repeat}`}
                  >
                    {repeat === "one" ? <Repeat1 className="size-5" strokeWidth={2.5} /> : <Repeat className="size-5" strokeWidth={2.5} />}
                  </button>
                </div>

                {/* Action Row — Mobile */}
                <div className="full-player-action-row flex lg:hidden items-center justify-center w-full gap-5 pt-1">
                  <button 
                    className="text-white/60 hover:text-white p-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-90" 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: track.title, text: `Listen to ${track.title} by ${track.artist} on Sonara`, url: window.location.href });
                      }
                    }}
                    title="Share"
                  >
                    <Share2 className="size-5" />
                  </button>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all min-h-[38px] active:scale-95 border",
                      lyricsOpen ? "bg-white/20 text-white border-white/20 shadow-md" : "text-white/60 hover:text-white border-white/10 bg-white/[0.05]"
                    )}
                    onClick={() => setLyricsOpen(!lyricsOpen)}
                  >
                    <Mic2 className="size-3.5 sm:size-4" /> Lyrics
                  </button>
                  <button 
                    className="text-white/60 hover:text-white p-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-90" 
                    onClick={() => setQueueOpen(true)}
                    title="Queue"
                  >
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
