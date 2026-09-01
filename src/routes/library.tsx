import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlbumCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { Rail } from "@/components/rail";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/player-store";
import type { Playlist } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({ component: LibraryPage });

function LibraryPage() {
  const recents = usePlayer((s) => s.recents);
  const likedIds = usePlayer((s) => s.likedIds);
  const playlists = usePlayer((s) => s.playlists);
  const playTracks = usePlayer((s) => s.playTracks);
  const createPlaylist = usePlayer((s) => s.createPlaylist);
  const deletePlaylist = usePlayer((s) => s.deletePlaylist);
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
          onClick={() => createPlaylist(`Playlist ${playlists.length + 1}`)}
        >
          New playlist
        </Button>
      </header>

      <div className="flex gap-2 border-b border-border/40 pb-3 overflow-x-auto [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0">
        {(
          [
            ["recents", "Recents"],
            ["likes", "Liked"],
            ["playlists", "Playlists"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cn(
              "rounded-full px-4 py-2 text-xs md:text-sm font-semibold transition-all duration-150 active:scale-95 shrink-0",
              tab === id
                ? "bg-elevated/90 text-fg border border-border/60 shadow-sm"
                : "bg-chip/60 text-muted hover:bg-chip hover:text-fg",
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "recents" ? (
        recents.length ? (
          <Rail title="Recently played">
            {recents.map((t) => (
              <AlbumCard key={t.id} track={t} queue={recents} />
            ))}
          </Rail>
        ) : (
          <Empty text="Play something and it will land here." />
        )
      ) : null}

      {tab === "likes" ? (
        likedTracks.length ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted">{likedTracks.length} tracks</p>
              <Button variant="solid" size="sm" onClick={() => playTracks(likedTracks, 0)}>
                Play all
              </Button>
            </div>
            {likedTracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} queue={likedTracks} />
            ))}
          </div>
        ) : (
          <Empty text="Tap the heart on a track to save it." />
        )
      ) : null}

      {tab === "playlists" ? (
        userPlaylists.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {playlists
              .filter((p) => p.id !== "likes")
              .map((p) => (
                <div key={p.id} className="group">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => p.tracks.length && playTracks(p.tracks, 0)}
                  >
                    <Cover
                      src={p.tracks[0]?.artworkLg || p.tracks[0]?.artwork}
                      alt={p.name}
                      title={p.name}
                      className="aspect-square w-full"
                    />
                    <p className="mt-2 truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted">{p.tracks.length} tracks</p>
                  </button>
                  <button
                    type="button"
                    className="mt-1 text-xs text-subtle hover:text-fg"
                    onClick={() => deletePlaylist(p.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <Empty text="Create a playlist from any track menu." />
        )
      ) : null}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-elevated px-6 py-16 text-center">
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
