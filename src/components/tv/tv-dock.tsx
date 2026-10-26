import { ListMusic, Maximize2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Cover } from "@/components/cover";
import { MarqueeText } from "@/components/marquee-text";
import { useProgress } from "@/components/player/use-progress";
import { TrackMenuButton } from "@/components/track-menu";
import { usePlayer } from "@/lib/player-store";

const ICON_BTN =
  "tv-card grid size-12 shrink-0 cursor-pointer place-items-center rounded-full text-fg/90 transition hover:bg-hover";

/**
 * The bar docked to the bottom of the TV screen. It is one step from anywhere:
 * press Down from the last row of the page to land on it.
 */
export function TvDock() {
  const track = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const setExpanded = usePlayer((s) => s.setExpanded);
  const setQueueOpen = usePlayer((s) => s.setQueueOpen);
  const { live, known, percent } = useProgress();

  if (!track) return null;

  return (
    <div data-tv-zone="player" className="fixed inset-x-(--tv-edge) bottom-4 z-40 hidden tvd:block">
      <div className="sonara-glass-strong relative overflow-hidden rounded-3xl">
        {known && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-white/10">
            <div className="h-full bg-accent transition-[width] duration-300 ease-linear" style={{ width: `${percent}%` }} />
          </div>
        )}

        <div className="flex h-[88px] items-center gap-4 px-4">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label={`Now playing: ${track.title} by ${track.artist}. Open full screen`}
            className="tv-card flex min-w-0 flex-1 items-center gap-4 rounded-2xl p-1.5 text-left"
          >
            <Cover src={track.artwork} alt="" title={track.title} className="size-[64px] shrink-0 rounded-2xl" />
            <span className="flex min-w-0 flex-col">
              <MarqueeText text={track.title} className="text-xl leading-tight font-semibold text-fg" />
              <span className="mt-0.5 truncate text-base text-muted">{track.artist}</span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button type="button" onClick={prev} aria-label="Previous song" className={ICON_BTN}>
              <SkipBack className="size-6 fill-current" />
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="tv-card grid size-16 shrink-0 cursor-pointer place-items-center rounded-full bg-fg text-bg shadow-lg"
            >
              {isPlaying ? <Pause className="size-7 fill-current" strokeWidth={0} /> : <Play className="ml-1 size-7 fill-current" strokeWidth={0} />}
            </button>
            <button type="button" onClick={next} aria-label="Next song" className={ICON_BTN}>
              <SkipForward className="size-6 fill-current" />
            </button>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            {live ? (
              <span className="rounded-md border border-accent/40 bg-accent-soft px-2 py-0.5 text-xs font-bold tracking-wider text-accent">LIVE</span>
            ) : null}
            <TrackMenuButton track={track} className="tv-card size-12" />
            <button type="button" onClick={() => setQueueOpen(true)} aria-label="Up next" className={ICON_BTN}>
              <ListMusic className="size-6" />
            </button>
            <button type="button" onClick={() => setExpanded(true)} aria-label="Full screen" className={ICON_BTN}>
              <Maximize2 className="size-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
