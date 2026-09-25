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
    <div className="mt-6 md:mt-0 flex-1 w-full overflow-y-auto px-2 md:px-8 text-center md:text-left [scrollbar-width:none] mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)">
      {isLoading ? (
        <p className="text-sm text-muted">Finding lyrics…</p>
      ) : data?.synced ? (
        <div className="space-y-3">
          {data.synced.map((line, i) => (
            <p
              key={`${line.time}-${i}`}
              ref={i === activeIndex ? activeRef : undefined}
              className={cn(
                "transition-all duration-300 py-2",
                i === activeIndex
                  ? "text-2xl md:text-4xl font-bold text-white scale-105 origin-left"
                  : "text-lg md:text-2xl text-white/40 hover:text-white/60 blur-[1px] hover:blur-none"
              )}
            >
              {line.text || " "}
            </p>
          ))}
        </div>
      ) : data?.plain ? (
        <p className="whitespace-pre-wrap text-sm leading-7 text-muted">{data.plain}</p>
      ) : customLyrics ? (
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-wider text-accent font-semibold">Artist Lyrics</p>
          <p className="whitespace-pre-wrap text-sm leading-7 text-fg/90">{customLyrics}</p>
        </div>
      ) : data?.instrumental ? (
        <p className="text-sm text-muted">Instrumental</p>
      ) : (
        <p className="text-sm text-muted">Lyrics not available for this track.</p>
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
        "fixed inset-0 z-50 flex lg:hidden flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] bg-black",
        "data-[open=false]:translate-y-full"
      )}
    >
      {/* Immersive blurred artwork background */}
      {track && (
        <div className="absolute inset-0 z-[-1] overflow-hidden">
          <img
            src={track.artworkLg || track.artwork}
            alt=""
            className="w-full h-full object-cover opacity-60 saturate-[150%] blur-[80px] scale-150"
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
