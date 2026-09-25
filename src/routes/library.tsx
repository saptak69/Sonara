import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { AlbumCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { Rail } from "@/components/rail";
import { TrackRow } from "@/components/track-row";
import { RadioContent } from "@/routes/radio";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/player-store";
import type { Playlist } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Compass, Heart, History, ListMusic, Plus, Trash2, Ghost } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type LibrarySearch = { tab?: "recents" | "favorites" | "playlists" | "radios" };

export const Route = createFileRoute("/library")({ 
  validateSearch: (search: Record<string, unknown>): LibrarySearch => {
    return {
      tab: search.tab === "favorites" || search.tab === "playlists" || search.tab === "recents" || search.tab === "radios"
        ? search.tab as any 
        : undefined,
    }
  },
  component: LibraryPage 
});

function LibraryPage() {
  const { tab: initialTab } = Route.useSearch();
  const navigate = useNavigate({ from: "/library" });
  
  const recents = usePlayer((s) => s.recents);
  const likedIds = usePlayer((s) => s.likedIds);
  const playlists = usePlayer((s) => s.playlists);
  const playTracks = usePlayer((s) => s.playTracks);
  const createPlaylist = usePlayer((s) => s.createPlaylist);
  const deletePlaylist = usePlayer((s) => s.deletePlaylist);
  const clearRecents = usePlayer((s) => s.clearRecents);
  
  const [tab, setTab] = useState<"recents" | "favorites" | "playlists" | "radios">(initialTab || "recents");

  useEffect(() => {
    if (initialTab && initialTab !== tab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (newTab: "recents" | "favorites" | "playlists" | "radios") => {
    setTab(newTab);
    void navigate({ search: { tab: newTab }, replace: true });
  };

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
    <div className="w-full pb-20 stagger-in">
      <header className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-12 pt-12 pb-4">
        <h1 className="font-display text-4xl md:text-[40px] font-bold text-white tracking-tight">Library</h1>
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

      <div className="px-4 md:px-12 mt-2 space-y-8">
        <div className="flex gap-2 pb-3 overflow-x-auto [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0">
          {(
            [
              ["recents", "Recents", recents.length],
              ["favorites", "Favorites", likedTracks.length],
              ["playlists", "Playlists", userPlaylists.length],
              ["radios", "Radios", 0],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              className="group relative isolate flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-150 md:text-sm active:scale-95 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10"
              onClick={() => handleTabChange(id)}
            >
              {tab === id && (
                <motion.div
                  layoutId="library-tab-glow"
                  className="absolute inset-0 z-[-1] rounded-full"
                  style={{ background: 'rgba(255, 74, 58, 0.2)', border: '1px solid rgba(255, 74, 58, 0.3)', boxShadow: '0 4px 12px rgba(255, 74, 58, 0.2)' }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className={cn("transition-colors relative z-10", tab === id ? "text-accent-fg" : "text-muted group-hover:text-fg")}>{label}</span>
              {count > 0 ? (
                <span className={cn("text-[10px] font-mono transition-colors relative z-10", tab === id ? "text-accent-fg/80" : "text-muted/60 group-hover:text-fg/80")}>({count})</span>
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
            icon={Ghost}
            title="No listening history yet"
            text="Songs and live stations you play will automatically appear here."
            action={{ label: "Explore trending tracks", to: "/explore" }}
          />
        )
      ) : null}

      {tab === "favorites" ? (
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
            title="Oops! There's no favorites"
            text="Tap the heart icon on any song you like to add it to your favorites."
            action={{ label: "Discover new music", to: "/explore" }}
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

      {tab === "radios" ? (
        <div className="pt-2">
          <RadioContent />
        </div>
      ) : null}
      </div>
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
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <Icon className="size-12 text-muted mb-4 stroke-[1.5]" />
      <h3 className="text-xl font-bold text-fg tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-muted max-w-sm mx-auto leading-relaxed">{text}</p>
      {action ? (
        <div className="mt-8">
          <Link
            to={action.to}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-accent text-white font-semibold text-sm transition-transform active:scale-95"
          >
            {action.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
