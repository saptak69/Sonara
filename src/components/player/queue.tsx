import { X, Infinity as InfinityIcon, ChevronUp, ChevronDown, Volume2 } from "lucide-react";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";

export function QueueList({ className }: { className?: string }) {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const autoplay = usePlayer((s) => s.autoplay);
  const toggleAutoplay = usePlayer((s) => s.toggleAutoplay);
  const volumeNormalization = usePlayer((s) => s.volumeNormalization);
  const toggleVolumeNormalization = usePlayer((s) => s.toggleVolumeNormalization);
  const moveUpcoming = usePlayer((s) => s.moveUpcoming);

  const current = queue[index];
  const upcoming = queue.slice(index + 1);
  const history = queue.slice(0, index);

  const clearUpcoming = usePlayer((s) => s.clearUpcoming);
  const clearRecents = usePlayer((s) => s.clearRecents);

  return (
    <div className={cn("flex-1 overflow-y-auto [scrollbar-width:none] px-4 md:px-8 pb-32", className)}>
      {/* Audio & Playback Enhancements (Spotify/Apple Music Parity) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* Autoplay (Infinity Mode) Control */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/20 text-accent">
              <InfinityIcon className="size-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white tracking-tight">Autoplay (Infinity)</div>
              <div className="text-xs text-white/50">Similar tracks keep playing</div>
            </div>
          </div>
          <Switch
            checked={autoplay}
            onCheckedChange={toggleAutoplay}
            aria-label="Toggle Autoplay Infinity Mode"
          />
        </div>

        {/* Volume Normalization (Sound Check / EBU R128) */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/20 text-accent">
              <Volume2 className="size-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white tracking-tight">Sound Check</div>
              <div className="text-xs text-white/50">Normalize volume across tracks</div>
            </div>
          </div>
          <Switch
            checked={volumeNormalization}
            onCheckedChange={toggleVolumeNormalization}
            aria-label="Toggle Volume Normalization"
          />
        </div>
      </div>

      <div className="space-y-10">
        {/* Queue (Upcoming) with Reordering */}
        {upcoming.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-4 px-2">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white">Queue ({upcoming.length})</h2>
                <span className="text-xs text-white/50">Hover to reorder upcoming tracks</span>
              </div>
              <button
                type="button"
                onClick={clearUpcoming}
                className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {upcoming.map((t, i) => (
                <div key={`${t.id}-${i}`} className="group/item relative flex items-center">
                  <div className="flex-1 min-w-0">
                    <TrackRow track={t} queue={queue} />
                  </div>
                  {/* Reorder controls */}
                  <div className="absolute right-12 z-20 hidden lg:group-hover/item:flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/15 shadow-md">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => moveUpcoming(i, i - 1)}
                        aria-label="Move track up"
                        title="Move up"
                        className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                    )}
                    {i < upcoming.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveUpcoming(i, i + 1)}
                        aria-label="Move track down"
                        title="Move down"
                        className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Playing (History / Active) */}
        {(current || history.length > 0) && (
          <div>
            <div className="flex items-end justify-between mb-4 px-2">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white">Continue Playing</h2>
                <span className="text-sm text-white/50">From your recent activity</span>
              </div>
              <button
                type="button"
                onClick={clearRecents}
                className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {current && <TrackRow track={current} queue={queue} />}
              {[...history].reverse().map((t, i) => (
                <TrackRow key={`history-${t.id}-${i}`} track={t} queue={queue} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function QueuePanel() {
  const open = usePlayer((s) => s.queueOpen);
  const setQueueOpen = usePlayer((s) => s.setQueueOpen);
  const track = usePlayer((s) => s.queue[s.index]);

  return (
    <aside
      data-open={open}
      className={cn(
        "fixed inset-0 z-50 flex lg:hidden flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] liquid-glass",
        "data-[open=false]:translate-y-full"
      )}
    >
      {/* Immersive blurred artwork background */}
      {track && (
        <div className="absolute inset-0 z-[-1] overflow-hidden bg-black">
          <img
            src={track.artworkLg || track.artwork || undefined}
            alt=""
            className="w-full h-full object-cover opacity-60 saturate-[150%] blur-3xl scale-150"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      <div className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-4 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Queue</h2>
          {track && <p className="text-xs font-medium text-white/60 drop-shadow">Now Playing: {track.title}</p>}
        </div>
        <Button
          variant="icon"
          size="iconSm"
          aria-label="Close queue"
          onClick={() => setQueueOpen(false)}
          className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors size-8 flex items-center justify-center shadow-lg"
        >
          <X className="size-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)">
        <QueueList />
      </div>
    </aside>
  );
}
