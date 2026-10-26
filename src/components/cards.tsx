import { Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Cover } from "@/components/cover";
import { usePlayer } from "@/lib/player-store";
import type { Artist, Playlist, RadioStation, Track } from "@/lib/types";
import { radioToTrack } from "@/lib/music-api";
import { cn } from "@/lib/utils";
import { tapFeedback as triggerHaptic } from "@/lib/haptics";
import { TrackMenuButton } from "@/components/track-menu";

// Round play button shown over artwork on hover / focus
function PlayBadge({ active, playing }: { active?: boolean; playing?: boolean }) {
  return (
    <span
      className={cn(
        "absolute right-3 bottom-3 z-20 flex items-center justify-center size-10 transition-all duration-200 ease-out pointer-events-none",
        active && playing
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-1 scale-95 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:scale-100"
      )}
    >
      <div className={cn(
        "grid size-full place-items-center rounded-full bg-white text-black shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-transform duration-150 active:scale-95"
      )}>
        {active && playing ? (
          <span className="flex items-center gap-[2px]">
            <div className="w-[2.5px] bg-black rounded-t-sm animate-[equalizer_0.8s_ease-in-out_infinite] h-2" />
            <div className="w-[2.5px] bg-black rounded-t-sm animate-[equalizer_1.2s_ease-in-out_infinite] h-3" style={{ animationDelay: '0.2s' }} />
            <div className="w-[2.5px] bg-black rounded-t-sm animate-[equalizer_0.9s_ease-in-out_infinite] h-2" style={{ animationDelay: '0.4s' }} />
          </span>
        ) : (
          <Play className="size-4 fill-black text-black ml-0.5" />
        )}
      </div>
    </span>
  );
}

// Large square card for the top of the home page
export function TopPickCard({
  track,
  queue,
  label = "Made for You",
}: {
  track: Track;
  queue?: Track[];
  label?: string;
}) {
  const playTracks = usePlayer((s) => s.playTracks);
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const active = current?.id === track.id;

  return (
    <div className="relative w-[210px] sm:w-[230px] shrink-0 snap-start">
      <button
        type="button"
        onClick={() => playTracks(queue?.length ? queue : [track], queue?.findIndex((t) => t.id === track.id) ?? 0)}
        onPointerDown={() => triggerHaptic()}
        className="group block w-full text-left rounded-xl tv-card transition-all duration-200 ease-out"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface border border-border transition-transform duration-300 ease-out lg:group-hover:scale-[1.02]">
          <Cover src={track.artworkLg || track.artwork} alt={track.title} title={track.title} className="size-full object-cover" />
          <PlayBadge active={active} playing={isPlaying} />
        </div>
        <div className="mt-3 flex flex-col px-0.5 pr-9">
          <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{label}</span>
          <span className={cn("line-clamp-2 text-[15px] font-medium leading-snug transition-colors", active ? "text-accent" : "text-fg")}>
            {track.title}
          </span>
          <span className="mt-0.5 truncate text-[13px] font-normal text-muted">{track.artist}</span>
        </div>
      </button>
      <TrackMenuButton track={track} rest={queue} className="absolute right-0 bottom-0 size-8" />
    </div>
  );
}

// Song card
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
    <div className="relative w-36 sm:w-44 shrink-0 snap-start">
      <button
        type="button"
        onClick={() => playTracks(queue?.length ? queue : [track], queue?.findIndex((t) => t.id === track.id) ?? 0)}
        onPointerDown={() => triggerHaptic()}
        className="group block w-full text-left rounded-xl tv-card transition-all duration-200 ease-out"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface border border-border transition-transform duration-300 ease-out lg:group-hover:scale-[1.02]">
          <Cover src={track.artworkLg || track.artwork} alt={track.title} title={track.title} className="size-full object-cover" />
          <PlayBadge active={active} playing={isPlaying} />
        </div>
        <div className="mt-2.5 px-0.5 pr-8">
          <span className={cn("block truncate text-[14px] font-medium leading-snug transition-colors", active ? "text-accent" : "text-fg")}>
            {track.title}
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-normal leading-snug text-muted">{track.artist}</span>
        </div>
      </button>
      <TrackMenuButton track={track} rest={queue} className="absolute right-[-6px] bottom-[-2px] size-8" />
    </div>
  );
}

// Playlist Card
export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      to="/playlist/$id"
      params={{ id: playlist.id }}
      onPointerDown={() => triggerHaptic()}
      className="group w-36 sm:w-44 shrink-0 snap-start rounded-xl tv-card transition-all duration-200 ease-out"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface border border-border transition-transform duration-300 ease-out lg:group-hover:scale-[1.02]">
        <Cover
          src={playlist.artworkLg || playlist.artwork}
          alt={playlist.name}
          title={playlist.name}
          className="size-full object-cover"
        />
        <PlayBadge />
      </div>

      <div className="mt-2.5 px-0.5">
        <span className="block truncate text-[14px] font-medium text-fg leading-snug lg:group-hover:text-accent transition-colors">
          {playlist.name}
        </span>
        <span className="block truncate text-[13px] text-muted mt-0.5 leading-snug font-normal">
          {playlist.isAlbum ? "Album" : "Playlist"}
          {playlist.owner ? ` · ${playlist.owner}` : ""}
        </span>
      </div>
    </Link>
  );
}

// Artist Card — circular avatar
export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      to="/artist/$id"
      params={{ id: artist.id }}
      onPointerDown={() => triggerHaptic()}
      className="group w-32 sm:w-36 shrink-0 snap-start text-center tv-card rounded-full transition-all duration-200 active:scale-95"
    >
      <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-surface border border-border shadow-sm transition-transform duration-300 ease-out lg:group-hover:scale-[1.03]">
        <Cover
          src={artist.artworkLg || artist.artwork}
          alt={artist.name}
          title={artist.name}
          rounded="full"
          className="size-full object-cover"
        />
      </div>
      <div className="mt-2.5 px-1">
        <span className="block truncate text-[14px] font-medium text-fg lg:group-hover:text-accent transition-colors">
          {artist.name}
        </span>
        <span className="block text-[12px] text-muted mt-0.5 font-normal">Artist</span>
      </div>
    </Link>
  );
}

// Radio Station Card (shelf)
export function RadioCard({ station }: { station: RadioStation }) {
  const playTrack = usePlayer((s) => s.playTrack);
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const track = radioToTrack(station);
  const active = current?.id === track.id;

  return (
    <div className="relative w-36 sm:w-44 shrink-0 snap-start">
      <button
        type="button"
        onClick={() => playTrack(track)}
        onPointerDown={() => triggerHaptic()}
        className="group block w-full text-left rounded-xl tv-card transition-all duration-200 ease-out"
      >
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-xl bg-surface border border-border transition-transform duration-300 ease-out lg:group-hover:scale-[1.02]",
            active && "border-accent/60",
          )}
        >
          <Cover src={station.artwork} alt={station.name} title={station.name} className="size-full object-cover" />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white backdrop-blur">
            <span className="size-1.5 rounded-full bg-accent" /> LIVE
          </span>
          <PlayBadge active={active} playing={isPlaying} />
        </div>
        <div className="mt-2.5 px-0.5 pr-8">
          <span className={cn("block truncate text-[14px] font-medium leading-snug transition-colors", active ? "text-accent" : "text-fg")}>
            {station.name}
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-normal leading-snug text-muted">{station.country || "Live radio"}</span>
        </div>
      </button>
      <TrackMenuButton track={track} className="absolute right-[-6px] bottom-[-2px] size-8" />
    </div>
  );
}

// Radio Station Tile (fills a grid cell, used on the Radio page)
export function RadioTile({ station }: { station: RadioStation }) {
  const playTrack = usePlayer((s) => s.playTrack);
  const toggle = usePlayer((s) => s.toggle);
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const track = radioToTrack(station);
  const active = current?.id === track.id;
  const tags = station.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => (active ? toggle() : playTrack(track))}
        onPointerDown={() => triggerHaptic()}
        className="group block w-full text-left rounded-2xl tv-card transition-all duration-200 ease-out"
      >
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-2xl border bg-surface transition-transform duration-300 ease-out lg:group-hover:scale-[1.02]",
            active ? "border-accent/70" : "border-border",
          )}
        >
          <Cover src={station.artwork} alt={station.name} title={station.name} className="size-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white backdrop-blur">
            <span className={cn("size-1.5 rounded-full bg-accent", active && isPlaying && "animate-pulse")} /> LIVE
          </span>
          <PlayBadge active={active} playing={isPlaying} />
        </div>
        <div className="mt-2.5 px-0.5 pr-8">
          <span className={cn("block truncate text-[14px] font-semibold leading-snug", active ? "text-accent" : "text-fg")}>
            {station.name}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] leading-snug text-muted">
            {[station.country, tags].filter(Boolean).join(" · ") || "Live radio"}
          </span>
        </div>
      </button>
      <TrackMenuButton track={track} className="absolute right-[-6px] bottom-[-2px] size-8" />
    </div>
  );
}

// Mood / Genre Card
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
      onPointerDown={() => triggerHaptic()}
      className="tv-card group relative flex aspect-[16/10] min-w-36 flex-1 flex-col justify-end overflow-hidden rounded-2xl p-4 transition-all duration-200 border border-border active:scale-[0.98]"
    >
      {image ? (
        <img
          src={image}
          alt={label}
          className="absolute inset-0 size-full object-cover brightness-[0.55] saturate-[0.8] transition-transform duration-500 ease-out lg:group-hover:scale-105"
          loading="lazy"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="relative z-10 flex flex-col">
        <span className="text-[17px] font-semibold text-white lg:group-hover:text-accent transition-colors leading-tight">
          {label}
        </span>
        {subtitle ? (
          <span className="text-[12px] font-normal text-muted mt-1 leading-snug">
            {subtitle}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
