import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AlbumCard, PlaylistCard, RadioCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { ChartList } from "@/components/home/chart-list";
import { GenreTiles } from "@/components/home/genre-tiles";
import { Pills } from "@/components/home/pills";
import { PickCard, PickSkeleton } from "@/components/home/top-picks";
import { useTopPicks } from "@/components/home/use-top-picks";
import { Rail } from "@/components/rail";
import { SiteFooter } from "@/components/site-footer";
import { firstName, useCurrentUser } from "@/lib/auth/use-current-user";
import { identityKey } from "@/lib/music/match";
import { fetchRadioStations, fetchTrending, fetchTrendingPlaylists, fetchUnderground } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";
import { useMounted, useNearViewport } from "@/lib/use-near-viewport";

export const Route = createFileRoute("/")({ component: Home });

const CHART_SIZE = 10;
const MINUTE = 60_000;

function greetingFor(hour: number): string {
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function uniqueTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const key = identityKey(t);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueArtists(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const key = (t.artistId ?? t.artist).toLowerCase();
    if (!t.artist || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function Home() {
  const user = useCurrentUser();
  const recents = usePlayer((s) => s.recents);
  const hydrated = usePlayer((s) => s.hydrated);
  const current = usePlayer((s) => s.queue[s.index]);
  // The clock and the saved library only exist in the browser; wait for them so the
  // first render matches what the server sent.
  const ready = useMounted() && hydrated;

  const trending = useQuery({ queryKey: ["trending"], queryFn: () => fetchTrending(20) });
  const chartTracks = useMemo(() => trending.data ?? [], [trending.data]);
  const fresh = useMemo(() => chartTracks.slice(CHART_SIZE), [chartTracks]);
  const artists = useMemo(() => uniqueArtists(chartTracks), [chartTracks]);
  const recent = useMemo(() => uniqueTracks(recents), [recents]);
  const picks = useTopPicks(chartTracks, ready);

  // "Because you played …" is based on the song the listener opened the page with, and
  // stays on it, so the shelf doesn't reshuffle while they listen.
  const [seed, setSeed] = useState<Track | null>(null);
  useEffect(() => {
    if (!ready || seed) return;
    setSeed((current?.kind === "track" ? current : recent.find((t) => t.kind === "track")) ?? null);
  }, [ready, seed, current, recent]);

  // Shelves below the fold fetch only once the listener scrolls toward them.
  const [becauseRef, becauseNear] = useNearViewport();
  const [radioRef, radioNear] = useNearViewport();
  const [independentRef, independentNear] = useNearViewport();
  const [playlistsRef, playlistsNear] = useNearViewport();

  const because = useQuery({
    queryKey: ["because-you-played", seed?.id],
    enabled: becauseNear && Boolean(seed),
    staleTime: 10 * MINUTE,
    queryFn: async () => {
      const { getSongRadioServerFn } = await import("@/lib/music/catalog");
      const { id, title, artist, genre, duration, source } = seed as Track;
      return getSongRadioServerFn({ data: { seed: { id, title, artist, genre, duration, source }, limit: 14 } });
    },
  });
  const radio = useQuery({ queryKey: ["home-radio"], queryFn: () => fetchRadioStations(14), enabled: radioNear, staleTime: 30 * MINUTE });
  const independent = useQuery({ queryKey: ["independent-trending"], queryFn: () => fetchUnderground(16), enabled: independentNear, staleTime: 15 * MINUTE });
  const playlists = useQuery({ queryKey: ["playlists"], queryFn: () => fetchTrendingPlaylists(12), enabled: playlistsNear });

  const name = firstName(user);
  const greeting = ready ? greetingFor(new Date().getHours()) : "Welcome";

  return (
    <div className="stagger-in mx-auto space-y-10 px-4 pt-4 pb-16 sm:px-6 md:space-y-12 short:space-y-7 short:pt-2 desk:px-10 desk:pt-6">
      <header className="space-y-4 tvd:hidden">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight sm:text-[40px] desk:text-5xl short:text-2xl">
          {greeting}
          {ready && name ? `, ${name}` : ""}
        </h1>
        <Pills />
      </header>

      <Rail title="Top Picks" subtitle="Made from what you play">
        {ready
          ? picks.map((pick, i) => <PickCard key={pick.key} pick={pick} first={i === 0} />)
          : Array.from({ length: 3 }).map((_, i) => <PickSkeleton key={i} />)}
      </Rail>

      {ready && recent.length > 0 ? (
        <Rail title="Recently Played" to="/library">
          {recent.slice(0, 16).map((track) => (
            <AlbumCard key={track.id} track={track} queue={recent} />
          ))}
        </Rail>
      ) : null}

      {seed ? (
        <div ref={becauseRef} className="defer-paint min-h-[260px]">
          <Rail
            title={`Because you played ${seed.title}`}
            subtitle={`Similar songs and more by ${seed.artist.split(/,|&/)[0].trim()}`}
            loading={!becauseNear || because.isLoading}
          >
            {(because.data ?? []).map((track) => (
              <AlbumCard key={track.id} track={track} queue={because.data} />
            ))}
          </Rail>
        </div>
      ) : null}

      <ChartList tracks={chartTracks} loading={trending.isLoading} onRetry={() => void trending.refetch()} />

      <GenreTiles />

      <div ref={radioRef} className="defer-paint min-h-[260px]">
        <Rail title="Live Radio" subtitle="Stations from around the world" to="/radio" loading={!radioNear || radio.isLoading}>
          {(radio.data ?? []).map((station) => (
            <RadioCard key={station.id} station={station} />
          ))}
        </Rail>
      </div>

      <div ref={independentRef} className="defer-paint min-h-[260px]">
        <Rail
          title="Rising Independent Artists"
          subtitle="Trending on Audius this week · full songs, free"
          loading={!independentNear || independent.isLoading}
        >
          {(independent.data ?? []).map((track) => (
            <AlbumCard key={track.id} track={track} queue={independent.data} />
          ))}
        </Rail>
      </div>

      <div ref={playlistsRef} className="defer-paint min-h-[260px]">
        <Rail title="Featured Playlists" to="/playlists" loading={!playlistsNear || playlists.isLoading}>
          {(playlists.data ?? []).map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </Rail>
      </div>

      <div className="defer-paint">
        <Rail title="New Music" loading={trending.isLoading}>
          {fresh.map((track) => (
            <AlbumCard key={track.id} track={track} queue={fresh} />
          ))}
        </Rail>
      </div>

      <div className="defer-paint">
        <Rail title="Artists" loading={trending.isLoading} placeholder="round">
          {artists.map((track) => (
            <Link
              key={track.artistId ?? track.artist}
              to={track.artistId ? "/artist/$id" : "/search"}
              params={track.artistId ? { id: track.artistId } : undefined}
              search={track.artistId ? undefined : { q: track.artist }}
              className="tv-card group flex w-32 shrink-0 flex-col items-center rounded-2xl text-center sm:w-36 tvd:w-44"
            >
              <Cover
                src={track.artwork || track.artworkLg}
                alt={track.artist}
                title={track.artist}
                rounded="full"
                px={300}
                className="aspect-square w-full ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="mt-2.5 w-full truncate text-[14px] font-medium text-fg group-hover:text-accent tvd:text-lg">{track.artist}</span>
              <span className="text-[12px] text-muted">Artist</span>
            </Link>
          ))}
        </Rail>
      </div>

      <div className="border-t border-border pt-8 tvd:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}
