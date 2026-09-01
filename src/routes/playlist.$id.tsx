import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { Cover } from "@/components/cover";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDurationTotal } from "@/lib/format";
import { fetchPlaylist } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/playlist/$id")({ component: PlaylistPage });

function PlaylistPage() {
  const { id } = Route.useParams();
  const playTracks = usePlayer((s) => s.playTracks);
  const playNext = usePlayer((s) => s.playNext);
  const query = useQuery({
    queryKey: ["playlist", id],
    queryFn: () => fetchPlaylist(id),
  });

  if (query.isLoading) {
    return (
      <div className="px-4 py-8 md:px-8">
        <div className="flex gap-6">
          <Skeleton className="size-48 rounded-lg" />
          <div className="flex-1 space-y-3 pt-8">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    );
  }

  const playlist = query.data;
  if (!playlist) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-lg font-semibold">Playlist not found</p>
      </div>
    );
  }

  const tracks = playlist.tracks ?? [];
  const total = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Cover
          src={playlist.artworkLg || playlist.artwork}
          alt={playlist.name}
          title={playlist.name}
          rounded="lg"
          className="size-44 shrink-0 sm:size-52"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.16em] text-subtle uppercase">
            {playlist.isAlbum ? "Album" : "Playlist"}
          </p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">{playlist.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {playlist.owner ? `${playlist.owner} · ` : ""}
            {tracks.length || playlist.trackCount} tracks
            {total ? ` · ${formatDurationTotal(total)}` : ""}
          </p>
          {playlist.description ? (
            <p className="mt-2 line-clamp-2 max-w-xl text-sm text-subtle">{playlist.description}</p>
          ) : null}
          <div className="mt-5 flex gap-2">
            <Button variant="solid" onClick={() => tracks.length && playTracks(tracks, 0)}>
              <Play className="size-4 fill-current" style={{ marginLeft: 2 }} />
              Play
            </Button>
            <Button
              variant="chip"
              onClick={() => tracks.forEach((t, i) => (i === 0 ? playTracks([t], 0) : playNext(t)))}
              disabled={!tracks.length}
            >
              Add to queue
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i} queue={tracks} />
        ))}
      </div>
    </div>
  );
}
