import { Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Cover } from "@/components/cover";
import { Equalizer } from "@/components/equalizer";
import { usePlayer } from "@/lib/player-store";
import type { Artist, Playlist, RadioStation, Track } from "@/lib/types";
import { radioToTrack } from "@/lib/music-api";
import { cn } from "@/lib/utils";

function PlayBadge({ active, playing }: { active?: boolean; playing?: boolean }) {
  return (
    <span
      className={cn(
        "absolute right-2 bottom-2 grid size-10 place-items-center rounded-full bg-fg text-bg shadow-play",
        "translate-y-2 opacity-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "group-hover:translate-y-0 group-hover:opacity-100",
        active && playing && "translate-y-0 opacity-100",
      )}
    >
      {active && playing ? (
        <Equalizer className="[&_span]:bg-bg" />
      ) : (
        <Play className="size-5 fill-current" style={{ marginLeft: 2 }} />
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
      className="group w-36 shrink-0 snap-start text-left sm:w-40"
    >
      <span className="relative block">
        <Cover
          src={track.artworkLg || track.artwork}
          alt={track.title}
          title={track.title}
          className="aspect-square w-full transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />
        <PlayBadge active={active} playing={isPlaying} />
      </span>
      <span className={cn("mt-2 block truncate text-sm font-medium", active && "text-accent")}>
        {track.title}
      </span>
      <span className="block truncate text-xs text-muted">{track.artist}</span>
    </button>
  );
}

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      to="/playlist/$id"
      params={{ id: playlist.id }}
      className="group w-36 shrink-0 snap-start sm:w-40"
    >
      <span className="relative block">
        <Cover
          src={playlist.artworkLg || playlist.artwork}
          alt={playlist.name}
          title={playlist.name}
          className="aspect-square w-full transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />
        <PlayBadge />
      </span>
      <span className="mt-2 block truncate text-sm font-medium">{playlist.name}</span>
      <span className="block truncate text-xs text-muted">
        {playlist.isAlbum ? "Album" : "Playlist"}
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
      className="group w-32 shrink-0 snap-start text-center sm:w-36"
    >
      <Cover
        src={artist.artworkLg || artist.artwork}
        alt={artist.name}
        title={artist.name}
        rounded="full"
        className="mx-auto aspect-square w-full transition-transform duration-300 ease-out group-hover:scale-[1.03]"
      />
      <span className="mt-2 block truncate text-sm font-medium">{artist.name}</span>
      <span className="block text-xs text-muted">Artist</span>
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
      className="group w-36 shrink-0 snap-start text-left sm:w-40"
    >
      <span className="relative block">
        <Cover
          src={station.artwork}
          alt={station.name}
          title={station.name}
          className="aspect-square w-full"
        />
        <PlayBadge active={active} playing={isPlaying} />
      </span>
      <span className={cn("mt-2 block truncate text-sm font-medium", active && "text-accent")}>
        {station.name}
      </span>
      <span className="block truncate text-xs text-muted">
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
