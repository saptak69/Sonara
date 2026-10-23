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

  // 1. Direct match on Artist name (e.g., "Taylor Swift", "Queen")
  const exactArtist = artists.find((a) => a.name.toLowerCase() === q);
  if (exactArtist) return { type: "artist", item: exactArtist };

  // 2. Direct match on Track title
  const exactTrack = tracks.find((t) => t.title.toLowerCase() === q);
  if (exactTrack) return { type: "track", item: exactTrack };

  // 3. Direct match on Album title
  const exactAlbum = albums.find((al) => al.name.toLowerCase() === q);
  if (exactAlbum) return { type: "album", item: exactAlbum };

  // 4. Prefix match on Artist name
  const prefixArtist = artists.find((a) => a.name.toLowerCase().startsWith(q));
  const prefixTrack = tracks.find((t) => t.title.toLowerCase().startsWith(q));

  if (prefixArtist && (!prefixTrack || q.length >= 3)) {
    return { type: "artist", item: prefixArtist };
  }
  if (prefixTrack) {
    return { type: "track", item: prefixTrack };
  }

  // 5. Default Priority: Track (primary listening intent) > Artist > Album
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
        className="group relative flex flex-col justify-between rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] p-5 sm:p-6 transition-all duration-300 border border-white/10 hover:border-white/20 min-h-[220px]"
      >
        <div className="space-y-4">
          <div className="relative size-24 sm:size-28 shrink-0 overflow-hidden rounded-full shadow-lg border border-white/10 bg-white/5">
            <Cover
              src={artist.artworkLg || artist.artwork}
              alt={artist.name}
              title={artist.name}
              rounded="full"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate group-hover:text-accent transition-colors">
              {artist.name}
            </h3>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90">
              Artist
            </span>
          </div>
        </div>

        <div className="absolute right-5 bottom-5 size-12 rounded-full bg-accent text-accent-fg flex items-center justify-center shadow-lg shadow-accent/40 opacity-90 lg:opacity-0 lg:group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-300 hover:scale-105 active:scale-95">
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
        className="group relative flex flex-col justify-between rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] p-5 sm:p-6 transition-all duration-300 border border-white/10 hover:border-white/20 min-h-[220px]"
      >
        <div className="space-y-4">
          <div className="relative size-24 sm:size-28 shrink-0 overflow-hidden rounded-xl shadow-lg border border-white/10 bg-white/5">
            <Cover
              src={album.artworkLg || album.artwork}
              alt={album.name}
              title={album.name}
              rounded="lg"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate group-hover:text-accent transition-colors">
              {album.name}
            </h3>
            <p className="text-sm text-muted mt-0.5 truncate">
              {album.owner ? `By ${album.owner}` : "Album"}
            </p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90">
              Album
            </span>
          </div>
        </div>

        <div className="absolute right-5 bottom-5 size-12 rounded-full bg-accent text-accent-fg flex items-center justify-center shadow-lg shadow-accent/40 opacity-90 lg:opacity-0 lg:group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-300 hover:scale-105 active:scale-95">
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
      className="group relative flex flex-col justify-between rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] p-5 sm:p-6 transition-all duration-300 border border-white/10 hover:border-white/20 cursor-pointer min-h-[220px]"
    >
      <div className="space-y-4">
        <div className="relative size-24 sm:size-28 shrink-0 overflow-hidden rounded-xl shadow-lg border border-white/10 bg-white/5">
          <Cover
            src={track.artworkLg || track.artwork}
            alt={track.title}
            title={track.title}
            rounded="lg"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div>
          <h3
            className={cn(
              "text-2xl sm:text-3xl font-extrabold tracking-tight truncate transition-colors",
              isCurrent
                ? "text-accent drop-shadow-[0_0_8px_rgba(255,74,58,0.3)]"
                : "text-white group-hover:text-accent"
            )}
          >
            {track.title}
          </h3>
          <p className="text-sm text-muted mt-0.5 truncate">{track.artist}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90">
            Song
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label={activePlaying ? "Pause" : "Play"}
        onClick={(e) => {
          e.stopPropagation();
          if (isCurrent) {
            toggle();
          } else {
            playTrack(track, queue.length ? queue : [track]);
          }
        }}
        className={cn(
          "absolute right-5 bottom-5 size-12 rounded-full bg-accent text-accent-fg flex items-center justify-center shadow-lg shadow-accent/40 transition-all duration-300 hover:scale-105 active:scale-95",
          activePlaying
            ? "opacity-100 translate-y-0"
            : "opacity-90 lg:opacity-0 lg:group-hover:opacity-100 group-hover:translate-y-0 translate-y-1"
        )}
      >
        {activePlaying ? (
          <Pause className="size-5 fill-current" />
        ) : (
          <Play className="size-5 fill-current ml-0.5" />
        )}
      </button>
    </div>
  );
}

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const recents = usePlayer((s) => s.recentSearches);
  const rememberSearch = usePlayer((s) => s.rememberSearch);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [localQ, setLocalQ] = useState(q);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

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
    enabled: q.trim().length > 0,
  });

  const albums = useQuery({
    queryKey: ["search-albums", q],
    queryFn: () => searchAlbums(q, 16),
    enabled: q.trim().length > 0,
  });

  const playlists = useQuery({
    queryKey: ["search-playlists", q],
    queryFn: () => searchPlaylists(q, 12),
    enabled: q.trim().length > 0,
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
    enabled: q.trim().length > 0,
  });

  const radio = useQuery({
    queryKey: ["search-radio", q],
    queryFn: () => searchRadio(q, 8),
    enabled: q.trim().length > 0,
  });

  const topResult = getTopResult(q, tracks.data, artists.data, albums.data);

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
      <div className="w-full stagger-in space-y-12 md:space-y-14 px-4 md:px-12 pt-10 md:pt-12 pb-32">
        <header className="relative z-50">
          <form onSubmit={onSearchSubmit} className="search-input-form relative lg:hidden mb-6">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
            <input
              value={localQ}
              onChange={(e) => {
                setLocalQ(e.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => setSuggestionsOpen(true)}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Search for songs, artists..."
              className="h-11 w-full rounded-full bg-surface pr-10 pl-11 text-sm text-fg placeholder:text-muted outline-none border border-border focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
            />
            {localQ && (
              <button
                type="button"
                onClick={() => {
                  setLocalQ("");
                  setSuggestionsOpen(false);
                  void navigate({ to: "/search", search: { q: "" } });
                }}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-muted hover:text-fg"
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
          <div className="hidden lg:flex items-center justify-between border-b border-white/10 pb-4">
            <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight text-white">Search</h1>
          </div>
        </header>

        {recents.length ? (
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-fg tracking-tight mb-2.5 px-1">Recent Searches</h2>
            <div className="flex flex-wrap gap-2">
              {recents.map((s) => (
                <Link
                  key={s}
                  to="/search"
                  search={{ q: s }}
                  className="rounded-full sonara-glass-light px-3.5 py-1.5 text-xs text-fg/80 hover:text-white hover:brightness-110 transition-all"
                  onClick={() => rememberSearch(s)}
                >
                  {s}
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-700">
            <motion.div 
              animate={{ y: [0, -10, 0], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative size-24 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shadow-[0_0_40px_rgba(var(--accent-rgb),0.1)] mb-6"
            >
              <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
              <SearchIcon className="size-10 text-accent drop-shadow-md relative z-10" />
            </motion.div>
            <h2 className="text-xl font-bold text-fg tracking-tight">What are you looking for?</h2>
            <p className="mt-2 text-sm text-muted max-w-sm">Search for artists, songs, podcasts, and more.</p>
          </div>
        )}

        {/* Trending culture & rock searches */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-fg tracking-tight mb-2.5 px-1">Trending & Featured</h2>
          <div className="flex flex-wrap gap-2.5">
            {TRENDING_SEARCHES.map((item) => (
              <Link
                key={item.label}
                to="/search"
                search={{ q: item.label }}
                className="group inline-flex items-center gap-2 rounded-xl sonara-glass-light hover:brightness-110 px-3.5 py-2 text-sm transition-all duration-200 active:scale-95 shadow-sm"
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

  const hasAnyResults =
    Boolean(topResult) ||
    (tracks.data ?? []).length > 0 ||
    (albums.data ?? []).length > 0 ||
    (artists.data ?? []).length > 0 ||
    (playlists.data ?? []).length > 0 ||
    (radio.data ?? []).length > 0;

  return (
    <div className="w-full stagger-in space-y-12 md:space-y-14 px-4 md:px-12 pt-10 md:pt-12 pb-32">
      <header className="relative z-50">
        <form onSubmit={onSearchSubmit} className="search-input-form relative lg:hidden mb-6">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            value={localQ}
            onChange={(e) => {
              setLocalQ(e.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Search for songs, artists..."
            className="h-11 w-full rounded-full bg-surface pr-10 pl-11 text-sm text-fg placeholder:text-muted outline-none border border-border focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
          />
          {localQ && (
            <button
              type="button"
              onClick={() => {
                setLocalQ("");
                setSuggestionsOpen(false);
                void navigate({ to: "/search", search: { q: "" } });
              }}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-muted hover:text-fg"
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
        <div className="hidden lg:flex items-center justify-between border-b border-white/10 pb-4 mb-4 mt-8 md:mt-0">
          <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight text-white">“{q}”</h1>
        </div>
      </header>

      {!hasAnyResults && !tracks.isLoading ? (
        <div className="py-20 text-center">
          <p className="text-lg font-semibold text-fg">No results found for “{q}”</p>
          <p className="mt-1 text-sm text-muted">
            Please make sure your words are spelled correctly, or try fewer or different keywords.
          </p>
        </div>
      ) : (
        <>
          {/* 1. Hero: Top Result + Songs (Spotify / Apple Music Industry Standard) */}
          {topResult || (tracks.data ?? []).length > 0 ? (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {topResult ? (
                <div className={cn((tracks.data ?? []).length > 0 ? "lg:col-span-5" : "lg:col-span-12")}>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-fg tracking-tight mb-3">
                    Top result
                  </h2>
                  <TopResultCard result={topResult} queue={tracks.data ?? []} />
                </div>
              ) : null}

              {(tracks.data ?? []).length > 0 ? (
                <div className={cn(topResult ? "lg:col-span-7" : "lg:col-span-12")}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-fg tracking-tight">Songs</h2>
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
        </>
      )}
    </div>
  );
}
