import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArtistCard, PlaylistCard, RadioCard } from "@/components/cards";
import { Rail } from "@/components/rail";
import { TrackRow } from "@/components/track-row";
import { HomeSkeleton } from "@/components/home-skeleton";
import { searchArtists, searchPlaylists, searchRadio, searchTracks } from "@/lib/music-api";
import { getCommunityReleasesServerFn } from "@/lib/artist-studio";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";

type Search = { q: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : "",
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const recents = usePlayer((s) => s.recentSearches);
  const rememberSearch = usePlayer((s) => s.rememberSearch);

  const tracks = useQuery({
    queryKey: ["search-tracks", q],
    queryFn: async () => {
      const remote = await searchTracks(q, 24);
      try {
        const communityRows = await getCommunityReleasesServerFn({ data: { limit: 50 } });
        const term = q.toLowerCase();
        const matchedCommunity: Track[] = communityRows
          .filter(
            (c) =>
              c.title.toLowerCase().includes(term) ||
              (c.artistName && c.artistName.toLowerCase().includes(term)) ||
              (c.genre && c.genre.toLowerCase().includes(term)) ||
              (c.mood && c.mood.toLowerCase().includes(term)),
          )
          .map((c): Track => ({
            id: c.id,
            title: c.title,
            artist: c.artistName || "Independent Artist",
            artistId: c.artistId,
            artwork: c.coverArtUrl,
            artworkLg: c.coverArtUrl,
            duration: c.duration,
            streamUrl: c.audioUrl,
            genre: c.genre || undefined,
            mood: c.mood || undefined,
            description: c.description || undefined,
            lyrics: c.lyrics || undefined,
            playCount: c.playCount,
            kind: "track",
          }));
        return [...matchedCommunity, ...remote];
      } catch {
        return remote;
      }
    },
    enabled: q.length > 1,
  });
  const playlists = useQuery({
    queryKey: ["search-playlists", q],
    queryFn: () => searchPlaylists(q, 12),
    enabled: q.length > 1,
  });
  const artists = useQuery({
    queryKey: ["search-artists", q],
    queryFn: async () => {
      const remote = await searchArtists(q, 12);
      try {
        const communityRows = await getCommunityReleasesServerFn({ data: { limit: 50 } });
        const term = q.toLowerCase();
        const seen = new Set<string>();
        const matchedCommunityArtists: {
          id: string;
          name: string;
          handle?: string;
          artwork: string | null;
          artworkLg: string | null;
        }[] = [];

        for (const r of communityRows) {
          if (!r.artistId || seen.has(r.artistId)) continue;
          const nameMatch = r.artistName && r.artistName.toLowerCase().includes(term);
          const handleMatch = r.artistHandle && r.artistHandle.toLowerCase().includes(term);
          if (nameMatch || handleMatch) {
            seen.add(r.artistId);
            matchedCommunityArtists.push({
              id: r.artistId,
              name: r.artistName || "Independent Artist",
              handle: r.artistHandle,
              artwork: r.artistAvatar || null,
              artworkLg: r.artistAvatar || null,
            });
          }
        }
        return [...matchedCommunityArtists, ...remote];
      } catch {
        return remote;
      }
    },
    enabled: q.length > 1,
  });
  const radio = useQuery({
    queryKey: ["search-radio", q],
    queryFn: () => searchRadio(q, 8),
    enabled: q.length > 1,
  });

  if (!q) {
    return (
      <div className="px-4 py-8 md:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
        <p className="mt-2 text-sm text-muted">Find songs, artists, playlists, and radio.</p>
        {recents.length ? (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-muted">Recent</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {recents.map((s) => (
                <Link
                  key={s}
                  to="/search"
                  search={{ q: s }}
                  className="rounded-pill bg-chip px-4 py-2 text-sm hover:bg-hover"
                  onClick={() => rememberSearch(s)}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (tracks.isLoading && !tracks.data) return <HomeSkeleton />;

  return (
    <div className="stagger-in space-y-10 px-4 py-6 md:px-8">
      <header>
        <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">Results</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">“{q}”</h1>
      </header>

      {(tracks.data ?? []).length ? (
        <section>
          <h2 className="mb-3 text-xl font-semibold tracking-tight">Songs</h2>
          {(tracks.data ?? []).map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} queue={tracks.data ?? []} showPlays />
          ))}
        </section>
      ) : (
        <p className="text-sm text-muted">No songs matched that search.</p>
      )}

      {(artists.data ?? []).length ? (
        <Rail title="Artists">
          {(artists.data ?? []).map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </Rail>
      ) : null}

      {(playlists.data ?? []).length ? (
        <Rail title="Playlists">
          {(playlists.data ?? []).map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </Rail>
      ) : null}

      {(radio.data ?? []).length ? (
        <Rail title="Radio">
          {(radio.data ?? []).map((s) => (
            <RadioCard key={s.id} station={s} />
          ))}
        </Rail>
      ) : null}
    </div>
  );
}
