import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlbumCard, PlaylistCard, RadioCard } from "@/components/cards";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { GENRES } from "@/lib/genres";
import { fetchRadioStations, fetchTrending, fetchTrendingPlaylists } from "@/lib/music-api";
import { getCommunityReleasesServerFn } from "@/lib/artist-studio";
import { hashHue } from "@/lib/utils";
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

  if (charts.isLoading && !charts.data) return <HomeSkeleton />;

  return (
    <div className="stagger-in space-y-10 px-4 py-6 md:px-8">
      <header>
        <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">Discover</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Explore</h1>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Featured genres</h2>
          <p className="text-xs text-muted">Explore distinct sounds and musical sub-cultures</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {GENRES.map((g) => (
            <Link
              key={g.slug}
              to="/genre/$slug"
              params={{ slug: g.slug }}
              className="group relative flex h-28 sm:h-32 flex-col justify-end overflow-hidden rounded-2xl p-4 border border-white/10 hover:border-white/30 shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-98"
            >
              {g.image ? (
                <img
                  src={g.image}
                  alt={g.label}
                  className="absolute inset-0 h-full w-full object-cover brightness-[0.75] contrast-[1.08] saturate-[1.15] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:brightness-[0.85]"
                  loading="lazy"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10 transition-opacity duration-300 group-hover:opacity-85" />
              <div className="relative z-10 flex flex-col">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-md group-hover:text-accent transition-colors">
                  {g.label}
                </span>
                <span className="text-[11px] font-medium text-white/70 drop-shadow">
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
