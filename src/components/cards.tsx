import { Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Cover } from "@/components/cover";
import { usePlayer } from "@/lib/player-store";
import type { Artist, Playlist, RadioStation, Track } from "@/lib/types";
import { radioToTrack } from "@/lib/music-api";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const triggerHaptic = () => {
  try {
    Haptics.impact({ style: ImpactStyle.Light });
  } catch (err) {
    // Ignore on web
  }
};

/* ────────────────────────────────────────────────
   Apple Music–style overlay play button
   Shows on hover (desktop) or when actively playing
   ──────────────────────────────────────────────── */
function PlayBadge({ active, playing }: { active?: boolean; playing?: boolean }) {
  return (
    <span
      className={cn(
        "absolute right-2 bottom-2 z-20 flex items-center justify-center size-[44px] opacity-0 transition-all duration-300 ease-[cubic-bezier(0.2,0,0.1,1)]",
        "lg:group-hover:opacity-100",
        active && playing && "opacity-100",
      )}
    >
      <div className={cn(
        "grid size-full place-items-center rounded-full bg-black/40 text-white backdrop-blur-[10px] transition-all duration-300 border border-white/20",
        "translate-y-2 lg:group-hover:translate-y-0 scale-90 lg:group-hover:scale-100",
        active && playing && "translate-y-0 scale-100 bg-accent/80 text-white border-accent/20",
      )}>
      {active && playing ? (
        <span className="flex items-center gap-[2px]">
          <div className="w-[3px] bg-current rounded-t-sm animate-[equalizer_0.8s_ease-in-out_infinite] h-2.5" />
          <div className="w-[3px] bg-current rounded-t-sm animate-[equalizer_1.2s_ease-in-out_infinite] h-3.5" style={{ animationDelay: '0.2s' }} />
          <div className="w-[3px] bg-current rounded-t-sm animate-[equalizer_0.9s_ease-in-out_infinite] h-2.5" style={{ animationDelay: '0.4s' }} />
        </span>
      ) : (
        <Play className="size-5 fill-current ml-0.5" />
      )}
    </div>
    </span>
  );
}

/* ────────────────────────────────────────────────
   Album / Track Card
   Clean artwork + metadata below — Apple Music style
   ──────────────────────────────────────────────── */
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
      onPointerDown={triggerHaptic}
      className="group relative w-40 shrink-0 snap-start text-left sm:w-44 rounded-xl transition-all duration-[0.25s] ease-[cubic-bezier(0.2,0,0.1,1)] active:enabled:scale-[0.97] lg:hover:scale-[1.025] focus-visible:outline-none"
    >
      {/* Artwork */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface transition-shadow duration-[0.25s] lg:group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] lg:group-hover:shadow-black/20">
        <Cover
          src={track.artworkLg || track.artwork}
          alt={track.title}
          title={track.title}
          className="aspect-square w-full"
        />
        
        {/* Apple Music Style Corner Logo */}
        <div className="absolute top-2 right-2.5 z-10 flex items-center gap-1 opacity-90 drop-shadow-md">
          <svg viewBox="0 0 100 100" className="size-2.5 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M50 0a50 50 0 1050 50A50 50 0 0050 0zM35.6 77.1V22.9h14.9a26.9 26.9 0 0113.6 3.4 15.6 15.6 0 017 9.4 34.6 34.6 0 012 11.7 39.5 39.5 0 01-1.7 11.8 15.2 15.2 0 01-6.5 9 29.8 29.8 0 01-14.8 3.5h-5.2v5.4H35.6zm10.7-14.7h3.8a13 13 0 0010.5-4.2 18.2 18.2 0 003.5-12.1 16.5 16.5 0 00-3.6-11.7 12 12 0 00-9.5-3.8h-4.7v31.8z"/></svg>
          <span className="text-white font-bold tracking-tight text-[9px]">Sonara</span>
        </div>

        <PlayBadge active={active} playing={isPlaying} />
      </div>

      {/* Metadata — clean and minimal like Apple Music */}
      <div className="mt-2.5 px-0.5">
        <span className={cn(
          "block truncate text-sm font-medium leading-snug transition-colors",
          active ? "text-accent" : "text-fg",
        )}>
          {track.title}
        </span>
        <span className="block truncate text-xs text-muted mt-0.5 leading-snug">{track.artist}</span>
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────
   Playlist Card
   ──────────────────────────────────────────────── */
export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      to="/playlist/$id"
      params={{ id: playlist.id }}
      onPointerDown={triggerHaptic}
      className="group w-40 shrink-0 snap-start sm:w-44 rounded-xl transition-all duration-[0.25s] ease-[cubic-bezier(0.2,0,0.1,1)] active:scale-[0.97] lg:hover:scale-[1.025] focus-visible:outline-none"
    >
      {/* Artwork */}
      <div className="relative overflow-hidden rounded-xl bg-surface transition-shadow duration-[0.25s] lg:group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] lg:group-hover:shadow-black/20">
        <Cover
          src={playlist.artworkLg || playlist.artwork}
          alt={playlist.name}
          title={playlist.name}
          className="aspect-square w-full"
        />
        
        {/* Apple Music Style Corner Logo */}
        <div className="absolute top-2 right-2.5 z-10 flex items-center gap-1 opacity-90 drop-shadow-md">
          <svg viewBox="0 0 100 100" className="size-2.5 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M50 0a50 50 0 1050 50A50 50 0 0050 0zM35.6 77.1V22.9h14.9a26.9 26.9 0 0113.6 3.4 15.6 15.6 0 017 9.4 34.6 34.6 0 012 11.7 39.5 39.5 0 01-1.7 11.8 15.2 15.2 0 01-6.5 9 29.8 29.8 0 01-14.8 3.5h-5.2v5.4H35.6zm10.7-14.7h3.8a13 13 0 0010.5-4.2 18.2 18.2 0 003.5-12.1 16.5 16.5 0 00-3.6-11.7 12 12 0 00-9.5-3.8h-4.7v31.8z"/></svg>
          <span className="text-white font-bold tracking-tight text-[9px]">Sonara</span>
        </div>

        <PlayBadge />
      </div>

      {/* Metadata */}
      <div className="mt-2.5 px-0.5">
        <span className="block truncate text-sm font-medium text-fg leading-snug lg:group-hover:text-accent transition-colors">
          {playlist.name}
        </span>
        <span className="block truncate text-xs text-muted mt-0.5 leading-snug">
          {playlist.isAlbum ? "Album" : "Playlist"}
          {playlist.owner ? ` · ${playlist.owner}` : ""}
        </span>
      </div>
    </Link>
  );
}

/* ────────────────────────────────────────────────
   Artist Card — circular artwork
   ──────────────────────────────────────────────── */
export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      to="/artist/$id"
      params={{ id: artist.id }}
      onPointerDown={triggerHaptic}
      className="group w-36 shrink-0 snap-start text-center sm:w-40 rounded-xl transition-all duration-[0.25s] ease-[cubic-bezier(0.2,0,0.1,1)] active:scale-[0.97] lg:hover:scale-[1.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-surface shadow-md transition-shadow duration-[0.25s] lg:group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] lg:group-hover:shadow-black/20">
        <Cover
          src={artist.artworkLg || artist.artwork}
          alt={artist.name}
          title={artist.name}
          rounded="full"
          className="aspect-square w-full"
        />
      </div>
      <div className="mt-2.5 px-0.5">
        <span className="block truncate text-sm font-medium text-fg leading-snug lg:group-hover:text-accent transition-colors">
          {artist.name}
        </span>
        <span className="block truncate text-xs text-muted mt-0.5 leading-snug">Artist</span>
      </div>
    </Link>
  );
}

/* ────────────────────────────────────────────────
   Radio Station Card
   ──────────────────────────────────────────────── */
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
      onPointerDown={triggerHaptic}
      className="group w-40 shrink-0 snap-start text-left sm:w-44 rounded-xl transition-all duration-[0.25s] ease-[cubic-bezier(0.2,0,0.1,1)] active:enabled:scale-[0.97] lg:hover:scale-[1.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      <div className={cn(
        "relative overflow-hidden rounded-xl bg-surface transition-shadow duration-[0.25s] lg:group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] lg:group-hover:shadow-black/20",
        active && "ring-2 ring-accent/60",
      )}>
        <Cover
          src={station.artwork}
          alt={station.name}
          title={station.name}
          className="aspect-square w-full"
        />
        <PlayBadge active={active} playing={isPlaying} />
      </div>
      <div className="mt-2.5 px-0.5">
        <span className={cn("block truncate text-sm font-medium transition-colors leading-snug", active ? "text-accent" : "text-fg lg:group-hover:text-accent")}>
          {station.name}
        </span>
        <span className="block truncate text-xs text-muted mt-0.5 leading-snug">
          {station.country || "Live"} · Radio
        </span>
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────
   Mood / Genre Card
   ──────────────────────────────────────────────── */
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
      onPointerDown={triggerHaptic}
      className="group relative flex h-28 sm:h-32 min-w-36 flex-1 flex-col justify-end overflow-hidden rounded-xl p-4 shadow-lg lg:hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all duration-[0.25s] ease-[cubic-bezier(0.2,0,0.1,1)] active:scale-[0.97] lg:hover:scale-[1.025]"
    >
      {image ? (
        <img
          src={image}
          alt={label}
          className="absolute inset-0 h-full w-full object-cover brightness-[0.7] saturate-[1.1] transition-transform duration-500 ease-out lg:group-hover:scale-105"
          loading="lazy"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative z-10 flex flex-col">
        <span className="truncate text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-md leading-tight lg:group-hover:text-accent transition-colors">
          {label}
        </span>
        {subtitle ? (
          <span className="truncate text-[11px] font-medium text-white/70 drop-shadow mt-0.5">
            {subtitle}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

/* ────────────────────────────────────────────────
   Top Pick Card — large format with text overlay
   ──────────────────────────────────────────────── */
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
    <button
      type="button"
      onClick={() => playTracks(queue?.length ? queue : [track], queue?.findIndex((t) => t.id === track.id) ?? 0)}
      onPointerDown={triggerHaptic}
      className="group relative w-[310px] shrink-0 snap-start text-left rounded-xl transition-all duration-[0.25s] ease-[cubic-bezier(0.2,0,0.1,1)] active:enabled:scale-[0.98] lg:hover:scale-[1.02] focus-visible:outline-none aspect-[4/5] overflow-hidden shadow-md lg:hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)]"
    >
      <Cover
        src={track.artworkLg || track.artwork}
        alt={track.title}
        title={track.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out lg:group-hover:scale-105"
      />
      
      {/* Top right Logo */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 opacity-90 drop-shadow-md">
        <svg viewBox="0 0 100 100" className="size-4 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M50 0a50 50 0 1050 50A50 50 0 0050 0zM35.6 77.1V22.9h14.9a26.9 26.9 0 0113.6 3.4 15.6 15.6 0 017 9.4 34.6 34.6 0 012 11.7 39.5 39.5 0 01-1.7 11.8 15.2 15.2 0 01-6.5 9 29.8 29.8 0 01-14.8 3.5h-5.2v5.4H35.6zm10.7-14.7h3.8a13 13 0 0010.5-4.2 18.2 18.2 0 003.5-12.1 16.5 16.5 0 00-3.6-11.7 12 12 0 00-9.5-3.8h-4.7v31.8z"/></svg>
        <span className="text-white font-bold tracking-tight text-sm">Sonara</span>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/0 opacity-90" />
      
      <PlayBadge active={active} playing={isPlaying} />

      <div className="absolute inset-x-0 bottom-0 p-5 z-10 flex flex-col justify-end">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80 drop-shadow mb-1">
          {label}
        </span>
        <span className="truncate text-2xl font-bold text-white drop-shadow-md leading-tight mb-1">
          {track.title}
        </span>
        <span className="truncate text-sm text-white/70 drop-shadow">
          {track.artist}
        </span>
      </div>
    </button>
  );
}
