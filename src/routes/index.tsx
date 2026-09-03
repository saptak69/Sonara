import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlbumCard, MoodCard, PlaylistCard } from "@/components/cards";
import { HomeSkeleton } from "@/components/home-skeleton";
import { Rail } from "@/components/rail";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { MOODS } from "@/lib/genres";
import { fetchTrending, fetchTrendingPlaylists, fetchUnderground } from "@/lib/music-api";
import { getCommunityReleasesServerFn } from "@/lib/artist-studio";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const recents = usePlayer((s) => s.recents);
  const playTracks = usePlayer((s) => s.playTracks);

  const community = useQuery({
    queryKey: ["community-releases"],
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

  const trending = useQuery({
    queryKey: ["trending"],
    queryFn: () => fetchTrending(24),
  });
  const underground = useQuery({
    queryKey: ["underground"],
    queryFn: () => fetchUnderground(16),
  });
  const playlists = useQuery({
    queryKey: ["playlists"],
    queryFn: () => fetchTrendingPlaylists(16),
  });

  const loading = trending.isLoading && !trending.data;

  if (loading) return <HomeSkeleton />;
  if (trending.isError) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-lg font-semibold">Couldn’t load your mix</p>
        <p className="mt-1 text-sm text-muted">Check the connection and try again.</p>
        <Button variant="solid" className="mt-4" onClick={() => void trending.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const picks = trending.data ?? [];

  return (
    <div className="stagger-in space-y-10 px-4 py-6 md:px-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">For you</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Listen now</h1>
        </div>
        {picks.length ? (
          <Button variant="chip" size="sm" onClick={() => playTracks(picks, 0)}>
            Play mix
          </Button>
        ) : null}
      </header>

      {recents.length ? (
        <Rail title="Listen again">
          {recents.slice(0, 12).map((t) => (
            <AlbumCard key={t.id} track={t} queue={recents} />
          ))}
        </Rail>
      ) : null}

      {picks.length ? (
        <section className="space-y-3">
          <h2 className="px-1 text-xl font-semibold tracking-tight">Quick picks</h2>
          <div className="grid grid-flow-col grid-rows-4 gap-x-3 -mx-4 px-4 sm:mx-0 sm:px-1 sm:gap-x-4 overflow-x-auto pb-1 [scrollbar-width:none]">
            {picks.slice(0, 16).map((t) => (
              <div key={t.id} className="w-[min(20rem,75vw)] sm:w-[min(22rem,78vw)]">
                <TrackRow track={t} queue={[t]} showPlays />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Moods & moments</h2>
            <p className="text-xs text-muted">Music curated for every vibe and atmosphere</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOODS.map((m) => (
            <MoodCard
              key={m.id}
              label={m.label}
              query={m.query}
              subtitle={m.subtitle}
              image={m.image}
            />
          ))}
        </div>
      </section>

      {(community.data ?? []).length ? (
        <Rail title="Indie Spotlight • Fresh Artist Releases" to="/explore">
          {(community.data ?? []).map((t) => (
            <AlbumCard key={t.id} track={t} queue={community.data} />
          ))}
        </Rail>
      ) : null}

      {(playlists.data ?? []).length ? (
        <Rail title="Mixed for you" to="/explore">
          {(playlists.data ?? []).map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </Rail>
      ) : null}

      {(underground.data ?? []).length ? (
        <Rail title="New releases">
          {(underground.data ?? []).map((t) => (
            <AlbumCard key={t.id} track={t} queue={underground.data} />
          ))}
        </Rail>
      ) : null}
    </div>
  );
}
