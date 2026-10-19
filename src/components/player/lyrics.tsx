import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { fetchLyrics } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function LyricsPanel() {
  const track = usePlayer((s) => s.queue[s.index]);
  const currentTime = usePlayer((s) => s.currentTime);
  const open = usePlayer((s) => s.lyricsOpen);
  const seekTo = usePlayer((s) => s.seekTo);
  const activeRef = useRef<HTMLParagraphElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["lyrics", track?.id],
    queryFn: () => fetchLyrics(track!.title, track!.artist),
    enabled: open && Boolean(track) && track?.kind !== "radio",
  });

  const activeIndex =
    data?.synced?.reduce((acc, line, i) => (currentTime >= line.time ? i : acc), -1) ?? -1;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex]);

  if (!open) return null;

  // Use track's embedded lyrics if external LRCLIB returned nothing
  const customLyrics = track?.lyrics;

  return (
    <div className="mt-6 md:mt-0 flex-1 w-full overflow-y-auto px-2 md:px-8 text-center md:text-left [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)]">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3">
          <div className="size-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-sm font-medium text-white/50 tracking-wide">Syncing real-time lyrics…</p>
        </div>
      ) : data?.synced ? (
        <div className="space-y-4 py-12">
          {data.synced.map((line, i) => {
            const isActive = i === activeIndex;
            return (
              <p
                key={`${line.time}-${i}`}
                ref={isActive ? activeRef : undefined}
                onClick={() => seekTo(line.time)}
                className={cn(
                  "cursor-pointer transition-all duration-300 py-2.5 px-3 rounded-2xl select-none leading-snug",
                  isActive
                    ? "text-2xl md:text-4xl font-extrabold text-white scale-[1.03] origin-left drop-shadow-[0_4px_24px_rgba(255,255,255,0.4)]"
                    : "text-lg md:text-2xl font-semibold text-white/35 hover:text-white/70 hover:scale-[1.01] hover:bg-white/[0.04]"
                )}
              >
                {line.text || "♪"}
              </p>
            );
          })}
        </div>
      ) : data?.plain ? (
        <div className="py-8">
          <p className="whitespace-pre-wrap text-base leading-8 text-white/80 font-medium">{data.plain}</p>
        </div>
      ) : customLyrics ? (
        <div className="space-y-3 text-center py-8">
          <span className="inline-block px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-xs uppercase tracking-wider text-accent font-bold">
            Artist Lyrics
          </span>
          <p className="whitespace-pre-wrap text-base leading-8 text-white/90 font-medium">{customLyrics}</p>
        </div>
      ) : data?.instrumental ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-base font-semibold text-white/50 tracking-wider uppercase">Instrumental Track</p>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-white/40">Lyrics not available for this track.</p>
        </div>
      )}
    </div>
  );
}

export function LyricsDrawer() {
  const open = usePlayer((s) => s.lyricsOpen);
  const setLyricsOpen = usePlayer((s) => s.setLyricsOpen);
  const track = usePlayer((s) => s.queue[s.index]);

  return (
    <aside
      data-open={open}
      className={cn(
        "fixed inset-0 z-50 flex lg:hidden flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] liquid-glass",
        "data-[open=false]:translate-y-full"
      )}
    >
      {/* Immersive blurred artwork background */}
      {track && (
        <div className="absolute inset-0 z-[-1] overflow-hidden bg-black">
          <img
            src={track.artworkLg || track.artwork || undefined}
            alt=""
            className="w-full h-full object-cover opacity-60 saturate-[150%] blur-3xl scale-150"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      <div className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-4 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Lyrics</h2>
          {track && <p className="text-xs font-medium text-white/60 drop-shadow">{track.title}</p>}
        </div>
        <Button variant="icon" size="iconSm" aria-label="Close lyrics" onClick={() => setLyricsOpen(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors size-8 flex items-center justify-center shadow-lg">
          <X className="size-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)">
        <LyricsPanel />
      </div>
    </aside>
  );
}
