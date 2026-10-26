import { Play } from "lucide-react";
import { Cover } from "@/components/cover";
import { TrackMenuButton } from "@/components/track-menu";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";

/**
 * The big banner at the top of the TV home screen: one song to start with.
 * Play is focused first, so a single OK press starts music.
 */
export function TvHero({ track, queue, kicker }: { track: Track | undefined; queue: Track[]; kicker: string }) {
  const playTracks = usePlayer((s) => s.playTracks);
  if (!track) return null;
  const art = track.artworkLg || track.artwork;
  const index = Math.max(0, queue.findIndex((t) => t.id === track.id));

  return (
    <section aria-label="Featured" className="relative isolate mb-8 hidden overflow-hidden rounded-[28px] border border-white/10 bg-surface tvd:block">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        {art ? <img src={art} alt="" className="size-full scale-125 object-cover opacity-40 blur-3xl saturate-150" /> : null}
        <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/60 to-bg/20" />
      </div>

      <div className="flex items-center justify-between gap-10 p-9">
        <div className="min-w-0 flex-1">
          <span className="text-sm font-bold tracking-[0.18em] text-accent uppercase">{kicker}</span>
          <h2 className="mt-3 line-clamp-2 text-[44px] leading-[1.08] font-bold tracking-tight text-fg">{track.title}</h2>
          <p className="mt-2 truncate text-2xl text-muted">{track.artist}</p>

          <div className="mt-7 flex items-center gap-3">
            <button
              type="button"
              data-tv-autofocus
              onClick={() => playTracks(queue.length ? queue : [track], index)}
              className="tv-card inline-flex h-16 cursor-pointer items-center gap-3 rounded-full bg-fg px-9 text-xl font-bold text-bg shadow-xl"
            >
              <Play className="size-6 fill-current" strokeWidth={0} />
              Play
            </button>
            <TrackMenuButton track={track} rest={queue} className="tv-card size-16 border border-white/10 bg-white/[0.07]" />
          </div>
        </div>

        <Cover
          src={art}
          alt={track.title}
          title={track.title}
          className="aspect-square w-[230px] shrink-0 rounded-3xl border border-white/10 object-cover shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
        />
      </div>
    </section>
  );
}
