import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Download, Heart, ListMusic, Plus, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { AlbumCard, PlaylistCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { Rail } from "@/components/rail";
import { CreatePlaylistDialog } from "@/components/shell/create-playlist-dialog";
import { loadCommunityTracks } from "@/lib/community-tracks";
import { fetchFeaturedAlbums, fetchTrending, fetchTrendingPlaylists } from "@/lib/music-api";
import { useOfflineTracks } from "@/lib/offline-cache";
import { LIKED_PLAYLIST_ID, usePlayer } from "@/lib/player-store";
import type { UserPlaylist } from "@/lib/types";
import { cn, hashHue } from "@/lib/utils";

export const Route = createFileRoute("/playlists")({
  head: () => ({ meta: [{ title: "Playlists · Sonara" }] }),
  component: PlaylistsPage,
});

const GRID = "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

/** 2×2 mosaic of the first songs' artwork; a tinted placeholder for an empty playlist. */
function Mosaic({ playlist }: { playlist: UserPlaylist }) {
  const arts = playlist.tracks
    .map((t) => t.artwork)
    .filter((a): a is string => Boolean(a))
    .slice(0, 4);
  const hue = hashHue(playlist.id);

  if (arts.length === 0) {
    return (
      <div
        className="grid size-full place-items-center"
        style={{ background: `linear-gradient(135deg, hsl(${hue} 55% 30%), hsl(${(hue + 50) % 360} 55% 14%))` }}
      >
        <ListMusic className="size-1/3 text-white/70" />
      </div>
    );
  }
  if (arts.length < 4) {
    return <Cover src={arts[0]} alt="" className="size-full object-cover" />;
  }
  return (
    <div className="grid size-full grid-cols-2 grid-rows-2">
      {arts.map((src, i) => (
        <Cover key={i} src={src} alt="" className="size-full rounded-none object-cover" />
      ))}
    </div>
  );
}

function PlaylistTile({ playlist }: { playlist: UserPlaylist }) {
  return (
    <Link
      to="/playlist/$id"
      params={{ id: playlist.id }}
      className="tv-card group block min-w-0 rounded-2xl transition-transform duration-200 active:scale-[0.97]"
    >
      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-md transition-transform duration-300 lg:group-hover:scale-[1.02]">
        <Mosaic playlist={playlist} />
      </div>
      <div className="mt-2.5 px-0.5">
        <span className="block truncate text-[14px] leading-snug font-semibold text-fg">{playlist.name}</span>
        <span className="mt-0.5 block truncate text-[12.5px] text-muted">
          {playlist.tracks.length} {playlist.tracks.length === 1 ? "song" : "songs"}
        </span>
      </div>
    </Link>
  );
}

function CreateTile() {
  return (
    <CreatePlaylistDialog
      trigger={
        <button
          type="button"
          className="tv-card group block min-w-0 cursor-pointer rounded-2xl text-left transition-transform duration-200 active:scale-[0.97]"
        >
          <div className="grid aspect-square w-full place-items-center rounded-2xl border-2 border-dashed border-border-strong bg-surface/50 text-muted transition group-hover:border-accent/60 group-hover:text-accent">
            <Plus className="size-9" strokeWidth={1.6} />
          </div>
          <div className="mt-2.5 px-0.5">
            <span className="block truncate text-[14px] leading-snug font-semibold text-fg">New playlist</span>
            <span className="mt-0.5 block truncate text-[12.5px] text-muted">Start from scratch</span>
          </div>
        </button>
      }
    />
  );
}

/** Big shortcut cards: Liked songs, Downloads, Weekly mix. */
function Shortcut({
  to,
  search,
  title,
  subtitle,
  icon: Icon,
  gradient,
}: {
  to: "/library" | "/weekly-mix";
  search?: { tab: "favorites" | "downloads" };
  title: string;
  subtitle: string;
  icon: typeof Heart;
  gradient: string;
}) {
  return (
    <Link
      to={to}
      search={search as never}
      className={cn(
        "tv-card group relative flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-white/[0.08] p-4 transition-transform duration-200 active:scale-[0.98] sm:p-5",
        gradient,
      )}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-black/25 text-white backdrop-blur sm:size-14">
        <Icon className="size-6 sm:size-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold text-white sm:text-lg">{title}</span>
        <span className="block truncate text-sm text-white/70">{subtitle}</span>
      </span>
      <ArrowUpRight className="size-5 shrink-0 text-white/60 transition group-hover:text-white" />
    </Link>
  );
}

function PlaylistsPage() {
  const hydrated = usePlayer((s) => s.hydrated);
  const allPlaylists = usePlayer((s) => s.playlists);
  const likedCount = usePlayer((s) => s.likedIds.length);
  const { downloadedTracks } = useOfflineTracks();
  const downloadedCount = downloadedTracks.length;
  const mine = useMemo(() => allPlaylists.filter((p) => p.id !== LIKED_PLAYLIST_ID), [allPlaylists]);

  const featured = useQuery({ queryKey: ["playlists-featured"], queryFn: () => fetchTrendingPlaylists(14) });
  const albums = useQuery({ queryKey: ["playlists-iconic-albums"], queryFn: () => fetchFeaturedAlbums(12) });
  const charts = useQuery({ queryKey: ["charts"], queryFn: () => fetchTrending(16) });
  const community = useQuery({ queryKey: ["community-explore"], queryFn: () => loadCommunityTracks(16) });

  return (
    <div className="w-full space-y-10 px-4 pt-6 pb-32 md:space-y-12 md:px-10 md:pt-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl md:text-4xl">Playlists</h1>
          <p className="mt-1 text-sm text-muted">Your collections, mixes made for you, and the best of the community</p>
        </div>
        <CreatePlaylistDialog
          trigger={
            <button
              type="button"
              className="hidden h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-fg px-5 text-sm font-semibold text-bg transition active:scale-95 sm:inline-flex"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              New playlist
            </button>
          }
        />
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Shortcuts">
        <Shortcut
          to="/library"
          search={{ tab: "favorites" }}
          title="Liked songs"
          subtitle={hydrated ? `${likedCount} ${likedCount === 1 ? "song" : "songs"}` : "Your favourites"}
          icon={Heart}
          gradient="bg-gradient-to-br from-[#7a1d3a] via-[#4b1229] to-[#1d0a14]"
        />
        <Shortcut
          to="/library"
          search={{ tab: "downloads" }}
          title="Downloads"
          subtitle={hydrated ? `${downloadedCount} for offline` : "Play without internet"}
          icon={Download}
          gradient="bg-gradient-to-br from-[#14506b] via-[#0e3347] to-[#08161f]"
        />
        <Shortcut
          to="/weekly-mix"
          title="Your weekly mix"
          subtitle="Fresh songs, updated every week"
          icon={Sparkles}
          gradient="bg-gradient-to-br from-[#8a4a0c] via-[#573009] to-[#1f1306] sm:col-span-2 xl:col-span-1"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-[22px]">Your playlists</h2>
        {hydrated ? (
          <div className={GRID}>
            <CreateTile />
            {mine.map((p) => (
              <PlaylistTile key={p.id} playlist={p} />
            ))}
          </div>
        ) : (
          <div className={GRID} aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <div className="skeleton aspect-square w-full rounded-2xl" />
                <div className="skeleton mt-3 h-3 w-3/4 rounded" />
              </div>
            ))}
          </div>
        )}
        {hydrated && mine.length === 0 && (
          <p className="text-sm text-muted">No playlists yet. Make one, or add songs from any song's ⋮ menu.</p>
        )}
      </section>

      {(featured.data ?? []).length > 0 && (
        <Rail title="Featured playlists" subtitle="Picked from what people are playing">
          {(featured.data ?? []).map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </Rail>
      )}

      {(albums.data ?? []).length > 0 && (
        <Rail title="Iconic albums">
          {(albums.data ?? []).map((a) => (
            <PlaylistCard key={a.id} playlist={a} />
          ))}
        </Rail>
      )}

      {(charts.data ?? []).length > 0 && (
        <Rail title="Top charts" subtitle="What everyone is playing right now">
          {(charts.data ?? []).map((t) => (
            <AlbumCard key={t.id} track={t} queue={charts.data} />
          ))}
        </Rail>
      )}

      {(community.data ?? []).length > 0 && (
        <Rail title="New from independent artists" subtitle="Fresh releases uploaded by the community">
          {(community.data ?? []).map((t) => (
            <AlbumCard key={t.id} track={t} queue={community.data} />
          ))}
        </Rail>
      )}

      <Link
        to="/explore"
        className="tv-card flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 transition hover:border-border-strong"
      >
        <span>
          <span className="block text-base font-semibold text-fg">Browse by genre and mood</span>
          <span className="block text-sm text-muted">Electronic, Lo-Fi, Hip-Hop, R&amp;B and more</span>
        </span>
        <ArrowUpRight className="size-5 shrink-0 text-muted" />
      </Link>
    </div>
  );
}
