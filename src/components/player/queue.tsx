import { X } from "lucide-react";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/player-store";

export function QueuePanel() {
  const open = usePlayer((s) => s.queueOpen);
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const setQueueOpen = usePlayer((s) => s.setQueueOpen);
  const upcoming = queue.slice(index + 1);
  const current = queue[index];

  return (
    <aside
      data-open={open}
      className="queue-drawer fixed top-0 right-0 z-50 flex h-[calc(100dvh-var(--spacing-player))] w-[min(22rem,100vw)] flex-col border-l border-border bg-surface"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold">Queue</h2>
        <Button variant="icon" size="iconSm" aria-label="Close queue" onClick={() => setQueueOpen(false)}>
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {current ? (
          <div className="mb-4">
            <p className="px-2 pb-2 text-[11px] font-medium tracking-wide text-subtle uppercase">
              Now playing
            </p>
            <TrackRow track={current} queue={queue} />
          </div>
        ) : (
          <p className="px-3 py-8 text-sm text-muted">Nothing in the queue yet.</p>
        )}
        {upcoming.length ? (
          <div>
            <p className="px-2 pb-2 text-[11px] font-medium tracking-wide text-subtle uppercase">
              Next
            </p>
            {upcoming.map((t) => (
              <TrackRow key={t.id} track={t} queue={queue} />
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
