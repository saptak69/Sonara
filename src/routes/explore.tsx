import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AlbumCard, PlaylistCard, RadioCard } from "@/components/cards";
import { GenreTile } from "@/components/genre-tile";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { TrackRow } from "@/components/track-row";
import { GENRES } from "@/lib/genres";
import { fetchFeaturedAlbums, fetchRadioStations, fetchTrending, fetchTrendingPlaylists } from "@/lib/music-api";
import { loadCommunityTracks } from "@/lib/community-tracks";

export const Route = createFileRoute("/explore")({ component: Explore });

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-[22px]">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}

function Explore() {
  const community = useQuery({ queryKey: ["community-explore"], queryFn: () => loadCommunityTracks(16) });

  const charts = useQuery({ queryKey: ["charts"], queryFn: () => fetchTrending(16) });
  const playlists = useQuery({ queryKey: ["playlists-explore"], queryFn: () => fetchTrendingPlaylists(12) });
  const radio = useQuery({ queryKey: ["radio-featured"], queryFn: () => fetchRadioStations(12) });
  const featuredAlbums = useQuery({ queryKey: ["featured-albums-explore"], queryFn: () => fetchFeaturedAlbums(12) });

  if (charts.isLoading && !charts.data) return <HomeSkeleton />;

  const top = (charts.data ?? []).slice(0, 10);

  return (
    <div className="space-y-10 px-4 pb-32 pt-6 md:space-y-12 md:px-10 md:pt-8">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl md:text-4xl">Browse</h1>
          <p className="mt-1 text-sm text-muted">Genres, charts and new music from independent artists</p>
        </div>
        <Link
          to="/search"
          search={{ q: "" }}
          className="tv-card flex h-12 max-w-2xl items-center gap-3 rounded-full border border-border bg-surface px-5 text-sm text-muted transition hover:border-border-strong hover:text-fg"
        >
          <Search className="size-[18px]" />
          Search songs, artists, albums
        </Link>
      </header>

      <section className="space-y-4">
        <Heading title="Genres & moods" subtitle="Pick a sound to start with" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {GENRES.map((g) => (
            <GenreTile key={g.slug} slug={g.slug} label={g.label} hint={g.hint} image={g.image} />
          ))}
        </div>
      </section>

      {top.length > 0 && (
        <section className="space-y-3">
          <Heading title="Top charts" subtitle="What everyone is playing right now" />
          <div className="grid gap-x-6 lg:grid-cols-2">
            <div>
              {top.slice(0, 5).map((t, i) => (
                <TrackRow key={t.id} track={t} index={i} queue={top} showPlays />
              ))}
            </div>
            <div>
              {top.slice(5, 10).map((t, i) => (
                <TrackRow key={t.id} track={t} index={i + 5} queue={top} showPlays />
              ))}
            </div>
          </div>
        </section>
      )}

      {(community.data ?? []).length ? (
        <Rail title="New from independent artists" subtitle="Fresh releases uploaded by the community">
          {(community.data ?? []).map((t) => (
            <AlbumCard key={t.id} track={t} queue={community.data} />
          ))}
        </Rail>
      ) : null}

      {(charts.data ?? []).length > 10 ? (
        <Rail title="More top songs">
          {(charts.data ?? []).slice(10).map((t) => (
            <AlbumCard key={t.id} track={t} queue={charts.data} />
          ))}
        </Rail>
      ) : null}

      {(featuredAlbums.data ?? []).length ? (
        <Rail title="Iconic albums">
          {(featuredAlbums.data ?? []).map((album) => (
            <PlaylistCard key={album.id} playlist={album} />
          ))}
        </Rail>
      ) : null}

      {(playlists.data ?? []).length ? (
        <Rail title="Featured playlists">
          {(playlists.data ?? []).map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </Rail>
      ) : null}

      {(radio.data ?? []).length ? (
        <Rail title="Live radio" subtitle="Tune in to stations worldwide" to="/radio">
          {(radio.data ?? []).map((s) => (
            <RadioCard key={s.id} station={s} />
          ))}
        </Rail>
      ) : null}
    </div>
  );
}
