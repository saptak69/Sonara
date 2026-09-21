import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArtistCard, PlaylistCard, RadioCard } from "@/components/cards";
import { Rail } from "@/components/rail";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { HomeSkeleton } from "@/components/home-skeleton";
import { fetchFeaturedAlbums, searchAlbums, searchArtists, searchPlaylists, searchRadio, searchTracks } from "@/lib/music-api";
import { getCommunityReleasesServerFn } from "@/lib/artist-studio";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";
import { Search as SearchIcon, X } from "lucide-react";

type Search = { q: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : "",
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const recents = usePlayer((s) => s.recentSearches);
  const rememberSearch = usePlayer((s) => s.rememberSearch);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [localQ, setLocalQ] = useState(q);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localQ.trim()) return;
    rememberSearch(localQ.trim());
    void navigate({ to: "/search", search: { q: localQ.trim() } });
  };

  const featuredAlbums = useQuery({
    queryKey: ["featured-albums-search"],
    queryFn: () => fetchFeaturedAlbums(12),
    enabled: !q,
  });

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
        return [...remote, ...matchedCommunity];
      } catch {
        return remote;
      }
    },
    enabled: q.length > 1,
  });
  const albums = useQuery({
    queryKey: ["search-albums", q],
    queryFn: () => searchAlbums(q, 16),
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
        return [...remote, ...matchedCommunityArtists];
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

  const TRENDING_SEARCHES = [
    { label: "Taylor Swift", tag: "Pop Icon" },
    { label: "Dream Theater", tag: "Progressive Metal" },
    { label: "Metallica", tag: "Heavy Metal" },
    { label: "Arijit Singh", tag: "Bollywood & Bengali" },
    { label: "Pink Floyd", tag: "Classic Rock" },
    { label: "Rabindra Sangeet", tag: "Bengali Classics" },
    { label: "The Weeknd", tag: "Global Pop" },
    { label: "AIR FM Gold Kolkata", tag: "Live Radio" },
    { label: "Daft Punk", tag: "Electronic" },
    { label: "Kishore Kumar", tag: "Timeless Master" },
  ];

  if (!q) {
    return (
      <div className="stagger-in px-4 py-8 md:px-8 space-y-8">
        <header>
          <form onSubmit={onSearchSubmit} className="relative md:hidden mb-6">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
            <input
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              placeholder="Search for songs, artists..."
              className="h-11 w-full rounded-full bg-surface pr-10 pl-11 text-sm text-fg placeholder:text-muted outline-none border border-border focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
            />
            {localQ && (
              <button type="button" onClick={() => setLocalQ("")} className="absolute top-1/2 right-4 -translate-y-1/2 text-muted hover:text-fg">
                <X className="size-4" />
              </button>
            )}
          </form>
          <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase hidden md:block">Explore Everything</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight hidden md:block">Search</h1>
          <p className="mt-1.5 text-sm text-muted hidden md:block">
            Find millions of full-length songs, rock bands, Bengali hits, playlists, and live radio.
          </p>
        </header>

        {recents.length ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wider text-fg/80 uppercase">Recent Searches</h2>
            <div className="flex flex-wrap gap-2">
              {recents.map((s) => (
                <Link
                  key={s}
                  to="/search"
                  search={{ q: s }}
                  className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs text-fg/80 hover:text-white hover:bg-white/15 transition-all"
                  onClick={() => rememberSearch(s)}
                >
                  {s}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Trending culture & rock searches */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-fg/80 uppercase">Trending & Featured</h2>
          <div className="flex flex-wrap gap-2.5">
            {TRENDING_SEARCHES.map((item) => (
              <Link
                key={item.label}
                to="/search"
                search={{ q: item.label }}
                className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface/60 hover:bg-white/10 px-3.5 py-2 text-sm transition-all duration-200 active:scale-95 shadow-sm"
                onClick={() => rememberSearch(item.label)}
              >
                <span className="font-medium text-fg group-hover:text-accent transition-colors">{item.label}</span>
                <span className="text-[11px] text-muted/70 bg-white/5 px-2 py-0.5 rounded-md">{item.tag}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular & Iconic Albums */}
        {(featuredAlbums.data ?? []).length ? (
          <Rail title="Popular & Iconic Albums">
            {(featuredAlbums.data ?? []).map((album) => (
              <PlaylistCard key={album.id} playlist={album} />
            ))}
          </Rail>
        ) : null}


      </div>
    );
  }

  if (tracks.isLoading && !tracks.data) return <HomeSkeleton />;

  return (
    <div className="stagger-in space-y-10 px-4 py-6 md:px-8">
      <header>
        <form onSubmit={onSearchSubmit} className="relative md:hidden mb-6">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="Search for songs, artists..."
            className="h-11 w-full rounded-full bg-surface pr-10 pl-11 text-sm text-fg placeholder:text-muted outline-none border border-border focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
          />
          {localQ && (
            <button type="button" onClick={() => {
              setLocalQ("");
              void navigate({ to: "/search", search: { q: "" } });
            }} className="absolute top-1/2 right-4 -translate-y-1/2 text-muted hover:text-fg">
              <X className="size-4" />
            </button>
          )}
        </form>
        <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">Results</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">“{q}”</h1>
      </header>

      {/* Artists Rail */}
      {(artists.data ?? []).length ? (
        <Rail title="Artists">
          {(artists.data ?? []).map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </Rail>
      ) : null}

      {/* Albums Rail - High prominence directly above songs */}
      {(albums.data ?? []).length ? (
        <Rail title="Albums">
          {(albums.data ?? []).map((album) => (
            <PlaylistCard key={album.id} playlist={album} />
          ))}
        </Rail>
      ) : null}

      {/* Songs Section */}
      {(tracks.data ?? []).length ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold tracking-tight">Songs</h2>
            {(tracks.data ?? []).length > 6 ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted hover:text-white"
                onClick={() => setShowAllSongs((prev) => !prev)}
              >
                {showAllSongs ? "Show less" : `Show all ${(tracks.data ?? []).length} songs`}
              </Button>
            ) : null}
          </div>
          {(showAllSongs ? (tracks.data ?? []) : (tracks.data ?? []).slice(0, 6)).map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} queue={[]} showPlays />
          ))}
        </section>
      ) : (
        <p className="text-sm text-muted">No songs matched that search.</p>
      )}

      {/* Playlists Rail */}
      {(playlists.data ?? []).length ? (
        <Rail title="Playlists">
          {(playlists.data ?? []).map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </Rail>
      ) : null}

      {/* Radio Stations */}
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
