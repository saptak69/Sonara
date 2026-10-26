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
import type { Artist, Playlist, Track } from "@/lib/types";
import { Cover } from "@/components/cover";
import { cn } from "@/lib/utils";
import { Play, Pause, Search as SearchIcon, X } from "lucide-react";
import { motion } from "framer-motion";
import { SearchSuggestions } from "@/components/search-suggestions";

type Search = { q: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : "",
  }),
  component: SearchPage,
});

type TopResult =
  | { type: "artist"; item: Artist }
  | { type: "track"; item: Track }
  | { type: "album"; item: Playlist };

function getTopResult(
  query: string,
  tracks: Track[] = [],
  artists: Artist[] = [],
  albums: Playlist[] = []
): TopResult | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // 1. Direct exact match on Track title
  const exactTrack = tracks.find((t) => t.title.toLowerCase() === q);
  if (exactTrack) return { type: "track", item: exactTrack };

  // 2. Direct exact match on Artist name
  const exactArtist = artists.find((a) => a.name.toLowerCase() === q);
  if (exactArtist) return { type: "artist", item: exactArtist };

  // 3. Direct match on Album title
  const exactAlbum = albums.find((al) => al.name.toLowerCase() === q);
  if (exactAlbum) return { type: "album", item: exactAlbum };

  // 4. Prefix match on Track title
  const prefixTrack = tracks.find((t) => t.title.toLowerCase().startsWith(q));
  if (prefixTrack) return { type: "track", item: prefixTrack };

  // 5. Prefix match on Artist name
  const prefixArtist = artists.find((a) => a.name.toLowerCase().startsWith(q));
  if (prefixArtist) return { type: "artist", item: prefixArtist };

  // 6. Default fallback: Track > Artist > Album
  if (tracks.length > 0) return { type: "track", item: tracks[0] };
  if (artists.length > 0) return { type: "artist", item: artists[0] };
  if (albums.length > 0) return { type: "album", item: albums[0] };

  return null;
}

function TopResultCard({
  result,
  queue,
}: {
  result: TopResult;
  queue: Track[];
}) {
  const isPlaying = usePlayer((s) => s.isPlaying);
  const current = usePlayer((s) => s.queue[s.index]);
  const playTrack = usePlayer((s) => s.playTrack);
  const toggle = usePlayer((s) => s.toggle);

  if (result.type === "artist") {
    const artist = result.item;
    return (
      <Link
        to="/artist/$id"
        params={{ id: artist.id }}
        className="group relative flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] p-4 sm:p-5 transition-all duration-200 border border-white/[0.08] hover:border-white/20"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-full shadow-md border border-white/10 bg-surface-2">
            <Cover
              src={artist.artworkLg || artist.artwork}
              alt={artist.name}
              title={artist.name}
              rounded="full"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="min-w-0">
            <span className="inline-block mb-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/80">
              Artist
            </span>
            <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight truncate group-hover:text-accent transition-colors">
              {artist.name}
            </h3>
          </div>
        </div>

        <div className="size-11 rounded-full bg-white text-black flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-105 active:scale-95 shrink-0 mr-1">
          <Play className="size-5 fill-current ml-0.5" />
        </div>
      </Link>
    );
  }

  if (result.type === "album") {
    const album = result.item;
    return (
      <Link
        to="/playlist/$id"
        params={{ id: album.id }}
        className="group relative flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] p-4 sm:p-5 transition-all duration-200 border border-white/[0.08] hover:border-white/20"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl shadow-md border border-white/10 bg-surface-2">
            <Cover
              src={album.artworkLg || album.artwork}
              alt={album.name}
              title={album.name}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="min-w-0">
            <span className="inline-block mb-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/80">
              Album
            </span>
            <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight truncate group-hover:text-accent transition-colors">
              {album.name}
            </h3>
            <p className="text-xs text-muted mt-0.5 truncate">
              {album.owner ? `By ${album.owner}` : "Album"}
            </p>
          </div>
        </div>

        <div className="size-11 rounded-full bg-white text-black flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-105 active:scale-95 shrink-0 mr-1">
          <Play className="size-5 fill-current ml-0.5" />
        </div>
      </Link>
    );
  }

  const track = result.item;
  const isCurrent = current?.id === track.id;
  const activePlaying = isCurrent && isPlaying;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isCurrent) {
          toggle();
        } else {
          playTrack(track, queue.length ? queue : [track]);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isCurrent) toggle();
          else playTrack(track, queue.length ? queue : [track]);
        }
      }}
      className="group relative flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] p-4 sm:p-5 transition-all duration-200 border border-white/[0.08] hover:border-white/20 cursor-pointer"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl shadow-md border border-white/10 bg-surface-2">
          <Cover
            src={track.artworkLg || track.artwork}
            alt={track.title}
            title={track.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0">
          <span className="inline-block mb-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/80">
            Song
          </span>
          <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight truncate group-hover:text-accent transition-colors">
            {track.title}
          </h3>
          <p className="text-xs text-muted mt-0.5 truncate">{track.artist}</p>
        </div>
      </div>

      <div className="size-11 rounded-full bg-white text-black flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-105 active:scale-95 shrink-0 mr-1">
        {activePlaying ? (
          <Pause className="size-5 fill-current" />
        ) : (
          <Play className="size-5 fill-current ml-0.5" />
        )}
      </div>
    </div>
  );
}

type SearchFilter = "all" | "songs" | "albums" | "artists" | "playlists" | "radio";

const TRENDING_SEARCHES = [
  { label: "Arijit Singh", tag: "Artist" },
  { label: "Anupam Roy", tag: "Singer-Songwriter" },
  { label: "Coke Studio Bangla", tag: "Folk Fusion" },
  { label: "Mohiner Ghoraguli", tag: "Bangla Rock" },
  { label: "Fossils", tag: "Hard Rock" },
  { label: "Lalon Geeti", tag: "Baul Tradition" },
  { label: "The Weeknd", tag: "Pop" },
  { label: "Diljit Dosanjh", tag: "Punjabi" },
];

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const recents = usePlayer((s) => s.recentSearches);
  const rememberSearch = usePlayer((s) => s.rememberSearch);
  const removeRecentSearch = usePlayer((s) => s.removeRecentSearch);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [localQ, setLocalQ] = useState(q);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    setLocalQ(q);
    setFilter("all");
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
    enabled: Boolean(q),
  });

  const albums = useQuery({
    queryKey: ["search-albums", q],
    queryFn: () => searchAlbums(q, 12),
    enabled: Boolean(q),
  });

  const artists = useQuery({
    queryKey: ["search-artists", q],
    queryFn: () => searchArtists(q, 12),
    enabled: Boolean(q),
  });

  const playlists = useQuery({
    queryKey: ["search-playlists", q],
    queryFn: () => searchPlaylists(q, 12),
    enabled: Boolean(q),
  });

  const radio = useQuery({
    queryKey: ["search-radio", q],
    queryFn: () => searchRadio(q, 12),
    enabled: Boolean(q),
  });

  const topResult = getTopResult(
    q,
    tracks.data ?? [],
    artists.data ?? [],
    albums.data ?? []
  );

  if (!q) {
    return (
      <div className="w-full space-y-8 md:space-y-10 px-4 md:px-10 pt-6 md:pt-8 pb-32">
        <header className="relative z-50 space-y-4">
          <form onSubmit={onSearchSubmit} className="search-input-form relative lg:hidden">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/50" />
            <input
              value={localQ}
              onChange={(e) => {
                setLocalQ(e.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => setSuggestionsOpen(true)}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Search for songs, artists, albums..."
              className="h-11 w-full rounded-full bg-surface-2 pr-10 pl-11 text-sm text-white placeholder:text-white/40 outline-none border border-white/10 focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
            />
            {localQ && (
              <button
                type="button"
                onClick={() => {
                  setLocalQ("");
                  setSuggestionsOpen(false);
                  void navigate({ to: "/search", search: { q: "" } });
                }}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-white/50 hover:text-white"
              >
                <X className="size-4" />
              </button>
            )}
            <SearchSuggestions 
              query={localQ} 
              isOpen={suggestionsOpen} 
              onClose={() => setSuggestionsOpen(false)} 
              onSelectQuery={(newQ) => {
                setLocalQ(newQ);
                setSuggestionsOpen(false);
                rememberSearch(newQ);
                void navigate({ to: "/search", search: { q: newQ } });
              }} 
            />
          </form>
          <div className="hidden lg:flex items-center justify-between pb-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">Search</h1>
          </div>
        </header>

        {recents.length ? (
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-2 px-0.5">Recent Searches</h2>
            <div className="flex flex-wrap gap-2">
              {recents.map((s) => (
                <div
                  key={s}
                  className="group inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 pl-3.5 pr-2 py-1 text-xs text-white/80 hover:text-white transition-all shadow-sm"
                >
                  <Link
                    to="/search"
                    search={{ q: s }}
                    className="font-medium"
                    onClick={() => rememberSearch(s)}
                  >
                    {s}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeRecentSearch(s);
                    }}
                    title={`Remove "${s}"`}
                    aria-label={`Remove "${s}"`}
                    className="size-4 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
              <SearchIcon className="size-7 text-white/50" />
            </div>
            <h2 className="text-lg font-semibold text-white tracking-normal">What are you looking for?</h2>
            <p className="mt-1 text-sm text-muted max-w-sm">Search for artists, songs, podcasts, and more.</p>
          </div>
        )}

        {/* Trending culture & rock searches */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-2 px-0.5">Trending & Featured</h2>
          <div className="flex flex-wrap gap-2.5">
            {TRENDING_SEARCHES.map((item) => (
              <Link
                key={item.label}
                to="/search"
                search={{ q: item.label }}
                className="group inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/20 px-3.5 py-2 text-sm transition-all duration-150 active:scale-95 shadow-sm"
                onClick={() => rememberSearch(item.label)}
              >
                <span className="font-medium text-white group-hover:text-accent transition-colors">{item.label}</span>
                <span className="text-[11px] text-white/40 bg-white/[0.06] px-2 py-0.5 rounded-md">{item.tag}</span>
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

  const hasAnyResults =
    Boolean(topResult) ||
    (tracks.data ?? []).length > 0 ||
    (albums.data ?? []).length > 0 ||
    (artists.data ?? []).length > 0 ||
    (playlists.data ?? []).length > 0 ||
    (radio.data ?? []).length > 0;

  return (
    <div className="w-full space-y-8 md:space-y-10 px-4 md:px-10 pt-6 md:pt-8 pb-32">
      <header className="relative z-50 space-y-4">
        <form onSubmit={onSearchSubmit} className="search-input-form relative lg:hidden">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/50" />
          <input
            value={localQ}
            onChange={(e) => {
              setLocalQ(e.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Search for songs, artists..."
            className="h-11 w-full rounded-full bg-surface-2 pr-10 pl-11 text-sm text-white placeholder:text-white/40 outline-none border border-white/10 focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
          />
          {localQ && (
            <button
              type="button"
              onClick={() => {
                setLocalQ("");
                setSuggestionsOpen(false);
                void navigate({ to: "/search", search: { q: "" } });
              }}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-white/50 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
          <SearchSuggestions 
            query={localQ} 
            isOpen={suggestionsOpen} 
            onClose={() => setSuggestionsOpen(false)} 
            onSelectQuery={(newQ) => {
              setLocalQ(newQ);
              setSuggestionsOpen(false);
              rememberSearch(newQ);
              void navigate({ to: "/search", search: { q: newQ } });
            }} 
          />
        </form>

        <div className="hidden lg:flex items-center justify-between pb-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Results for “{q}”
          </h1>
        </div>

        {/* Category Filter Chips */}
        {hasAnyResults && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {[
              { id: "all", label: "All" },
              { id: "songs", label: "Songs", count: tracks.data?.length },
              { id: "albums", label: "Albums", count: albums.data?.length },
              { id: "artists", label: "Artists", count: artists.data?.length },
              { id: "playlists", label: "Playlists", count: playlists.data?.length },
              { id: "radio", label: "Radio", count: radio.data?.length },
            ]
              .filter((tab) => tab.id === "all" || (tab.count ?? 0) > 0)
              .map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id as typeof filter)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all shrink-0 active:scale-95 cursor-pointer flex items-center gap-1.5",
                    filter === tab.id
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "bg-white/[0.06] hover:bg-white/10 text-white/70 hover:text-white border border-white/10"
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-xs opacity-60 tabular-nums font-mono">{tab.count}</span>
                  )}
                </button>
              ))}
          </div>
        )}
      </header>

      {!hasAnyResults && !tracks.isLoading ? (
        <div className="py-20 text-center">
          <p className="text-lg font-semibold text-white">No results found for “{q}”</p>
          <p className="mt-1 text-sm text-muted">
            Please make sure your words are spelled correctly, or try fewer or different keywords.
          </p>
        </div>
      ) : (
        <>
          {/* View: ALL */}
          {filter === "all" && (
            <div className="space-y-10 md:space-y-12">
              {/* 1. Hero: Top Result + Songs */}
              {topResult || (tracks.data ?? []).length > 0 ? (
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {topResult ? (
                    <div className={cn((tracks.data ?? []).length > 0 ? "lg:col-span-5" : "lg:col-span-12")}>
                      <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-3">
                        Top result
                      </h2>
                      <TopResultCard result={topResult} queue={tracks.data ?? []} />
                    </div>
                  ) : null}

                  {(tracks.data ?? []).length > 0 ? (
                    <div className={cn(topResult ? "lg:col-span-7" : "lg:col-span-12")}>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">Songs</h2>
                        {(tracks.data ?? []).length > 4 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted hover:text-white"
                            onClick={() => setShowAllSongs((prev) => !prev)}
                          >
                            {showAllSongs ? "Show less" : `Show all ${(tracks.data ?? []).length}`}
                          </Button>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        {(showAllSongs ? (tracks.data ?? []) : (tracks.data ?? []).slice(0, 4)).map((t, i) => (
                          <TrackRow key={t.id} track={t} index={i} queue={tracks.data ?? []} showPlays />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {/* 2. Albums Rail */}
              {(albums.data ?? []).length ? (
                <Rail title="Albums">
                  {(albums.data ?? []).map((album) => (
                    <PlaylistCard key={album.id} playlist={album} />
                  ))}
                </Rail>
              ) : null}

              {/* 3. Artists Rail */}
              {(artists.data ?? []).length ? (
                <Rail title="Artists">
                  {(artists.data ?? []).map((a) => (
                    <ArtistCard key={a.id} artist={a} />
                  ))}
                </Rail>
              ) : null}

              {/* 4. Playlists Rail */}
              {(playlists.data ?? []).length ? (
                <Rail title="Playlists">
                  {(playlists.data ?? []).map((p) => (
                    <PlaylistCard key={p.id} playlist={p} />
                  ))}
                </Rail>
              ) : null}

              {/* 5. Radio Stations Rail */}
              {(radio.data ?? []).length ? (
                <Rail title="Radio">
                  {(radio.data ?? []).map((s) => (
                    <RadioCard key={s.id} station={s} />
                  ))}
                </Rail>
              ) : null}
            </div>
          )}

          {/* View: SONGS */}
          {filter === "songs" && (
            <section className="space-y-3">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Songs</h2>
                <span className="text-xs text-muted">{tracks.data?.length ?? 0} results</span>
              </div>
              <div className="space-y-1">
                {(tracks.data ?? []).map((t, i) => (
                  <TrackRow key={t.id} track={t} index={i} queue={tracks.data ?? []} showPlays />
                ))}
              </div>
            </section>
          )}

          {/* View: ALBUMS */}
          {filter === "albums" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Albums</h2>
                <span className="text-xs text-muted">{albums.data?.length ?? 0} releases</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {(albums.data ?? []).map((album) => (
                  <PlaylistCard key={album.id} playlist={album} />
                ))}
              </div>
            </section>
          )}

          {/* View: ARTISTS */}
          {filter === "artists" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Artists</h2>
                <span className="text-xs text-muted">{artists.data?.length ?? 0} artists</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {(artists.data ?? []).map((a) => (
                  <ArtistCard key={a.id} artist={a} />
                ))}
              </div>
            </section>
          )}

          {/* View: PLAYLISTS */}
          {filter === "playlists" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Playlists</h2>
                <span className="text-xs text-muted">{playlists.data?.length ?? 0} playlists</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {(playlists.data ?? []).map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            </section>
          )}

          {/* View: RADIO */}
          {filter === "radio" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Live Broadcast Radio</h2>
                <span className="text-xs text-muted">{radio.data?.length ?? 0} stations</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {(radio.data ?? []).map((s) => (
                  <RadioCard key={s.id} station={s} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
