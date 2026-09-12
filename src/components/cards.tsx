import { Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Cover } from "@/components/cover";
import { Equalizer } from "@/components/equalizer";
import { usePlayer } from "@/lib/player-store";
import type { Artist, Playlist, RadioStation, Track } from "@/lib/types";
import { radioToTrack } from "@/lib/music-api";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function PlayBadge({ active, playing }: { active?: boolean; playing?: boolean }) {
  return (
    <span
      className={cn(
        "absolute right-2.5 bottom-2.5 grid size-9 place-items-center rounded-full bg-brass text-abyss shadow-md",
        "translate-y-2 opacity-0 transition-[opacity,transform] duration-200 ease-out",
        "group-hover:translate-y-0 group-hover:opacity-100",
        active && playing && "translate-y-0 opacity-100",
      )}
    >
      {active && playing ? (
        <span className="flex items-center gap-0.5">
          <span className="size-1 rounded-full bg-abyss animate-bounce" />
          <span className="size-1 rounded-full bg-abyss animate-bounce delay-100" />
        </span>
      ) : (
        <Play className="size-4 fill-current ml-0.5" />
      )}
    </span>
  );
}

export function AlbumCard({
  track,
  queue,
}: {
  track: Track;
  queue?: Track[];
}) {
  const playTracks = usePlayer((s) => s.playTracks);
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const active = current?.id === track.id;

  return (
    <button
      type="button"
      onClick={() => playTracks(queue?.length ? queue : [track], queue?.findIndex((t) => t.id === track.id) ?? 0)}
      className="group relative w-36 shrink-0 snap-start text-left sm:w-44 rounded-xl p-2.5 transition-all duration-200 hover:bg-ink-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass"
    >
      <div className="relative aspect-square w-full">
        {/* Tactile vinyl disc sliding out on hover with etched label */}
        <div
          className={cn(
            "vinyl-etched absolute inset-y-1 right-0 w-[92%] rounded-full transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] pointer-events-none",
            "group-hover:translate-x-6 group-hover:rotate-12 shadow-xl",
            active && isPlaying && "translate-x-5 rotate-12",
          )}
          aria-hidden="true"
        >
          {/* Concentric etched sounding grooves */}
          <div className="vinyl-grooves-etched absolute inset-0 rounded-full" />
          {/* Matte etched brass & ink center label */}
          <div className="absolute inset-0 m-auto size-[36%] rounded-full border border-brass/40 bg-ink overflow-hidden shadow-inner flex flex-col items-center justify-center p-1">
            <span className="text-[7px] font-mono tracking-widest text-brass-dim uppercase">SONARA</span>
            <div className="size-2 my-0.5 rounded-full bg-abyss border border-brass/60" />
            <span className="text-[6px] font-mono text-muted tabular-nums">45 RPM</span>
          </div>
        </div>

        {/* Front Album Jacket Cover */}
        <div className={cn(
          "relative z-10 block overflow-hidden rounded border border-brass/20 bg-abyss transition-all duration-200 group-hover:border-brass group-hover:shadow-lg",
          active && "border-brass",
        )}>
          <Cover
            src={track.artworkLg || track.artwork}
            alt={track.title}
            title={track.title}
            className="aspect-square w-full transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
          <PlayBadge active={active} playing={isPlaying} />
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className={cn(
          "block truncate font-display font-medium text-sm transition-colors",
          active ? "text-brass" : "text-paper group-hover:text-brass",
        )}>
          {track.title}
        </span>
        {track.duration ? (
          <span className="font-mono text-[10px] text-muted tabular-nums shrink-0">
            {formatTime(track.duration)}
          </span>
        ) : null}
      </div>
      <span className="block truncate font-mono text-xs text-muted mt-0.5">{track.artist}</span>
    </button>
  );
}

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      to="/playlist/$id"
      params={{ id: playlist.id }}
      className="group w-36 shrink-0 snap-start sm:w-40 rounded-xl p-2.5 transition-all duration-200 hover:bg-ink-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass"
    >
      <div className="relative block overflow-hidden rounded border border-brass/20 bg-abyss transition-all duration-200 group-hover:border-brass group-hover:shadow-md">
        <Cover
          src={playlist.artworkLg || playlist.artwork}
          alt={playlist.name}
          title={playlist.name}
          className="aspect-square w-full transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />
        <PlayBadge />
      </div>
      <span className="mt-2.5 block truncate font-display font-medium text-sm text-paper group-hover:text-brass transition-colors">
        {playlist.name}
      </span>
      <span className="block truncate font-mono text-xs text-muted mt-0.5">
        {playlist.isAlbum ? "Archive LP" : "Sounding Mix"}
        {playlist.owner ? ` · ${playlist.owner}` : ""}
      </span>
    </Link>
  );
}

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      to="/artist/$id"
      params={{ id: artist.id }}
      className="group w-32 shrink-0 snap-start text-center sm:w-36 rounded-xl p-2 transition-all duration-200 hover:bg-ink-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass"
    >
      <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full border border-brass/20 bg-abyss transition-all duration-200 group-hover:border-brass group-hover:shadow-md">
        <Cover
          src={artist.artworkLg || artist.artwork}
          alt={artist.name}
          title={artist.name}
          rounded="full"
          className="aspect-square w-full transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
      </div>
      <span className="mt-2.5 block truncate font-display font-medium text-sm text-paper group-hover:text-brass transition-colors">
        {artist.name}
      </span>
      <span className="block font-mono text-xs text-muted">Surveyor</span>
    </Link>
  );
}

export function RadioCard({ station }: { station: RadioStation }) {
  const playTrack = usePlayer((s) => s.playTrack);
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const track = radioToTrack(station);
  const active = current?.id === track.id;

  return (
    <button
      type="button"
      onClick={() => playTrack(track)}
      className="group w-36 shrink-0 snap-start text-left sm:w-40 rounded-2xl p-2 transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <span className={cn(
        "relative block overflow-hidden rounded-xl border border-white/10 transition-all duration-300 group-hover:border-white/25 group-hover:shadow-lg",
        active && "border-accent/50 shadow-[0_0_18px_var(--color-glow)]",
      )}>
        <Cover
          src={station.artwork}
          alt={station.name}
          title={station.name}
          className="aspect-square w-full transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
        <PlayBadge active={active} playing={isPlaying} />
      </span>
      <span className={cn("mt-2.5 block truncate text-sm font-semibold tracking-tight transition-colors", active ? "text-accent" : "text-fg group-hover:text-white")}>
        {station.name}
      </span>
      <span className="block truncate text-xs text-muted/80">
        {station.country || "Live"} · Radio
      </span>
    </button>
  );
}

export function MoodCard({
  label,
  query,
  subtitle,
  image,
}: {
  label: string;
  query: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <Link
      to="/search"
      search={{ q: query }}
      className="group relative flex h-28 sm:h-32 min-w-36 flex-1 flex-col justify-end overflow-hidden rounded-2xl p-4 border border-white/10 hover:border-white/30 shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-98"
    >
      {image ? (
        <img
          src={image}
          alt={label}
          className="absolute inset-0 h-full w-full object-cover brightness-[0.75] contrast-[1.08] saturate-[1.15] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:brightness-[0.85]"
          loading="lazy"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 transition-opacity duration-300 group-hover:opacity-85" />
      <div className="relative z-10 flex flex-col">
        <span className="text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-md group-hover:text-accent transition-colors">
          {label}
        </span>
        {subtitle ? (
          <span className="text-[11px] font-medium text-white/70 drop-shadow">
            {subtitle}
          </span>
        ) : null}
      </div>
      <span className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 scale-75">
        <Play className="size-3.5 fill-current ml-0.5" />
      </span>
    </Link>
  );
}
