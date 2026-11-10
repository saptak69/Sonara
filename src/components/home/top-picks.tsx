import { PlayBadge } from "@/components/cards";
import { tapFeedback } from "@/lib/haptics";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import type { Pick } from "./use-top-picks";

const CARD_WIDTH = "w-[min(78vw,320px)] sm:w-[300px] md:w-[320px] desk:w-[340px] short:w-[220px] tvd:w-[420px]";

export function PickCard({ pick, first }: { pick: Pick; first: boolean }) {
  const playing = usePlayer((s) => s.isPlaying);
  return (
    <button
      type="button"
      onClick={pick.onSelect}
      onPointerDown={() => tapFeedback()}
      data-tv-autofocus={first ? true : undefined}
      className={cn("tv-card group shrink-0 snap-start cursor-pointer rounded-2xl text-left", CARD_WIDTH)}
    >
      <span className="relative block aspect-square overflow-hidden rounded-2xl bg-surface shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10 transition-transform duration-300 ease-out lg:group-hover:scale-[1.02]">
        {pick.cover}
        <PlayBadge active={pick.active} playing={playing} />
      </span>
      <span className="mt-3 block px-0.5">
        <span className={cn("block text-[11px] font-semibold tracking-[0.08em] uppercase tvd:text-sm", pick.active ? "text-accent" : "text-subtle")}>
          {pick.kicker}
        </span>
        <span className="mt-0.5 block truncate text-[17px] font-semibold tracking-tight text-fg tvd:text-2xl">{pick.title}</span>
        <span className="block truncate text-[15px] text-muted tvd:text-xl">{pick.subtitle}</span>
      </span>
    </button>
  );
}

export function PickSkeleton() {
  return (
    <div aria-hidden className={cn("shrink-0", CARD_WIDTH)}>
      <div className="skeleton aspect-square rounded-2xl" />
      <div className="skeleton mt-3 h-3 w-24 rounded" />
      <div className="skeleton mt-2 h-4 w-3/4 rounded" />
    </div>
  );
}
