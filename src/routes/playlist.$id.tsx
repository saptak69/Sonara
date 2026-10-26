import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, Download, ListMusic, Loader2, Lock, MoreHorizontal, Pencil, Play, Share2, Shuffle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Cover } from "@/components/cover";
import { EmptyState } from "@/components/empty-state";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDurationTotal } from "@/lib/format";
import { fetchPlaylist } from "@/lib/music-api";
import { downloadTrackAudio, removeDownloadedAudio, useOfflineTracks } from "@/lib/offline-cache";
import { LIKED_PLAYLIST_ID, usePlayer } from "@/lib/player-store";
import type { Playlist, Track } from "@/lib/types";

export const Route = createFileRoute("/playlist/$id")({ component: PlaylistPage });

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function PlaylistPage() {
  const { id } = Route.useParams();
  const ownPlaylist = usePlayer((s) => s.playlists.find((p) => p.id === id && p.id !== LIKED_PLAYLIST_ID));

  // The user's own playlists come straight from the store so edits show at once.
  const remote = useQuery({
    queryKey: ["playlist", id],
    queryFn: () => fetchPlaylist(id),
    enabled: !ownPlaylist,
  });

  const playlist: Playlist | null | undefined = useMemo(() => {
    if (!ownPlaylist) return remote.data;
    return {
      id: ownPlaylist.id,
      name: ownPlaylist.name,
      artwork: ownPlaylist.tracks[0]?.artwork ?? null,
      artworkLg: ownPlaylist.tracks[0]?.artworkLg ?? ownPlaylist.tracks[0]?.artwork ?? null,
      trackCount: ownPlaylist.tracks.length,
      isAlbum: false,
      owner: "You",
      tracks: ownPlaylist.tracks,
    };
  }, [ownPlaylist, remote.data]);

  if (!ownPlaylist && remote.isLoading) return <PlaylistSkeleton />;

  if (!playlist) {
    return (
      <div className="px-4 pt-16 md:px-10">
        <EmptyState
          icon={Lock}
          title="This playlist isn't available"
          description="It may have been deleted, or it's private to someone else."
        />
      </div>
    );
  }

  return <PlaylistView playlist={playlist} editable={Boolean(ownPlaylist)} />;
}

function PlaylistView({ playlist, editable }: { playlist: Playlist; editable: boolean }) {
  const playTracks = usePlayer((s) => s.playTracks);
  const tracks: Track[] = playlist.tracks ?? [];
  const totalSeconds = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const art = playlist.artworkLg || playlist.artwork;

  return (
    <div className="relative min-h-dvh">
      {art && (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[55vh] overflow-hidden" aria-hidden>
          <img src={art} alt="" className="size-full scale-125 object-cover opacity-40 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/80 to-bg" />
        </div>
      )}

      <div className="detail-header-container px-4 pt-8 pb-16 md:px-10 md:pt-12">
        <div className="detail-header flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:text-left">
          <Cover
            src={art}
            alt={playlist.name}
            title={playlist.name}
            rounded="lg"
            className="detail-header-art size-56 shrink-0 border border-border shadow-pop md:size-52"
          />
          <div className="detail-header-info flex w-full min-w-0 flex-col items-center md:items-start">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-subtle uppercase">
              {playlist.isAlbum ? "Album" : "Playlist"}
            </p>
            <h1 className="line-clamp-2 text-3xl font-bold tracking-tight md:text-5xl">{playlist.name}</h1>
            <p className="mt-3 text-sm text-muted">
              {[playlist.owner, `${tracks.length || playlist.trackCount} songs`, totalSeconds ? formatDurationTotal(totalSeconds) : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {playlist.description && <p className="mt-3 line-clamp-2 max-w-xl text-sm text-subtle">{playlist.description}</p>}

            <div className="detail-header-actions mt-6 flex items-center gap-2.5">
              <Button
                variant="accent"
                size="lg"
                className="px-7"
                disabled={!tracks.length}
                onClick={() => playTracks(tracks, 0)}
                data-tv-autofocus
              >
                <Play className="size-5 fill-current" strokeWidth={0} /> Play
              </Button>
              <Button
                variant="chip"
                size="lg"
                disabled={!tracks.length}
                onClick={() => playTracks(shuffled(tracks), 0)}
              >
                <Shuffle className="size-[18px]" /> Shuffle
              </Button>
              <DownloadAllButton tracks={tracks} />
              <PlaylistActions playlist={playlist} editable={editable} />
            </div>
          </div>
        </div>

        <div className="mt-10">
          {tracks.length === 0 ? (
            <EmptyState
              icon={ListMusic}
              title={editable ? "Nothing here yet" : "No songs"}
              description={editable ? "Use the ⋯ menu on any song and pick “Add to …” to fill this playlist." : "This playlist is empty."}
            />
          ) : (
            tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i}
                queue={tracks}
                playlistId={editable ? playlist.id : undefined}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DownloadAllButton({ tracks }: { tracks: Track[] }) {
  const { downloadedTracks } = useOfflineTracks();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const allDownloaded = tracks.length > 0 && tracks.every((t) => downloadedTracks.some((d) => d.id === t.id));

  const onClick = async () => {
    if (allDownloaded) {
      for (const t of tracks) await removeDownloadedAudio(t.id);
      toast("Downloads removed");
      return;
    }
    setProgress({ done: 0, total: tracks.length });
    let done = 0;
    let failed = 0;
    for (const t of tracks) {
      try {
        await downloadTrackAudio(t);
      } catch {
        failed += 1;
      }
      done += 1;
      setProgress({ done, total: tracks.length });
    }
    setProgress(null);
    if (failed) toast.warning(`Downloaded ${done - failed} of ${tracks.length}. Some songs aren't available offline.`);
    else toast.success("Saved for offline listening");
  };

  return (
    <Button
      variant="chip"
      size="icon"
      className="size-12"
      onClick={onClick}
      disabled={Boolean(progress) || !tracks.length}
      aria-label={allDownloaded ? "Remove downloads" : "Download all"}
    >
      {progress ? (
        <span className="flex items-center gap-1 text-[11px] tabular-nums">
          <Loader2 className="size-4 animate-spin" />
        </span>
      ) : allDownloaded ? (
        <CheckCircle2 className="size-5 text-ok" />
      ) : (
        <Download className="size-5" />
      )}
    </Button>
  );
}

function PlaylistActions({ playlist, editable }: { playlist: Playlist; editable: boolean }) {
  const navigate = useNavigate();
  const renamePlaylist = usePlayer((s) => s.renamePlaylist);
  const deletePlaylist = usePlayer((s) => s.deletePlaylist);
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const [name, setName] = useState(playlist.name);

  const share = () => {
    const url = `${window.location.origin}/playlist/${encodeURIComponent(playlist.id)}`;
    if (navigator.share) void navigator.share({ title: playlist.name, url }).catch(() => {});
    else void navigator.clipboard?.writeText(url).then(() => toast.success("Link copied"));
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="chip" size="icon" className="size-12" aria-label="More options">
            <MoreHorizontal className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={share}>
            <Share2 className="size-4 text-muted" /> Share
          </DropdownMenuItem>
          {editable && (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  setName(playlist.name);
                  setDialog("rename");
                }}
              >
                <Pencil className="size-4 text-muted" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog("delete")} className="text-danger data-[highlighted]:text-danger">
                <Trash2 className="size-4" /> Delete playlist
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === "rename"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent title="Rename playlist">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              renamePlaylist(playlist.id, name);
              setDialog(null);
            }}
          >
            <input
              autoFocus
              value={name}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/25"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={!name.trim()}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent title="Delete this playlist?">
          <p className="text-sm text-muted">
            “{playlist.name}” will be removed from all your devices. The songs themselves stay in Sonara.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Keep it
            </Button>
            <Button
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                deletePlaylist(playlist.id);
                setDialog(null);
                void navigate({ to: "/library", search: { tab: "playlists" } });
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlaylistSkeleton() {
  return (
    <div className="px-4 pt-10 md:px-10">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-end">
        <Skeleton className="size-56 rounded-2xl md:size-52" />
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="mt-10 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
