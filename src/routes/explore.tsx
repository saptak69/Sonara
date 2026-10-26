import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlbumCard, PlaylistCard, RadioCard } from "@/components/cards";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { GENRES } from "@/lib/genres";
import { fetchFeaturedAlbums, fetchRadioStations, fetchTrending, fetchTrendingPlaylists } from "@/lib/music-api";
import { getCommunityReleasesServerFn } from "@/lib/artist-studio";
import type { Track } from "@/lib/types";

export const Route = createFileRoute("/explore")({ component: Explore });

function Explore() {
  const community = useQuery({
    queryKey: ["community-explore"],
    queryFn: async () => {
      try {
        const rows = await getCommunityReleasesServerFn({ data: { limit: 16 } });
        return rows.map(
          (r): Track => ({
            id: r.id,
            title: r.title,
            artist: r.artistName || "Independent Artist",
            artistId: r.artistId,
            artwork: r.coverArtUrl,
            artworkLg: r.coverArtUrl,
            duration: r.duration,
            streamUrl: r.audioUrl,
            genre: r.genre || undefined,
            mood: r.mood || undefined,
            description: r.description || undefined,
            lyrics: r.lyrics || undefined,
            playCount: r.playCount,
            kind: "track",
          }),
        );
      } catch {
        return [];
      }
    },
  });

  const charts = useQuery({ queryKey: ["charts"], queryFn: () => fetchTrending(16) });
  const playlists = useQuery({
    queryKey: ["playlists-explore"],
    queryFn: () => fetchTrendingPlaylists(12),
  });
  const radio = useQuery({
    queryKey: ["radio-featured"],
    queryFn: () => fetchRadioStations(12),
  });
  const featuredAlbums = useQuery({
    queryKey: ["featured-albums-explore"],
    queryFn: () => fetchFeaturedAlbums(12),
  });

  if (charts.isLoading && !charts.data) return <HomeSkeleton />;

  return (
    <div className="space-y-10 md:space-y-12 px-4 md:px-10 pt-6 md:pt-8 pb-32">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">Browse</h1>
        <p className="text-sm text-muted">Explore distinct sounds, genres, and community releases</p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">Featured genres</h2>
        </div>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
          {GENRES.map((g) => (
            <Link
              key={g.slug}
              to="/genre/$slug"
              params={{ slug: g.slug }}
              className="group relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-xl p-4 border border-white/[0.08] hover:border-white/20 shadow-md transition-all duration-200 active:scale-95"
            >
              {g.image ? (
                <img
                  src={g.image}
                  alt={g.label}
                  className="absolute inset-0 h-full w-full object-cover brightness-[0.6] contrast-[1.05] saturate-[0.85] transition-transform duration-300 ease-out group-hover:scale-105"
                  loading="lazy"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/15 transition-opacity duration-200" />
              <div className="relative z-10 flex flex-col">
                <span className="text-sm sm:text-base font-semibold tracking-normal text-white group-hover:text-accent transition-colors">
                  {g.label}
                </span>
                <span className="text-[11px] font-normal text-muted mt-0.5">
                  {g.hint}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {(community.data ?? []).length ? (
        <Rail title="Independent Artists & Community Releases">
          {(community.data ?? []).map((t) => (
            <AlbumCard key={t.id} track={t} queue={community.data} />
          ))}
        </Rail>
      ) : null}

      {(charts.data ?? []).length ? (
        <Rail title="Top songs">
          {(charts.data ?? []).map((t) => (
            <AlbumCard key={t.id} track={t} queue={charts.data} />
          ))}
        </Rail>
      ) : null}

      {(featuredAlbums.data ?? []).length ? (
        <Rail title="Masterpiece & Iconic Albums">
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
        <Rail title="Live radio" to="/radio">
          {(radio.data ?? []).map((s) => (
            <RadioCard key={s.id} station={s} />
          ))}
        </Rail>
      ) : null}
    </div>
  );
}
