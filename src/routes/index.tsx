import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Compass, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AlbumCard, PlaylistCard, TopPickCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { Rail } from "@/components/rail";
import { TvHero } from "@/components/tv/tv-hero";
import { SiteFooter } from "@/components/site-footer";
import { firstName, useCurrentUser } from "@/lib/auth/use-current-user";
import { fetchTrending, fetchTrendingPlaylists } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

const WEEKLY_MIX_ART =
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=600&auto=format&fit=crop";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Home() {
  const user = useCurrentUser();
  const recents = usePlayer((s) => s.recents);
  const hydrated = usePlayer((s) => s.hydrated);

  const trending = useQuery({ queryKey: ["trending"], queryFn: () => fetchTrending(18) });
  const playlists = useQuery({ queryKey: ["playlists"], queryFn: () => fetchTrendingPlaylists(12) });

  const topTracks = useMemo(() => trending.data ?? [], [trending.data]);
  const picks = topTracks.slice(0, 6);
  const fresh = topTracks.slice(6);
  const artists = useMemo(() => uniqueArtists(topTracks), [topTracks]);
  const name = firstName(user);

  return (
    <div className="stagger-in space-y-10 px-4 pt-4 pb-16 sm:px-6 md:space-y-12 short:space-y-7 short:pt-2 desk:px-10 desk:pt-6">
      <TvHero
        track={hydrated && recents.length > 0 ? recents[0] : picks[0]}
        queue={hydrated && recents.length > 0 ? recents : topTracks}
        kicker={hydrated && recents.length > 0 ? "Continue listening" : "Trending now"}
      />

      <header className="pt-2 tvd:hidden">
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight sm:text-4xl short:text-2xl">
          {greeting()}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="mt-1.5 text-sm text-muted sm:text-base short:hidden">
          {recents.length ? "Pick up where you left off, or find something new." : "Fresh picks, live radio and new artists, all in one place."}
        </p>
      </header>

      {hydrated && recents.length > 0 && (
        <Rail title="Jump back in">
          {recents.slice(0, 16).map((track) => (
            <AlbumCard key={track.id} track={track} queue={recents} />
          ))}
        </Rail>
      )}

      <Rail title="Top picks for you" loading={trending.isLoading} placeholder="large">
        {picks.map((track, i) => (
          <TopPickCard key={track.id} track={track} queue={topTracks} label={PICK_LABELS[i] ?? "For you"} />
        ))}
      </Rail>

      <Rail title="Made for you" subtitle="Mixes that learn from what you play" to="/playlists" loading={playlists.isLoading}>
        <DiscoveryStationCard />
        <Link to="/weekly-mix" className="tv-card group w-36 shrink-0 rounded-xl sm:w-44">
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
            <Cover src={WEEKLY_MIX_ART} alt="" title="Weekly Mix" className="aspect-square w-full" />
          </div>
          <span className="mt-2.5 block truncate text-sm font-medium text-fg transition-colors lg:group-hover:text-accent">
            Your Weekly Mix
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-muted">Updated every Monday</span>
        </Link>
        {(playlists.data ?? []).map((playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </Rail>

      <Rail title="New music" loading={trending.isLoading}>
        {fresh.map((track) => (
          <AlbumCard key={track.id} track={track} queue={fresh} />
        ))}
      </Rail>

      <Rail title="Artists you might like" loading={trending.isLoading} placeholder="round">
        {artists.map((track) => (
          <Link
            key={track.artistId ?? track.artist}
            to={track.artistId ? "/artist/$id" : "/search"}
            params={track.artistId ? { id: track.artistId } : undefined}
            search={track.artistId ? undefined : { q: track.artist }}
            className="tv-card group flex w-32 shrink-0 flex-col items-center rounded-2xl text-center sm:w-36"
          >
            <Cover
              src={track.artworkLg || track.artwork}
              alt={track.artist}
              title={track.artist}
              rounded="full"
              className="aspect-square w-full border border-border transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <span className="mt-2.5 w-full truncate text-[13px] font-medium text-fg group-hover:text-accent">{track.artist}</span>
            <span className="mt-0.5 text-xs text-subtle">Artist</span>
          </Link>
        ))}
      </Rail>

      {trending.isError && playlists.isError && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="font-medium">We couldn't load music right now.</p>
          <p className="mt-1 text-sm text-muted">Check your connection — your library and downloads still work.</p>
          <button
            type="button"
            onClick={() => {
              void trending.refetch();
              void playlists.refetch();
            }}
            className="mt-4 h-10 rounded-full bg-surface-2 px-5 text-sm font-medium transition hover:bg-surface-3"
          >
            Try again
          </button>
        </div>
      )}

      <div className="border-t border-border pt-8 tvd:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}

const PICK_LABELS = ["Trending now", "Listen again", "Made for you", "New release", "Popular", "Top hit"];

function uniqueArtists(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const key = (t.artistId ?? t.artist).toLowerCase();
    if (!t.artist || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function DiscoveryStationCard() {
  const playTracks = usePlayer((s) => s.playTracks);
  const [tuning, setTuning] = useState(false);

  const start = async () => {
    setTuning(true);
    try {
      const { getDiscoveryStationTracksServerFn } = await import("@/lib/recommendation-engine");
      const tracks = await getDiscoveryStationTracksServerFn({ data: { limit: 20 } });
      if (tracks.length) {
        playTracks(tracks, 0);
        toast.success("Discovery Station", { description: "Only songs you haven't heard yet" });
      } else {
        toast("No new songs to discover right now. Try again later.");
      }
    } catch {
      toast.error("Discovery Station isn't available right now.");
    } finally {
      setTuning(false);
    }
  };

  return (
    <button type="button" onClick={start} disabled={tuning} className="tv-card group w-36 shrink-0 rounded-xl text-left sm:w-44">
      <div className="relative flex aspect-square flex-col justify-between overflow-hidden rounded-xl border border-border bg-gradient-to-br from-surface-3 via-surface-2 to-bg p-4 transition-colors group-hover:border-accent/40">
        <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-accent/20 blur-2xl" />
        <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
          {tuning ? <Loader2 className="size-5 animate-spin" /> : <Compass className="size-5" />}
        </span>
        <span>
          <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-muted uppercase">
            <Sparkles className="size-3" /> Smart mix
          </span>
          <span className="mt-0.5 block text-base leading-tight font-semibold">Discovery</span>
        </span>
      </div>
      <span className="mt-2.5 block truncate text-sm font-medium text-fg transition-colors lg:group-hover:text-accent">
        Discovery Station
      </span>
      <span className="mt-0.5 block truncate text-[13px] text-muted">Songs you haven't heard</span>
    </button>
  );
}
