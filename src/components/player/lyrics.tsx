import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { fetchLyrics } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";

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


