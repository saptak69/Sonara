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

function PlayBadge({ active, playing }: { active?: boolean; playing?: boolean }) {
  return (
    <span
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 transition-opacity duration-300",
        "group-hover:opacity-100",
        active && playing && "opacity-100 bg-black/60",
      )}
    >
      <div className={cn(
        "grid size-12 place-items-center rounded-full bg-accent/90 text-white shadow-xl transition-transform duration-300",
        "translate-y-4 group-hover:translate-y-0",
        active && playing && "translate-y-0 scale-100",
      )}>
      {active && playing ? (
        <span className="flex items-center gap-1">
          <div className="w-1 bg-white rounded-t-sm animate-[equalizer_0.8s_ease-in-out_infinite] h-3" />
          <div className="w-1 bg-white rounded-t-sm animate-[equalizer_1.2s_ease-in-out_infinite] h-4" style={{ animationDelay: '0.2s' }} />
          <div className="w-1 bg-white rounded-t-sm animate-[equalizer_0.9s_ease-in-out_infinite] h-3" style={{ animationDelay: '0.4s' }} />
        </span>
      ) : (
        <Play className="size-5 fill-current ml-1" />
      )}
    </div>
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
      onPointerDown={triggerHaptic}
      className="group relative w-36 shrink-0 snap-start text-left sm:w-44 rounded-xl p-2.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-surface hover:-translate-y-1 hover:shadow-2xl active:enabled:scale-[0.95] active:enabled:transition-transform active:enabled:duration-100 active:enabled:ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
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
          "relative z-10 block overflow-hidden rounded-lg bg-surface transition-all duration-300 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]",
        )}>
          <Cover
            src={track.artworkLg || track.artwork}
            alt={track.title}
            title={track.title}
            className="aspect-square w-full transition-transform duration-[3s] ease-out group-hover:scale-110"
          />
          
          {/* Simulated Video Preview / Hover Visualizer Overlay */}
          <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-screen bg-gradient-to-tr from-accent/40 via-transparent to-transparent flex items-end justify-between px-2 pb-2 gap-0.5">
             {Array.from({length: 12}).map((_, i) => (
                <div 
                   key={i} 
                   className="flex-1 bg-white/50 rounded-t-full origin-bottom"
                   style={{ 
                      animation: `equalizer ${0.5 + Math.random()}s ease-in-out infinite alternate`,
                      animationDelay: `${Math.random()}s`,
                      maxHeight: `${20 + Math.random() * 40}%`
                   }}
                />
             ))}
          </div>

          <PlayBadge active={active} playing={isPlaying} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className={cn(
          "block truncate font-medium text-sm transition-colors",
          active ? "text-accent" : "text-fg group-hover:text-accent",
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
      onPointerDown={triggerHaptic}
      className="group w-36 shrink-0 snap-start sm:w-40 rounded-xl p-2.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-surface hover:-translate-y-1 hover:shadow-2xl active:scale-[0.95] active:transition-transform active:duration-100 active:ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
    >
      <div className="relative block overflow-hidden rounded-lg bg-surface transition-all duration-300 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        <Cover
          src={playlist.artworkLg || playlist.artwork}
          alt={playlist.name}
          title={playlist.name}
          className="aspect-square w-full transition-transform duration-[3s] ease-out group-hover:scale-110"
        />
        
        {/* Simulated Video Preview / Hover Visualizer Overlay */}
        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-screen bg-gradient-to-tr from-accent/40 via-transparent to-transparent flex items-end justify-between px-2 pb-2 gap-0.5">
           {Array.from({length: 12}).map((_, i) => (
              <div 
                 key={i} 
                 className="flex-1 bg-white/50 rounded-t-full origin-bottom"
                 style={{ 
                    animation: `equalizer ${0.5 + Math.random()}s ease-in-out infinite alternate`,
                    animationDelay: `${Math.random()}s`,
                    maxHeight: `${20 + Math.random() * 40}%`
                 }}
              />
           ))}
        </div>

        <PlayBadge />
      </div>
      <span className="mt-3 block truncate font-medium text-sm text-fg group-hover:text-accent transition-colors">
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
      onPointerDown={triggerHaptic}
      className="group w-32 shrink-0 snap-start text-center sm:w-36 rounded-xl p-2 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-surface hover:-translate-y-1 hover:shadow-2xl active:scale-[0.95] active:transition-transform active:duration-100 active:ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
    >
      <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-surface transition-all duration-300 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        <Cover
          src={artist.artworkLg || artist.artwork}
          alt={artist.name}
          title={artist.name}
          rounded="full"
          className="aspect-square w-full transition-transform duration-[3s] ease-out group-hover:scale-110"
        />
      </div>
      <span className="mt-3 block truncate font-medium text-sm text-fg group-hover:text-accent transition-colors">
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
      onPointerDown={triggerHaptic}
      className="group w-36 shrink-0 snap-start text-left sm:w-40 rounded-xl p-2.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-surface hover:-translate-y-1 hover:shadow-2xl active:enabled:scale-[0.95] active:enabled:transition-transform active:enabled:duration-100 active:enabled:ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
    >
      <div className={cn(
        "relative block overflow-hidden rounded-lg bg-surface transition-all duration-300 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]",
        active && "ring-1 ring-accent/50",
      )}>
        <Cover
          src={station.artwork}
          alt={station.name}
          title={station.name}
          className="aspect-square w-full transition-transform duration-[3s] ease-out group-hover:scale-110"
        />
        
        {/* Simulated Video Preview / Hover Visualizer Overlay */}
        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-screen bg-gradient-to-tr from-accent/40 via-transparent to-transparent flex items-end justify-between px-2 pb-2 gap-0.5">
           {Array.from({length: 12}).map((_, i) => (
              <div 
                 key={i} 
                 className="flex-1 bg-white/50 rounded-t-full origin-bottom"
                 style={{ 
                    animation: `equalizer ${0.5 + Math.random()}s ease-in-out infinite alternate`,
                    animationDelay: `${Math.random()}s`,
                    maxHeight: `${20 + Math.random() * 40}%`
                 }}
              />
           ))}
        </div>
        <PlayBadge active={active} playing={isPlaying} />
      </div>
      <span className={cn("mt-3 block truncate text-sm font-medium transition-colors", active ? "text-accent" : "text-fg group-hover:text-accent")}>
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
      onPointerDown={triggerHaptic}
      className="group relative flex h-28 sm:h-32 min-w-36 flex-1 flex-col justify-end overflow-hidden rounded-2xl p-4 border border-white/10 hover:border-white/30 shadow-lg hover:shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.95] active:transition-transform active:duration-100 active:ease-out"
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
