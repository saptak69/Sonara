import { ListMusic, ListPlus, ListEnd, ListX, MoreVertical, Radio, UserRound, Heart, Share2, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LIKED_PLAYLIST_ID, usePlayer } from "@/lib/player-store";
import { useOfflineTracks } from "@/lib/offline-cache";
import type { Track } from "@/lib/types";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TrackMenu({
  track,
  rest,
  playlistId,
  children,
}: {
  track: Track;
  rest?: Track[];
  /** Set when shown inside one of the user's playlists, to offer "Remove". */
  playlistId?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const playNext = usePlayer((s) => s.playNext);
  const addToQueue = usePlayer((s) => s.addToQueue);
  const toggleLike = usePlayer((s) => s.toggleLike);
  const likedIds = usePlayer((s) => s.likedIds);
  const isLiked = likedIds.includes(track.id);
  const playTracks = usePlayer((s) => s.playTracks);
  const playlists = usePlayer((s) => s.playlists);
  const addToPlaylist = usePlayer((s) => s.addToPlaylist);
  const createPlaylist = usePlayer((s) => s.createPlaylist);
  const removeFromPlaylist = usePlayer((s) => s.removeFromPlaylist);
  const { isDownloaded, downloadTrack, removeDownload } = useOfflineTracks();
  const downloaded = isDownloaded(track.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Group 1: Queue Controls */}
        <DropdownMenuItem
          onSelect={() => {
            playNext(track);
            toast("Playing next");
          }}
        >
          <ListEnd className="size-4 text-muted" />
          <span>Play next</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            addToQueue(track);
            toast("Added to queue");
          }}
        >
          <ListPlus className="size-4 text-muted" />
          <span>Add to queue</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Group 2: Library & Offline */}
        <DropdownMenuItem
          onSelect={() => {
            toggleLike(track);
            toast(isLiked ? "Removed from likes" : "Saved to likes");
          }}
        >
          <Heart className={isLiked ? "size-4 fill-accent text-accent" : "size-4 text-muted"} />
          <span>{isLiked ? "Remove from likes" : "Save to likes"}</span>
        </DropdownMenuItem>
        {track.kind !== "radio" ? (
          <DropdownMenuItem
            onSelect={async () => {
              if (downloaded) {
                await removeDownload(track.id);
                toast.success(`Removed "${track.title}" from offline downloads`);
              } else {
                toast.loading(`Downloading "${track.title}" for offline...`, { id: `dl-${track.id}` });
                const success = await downloadTrack(track);
                if (success) {
                  toast.success(`Downloaded "${track.title}" (Ready offline)`, { id: `dl-${track.id}` });
                } else {
                  toast.error("Failed to download audio stream", { id: `dl-${track.id}` });
                }
              }
            }}
          >
            {downloaded ? (
              <>
                <CheckCircle2 className="size-4 text-ok" />
                <span className="text-ok">Remove download</span>
              </>
            ) : (
              <>
                <Download className="size-4 text-muted" />
                <span>Download for offline</span>
              </>
            )}
          </DropdownMenuItem>
        ) : null}
        {playlistId && playlistId !== LIKED_PLAYLIST_ID ? (
          <DropdownMenuItem
            onSelect={() => {
              removeFromPlaylist(playlistId, track.id);
              toast("Removed from playlist");
            }}
          >
            <ListX className="size-4 text-muted" />
            <span>Remove from this playlist</span>
          </DropdownMenuItem>
        ) : null}
        {playlists
          .filter((p) => p.id !== LIKED_PLAYLIST_ID && p.id !== playlistId && !p.tracks.some((t) => t.id === track.id))
          .slice(0, 5)
          .map((p) => (
            <DropdownMenuItem
              key={p.id}
              onSelect={() => {
                addToPlaylist(p.id, track);
                toast(`Saved to ${p.name}`);
              }}
            >
              <ListMusic className="size-4 text-muted" />
              <span>Add to {p.name}</span>
            </DropdownMenuItem>
          ))}
        <DropdownMenuItem
          onSelect={() => {
            const name = `Mix · ${track.artist}`;
            createPlaylist(name, [track]);
            toast(`Created ${name}`);
          }}
        >
          <ListMusic className="size-4 text-muted" />
          <span>New playlist</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Group 3: Discovery & Share */}
        <DropdownMenuItem
          onSelect={async () => {
            toast.loading(`Tuning into "${track.title}" Radio...`, { id: "track-radio" });
            try {
              const { getTrackRadioServerFn } = await import("@/lib/recommendation-engine");
              const radioTracks = await getTrackRadioServerFn({ data: { seedTrackId: track.id, limit: 25 } });
              if (radioTracks?.length) {
                playTracks(radioTracks, 0);
                toast.success(`Started "${track.title}" Radio`, {
                  id: "track-radio",
                  description: `${radioTracks.length} cohesive songs loaded`,
                });
              } else {
                playTracks(rest?.length ? [track, ...rest] : [track], 0);
                toast.dismiss("track-radio");
              }
            } catch {
              playTracks(rest?.length ? [track, ...rest] : [track], 0);
              toast.dismiss("track-radio");
            }
          }}
        >
          <Radio className="size-4 text-muted" />
          <span>Start Track Radio</span>
        </DropdownMenuItem>
        {track.artistId ? (
          <DropdownMenuItem
            onSelect={() => {
              void navigate({ to: "/artist/$id", params: { id: track.artistId! } });
            }}
          >
            <UserRound className="size-4 text-muted" />
            <span>Go to artist</span>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          onSelect={() => {
            const shareUrl = `${window.location.origin}/track/${encodeURIComponent(track.id)}`;
            const shareData = {
              title: `${track.title} - ${track.artist}`,
              text: `Listen to "${track.title}" by ${track.artist} on Sonara`,
              url: shareUrl,
            };
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
              void navigator.share(shareData).catch(() => {});
            } else if (navigator.clipboard) {
              void navigator.clipboard.writeText(shareUrl);
              toast.success("Song link copied to clipboard!");
            }
          }}
        >
          <Share2 className="size-4 text-muted" />
          <span>Share track</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The standard "more" button: opens the song menu (queue, like, playlists, download, share...). */
export function TrackMenuButton({
  track,
  rest,
  playlistId,
  className,
}: {
  track: Track;
  rest?: Track[];
  playlistId?: string;
  className?: string;
}) {
  return (
    <TrackMenu track={track} rest={rest} playlistId={playlistId}>
      <button
        type="button"
        aria-label={`More options for ${track.title}`}
        title="More options"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted transition hover:bg-hover hover:text-fg active:scale-90",
          className,
        )}
      >
        <MoreVertical className="size-[18px]" />
      </button>
    </TrackMenu>
  );
}
