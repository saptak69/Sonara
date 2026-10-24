import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Download, CheckCircle2, Loader2 } from "lucide-react";
import { Cover } from "@/components/cover";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDurationTotal } from "@/lib/format";
import { fetchPlaylist } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import { useOfflineTracks, downloadTrackAudio, removeDownloadedAudio } from "@/lib/offline-cache";
import { toast } from "sonner";

export const Route = createFileRoute("/playlist/$id")({ component: PlaylistPage });

function PlaylistPage() {
  const { id } = Route.useParams();
  const playTracks = usePlayer((s) => s.playTracks);
  const { downloadedTracks } = useOfflineTracks();
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ done: 0, total: 0 });

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

  const allDownloaded = tracks.length > 0 && tracks.every((t) => downloadedTracks.some((d) => d.id === t.id));

  const handleDownloadAll = async () => {
    if (allDownloaded) {
      for (const t of tracks) {
        await removeDownloadedAudio(t.id);
      }
      toast.success("Removed all downloads for this playlist");
      return;
    }

    setIsDownloadingAll(true);
    setDownloadProgress({ done: 0, total: tracks.length });
    let count = 0;
    for (const t of tracks) {
      await downloadTrackAudio(t);
      count++;
      setDownloadProgress({ done: count, total: tracks.length });
    }
    setIsDownloadingAll(false);
    toast.success(`Downloaded ${tracks.length} tracks for offline playback!`);
  };

  return (
    <div className="relative min-h-dvh">
      {/* Background Aura */}
      <div className="absolute top-0 left-0 w-full h-[60vh] -z-10 overflow-hidden">
        {playlist.artworkLg || playlist.artwork ? (
          <img
            src={playlist.artworkLg || playlist.artwork || undefined}
            alt=""
            className="w-full h-full object-cover opacity-50 blur-3xl scale-125"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/80 to-bg" />
      </div>

      <div className="detail-header-container px-4 md:px-12 pt-10 md:pt-12 pb-32">
        <div className="detail-header flex flex-col items-center text-center gap-6 md:flex-row md:items-end md:text-left">
          <Cover
            src={playlist.artworkLg || playlist.artwork || undefined}
            alt={playlist.name}
            title={playlist.name}
            rounded="lg"
            className="detail-header-art size-64 md:size-52 shrink-0 shadow-2xl mx-auto md:mx-0 border border-white/10"
          />
          <div className="detail-header-info min-w-0 flex flex-col items-center md:items-start w-full">
            <p className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase mb-2 md:mb-1">
              {playlist.isAlbum ? "Album" : "Playlist"}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight line-clamp-2 text-white">{playlist.name}</h1>
            <p className="mt-2 text-sm text-white/70 font-medium">
              {playlist.owner ? `${playlist.owner} · ` : ""}
              {tracks.length || playlist.trackCount} tracks
              {total ? ` · ${formatDurationTotal(total)}` : ""}
            </p>
            {playlist.description ? (
              <p className="mt-3 line-clamp-2 max-w-xl text-sm text-white/50">{playlist.description}</p>
            ) : null}
            
            <div className="detail-header-actions mt-6 flex flex-wrap items-center gap-3 w-full max-w-[380px] mx-auto md:mx-0">
              <Button 
                variant="solid" 
                className="flex-1 min-w-[90px] rounded-xl h-[48px] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold shadow-sm transition-colors"
                onClick={() => tracks.length && playTracks(tracks, 0)}
              >
                <Play className="size-5 fill-current mr-1" />
                Play
              </Button>
              <Button
                variant="solid" 
                className="flex-1 min-w-[90px] rounded-xl h-[48px] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold shadow-sm transition-colors"
                onClick={() => {
                  const shuffled = [...tracks].sort(() => 0.5 - Math.random());
                  if (shuffled.length) playTracks(shuffled, 0);
                }}
                disabled={!tracks.length}
              >
                <svg className="size-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
                Shuffle
              </Button>
              <Button
                variant="solid"
                className={`rounded-xl h-[48px] px-4 backdrop-blur-md font-semibold transition-all shadow-sm ${
                  allDownloaded
                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
                onClick={handleDownloadAll}
                disabled={isDownloadingAll || !tracks.length}
                title={allDownloaded ? "All songs downloaded" : "Download all songs for offline"}
              >
                {isDownloadingAll ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1.5" />
                    <span className="text-xs">{downloadProgress.done}/{downloadProgress.total}</span>
                  </>
                ) : allDownloaded ? (
                  <>
                    <CheckCircle2 className="size-5 text-emerald-400" />
                  </>
                ) : (
                  <>
                    <Download className="size-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-10 md:mt-12">
          {tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} queue={tracks} />
          ))}
        </div>
      </div>
    </div>
  );
}
