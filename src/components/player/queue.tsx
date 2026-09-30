import { X } from "lucide-react";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";

export function QueueList({ className }: { className?: string }) {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const current = queue[index];
  const upcoming = queue.slice(index + 1);
  const history = queue.slice(0, index);

  return (
    <div className={cn("flex-1 overflow-y-auto [scrollbar-width:none] px-4 md:px-8 pb-32", className)}>
      

      <div className="space-y-10">
        {/* Queue (Upcoming) */}
        {upcoming.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-4 px-2">
              <h2 className="text-xl font-bold text-white">Queue</h2>
              <button className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {upcoming.map((t, i) => (
                <TrackRow key={`${t.id}-${i}`} track={t} queue={queue} />
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
              <button className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {current && <TrackRow track={current} queue={queue} />}
              {history.reverse().map((t, i) => (
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
        "fixed inset-0 z-50 flex md:hidden flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] liquid-glass",
        "data-[open=false]:translate-y-full"
      )}
    >
      {/* Immersive blurred artwork background */}
      {track && (
        <div className="absolute inset-0 z-[-1] overflow-hidden bg-black">
          <img
            src={track.artworkLg || track.artwork}
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
        <Button variant="icon" size="iconSm" aria-label="Close queue" onClick={() => setQueueOpen(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors size-8 flex items-center justify-center shadow-lg">
          <X className="size-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)">
        <QueueList />
      </div>
    </aside>
  );
}
