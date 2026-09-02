import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlbumCard } from "@/components/cards";
import { HomeSkeleton } from "@/components/home-skeleton";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { genreBySlug } from "@/lib/genres";
import { fetchTrending, searchTracks } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import { hashHue } from "@/lib/utils";

import { Play, Sparkles } from "lucide-react";

export const Route = createFileRoute("/genre/$slug")({ component: GenrePage });

function GenrePage() {
  const { slug } = Route.useParams();
  const genre = genreBySlug(slug);
  const playTracks = usePlayer((s) => s.playTracks);
  const query = useQuery({
    queryKey: ["genre", slug],
    queryFn: async () => {
      if (!genre) return searchTracks(slug, 28);
      const fullSongs = await searchTracks(`${genre.label} hits`, 28);
      if (fullSongs.length >= 8) return fullSongs;
      const trending = await fetchTrending(28, genre.api);
      const combined = [...fullSongs, ...trending];
      const seen = new Set<string>();
      return combined.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      }).slice(0, 28);
    },
  });

  if (query.isLoading) return <HomeSkeleton />;
  const tracks = query.data ?? [];
  const tone = hashHue(slug);

  return (
    <div className="stagger-in px-4 py-6 md:px-8 space-y-8">
      {/* Hero Genre Slab with high-res picture */}
      <div
        className="relative overflow-hidden rounded-3xl border border-white/15 p-6 sm:p-10 shadow-2xl min-h-[220px] sm:min-h-[260px] flex flex-col justify-end"
        style={{
          background: `linear-gradient(135deg, hsl(${tone} 32% 20%), hsl(${tone} 16% 6%))`,
        }}
      >
        {genre?.image ? (
          <img
            src={genre.image}
            alt={genre.label}
            className="absolute inset-0 h-full w-full object-cover brightness-[0.55] contrast-[1.1] saturate-[1.25] scale-105"
            loading="eager"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
        <div className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold tracking-wider text-white/90 uppercase mb-3">
              <Sparkles className="size-3 text-accent" />
              Genre Spotlight
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
              {genre?.label ?? slug}
            </h1>
            {genre?.hint ? (
              <p className="mt-2 text-sm sm:text-base text-white/80 max-w-xl drop-shadow">
                {genre.hint}
              </p>
            ) : null}
          </div>

          {tracks.length ? (
            <Button
              variant="solid"
              size="lg"
              className="rounded-2xl px-6 font-semibold shadow-lg shadow-accent/25 active:scale-95 transition-all gap-2 shrink-0 bg-accent hover:bg-accent/90 text-white"
              onClick={() => playTracks(tracks, 0)}
            >
              <Play className="size-4 fill-current" />
              Play all ({tracks.length})
            </Button>
          ) : null}
        </div>
      </div>

      {tracks.length ? (
        <>
          <div className="mb-8 flex gap-4 overflow-x-auto [scrollbar-width:none]">
            {tracks.slice(0, 10).map((t) => (
              <AlbumCard key={t.id} track={t} queue={tracks} />
            ))}
          </div>
          {tracks.map((t, i) => (
            <TrackRow key={`row-${t.id}`} track={t} index={i} queue={tracks} showPlays />
          ))}
        </>
      ) : (
        <p className="text-sm text-muted">Nothing in this lane yet.</p>
      )}
    </div>
  );
}
