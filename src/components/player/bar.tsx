import React from "react";
import { ListMusic, Mic2, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Cover } from "@/components/cover";
import { MarqueeText } from "@/components/marquee-text";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
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
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);

  // Scrubber interactive states
  const [hoverTime, setHoverTime] = React.useState<number | null>(null);
  const [hoverX, setHoverX] = React.useState<number | null>(null);
  const scrubberRef = React.useRef<HTMLDivElement>(null);
  const isDraggingScrubber = React.useRef(false);

  const live = track?.kind === "radio";
  const progress =
    live || !duration || !Number.isFinite(duration) ? 0 : (currentTime / duration) * 100;

  const handleScrubberMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!scrubberRef.current || duration <= 0) return;
      const rect = scrubberRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverTime(pos * duration);
      setHoverX(e.clientX - rect.left);
    },
    [duration]
  );

  const handleScrubberMouseLeave = React.useCallback(() => {
    if (!isDraggingScrubber.current) {
      setHoverTime(null);
      setHoverX(null);
    }
  }, []);

  const handleScrubberPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubberRef.current || duration <= 0) return;
      isDraggingScrubber.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = scrubberRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seekTo(pos * duration);
      setHoverTime(pos * duration);
      setHoverX(e.clientX - rect.left);
    },
    [duration, seekTo]
  );

  const handleScrubberPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingScrubber.current || !scrubberRef.current || duration <= 0) return;
      const rect = scrubberRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seekTo(pos * duration);
      setHoverTime(pos * duration);
      setHoverX(e.clientX - rect.left);
    },
    [duration, seekTo]
  );

  const handleScrubberPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isDraggingScrubber.current) {
        isDraggingScrubber.current = false;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // pointer capture might already be released
        }
        setHoverTime(null);
        setHoverX(null);
      }
    },
    []
  );

  if (!track) {
    return null;
  }

  return (
    <>
      {/* Mobile Player Pill (Apple Music iOS Style) */}
      <div className="mobile-player-pill-wrapper w-full lg:hidden relative rounded-full backdrop-blur-2xl bg-black/75 border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.65)] ring-1 ring-inset ring-white/[0.06] overflow-hidden">
        <div className="mobile-player-pill-bar flex h-[62px] items-center gap-3 px-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.98] transition-transform"
            onClick={() => setExpanded(true)}
          >
            <div className="mobile-player-pill-art relative size-[44px] shrink-0 rounded-[12px] overflow-hidden shadow-md ring-1 ring-white/10 ml-0.5">
              <Cover
                src={track.artwork}
                alt={track.title}
                title={track.title}
                className="size-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1 justify-center overflow-hidden">
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <MarqueeText text={track.title} className="text-[15px] font-bold text-white tracking-tight flex-1 min-w-0 leading-tight" />
              </div>
              <span className="truncate text-[13px] text-white/60 font-medium leading-tight mt-[2px] tracking-tight">
                {track.artist}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0 pr-2 sm:pr-4 text-white">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className="size-10 rounded-full flex items-center justify-center text-white hover:text-white/80 active:scale-90 transition-all bg-white/[0.08] border border-white/[0.08]"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                  <path d="M7 4.5v15a1 1 0 001.524.852l12-7.5a1 1 0 000-1.704l-12-7.5A1 1 0 007 4.5z" />
                </svg>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="size-10 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-transform"
              aria-label="Next track"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6.5v11a1 1 0 001.536.843l8.5-5.5a1 1 0 000-1.686l-8.5-5.5A1 1 0 004 6.5z" />
                <path d="M12.5 6.5v11a1 1 0 001.536.843l8.5-5.5a1 1 0 000-1.686l-8.5-5.5A1 1 0 0012.5 6.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Mini Progress Bar */}
        {!live && duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10 overflow-hidden pointer-events-none">
            <div 
              className="h-full bg-accent shadow-[0_0_8px_rgba(255,74,58,0.7)] transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Desktop Bar - Apple Music Floating Pill Style with Frosted Obsidian Glass */}
      <div className="hidden lg:flex fixed bottom-8 left-[calc(var(--spacing-sidebar)+((100vw-var(--spacing-sidebar))/2))] -translate-x-1/2 h-[74px] bg-black/65 backdrop-blur-2xl border border-white/10 items-center justify-between px-6 z-50 rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.7)] ring-1 ring-inset ring-white/[0.08] w-[calc(100vw-var(--spacing-sidebar)-3rem)] max-w-[880px] min-w-0 group select-none">
        
        {/* Interactive 3px -> 6px Expanding Scrubber with Glow Pip and Time Tooltip */}
        {!live && duration > 0 && (
          <div 
            ref={scrubberRef}
            className="absolute top-0 left-6 right-6 h-[3px] group-hover:h-[6px] transition-all duration-200 cursor-pointer z-20 py-2 -my-2"
            onMouseMove={handleScrubberMouseMove}
            onMouseLeave={handleScrubberMouseLeave}
            onPointerDown={handleScrubberPointerDown}
            onPointerMove={handleScrubberPointerMove}
            onPointerUp={handleScrubberPointerUp}
          >
            {/* Scrubber Track */}
            <div className="relative w-full h-[3px] group-hover:h-[6px] bg-white/15 rounded-full overflow-visible transition-all duration-200">
              {/* Progress Fill */}
              <div 
                className="h-full bg-gradient-to-r from-accent/90 to-accent rounded-full shadow-[0_0_10px_rgba(255,74,58,0.5)] transition-all ease-linear relative"
                style={{ width: `${progress}%` }}
              >
                {/* Active Glow Pip */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 size-3.5 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.9),0_0_4px_rgba(255,74,58,0.8)] opacity-0 group-hover:opacity-100 transform translate-x-1/2 transition-opacity duration-150" />
              </div>
            </div>

            {/* Floating Time Tooltip */}
            {hoverTime !== null && hoverX !== null && (
              <div 
                className="absolute -top-7 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 text-[11px] font-mono text-white/90 border border-white/15 backdrop-blur-md shadow-xl pointer-events-none z-30 tracking-tight"
                style={{ left: `${Math.max(16, Math.min(scrubberRef.current?.clientWidth ?? 800 - 16, hoverX))}px` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Background Aura inside Pill */}
        <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none rounded-full">
          <img
            src={track.artwork || undefined}
            alt=""
            className="w-full h-full object-cover opacity-25 saturate-200 blur-3xl transform scale-[2.2]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-black/30" />
        </div>

        {/* Left: Track Info */}
        <div className="flex items-center gap-3.5 w-[230px] xl:w-[270px] min-w-0 shrink cursor-pointer" onClick={() => setExpanded(true)}>
          <div className="h-[50px] aspect-square rounded-[10px] overflow-hidden shadow-md ring-1 ring-white/10 shrink-0">
            <Cover
              src={track.artwork}
              alt={track.title}
              className="size-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-1.5 overflow-hidden w-full">
              {live && (
                <span className="text-[9px] font-bold tracking-wider text-accent border border-accent/40 bg-accent/10 px-1 py-0.5 rounded-sm shrink-0">
                  LIVE
                </span>
              )}
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <MarqueeText text={track.title} className="font-bold text-white text-[14px] leading-tight flex-1 min-w-0" />
                <Equalizer isPlaying={isPlaying} />
              </div>
            </div>
            <span className="truncate text-white/60 text-[12px] leading-tight mt-1 font-medium">
              {track.artist}
            </span>
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="flex items-center gap-5 sm:gap-6">
            <button
              className={cn(
                "p-2 text-white/50 hover:text-white transition-all active:scale-90 rounded-full",
                shuffle && "text-accent hover:text-accent drop-shadow-[0_0_8px_rgba(255,74,58,0.5)]"
              )}
              onClick={toggleShuffle}
              title={shuffle ? "Shuffle On" : "Shuffle Off"}
            >
              <Shuffle className="size-[17px]" strokeWidth={2.5} />
            </button>
            <button 
              className="p-2 text-white/90 hover:text-white transition-transform active:scale-90" 
              onClick={prev}
              title="Previous"
            >
              <SkipBack className="size-6 fill-current" />
            </button>
            <button
              onClick={toggle}
              className="text-black bg-white hover:scale-105 active:scale-95 transition-transform flex items-center justify-center size-[46px] rounded-full shadow-[0_8px_20px_rgba(255,255,255,0.25)]"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="size-5 fill-current" strokeWidth={0} />
              ) : (
                <Play className="size-5 fill-current ml-0.5" strokeWidth={0} />
              )}
            </button>
            <button 
              className="p-2 text-white/90 hover:text-white transition-transform active:scale-90" 
              onClick={next}
              title="Next"
            >
              <SkipForward className="size-6 fill-current" />
            </button>
            <button
              className={cn(
                "p-2 text-white/50 hover:text-white transition-all active:scale-90 rounded-full",
                repeat !== "off" && "text-accent hover:text-accent drop-shadow-[0_0_8px_rgba(255,74,58,0.5)]"
              )}
              onClick={cycleRepeat}
              title={`Repeat: ${repeat}`}
            >
              {repeat === "one" ? <Repeat1 className="size-[17px]" strokeWidth={2.5} /> : <Repeat className="size-[17px]" strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-3.5 xl:gap-5 w-[230px] xl:w-[270px] min-w-0 shrink">
          {!live && duration > 0 && (
            <span className="text-[12px] font-medium text-white/50 font-mono tracking-tight mr-1">
              -{formatTime(Math.max(0, duration - currentTime))}
            </span>
          )}
          <button 
            className="p-2 text-white/50 hover:text-white transition-colors active:scale-90 rounded-full hover:bg-white/[0.06]"
            onClick={() => {
              setExpanded(true);
              setLyricsOpen(true);
            }}
            title="Lyrics"
          >
            <Mic2 className="size-[18px]" strokeWidth={2} />
          </button>
          <button 
            className="p-2 text-white/50 hover:text-white transition-colors active:scale-90 rounded-full hover:bg-white/[0.06]"
            onClick={() => {
              setExpanded(true);
              setLyricsOpen(false);
            }}
            title="Queue"
          >
            <ListMusic className="size-[18px]" strokeWidth={2} />
          </button>
          
          <div className="flex items-center gap-2 group/vol w-[115px]">
            <button
              onClick={toggleMute}
              className="text-white/50 hover:text-white transition-colors shrink-0 p-1 active:scale-90"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <VolumeX className="size-[18px]" strokeWidth={2} />
              ) : (
                <Volume2 className="size-[18px]" strokeWidth={2} />
              )}
            </button>
            <div
              className="flex-1 h-1.5 bg-white/15 rounded-full relative overflow-hidden group-hover/vol:h-2 transition-all cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setVolume(pos);
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 bg-white rounded-full transition-[width]"
                style={{ width: `${(muted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
