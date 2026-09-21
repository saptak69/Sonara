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

  return (
    <aside
      data-open={open}
      className={cn(
        "fixed top-0 right-0 z-50 flex h-[100dvh] md:hidden w-full flex-col bg-bg/95 backdrop-blur-3xl transition-transform duration-300",
        "data-[open=false]:translate-x-full"
      )}
    >
      <div className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+16px)] pb-4 border-b border-white/5 bg-transparent">
        <h2 className="text-lg font-bold text-white tracking-tight">Queue</h2>
        <Button variant="icon" size="iconSm" aria-label="Close queue" onClick={() => setQueueOpen(false)} className="text-white/60 hover:text-white bg-white/10 rounded-full">
          <X className="size-5" />
        </Button>
      </div>
      <QueueList />
    </aside>
  );
}
