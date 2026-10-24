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
  Sliders,
} from "lucide-react";
import { PlayPauseButton } from "./play-pause-button";
import { Cover } from "@/components/cover";
import { MarqueeText } from "@/components/marquee-text";
import { LyricsPanel } from "@/components/player/lyrics";
import { QueueList } from "@/components/player/queue";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/format";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function getTrackAudioFormat(track: Track | undefined): { label: string; format: string } {
  if (!track) return { label: "Standard", format: "Stereo" };
  if (track.kind === "radio" || track.streamUrl?.includes(".m3u8") || track.streamUrl?.includes("/listen") || track.streamUrl?.includes("zeno.fm")) {
    return { label: "Live Broadcast", format: "Stream" };
  }
  if (track.id?.startsWith("saavn_") || track.streamUrl?.includes("saavncdn.com")) {
    return { label: "High Quality", format: "320 kbps AAC" };
  }
  if (track.id?.startsWith("sc_") || track.streamUrl?.includes("sndcdn.com") || track.streamUrl?.includes("soundcloud.com")) {
    return { label: "Standard Audio", format: "128 kbps MP3" };
  }
  if (track.streamUrl?.includes("archive.org")) {
    return { label: "Archival Audio", format: "MP3" };
  }
  return { label: "Standard Audio", format: "Stereo" };
}

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
        if (!ctx) { resolve("#151211"); return; }
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
        resolve("#151211");
      }
    };
    img.onerror = () => resolve("#151211");
    img.src = url;
  });
}

function useArtworkColor(artworkUrl?: string) {
  const [color, setColor] = useState("#151211");
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
  const toggleEqualizer = usePlayer((s) => s.toggleEqualizer);
  const equalizerEnabled = usePlayer((s) => s.equalizerEnabled);

  const live = track?.kind === "radio";
  const audioFormat = getTrackAudioFormat(track);
  const dominantColor = useArtworkColor(track?.artworkLg || track?.artwork || undefined);

  return (
    <div
      data-open={expanded}
      className={cn(
        "full-player fixed inset-0 z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-[#0B0A0A]",
        "data-[open=false]:translate-y-full"
      )}
      aria-hidden={!expanded}
    >
      {track ? (
        <>
          {/* ─── Dynamic Artwork Background (Subtle 25-30% Ambient Wash) ─── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10 bg-[#0B0A0A]">
            <div
              className="absolute inset-0 opacity-20 transition-colors duration-1000 ease-out"
              style={{ backgroundColor: dominantColor }}
            />
            {(track.artworkLg || track.artwork) && (
              <img
                src={track.artworkLg || track.artwork || ""}
                alt=""
                className="h-full w-full scale-[1.25] object-cover opacity-25 blur-3xl saturate-125 transition-all duration-1000 ease-out"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B0A0A]/40 via-transparent to-[#0B0A0A]/90 pointer-events-none" />
          </div>

          {/* ─── Header ─── */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4 pt-[max(env(safe-area-inset-top),16px)] lg:px-8 lg:py-5 pointer-events-none">
            <button
              aria-label="Close player"
              onClick={() => setExpanded(false)}
              className="pointer-events-auto p-2.5 rounded-full bg-white/[0.08] text-white/90 hover:bg-white/15 hover:text-white transition-all active:scale-95 border border-white/10 shadow-sm cursor-pointer"
              title="Close"
            >
              <ChevronDown className="size-5" strokeWidth={2} />
            </button>
            
            <p className="pointer-events-auto text-[11px] font-semibold tracking-wider text-white/70 uppercase lg:hidden truncate max-w-[50%]">
              {track.album || "Now Playing"}
            </p>

            <button
              aria-label="Share"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: track.title, text: `Listen to ${track.title} by ${track.artist} on Sonara`, url: window.location.href });
                }
              }}
              className="pointer-events-auto p-2.5 rounded-full bg-white/[0.08] text-white/90 hover:bg-white/15 hover:text-white transition-all active:scale-95 border border-white/10 shadow-sm cursor-pointer"
              title="Share"
            >
              <Share2 className="size-4" strokeWidth={1.75} />
            </button>
          </div>

          {/* ─── Main Layout ─── */}
          <div className={cn(
            "full-player-main relative flex-1 flex flex-col lg:flex-row px-6 lg:px-12 xl:px-20 pt-[calc(env(safe-area-inset-top)+64px)] pb-[max(env(safe-area-inset-bottom),20px)] lg:py-8 overflow-y-auto lg:overflow-hidden [scrollbar-width:none] w-full max-w-6xl mx-auto gap-4 sm:gap-6 lg:gap-12 xl:gap-20 items-center lg:justify-center",
            panelOpen ? "justify-start" : "justify-center"
          )}>
            
            {/* ─── Left: Artwork & Controls ─── */}
            <div className="full-player-left-col flex flex-col w-full transition-all duration-300 lg:justify-center items-center lg:items-stretch lg:w-[44%] lg:max-w-[390px] xl:max-w-[420px] flex-shrink-0">
              
              {/* Artwork */}
              <div className="full-player-artwork-box w-[min(72vw,280px)] sm:w-[min(78vw,320px)] lg:w-[min(38vh,300px)] xl:w-[min(42vh,340px)] aspect-square mx-auto rounded-2xl shadow-2xl border border-white/[0.08] overflow-hidden relative transition-all duration-300 flex-shrink-0 mb-4 sm:mb-6 lg:mb-6 group/art bg-[#151211]">
                <Cover
                  src={track.artworkLg || track.artwork}
                  alt={track.title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/art:scale-105"
                />
              </div>

              {/* Track Info */}
              <div className="full-player-info-box w-full max-w-[340px] sm:max-w-[380px] lg:max-w-none mx-auto">
                <div className="flex items-start justify-between gap-3 mb-2 lg:mb-3 overflow-hidden">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <MarqueeText text={track.title} className="full-player-title font-semibold text-white text-[20px] sm:text-2xl lg:text-[24px] leading-tight tracking-tight" />
                    <MarqueeText text={track.artist} className="full-player-artist text-[#A9A19B] font-normal text-sm lg:text-base mt-1" />
                    
                    {/* Truthful Audio Quality Pill */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-medium text-white/70">
                        <span className="size-1.5 rounded-full bg-[#52B58A]" />
                        <span>{audioFormat.label} · {audioFormat.format}</span>
                      </div>
                      {live && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FF5B2E]/15 text-[#FF5B2E] border border-[#FF5B2E]/30 text-[10px] font-semibold uppercase">
                          Live Radio
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    aria-label={liked ? "Unlike" : "Like"}
                    whileTap={{ scale: 0.85 }}
                    className="p-2.5 rounded-full text-white/70 hover:text-white transition-colors shrink-0 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] shadow-sm mt-1 cursor-pointer"
                    onClick={() => toggleLike(track)}
                  >
                    <Heart className={cn("size-5 transition-all duration-200", liked && "fill-[#FF5B2E] text-[#FF5B2E]")} strokeWidth={1.75} />
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
                  <div className="mt-1.5 flex justify-between text-[11px] text-white/40 font-medium tabular-nums font-mono">
                    <span>{live ? "LIVE" : formatTime(currentTime)}</span>
                    <span>{live ? "∞" : `-${formatTime(Number.isFinite(duration) ? Math.max(0, duration - currentTime) : 0)}`}</span>
                  </div>
                </div>

                {/* Transport Controls */}
                <div className="full-player-controls flex items-center justify-between w-full max-w-[320px] mx-auto mb-2 lg:mb-3 py-1">
                  <button
                    className={cn(
                      "text-white/40 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 rounded-full cursor-pointer",
                      shuffle && "text-[#FF5B2E] hover:text-[#FF5B2E]"
                    )}
                    onClick={toggleShuffle}
                    title={shuffle ? "Shuffle On" : "Shuffle Off"}
                  >
                    <Shuffle className="size-5" strokeWidth={2} />
                  </button>
                  <button 
                    className="text-white hover:text-white/80 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 cursor-pointer" 
                    onClick={prev}
                    title="Previous"
                  >
                    <SkipBack className="size-7 sm:size-8 fill-current" />
                  </button>
                  <PlayPauseButton
                    isPlaying={isPlaying}
                    onClick={toggle}
                    className="full-player-play-btn size-14 sm:size-16 rounded-full bg-white text-black hover:scale-105 active:scale-95 shadow-md flex items-center justify-center transition-transform cursor-pointer"
                    iconClassName="size-6 ml-0.5"
                  />
                  <button 
                    className="text-white hover:text-white/80 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 cursor-pointer" 
                    onClick={next}
                    title="Next"
                  >
                    <SkipForward className="size-7 sm:size-8 fill-current" />
                  </button>
                  <button
                    className={cn(
                      "text-white/40 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 rounded-full cursor-pointer",
                      repeat !== "off" && "text-[#FF5B2E] hover:text-[#FF5B2E]"
                    )}
                    onClick={cycleRepeat}
                    title={`Repeat: ${repeat}`}
                  >
                    {repeat === "one" ? <Repeat1 className="size-5" strokeWidth={2} /> : <Repeat className="size-5" strokeWidth={2} />}
                  </button>
                </div>

                {/* Action Dock (Mobile) */}
                <div className="full-player-action-row flex lg:hidden items-center justify-center w-full gap-3 pt-2">
                  <button
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all min-h-[38px] active:scale-95 border cursor-pointer",
                      lyricsOpen
                        ? "bg-white/20 text-white border-white/25 shadow-sm"
                        : "text-white/70 hover:text-white border-white/10 bg-white/[0.06]"
                    )}
                    onClick={() => {
                      setLyricsOpen(!lyricsOpen);
                      setQueueOpen(false);
                    }}
                    title="Lyrics"
                  >
                    <Mic2 className="size-3.5" />
                    <span>Lyrics</span>
                  </button>

                  <button
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all min-h-[38px] active:scale-95 border cursor-pointer",
                      equalizerEnabled
                        ? "bg-[#FF5B2E] text-white border-[#FF5B2E] shadow-sm"
                        : "text-white/70 hover:text-white border-white/10 bg-white/[0.06]"
                    )}
                    onClick={toggleEqualizer}
                    title={equalizerEnabled ? "Equalizer Active" : "Equalizer"}
                  >
                    <Sliders className="size-3.5" />
                    <span>EQ</span>
                  </button>

                  <button
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all min-h-[38px] active:scale-95 border cursor-pointer",
                      queueOpen
                        ? "bg-white/20 text-white border-white/25 shadow-sm"
                        : "text-white/70 hover:text-white border-white/10 bg-white/[0.06]"
                    )}
                    onClick={() => {
                      setQueueOpen(!queueOpen);
                      setLyricsOpen(false);
                    }}
                    title="Queue"
                  >
                    <ListMusic className="size-3.5" />
                    <span>Queue</span>
                  </button>
                </div>

                {/* Desktop: Audio Equalizer pill */}
                <div className="hidden lg:flex items-center justify-center w-full pt-3">
                  <button
                    className={cn(
                      "flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium transition-all active:scale-95 border shadow-sm cursor-pointer",
                      equalizerEnabled
                        ? "bg-[#FF5B2E] text-white border-[#FF5B2E]"
                        : "text-white/70 hover:text-white border-white/10 bg-white/[0.06] hover:bg-white/10"
                    )}
                    onClick={toggleEqualizer}
                    title={equalizerEnabled ? "Equalizer DSP Active" : "Audio Equalizer"}
                  >
                    <Sliders className="size-3.5" />
                    <span>{equalizerEnabled ? "Equalizer DSP (Active)" : "Audio Equalizer"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Right: Lyrics or Queue (Desktop) ─── */}
            <div className={cn(
              "w-full transition-all duration-300 relative",
              "hidden lg:block lg:w-[45%] lg:h-full lg:flex lg:flex-col"
            )}>
              {/* Desktop Tabs */}
              <div className="hidden lg:flex items-center justify-center mb-6 mt-2">
                <div className="flex bg-white/[0.06] p-1 rounded-full text-sm font-medium border border-white/[0.08]">
                  <button
                    className="group relative isolate px-7 py-1.5 rounded-full transition-colors cursor-pointer"
                    onClick={() => { setQueueOpen(true); setLyricsOpen(false); }}
                  >
                    {!lyricsOpen && (
                      <motion.div
                        layoutId="player-tab-glow"
                        className="absolute inset-0 z-[-1] rounded-full bg-white/[0.12] shadow-sm"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className={cn("relative z-10 transition-colors", !lyricsOpen ? "text-white font-medium" : "text-white/50 hover:text-white/80")}>Queue</span>
                  </button>
                  <button
                    className="group relative isolate px-7 py-1.5 rounded-full transition-colors cursor-pointer"
                    onClick={() => { setLyricsOpen(true); setQueueOpen(false); }}
                  >
                    {lyricsOpen && (
                      <motion.div
                        layoutId="player-tab-glow"
                        className="absolute inset-0 z-[-1] rounded-full bg-white/[0.12] shadow-sm"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className={cn("relative z-10 transition-colors", lyricsOpen ? "text-white font-medium" : "text-white/50 hover:text-white/80")}>Lyrics</span>
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
