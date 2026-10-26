import { useEffect, useMemo, useRef } from "react";
import { ChevronDown, Heart, ListMusic, Mic2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { Cover } from "@/components/cover";
import { SeekBar } from "@/components/player/bar";
import { useProgress } from "@/components/player/use-progress";
import { TrackMenuButton } from "@/components/track-menu";
import { formatTime } from "@/lib/format";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";

const ROUND =
  "tv-card grid size-16 shrink-0 cursor-pointer place-items-center rounded-full text-fg/90 transition hover:bg-white/10";
const PILL =
  "tv-card inline-flex h-14 cursor-pointer items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.07] px-6 text-lg font-semibold text-fg";

/**
 * Full-screen "Now Playing" for the TV: big artwork on the left; title, progress and
 * large controls on the right. Left/Right on the progress bar seeks; Back closes.
 */
export function TvNowPlaying() {
  const expanded = usePlayer((s) => s.expanded);
  const track = usePlayer((s) => s.queue[s.index]);
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const upNext = useMemo(() => queue.slice(index + 1, index + 4), [queue, index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const liked = usePlayer((s) => (track ? s.likedIds.includes(track.id) : false));
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const toggleLike = usePlayer((s) => s.toggleLike);
  const setExpanded = usePlayer((s) => s.setExpanded);
  const setLyricsOpen = usePlayer((s) => s.setLyricsOpen);
  const setQueueOpen = usePlayer((s) => s.setQueueOpen);
  const { live, known, currentTime, duration } = useProgress();

  const rootRef = useRef<HTMLDivElement>(null);
  const open = expanded && Boolean(track);

  // Put focus on Play/Pause when the screen opens, so one OK press toggles playback.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => rootRef.current?.querySelector<HTMLElement>("[data-tv-autofocus]")?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  if (!expanded || !track) return null;
  const art = track.artworkLg || track.artwork;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Now playing"
      data-tv-scope="true"
      className="fixed inset-0 z-50 hidden overflow-hidden bg-bg tvd:block"
    >
      {/* soft colour wash from the artwork */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {art ? <img src={art} alt="" className="size-full scale-125 object-cover opacity-35 blur-3xl saturate-150" /> : null}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/50 to-bg" />
      </div>

      <button
        type="button"
        onClick={() => setExpanded(false)}
        aria-label="Close"
        className="tv-card absolute top-5 left-(--tv-edge) z-10 grid size-14 cursor-pointer place-items-center rounded-full bg-white/10"
      >
        <ChevronDown className="size-7" />
      </button>

      <div className="relative z-10 flex h-full items-center gap-14 px-(--tv-edge) pt-10">
        <Cover
          src={art}
          alt={track.title}
          title={track.title}
          className="aspect-square w-[min(34vw,340px)] shrink-0 rounded-3xl border border-white/10 object-cover shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="min-w-0">
            {live && (
              <span className="mb-2 inline-block rounded-md border border-accent/40 bg-accent-soft px-2 py-0.5 text-xs font-bold tracking-wider text-accent">
                LIVE
              </span>
            )}
            <h2 className="line-clamp-2 text-[40px] leading-[1.1] font-bold tracking-tight text-fg">{track.title}</h2>
            <p className="mt-2 truncate text-2xl text-muted">{track.artist}</p>
            {track.album ? <p className="truncate text-lg text-subtle">{track.album}</p> : null}
          </div>

          {known ? (
            <div>
              <SeekBar currentTime={currentTime} duration={duration} />
              <div className="mt-1 flex justify-between font-mono text-base text-subtle tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <button type="button" onClick={toggleShuffle} aria-pressed={shuffle} aria-label="Shuffle" className={cn(ROUND, shuffle && "text-accent")}>
              <Shuffle className="size-7" />
            </button>
            <button type="button" onClick={prev} aria-label="Previous song" className={ROUND}>
              <SkipBack className="size-8 fill-current" />
            </button>
            <button
              type="button"
              data-tv-autofocus
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="tv-card grid size-24 shrink-0 cursor-pointer place-items-center rounded-full bg-fg text-bg shadow-xl"
            >
              {isPlaying ? <Pause className="size-10 fill-current" strokeWidth={0} /> : <Play className="ml-1.5 size-10 fill-current" strokeWidth={0} />}
            </button>
            <button type="button" onClick={next} aria-label="Next song" className={ROUND}>
              <SkipForward className="size-8 fill-current" />
            </button>
            <button type="button" onClick={cycleRepeat} aria-label={`Repeat: ${repeat}`} className={cn(ROUND, repeat !== "off" && "text-accent")}>
              {repeat === "one" ? <Repeat1 className="size-7" /> : <Repeat className="size-7" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => toggleLike(track)} aria-pressed={liked} className={PILL}>
              <Heart className={cn("size-6", liked && "fill-accent text-accent")} />
              {liked ? "Liked" : "Like"}
            </button>
            <button type="button" onClick={() => setLyricsOpen(true)} className={PILL}>
              <Mic2 className="size-6" />
              Lyrics
            </button>
            <button type="button" onClick={() => setQueueOpen(true)} className={PILL}>
              <ListMusic className="size-6" />
              Up next
            </button>
            <TrackMenuButton track={track} className="tv-card size-14 border border-white/10 bg-white/[0.07]" />
          </div>

          {upNext.length > 0 && (
            <p className="truncate text-lg text-subtle">
              <span className="font-semibold text-muted">Up next · </span>
              {upNext.map((t) => t.title).join("  •  ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
