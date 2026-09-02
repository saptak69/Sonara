import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlbumCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { Rail } from "@/components/rail";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/player-store";
import type { Playlist } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Compass, Heart, History, ListMusic, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/library")({ component: LibraryPage });

function LibraryPage() {
  const recents = usePlayer((s) => s.recents);
  const likedIds = usePlayer((s) => s.likedIds);
  const playlists = usePlayer((s) => s.playlists);
  const playTracks = usePlayer((s) => s.playTracks);
  const createPlaylist = usePlayer((s) => s.createPlaylist);
  const deletePlaylist = usePlayer((s) => s.deletePlaylist);
  const clearRecents = usePlayer((s) => s.clearRecents);
  const [tab, setTab] = useState<"recents" | "likes" | "playlists">("recents");

  const likedTracks = useMemo(() => {
    const fromPlaylists = playlists.find((p) => p.id === "likes")?.tracks ?? [];
    const fromRecents = recents.filter((t) => likedIds.includes(t.id));
    const map = new Map(fromPlaylists.map((t) => [t.id, t]));
    for (const t of fromRecents) map.set(t.id, t);
    return likedIds.map((id) => map.get(id)).filter((t): t is NonNullable<typeof t> => Boolean(t));
  }, [likedIds, playlists, recents]);

  const userPlaylists: Playlist[] = useMemo(
    () =>
      playlists
        .filter((p) => p.id !== "likes")
        .map((p) => ({
          id: p.id,
          name: p.name,
          artwork: p.tracks[0]?.artworkLg || p.tracks[0]?.artwork || null,
          artworkLg: p.tracks[0]?.artworkLg || null,
          trackCount: p.tracks.length,
          isAlbum: false,
          tracks: p.tracks,
        })),
    [playlists],
  );

  return (
    <div className="stagger-in space-y-8 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-subtle uppercase">Yours</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Library</h1>
        </div>
        <Button
          variant="chip"
          size="sm"
          onClick={() => {
            const name = `Playlist ${playlists.length + 1}`;
            createPlaylist(name);
            toast.success(`Created "${name}"`);
          }}
        >
          <Plus className="size-4 mr-1.5" />
          New playlist
        </Button>
      </header>

      <div className="flex gap-2 border-b border-border/40 pb-3 overflow-x-auto [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0">
        {(
          [
            ["recents", "Recents", recents.length],
            ["likes", "Liked Songs", likedTracks.length],
            ["playlists", "Playlists", userPlaylists.length],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            className={cn(
              "rounded-full px-4 py-2 text-xs md:text-sm font-semibold transition-all duration-150 active:scale-95 shrink-0 flex items-center gap-2",
              tab === id
                ? "bg-white/15 text-fg border border-white/20 shadow-sm backdrop-blur-md"
                : "bg-white/5 text-muted hover:bg-white/10 hover:text-fg",
            )}
            onClick={() => setTab(id)}
          >
            <span>{label}</span>
            {count > 0 ? (
              <span className="text-[10px] opacity-60 font-mono">({count})</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "recents" ? (
        recents.length ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted">{recents.length} recently played tracks</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted hover:text-red-400"
                onClick={() => {
                  clearRecents();
                  toast("Listening history cleared");
                }}
              >
                <Trash2 className="size-3.5 mr-1" />
                Clear history
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {recents.map((t) => (
                <AlbumCard key={t.id} track={t} queue={recents} />
              ))}
            </div>
          </div>
        ) : (
          <Empty
            icon={History}
            title="No listening history yet"
            text="Songs and live stations you play will automatically appear here."
            action={{ label: "Explore trending tracks", to: "/explore" }}
          />
        )
      ) : null}

      {tab === "likes" ? (
        likedTracks.length ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted">{likedTracks.length} favorite tracks</p>
              <Button variant="solid" size="sm" onClick={() => playTracks(likedTracks, 0)}>
                Play all
              </Button>
            </div>
            {likedTracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} queue={likedTracks} />
            ))}
          </div>
        ) : (
          <Empty
            icon={Heart}
            title="No liked songs yet"
            text="Tap the heart on any track across Sonara to build your personal favorites collection."
            action={{ label: "Discover new music", to: "/" }}
          />
        )
      ) : null}

      {tab === "playlists" ? (
        userPlaylists.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {playlists
              .filter((p) => p.id !== "likes")
              .map((p) => (
                <div key={p.id} className="group relative flex flex-col justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => p.tracks.length && playTracks(p.tracks, 0)}
                  >
                    <Cover
                      src={p.tracks[0]?.artworkLg || p.tracks[0]?.artwork}
                      alt={p.name}
                      title={p.name}
                      className="aspect-square w-full rounded-xl shadow-md"
                    />
                    <p className="mt-2.5 truncate text-sm font-semibold text-fg">{p.name}</p>
                    <p className="text-xs text-muted">{p.tracks.length} tracks</p>
                  </button>
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-subtle">Personal</span>
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-red-400 transition-colors p-1"
                      onClick={() => {
                        deletePlaylist(p.id);
                        toast(`Deleted ${p.name}`);
                      }}
                      title="Delete playlist"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <Empty
            icon={ListMusic}
            title="No playlists created"
            text="Organize your sound by creating playlists from any track menu or using the button above."
            action={{ label: "Browse Music", to: "/explore" }}
          />
        )
      ) : null}
    </div>
  );
}

function Empty({
  icon: Icon = Compass,
  title = "Nothing here yet",
  text,
  action,
}: {
  icon?: typeof Compass;
  title?: string;
  text: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] px-6 py-14 text-center backdrop-blur-xl">
      <div className="inline-grid size-12 place-items-center rounded-full bg-white/5 border border-white/10 text-muted mb-3">
        <Icon className="size-6" />
      </div>
      <p className="text-base font-semibold text-fg">{title}</p>
      <p className="mt-1 text-xs text-muted max-w-sm mx-auto">{text}</p>
      {action ? (
        <div className="mt-5">
          <Link
            to={action.to}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-fg text-xs font-semibold border border-white/15 transition-all active:scale-95"
          >
            {action.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
