import { Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Cover } from "@/components/cover";
import { usePlayer } from "@/lib/player-store";
import type { Artist, Playlist, RadioStation, Track } from "@/lib/types";
import { radioToTrack } from "@/lib/music-api";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const triggerHaptic = () => {
  try {
    Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Ignore on web
  }
};

/* ────────────────────────────────────────────────
   White Play Disc Overlay
   Fades in and rises 4px on hover (desktop)
   ──────────────────────────────────────────────── */
function PlayBadge({ active, playing }: { active?: boolean; playing?: boolean }) {
  return (
    <span
      className={cn(
        "absolute right-3 bottom-3 z-20 flex items-center justify-center size-10 transition-all duration-200 ease-out pointer-events-none",
        active && playing
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-1 scale-95 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:scale-100"
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

/* ────────────────────────────────────────────────
   Top Pick Card — square format with caption beneath
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
      className="group relative w-[210px] sm:w-[230px] shrink-0 snap-start text-left rounded-xl transition-all duration-200 ease-out focus-visible:outline-none"
    >
      {/* Native Square Artwork */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#151211] border border-white/[0.06] transition-transform duration-300 ease-out lg:group-hover:scale-[1.02]">
        <Cover
          src={track.artworkLg || track.artwork}
          alt={track.title}
          title={track.title}
          className="size-full object-cover"
        />
        <PlayBadge active={active} playing={isPlaying} />
      </div>

      {/* Caption BENEATH art */}
      <div className="mt-3 px-0.5 flex flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A726C] mb-1">
          {label}
        </span>
        <span className={cn(
          "line-clamp-2 text-[15px] font-medium leading-snug transition-colors",
          active ? "text-[#FF5B2E]" : "text-[#F4EFEA] lg:group-hover:text-white"
        )}>
          {track.title}
        </span>
        <span className="truncate text-[13px] text-[#A9A19B] mt-0.5 font-normal">
          {track.artist}
        </span>
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────
   Album / Track Card
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
      className="group relative w-36 sm:w-44 shrink-0 snap-start text-left rounded-xl transition-all duration-200 ease-out focus-visible:outline-none"
    >
      {/* Square Artwork */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#151211] border border-white/[0.06] transition-transform duration-300 ease-out lg:group-hover:scale-[1.02]">
        <Cover
          src={track.artworkLg || track.artwork}
          alt={track.title}
          title={track.title}
          className="size-full object-cover"
        />
        <PlayBadge active={active} playing={isPlaying} />
      </div>

      {/* Caption */}
      <div className="mt-2.5 px-0.5">
        <span className={cn(
          "block truncate text-[14px] font-medium leading-snug transition-colors",
          active ? "text-[#FF5B2E]" : "text-[#F4EFEA] lg:group-hover:text-white"
        )}>
          {track.title}
        </span>
        <span className="block truncate text-[13px] text-[#A9A19B] mt-0.5 leading-snug font-normal">
          {track.artist}
        </span>
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
      className="group w-36 sm:w-44 shrink-0 snap-start rounded-xl transition-all duration-200 ease-out focus-visible:outline-none"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#151211] border border-white/[0.06] transition-transform duration-300 ease-out lg:group-hover:scale-[1.02]">
        <Cover
          src={playlist.artworkLg || playlist.artwork}
          alt={playlist.name}
          title={playlist.name}
          className="size-full object-cover"
        />
        <PlayBadge />
      </div>

      <div className="mt-2.5 px-0.5">
        <span className="block truncate text-[14px] font-medium text-[#F4EFEA] leading-snug lg:group-hover:text-[#FF5B2E] transition-colors">
          {playlist.name}
        </span>
        <span className="block truncate text-[13px] text-[#A9A19B] mt-0.5 leading-snug font-normal">
          {playlist.isAlbum ? "Album" : "Playlist"}
          {playlist.owner ? ` · ${playlist.owner}` : ""}
        </span>
      </div>
    </Link>
  );
}

/* ────────────────────────────────────────────────
   Artist Card — circular avatar
   ──────────────────────────────────────────────── */
export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      to="/artist/$id"
      params={{ id: artist.id }}
      onPointerDown={triggerHaptic}
      className="group w-32 sm:w-36 shrink-0 snap-start text-center rounded-full transition-all duration-200 active:scale-95 focus-visible:outline-none"
    >
      <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-[#151211] border border-white/[0.08] shadow-sm transition-transform duration-300 ease-out lg:group-hover:scale-[1.03]">
        <Cover
          src={artist.artworkLg || artist.artwork}
          alt={artist.name}
          title={artist.name}
          rounded="full"
          className="size-full object-cover"
        />
      </div>
      <div className="mt-2.5 px-1">
        <span className="block truncate text-[14px] font-medium text-[#F4EFEA] lg:group-hover:text-[#FF5B2E] transition-colors">
          {artist.name}
        </span>
        <span className="block text-[12px] text-[#A9A19B] mt-0.5 font-normal">Artist</span>
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
      className="group w-36 sm:w-44 shrink-0 snap-start text-left rounded-xl transition-all duration-200 ease-out focus-visible:outline-none"
    >
      <div className={cn(
        "relative aspect-square w-full overflow-hidden rounded-xl bg-[#151211] border border-white/[0.06] transition-transform duration-300 ease-out lg:group-hover:scale-[1.02]",
        active && "border-[#FF5B2E]/60",
      )}>
        <Cover
          src={station.artwork}
          alt={station.name}
          title={station.name}
          className="size-full object-cover"
        />
        <PlayBadge active={active} playing={isPlaying} />
      </div>
      <div className="mt-2.5 px-0.5">
        <span className={cn(
          "block truncate text-[14px] font-medium leading-snug transition-colors",
          active ? "text-[#FF5B2E]" : "text-[#F4EFEA] lg:group-hover:text-white"
        )}>
          {station.name}
        </span>
        <span className="block truncate text-[13px] text-[#A9A19B] mt-0.5 leading-snug font-normal">
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
      className="group relative flex aspect-[16/10] min-w-36 flex-1 flex-col justify-end overflow-hidden rounded-2xl p-4 transition-all duration-200 border border-white/[0.06] active:scale-[0.98]"
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
        <span className="text-[17px] font-semibold text-white lg:group-hover:text-[#FF5B2E] transition-colors leading-tight">
          {label}
        </span>
        {subtitle ? (
          <span className="text-[12px] font-normal text-[#A9A19B] mt-1 leading-snug">
            {subtitle}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
