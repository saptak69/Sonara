import { ListMusic, ListPlus, ListEnd, Radio, UserRound, Heart, Share2, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlayer } from "@/lib/player-store";
import { useOfflineTracks } from "@/lib/offline-cache";
import type { Track } from "@/lib/types";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function TrackMenu({ track, rest, children }: { track: Track; rest?: Track[]; children: ReactNode }) {
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
          <ListEnd className="size-4 text-white/50" />
          <span>Play next</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            addToQueue(track);
            toast("Added to queue");
          }}
        >
          <ListPlus className="size-4 text-white/50" />
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
          <Heart className={isLiked ? "size-4 fill-[#FF5B2E] text-[#FF5B2E]" : "size-4 text-white/50"} />
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
                <CheckCircle2 className="size-4 text-[#52B58A]" />
                <span className="text-[#52B58A]">Remove download</span>
              </>
            ) : (
              <>
                <Download className="size-4 text-white/50" />
                <span>Download for offline</span>
              </>
            )}
          </DropdownMenuItem>
        ) : null}
        {playlists
          .filter((p) => p.id !== "likes")
          .slice(0, 3)
          .map((p) => (
            <DropdownMenuItem
              key={p.id}
              onSelect={() => {
                addToPlaylist(p.id, track);
                toast(`Saved to ${p.name}`);
              }}
            >
              <ListMusic className="size-4 text-white/50" />
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
          <ListMusic className="size-4 text-white/50" />
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
          <Radio className="size-4 text-white/50" />
          <span>Start Track Radio</span>
        </DropdownMenuItem>
        {track.artistId ? (
          <DropdownMenuItem
            onSelect={() => {
              void navigate({ to: "/artist/$id", params: { id: track.artistId! } });
            }}
          >
            <UserRound className="size-4 text-white/50" />
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
          <Share2 className="size-4 text-white/50" />
          <span>Share track</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
