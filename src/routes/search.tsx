import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, Pause, Play, TrendingUp, X } from "lucide-react";
import { ArtistCard, PlaylistCard, RadioCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { GenreTile } from "@/components/genre-tile";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { SearchField } from "@/components/search-field";
import { TrackMenuButton } from "@/components/track-menu";
import { TrackRow } from "@/components/track-row";
import { getCommunityReleasesServerFn } from "@/lib/artist-studio";
import { GENRES } from "@/lib/genres";
import { fetchFeaturedAlbums, searchAlbums, searchArtists, searchPlaylists, searchRadio, searchTracks } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import type { Artist, Playlist, Track } from "@/lib/types";
import { cn } from "@/lib/utils";

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

function getTopResult(query: string, tracks: Track[] = [], artists: Artist[] = [], albums: Playlist[] = []): TopResult | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const exactTrack = tracks.find((t) => t.title.toLowerCase() === q);
  if (exactTrack) return { type: "track", item: exactTrack };
  const exactArtist = artists.find((a) => a.name.toLowerCase() === q);
  if (exactArtist) return { type: "artist", item: exactArtist };
  const exactAlbum = albums.find((al) => al.name.toLowerCase() === q);
  if (exactAlbum) return { type: "album", item: exactAlbum };
  const prefixTrack = tracks.find((t) => t.title.toLowerCase().startsWith(q));
  if (prefixTrack) return { type: "track", item: prefixTrack };
  const prefixArtist = artists.find((a) => a.name.toLowerCase().startsWith(q));
  if (prefixArtist) return { type: "artist", item: prefixArtist };

  if (tracks.length > 0) return { type: "track", item: tracks[0] };
  if (artists.length > 0) return { type: "artist", item: artists[0] };
  if (albums.length > 0) return { type: "album", item: albums[0] };
  return null;
}

/** The big "best match" card: soft colour wash from the artwork, one clear action. */
function TopResultCard({ result, queue }: { result: TopResult; queue: Track[] }) {
  const isPlaying = usePlayer((s) => s.isPlaying);
  const current = usePlayer((s) => s.queue[s.index]);
  const playTrack = usePlayer((s) => s.playTrack);
  const toggle = usePlayer((s) => s.toggle);

  const shell =
    "tv-card group relative isolate flex items-center gap-4 overflow-hidden rounded-3xl border border-border bg-surface p-4 transition-colors hover:border-border-strong sm:gap-6 sm:p-6 lg:flex-col lg:items-start lg:gap-4";

  const Wash = ({ src }: { src?: string | null }) => (
    <>
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-30" aria-hidden>
        <Cover src={src} alt="" className="size-full scale-125 object-cover blur-3xl saturate-150" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-bg/85 via-bg/60 to-bg/30" aria-hidden />
    </>
  );

  const PlayDot = ({ playing }: { playing?: boolean }) => (
    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-fg text-bg shadow-lg transition group-hover:scale-105 sm:size-14">
      {playing ? <Pause className="size-5 fill-current" strokeWidth={0} /> : <Play className="ml-0.5 size-5 fill-current" strokeWidth={0} />}
    </span>
  );

  const Kicker = ({ children }: { children: string }) => (
    <span className="mb-1.5 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-white/80 uppercase">
      {children}
    </span>
  );

  if (result.type === "artist") {
    const artist = result.item;
    return (
      <Link to="/artist/$id" params={{ id: artist.id }} className={shell}>
        <Wash src={artist.artworkLg || artist.artwork} />
        <Cover
          src={artist.artworkLg || artist.artwork}
          alt={artist.name}
          title={artist.name}
          rounded="full"
          className="size-24 shrink-0 rounded-full border border-white/10 object-cover shadow-xl sm:size-32 lg:size-36"
        />
        <div className="min-w-0 flex-1 lg:w-full">
          <Kicker>Artist</Kicker>
          <h3 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">{artist.name}</h3>
        </div>
        <PlayDot />
      </Link>
    );
  }

  if (result.type === "album") {
    const album = result.item;
    return (
      <Link to="/playlist/$id" params={{ id: album.id }} className={shell}>
        <Wash src={album.artworkLg || album.artwork} />
        <Cover
          src={album.artworkLg || album.artwork}
          alt={album.name}
          title={album.name}
          className="size-24 shrink-0 rounded-2xl border border-white/10 object-cover shadow-xl sm:size-32 lg:size-36"
        />
        <div className="min-w-0 flex-1 lg:w-full">
          <Kicker>Album</Kicker>
          <h3 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">{album.name}</h3>
          <p className="mt-1 truncate text-sm text-muted">{album.owner ? `By ${album.owner}` : "Album"}</p>
        </div>
        <PlayDot />
      </Link>
    );
  }

  const track = result.item;
  const isCurrent = current?.id === track.id;
  const activate = () => (isCurrent ? toggle() : playTrack(track, queue.length ? queue : [track]));

  return (
    <div className={cn(shell, "relative")}>
      <Wash src={track.artworkLg || track.artwork} />
      <button type="button" onClick={activate} className="flex min-w-0 flex-1 items-center gap-4 text-left sm:gap-6 lg:w-full lg:flex-col lg:items-start lg:gap-4" aria-label={`Play ${track.title}`}>
        <Cover
          src={track.artworkLg || track.artwork}
          alt={track.title}
          title={track.title}
          className="size-24 shrink-0 rounded-2xl border border-white/10 object-cover shadow-xl sm:size-32 lg:size-36"
        />
        <span className="min-w-0 flex-1 lg:w-full">
          <Kicker>Song</Kicker>
          <span className="block truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">{track.title}</span>
          <span className="mt-1 block truncate text-sm text-muted">{track.artist}</span>
        </span>
        <PlayDot playing={isCurrent && isPlaying} />
      </button>
      <TrackMenuButton track={track} rest={queue} className="size-10 lg:absolute lg:top-4 lg:right-4" />
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

const GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-6";

function SectionTitle({ children, aside }: { children: string; aside?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-[22px]">{children}</h2>
      {aside ? <span className="text-xs text-muted">{aside}</span> : null}
    </div>
  );
}

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const recents = usePlayer((s) => s.recentSearches);
  const rememberSearch = usePlayer((s) => s.rememberSearch);
  const removeRecentSearch = usePlayer((s) => s.removeRecentSearch);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [localQ, setLocalQ] = useState(q);

  useEffect(() => {
    setLocalQ(q);
    setFilter("all");
    setShowAllSongs(false);
  }, [q]);

  const runSearch = (value: string) => {
    const query = value.trim();
    if (!query) return;
    rememberSearch(query);
    void navigate({ to: "/search", search: { q: query } });
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

  const albums = useQuery({ queryKey: ["search-albums", q], queryFn: () => searchAlbums(q, 12), enabled: Boolean(q) });
  const artists = useQuery({ queryKey: ["search-artists", q], queryFn: () => searchArtists(q, 12), enabled: Boolean(q) });
  const playlists = useQuery({ queryKey: ["search-playlists", q], queryFn: () => searchPlaylists(q, 12), enabled: Boolean(q) });
  const radio = useQuery({ queryKey: ["search-radio", q], queryFn: () => searchRadio(q, 12), enabled: Boolean(q) });

  const topResult = getTopResult(q, tracks.data ?? [], artists.data ?? [], albums.data ?? []);

  const field = (
    <SearchField value={localQ} onChange={setLocalQ} onSearch={runSearch} className="relative z-[45] max-w-3xl" />
  );

  // ── Nothing searched yet ───────────────────────────────────────────────────
  if (!q) {
    return (
      <div className="w-full space-y-10 px-4 pt-6 pb-32 md:px-10 md:pt-8">
        <header className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl md:text-4xl">Search</h1>
          {field}
        </header>

        {recents.length > 0 && (
          <section className="space-y-2">
            <SectionTitle>Recent searches</SectionTitle>
            <ul className="max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {recents.slice(0, 6).map((s) => (
                <li key={s} className="flex items-center">
                  <Link
                    to="/search"
                    search={{ q: s }}
                    onClick={() => rememberSearch(s)}
                    className="tv-card flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-sm text-fg/90 transition hover:bg-hover"
                  >
                    <History className="size-4 shrink-0 text-muted" />
                    <span className="truncate">{s}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeRecentSearch(s)}
                    aria-label={`Remove "${s}"`}
                    className="mr-2 grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-hover hover:text-fg"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-[22px]">Browse by genre</h2>
            <Link to="/explore" className="text-sm font-medium text-muted transition hover:text-fg">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {GENRES.slice(0, 6).map((g) => (
              <GenreTile key={g.slug} slug={g.slug} label={g.label} hint={g.hint} image={g.image} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle>Trending searches</SectionTitle>
          <div className="flex flex-wrap gap-2.5">
            {TRENDING_SEARCHES.map((item) => (
              <Link
                key={item.label}
                to="/search"
                search={{ q: item.label }}
                onClick={() => rememberSearch(item.label)}
                className="tv-card group inline-flex items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-2.5 text-sm transition hover:border-border-strong active:scale-95"
              >
                <TrendingUp className="size-4 text-accent" />
                <span className="font-medium text-fg">{item.label}</span>
                <span className="hidden text-xs text-subtle sm:inline">{item.tag}</span>
              </Link>
            ))}
          </div>
        </section>

        {(featuredAlbums.data ?? []).length ? (
          <Rail title="Popular & iconic albums">
            {(featuredAlbums.data ?? []).map((album) => (
              <PlaylistCard key={album.id} playlist={album} />
            ))}
          </Rail>
        ) : null}
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (tracks.isLoading && !tracks.data) return <HomeSkeleton />;

  const songs = tracks.data ?? [];
  const hasAnyResults =
    Boolean(topResult) ||
    songs.length > 0 ||
    (albums.data ?? []).length > 0 ||
    (artists.data ?? []).length > 0 ||
    (playlists.data ?? []).length > 0 ||
    (radio.data ?? []).length > 0;

  const tabs = [
    { id: "all", label: "All" },
    { id: "songs", label: "Songs", count: songs.length },
    { id: "albums", label: "Albums", count: albums.data?.length },
    { id: "artists", label: "Artists", count: artists.data?.length },
    { id: "playlists", label: "Playlists", count: playlists.data?.length },
    { id: "radio", label: "Radio", count: radio.data?.length },
  ].filter((t) => t.id === "all" || (t.count ?? 0) > 0);

  return (
    <div className="w-full space-y-8 px-4 pt-6 pb-32 md:space-y-10 md:px-10 md:pt-8">
      <header className="space-y-4">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-fg sm:text-3xl md:text-4xl">Results for “{q}”</h1>
        {field}

        {hasAnyResults && (
          <div role="tablist" aria-label="Result type" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:-mx-10 md:px-10 [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id as SearchFilter)}
                className={cn(
                  "flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition active:scale-95",
                  filter === tab.id ? "border-fg bg-fg text-bg" : "border-border bg-surface text-muted hover:border-border-strong hover:text-fg",
                )}
              >
                {tab.label}
                {tab.count !== undefined && <span className="font-mono text-xs tabular-nums opacity-60">{tab.count}</span>}
              </button>
            ))}
          </div>
        )}
      </header>

      {!hasAnyResults && !tracks.isLoading ? (
        <div className="py-20 text-center">
          <p className="text-lg font-semibold text-fg">No results for “{q}”</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Check the spelling, or try fewer or different words.</p>
        </div>
      ) : (
        <>
          {filter === "all" && (
            <div className="space-y-10 md:space-y-12">
              {topResult || songs.length > 0 ? (
                <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                  {topResult ? (
                    <div className={cn("space-y-3", songs.length > 0 ? "lg:col-span-5" : "lg:col-span-12")}>
                      <SectionTitle>Top result</SectionTitle>
                      <TopResultCard result={topResult} queue={songs} />
                    </div>
                  ) : null}

                  {songs.length > 0 ? (
                    <div className={cn("space-y-3", topResult ? "lg:col-span-7" : "lg:col-span-12")}>
                      <div className="flex items-end justify-between gap-3">
                        <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-[22px]">Songs</h2>
                        {songs.length > 4 ? (
                          <button
                            type="button"
                            onClick={() => setShowAllSongs((v) => !v)}
                            className="text-sm font-medium text-muted transition hover:text-fg"
                          >
                            {showAllSongs ? "Show less" : `Show all ${songs.length}`}
                          </button>
                        ) : null}
                      </div>
                      <div>
                        {(showAllSongs ? songs : songs.slice(0, 5)).map((t, i) => (
                          <TrackRow key={t.id} track={t} index={i} queue={songs} showPlays />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {(albums.data ?? []).length ? (
                <Rail title="Albums">
                  {(albums.data ?? []).map((album) => (
                    <PlaylistCard key={album.id} playlist={album} />
                  ))}
                </Rail>
              ) : null}

              {(artists.data ?? []).length ? (
                <Rail title="Artists" placeholder="round">
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
          )}

          {filter === "songs" && (
            <section className="space-y-3">
              <SectionTitle aside={`${songs.length} results`}>Songs</SectionTitle>
              <div>
                {songs.map((t, i) => (
                  <TrackRow key={t.id} track={t} index={i} queue={songs} showPlays />
                ))}
              </div>
            </section>
          )}

          {filter === "albums" && (
            <section className="space-y-4">
              <SectionTitle aside={`${albums.data?.length ?? 0} releases`}>Albums</SectionTitle>
              <div className={GRID}>
                {(albums.data ?? []).map((album) => (
                  <PlaylistCard key={album.id} playlist={album} />
                ))}
              </div>
            </section>
          )}

          {filter === "artists" && (
            <section className="space-y-4">
              <SectionTitle aside={`${artists.data?.length ?? 0} artists`}>Artists</SectionTitle>
              <div className={GRID}>
                {(artists.data ?? []).map((a) => (
                  <ArtistCard key={a.id} artist={a} />
                ))}
              </div>
            </section>
          )}

          {filter === "playlists" && (
            <section className="space-y-4">
              <SectionTitle aside={`${playlists.data?.length ?? 0} playlists`}>Playlists</SectionTitle>
              <div className={GRID}>
                {(playlists.data ?? []).map((p) => (
                  <PlaylistCard key={p.id} playlist={p} />
                ))}
              </div>
            </section>
          )}

          {filter === "radio" && (
            <section className="space-y-4">
              <SectionTitle aside={`${radio.data?.length ?? 0} stations`}>Live radio</SectionTitle>
              <div className={GRID}>
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
