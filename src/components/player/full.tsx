import { useEffect, useState, type CSSProperties } from "react";
import {
  ChevronDown,
  Heart,
  ListMusic,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Cover } from "@/components/cover";
import { LyricsPanel } from "@/components/player/lyrics";
import { Visualizer } from "@/components/player/visualizer";
import { Button } from "@/components/ui/button";
import { extractAccent } from "@/lib/color";
import { formatTime } from "@/lib/format";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";

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
  const [glow, setGlow] = useState<string>("rgba(255,42,61,0.4)");

  useEffect(() => {
    let live = true;
    const url = track?.artworkLg || track?.artwork;
    if (!url) return;
    extractAccent(url).then((c) => {
      if (live && c) setGlow(c);
    });
    return () => {
      live = false;
    };
  }, [track?.artworkLg, track?.artwork]);

  const live = track?.kind === "radio";
  const progress =
    live || !duration || !Number.isFinite(duration) ? 0 : (currentTime / duration) * 100;

  return (
    <div
      data-open={expanded}
      className="full-player fixed inset-0 z-40 flex flex-col bg-bg"
      aria-hidden={!expanded}
    >
      {track ? (
        <>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {track.artworkLg || track.artwork ? (
              <img
                src={track.artworkLg || track.artwork || ""}
                alt=""
                className="h-full w-full scale-125 object-cover opacity-35 blur-3xl"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            <div
              className="glow-orb absolute top-1/4 left-1/2 size-[28rem] -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: glow }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-bg/20 via-bg/55 to-bg" />
          </div>

          <div className="relative flex items-center justify-between px-4 py-3">
            <Button
              variant="icon"
              size="icon"
              aria-label="Close player"
              onClick={() => setExpanded(false)}
            >
              <ChevronDown className="size-6" />
            </Button>
            <p className="text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
              {live ? "Live radio" : "Now playing"}
            </p>
            <Button
              variant="icon"
              size="icon"
              aria-label="Queue"
              onClick={() => setQueueOpen(true)}
            >
              <ListMusic className="size-5" />
            </Button>
          </div>

          <div className="relative flex-1 overflow-y-auto px-4 pb-8 flex flex-col items-center justify-between min-h-0 [scrollbar-width:none]">
            <div className="flex flex-col items-center justify-center w-full max-w-md my-auto py-2">
              <Cover
                src={track.artworkLg || track.artwork}
                alt={track.title}
                title={track.title}
                rounded="lg"
                className={cn(
                  "aspect-square w-[min(19rem,68vw)] max-h-[36vh] shadow-pop rounded-2xl",
                  isPlaying && "art-playing",
                )}
              />

              <div className="mt-5 sm:mt-8 flex w-full items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-xl sm:text-2xl font-bold tracking-tight text-fg">
                    {track.title}
                  </h1>
                  <p className="truncate text-sm sm:text-base text-muted mt-0.5">{track.artist}</p>
                </div>
                <Button
                  variant="icon"
                  size="icon"
                  aria-label={liked ? "Unlike" : "Like"}
                  className="shrink-0"
                  onClick={() => toggleLike(track)}
                >
                  <Heart className={cn("size-6", liked && "fill-accent text-accent")} />
                </Button>
              </div>

              <div className="mt-4 sm:mt-6 w-full">
                <input
                  className="player-range"
                  type="range"
                  min={0}
                  max={live || !duration ? 0 : duration}
                  step={0.1}
                  value={live ? 0 : currentTime}
                  disabled={live}
                  style={{ "--progress": `${progress}%` } as CSSProperties}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  aria-label="Seek"
                />
                <div className="mt-1.5 flex justify-between text-xs tabular-nums text-subtle font-medium">
                  <span>{live ? "LIVE" : formatTime(currentTime)}</span>
                  <span>{live ? "∞" : formatTime(Number.isFinite(duration) ? duration : 0)}</span>
                </div>
              </div>

              <div className="mt-3 sm:mt-5 flex items-center justify-between w-full max-w-xs sm:max-w-sm px-2">
                <Button
                  variant="icon"
                  size="iconSm"
                  aria-label="Shuffle"
                  className={cn("text-muted hover:text-fg", shuffle && "text-accent")}
                  onClick={toggleShuffle}
                >
                  <Shuffle className="size-4.5 sm:size-5" />
                </Button>
                <Button
                  variant="icon"
                  size="icon"
                  aria-label="Previous"
                  className="text-fg active:scale-95"
                  onClick={prev}
                >
                  <SkipBack className="size-6 sm:size-7 fill-current" />
                </Button>
                <Button
                  variant="solid"
                  size="icon"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="size-14 sm:size-16 rounded-full shadow-lg active:scale-95 transition-transform"
                  onClick={toggle}
                >
                  {isPlaying ? (
                    <Pause className="size-6 sm:size-7 fill-current" />
                  ) : (
                    <Play className="size-6 sm:size-7 fill-current" style={{ marginLeft: 3 }} />
                  )}
                </Button>
                <Button
                  variant="icon"
                  size="icon"
                  aria-label="Next"
                  className="text-fg active:scale-95"
                  onClick={next}
                >
                  <SkipForward className="size-6 sm:size-7 fill-current" />
                </Button>
                <Button
                  variant="icon"
                  size="iconSm"
                  aria-label="Repeat"
                  className={cn("text-muted hover:text-fg", repeat !== "off" && "text-accent")}
                  onClick={cycleRepeat}
                >
                  {repeat === "one" ? (
                    <Repeat1 className="size-4.5 sm:size-5" />
                  ) : (
                    <Repeat className="size-4.5 sm:size-5" />
                  )}
                </Button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant={lyricsOpen ? "chip" : "ghost"}
                  size="sm"
                  className="rounded-full px-4 text-xs font-medium border border-border/40"
                  onClick={() => setLyricsOpen(!lyricsOpen)}
                >
                  <Mic2 className="size-3.5 mr-1.5" />
                  Lyrics
                </Button>
              </div>

              <LyricsPanel />
              <div className="mt-4 w-full">
                <Visualizer />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
