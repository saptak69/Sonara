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

export const Route = createFileRoute("/genre/$slug")({ component: GenrePage });

function GenrePage() {
  const { slug } = Route.useParams();
  const genre = genreBySlug(slug);
  const playTracks = usePlayer((s) => s.playTracks);
  const query = useQuery({
    queryKey: ["genre", slug],
    queryFn: async () => {
      if (!genre) return searchTracks(slug, 24);
      const trending = await fetchTrending(24, genre.api);
      if (trending.length) return trending;
      return searchTracks(genre.label, 24);
    },
  });

  if (query.isLoading) return <HomeSkeleton />;
  const tracks = query.data ?? [];
  const tone = hashHue(slug);

  return (
    <div className="px-4 py-6 md:px-8">
      <div
        className="mb-8 overflow-hidden rounded-xl px-6 py-10"
        style={{
          background: `linear-gradient(135deg, hsl(${tone} 32% 28%), hsl(${tone} 16% 8%))`,
        }}
      >
        <p className="text-xs font-medium tracking-[0.16em] text-fg/70 uppercase">Genre</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">{genre?.label ?? slug}</h1>
        {genre?.hint ? <p className="mt-2 text-sm text-fg/70">{genre.hint}</p> : null}
        {tracks.length ? (
          <Button variant="solid" className="mt-5" onClick={() => playTracks(tracks, 0)}>
            Play all
          </Button>
        ) : null}
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
