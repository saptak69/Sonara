import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useEffect, useState } from "react";
import { AlbumCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { TrackRow } from "@/components/track-row";
import { RadioContent } from "@/routes/radio";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/player-store";
import { useOfflineTracks, getOfflineStorageUsage, downloadTrackAudio } from "@/lib/offline-cache";
import { PlaylistImportModal } from "@/components/playlist-import-modal";
import { EmptyState } from "@/components/empty-state";
import type { Playlist } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Compass, Heart, ListMusic, Plus, Trash2, Ghost, Sparkles, Download, ArrowDownCircle, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type LibrarySearch = { tab?: "recents" | "favorites" | "playlists" | "downloads" | "radios" };

export const Route = createFileRoute("/library")({ 
  validateSearch: (search: Record<string, unknown>): LibrarySearch => {
    return {
      tab: search.tab === "favorites" || search.tab === "playlists" || search.tab === "recents" || search.tab === "downloads" || search.tab === "radios"
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
  const syncFromDatabase = usePlayer((s) => s.syncFromDatabase);

  const { downloadedTracks, clearAll } = useOfflineTracks();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ usedBytes: number; quotaBytes: number; trackCount: number } | null>(null);
  const [isDownloadingFavorites, setIsDownloadingFavorites] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    void syncFromDatabase();
  }, [syncFromDatabase]);

  useEffect(() => {
    void getOfflineStorageUsage().then(setStorageUsage);
  }, [downloadedTracks]);
  
  const tab = initialTab || "recents";

  const handleTabChange = (newTab: "recents" | "favorites" | "playlists" | "downloads" | "radios") => {
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

  const storageMb = useMemo(() => {
    if (storageUsage && storageUsage.usedBytes > 0) {
      return (storageUsage.usedBytes / (1024 * 1024)).toFixed(1);
    }
    return (downloadedTracks.length * 3.8).toFixed(1);
  }, [storageUsage, downloadedTracks.length]);

  const undownloadedFavorites = useMemo(
    () => likedTracks.filter((t) => !downloadedTracks.some((d) => d.id === t.id)),
    [likedTracks, downloadedTracks],
  );

  const handleDownloadFavorites = async () => {
    if (undownloadedFavorites.length === 0 || isDownloadingFavorites) return;
    setIsDownloadingFavorites(true);
    let done = 0;
    const total = undownloadedFavorites.length;
    setDownloadProgress({ current: 0, total });
    toast.info(`Downloading ${total} favorite tracks for offline listening...`);

    for (const track of undownloadedFavorites) {
      try {
        await downloadTrackAudio(track);
        done++;
        setDownloadProgress({ current: done, total });
      } catch (err) {
        console.error("Failed to download track:", track.id, err);
      }
    }
    setIsDownloadingFavorites(false);
    setDownloadProgress(null);
    toast.success(`Successfully downloaded ${done} songs for offline listening!`);
  };

  return (
    <div className="w-full space-y-8 md:space-y-10 px-4 md:px-10 pt-6 md:pt-8 pb-32">
      <header className="flex items-center justify-between pb-1">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">Library</h1>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-4 rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:text-white hover:bg-white/10 text-xs font-medium inline-flex items-center gap-1.5 transition-all"
          onClick={() => {
            const fromPlaylists = playlists.find((p) => p.id === "likes")?.tracks ?? [];
            const fromRecents = recents.filter((t) => likedIds.includes(t.id));
            const map = new Map(fromPlaylists.map((t) => [t.id, t]));
            for (const t of fromRecents) map.set(t.id, t);
            const allLiked = likedIds.map((id) => map.get(id)).filter((t): t is NonNullable<typeof t> => Boolean(t));
            
            if (allLiked.length === 0 && recents.length === 0) {
              toast.error("Play or like some songs first to generate a Smart Mix!");
              return;
            }

            const mixPool = [...allLiked, ...recents];
            const uniquePool = Array.from(new Map(mixPool.map((t) => [t.id, t])).values());
            const shuffled = uniquePool.sort(() => 0.5 - Math.random()).slice(0, 20);
            
            const name = `Smart Mix • ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
            createPlaylist(name, shuffled);
            toast.success(`Generated "${name}" with ${shuffled.length} tracks`);
            
            if (tab !== "playlists") {
              handleTabChange("playlists");
            }
          }}
        >
          <Sparkles className="size-3.5 text-white/60" />
          Auto-Mix
        </Button>
      </header>

      {/* Underline Tabs */}
      <div className="flex gap-6 border-b border-white/[0.08] overflow-x-auto [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0">
        {(
          [
            ["recents", "Recents", recents.length],
            ["favorites", "Favorites", likedTracks.length],
            ["playlists", "Playlists", userPlaylists.length],
            ["downloads", "Downloads", downloadedTracks.length],
            ["radios", "Radios", 0],
          ] as const
        ).map(([id, label, count]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              className={cn(
                "relative pb-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                active ? "text-white" : "text-white/50 hover:text-white/80"
              )}
              onClick={() => handleTabChange(id)}
            >
              <span>{label}</span>
              {count > 0 && (
                <span className="text-xs text-white/40 tabular-nums font-mono">({count})</span>
              )}
              {active && (
                <motion.div
                  layoutId="library-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {tab === "recents" ? (
        recents.length ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[#A9A19B]">{recents.length} recently played tracks</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#A9A19B] hover:text-red-400"
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
          <EmptyState
            icon={Ghost}
            title="No listening history yet"
            description="Songs and live stations you play will automatically appear here."
            primaryAction={{ label: "Explore trending tracks", onClick: () => navigate({ to: "/explore" }) }}
          />
        )
      ) : null}

      {tab === "favorites" ? (
        likedTracks.length ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[#A9A19B]">{likedTracks.length} favorite tracks</p>
              <Button 
                variant="solid" 
                size="sm" 
                className="rounded-full bg-white text-black font-semibold hover:bg-white/90 text-xs px-4"
                onClick={() => playTracks(likedTracks, 0)}
              >
                Play all
              </Button>
            </div>
            {likedTracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} queue={likedTracks} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Tap the heart icon on any song you love to build your personal collection."
            primaryAction={{ label: "Discover new music", onClick: () => navigate({ to: "/explore" }) }}
          />
        )
      ) : null}

      {tab === "playlists" ? (
        userPlaylists.length ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[#A9A19B]">{userPlaylists.length} custom playlists</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 rounded-full bg-white/[0.06] text-white/80 hover:text-white border border-white/10 text-xs font-medium"
                  onClick={() => setImportModalOpen(true)}
                >
                  <Download className="size-3.5 mr-1.5" />
                  Import
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 rounded-full bg-white/[0.06] text-white/80 hover:text-white border border-white/10 text-xs font-medium"
                  onClick={() => {
                    const name = `Playlist ${playlists.length + 1}`;
                    createPlaylist(name);
                    toast.success(`Created "${name}"`);
                  }}
                >
                  <Plus className="size-3.5 mr-1.5" />
                  New Playlist
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {playlists
                .filter((p) => p.id !== "likes")
                .map((p) => (
                  <div key={p.id} className="group relative flex flex-col justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => p.tracks.length && playTracks(p.tracks, 0)}
                    >
                      <Cover
                        src={p.tracks[0]?.artworkLg || p.tracks[0]?.artwork}
                        alt={p.name}
                        title={p.name}
                        className="aspect-square w-full rounded-lg shadow-sm"
                      />
                      <p className="mt-2.5 truncate text-sm font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-[#A9A19B]">{p.tracks.length} tracks</p>
                    </button>
                    <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[11px] text-white/40">Personal</span>
                      <button
                        type="button"
                        className="text-xs text-white/40 hover:text-red-400 transition-colors p-1"
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
          </div>
        ) : (
          <EmptyState
            icon={ListMusic}
            title="No playlists created yet"
            description="Create a fresh playlist or import your existing playlists from Spotify and Apple Music with one tap."
            primaryAction={{
              label: "Import from Spotify / Apple Music",
              onClick: () => setImportModalOpen(true),
              icon: Download,
            }}
            secondaryAction={{
              label: "New Playlist",
              onClick: () => {
                const name = `Playlist ${playlists.length + 1}`;
                createPlaylist(name);
                toast.success(`Created "${name}"`);
              },
              icon: Plus,
            }}
          />
        )
      ) : null}

      {tab === "downloads" ? (
        downloadedTracks.length ? (
          <div>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 text-sm text-[#A9A19B]">
                <span><strong className="text-white font-semibold">{downloadedTracks.length}</strong> offline tracks ready</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-0.5 text-xs text-[#52B58A] font-medium">
                  <HardDrive className="size-3.5" />
                  {storageMb} MB used
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {undownloadedFavorites.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-full bg-white/[0.06] text-white/80 hover:text-white border border-white/10 text-xs font-medium"
                    disabled={isDownloadingFavorites}
                    onClick={handleDownloadFavorites}
                  >
                    <Download className="size-3.5 mr-1.5" />
                    {isDownloadingFavorites
                      ? `Downloading (${downloadProgress?.current}/${downloadProgress?.total})...`
                      : `Download ${undownloadedFavorites.length} Favorites`}
                  </Button>
                )}
                <Button 
                  variant="solid" 
                  size="sm" 
                  className="h-8 px-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 text-xs"
                  onClick={() => playTracks(downloadedTracks, 0)}
                >
                  Play all offline
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#A9A19B] hover:text-red-400"
                  onClick={() => {
                    void clearAll();
                    toast("All offline downloads cleared");
                  }}
                >
                  <Trash2 className="size-3.5 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
            {downloadedTracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} queue={downloadedTracks} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ArrowDownCircle}
            title="No offline songs downloaded"
            description="Save songs and live stations for offline playback whenever you have no internet connection."
            primaryAction={
              likedTracks.length > 0
                ? {
                    label: isDownloadingFavorites
                      ? `Downloading (${downloadProgress?.current}/${downloadProgress?.total})...`
                      : `Download All ${likedTracks.length} Favorites`,
                    onClick: handleDownloadFavorites,
                    icon: Download,
                  }
                : undefined
            }
            secondaryAction={{
              label: "Discover music",
              onClick: () => navigate({ to: "/explore" }),
              icon: Compass,
            }}
          />
        )
      ) : null}

      {tab === "radios" ? (
        <div className="pt-2">
          <RadioContent />
        </div>
      ) : null}

      <PlaylistImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={() => handleTabChange("playlists")}
      />
    </div>
  );
}
