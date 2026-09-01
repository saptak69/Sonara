import { ListMusic, ListPlus, ListEnd, Radio, UserRound, Heart } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";
import { useNavigate } from "@tanstack/react-router";
import { fetchTrending } from "@/lib/music-api";
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            playNext(track);
            toast("Playing next");
          }}
        >
          <ListEnd className="size-4 text-muted" />
          Play next
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            addToQueue(track);
            toast("Added to queue");
          }}
        >
          <ListPlus className="size-4 text-muted" />
          Add to queue
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            toggleLike(track);
            toast(isLiked ? "Removed from likes" : "Saved to likes");
          }}
        >
          <Heart className={isLiked ? "size-4 fill-accent text-accent" : "size-4 text-muted"} />
          {isLiked ? "Remove from likes" : "Save to likes"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {playlists
          .filter((p) => p.id !== "likes")
          .slice(0, 4)
          .map((p) => (
            <DropdownMenuItem
              key={p.id}
              onSelect={() => {
                addToPlaylist(p.id, track);
                toast(`Saved to ${p.name}`);
              }}
            >
              <ListMusic className="size-4 text-muted" />
              Add to {p.name}
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
          New playlist
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            try {
              const more = await fetchTrending(24, track.genre);
              playTracks([track, ...more.filter((t) => t.id !== track.id)], 0);
            } catch {
              playTracks(rest?.length ? [track, ...rest] : [track], 0);
            }
          }}
        >
          <Radio className="size-4 text-muted" />
          Start radio
        </DropdownMenuItem>
        {track.artistId ? (
          <DropdownMenuItem
            onSelect={() => {
              void navigate({ to: "/artist/$id", params: { id: track.artistId! } });
            }}
          >
            <UserRound className="size-4 text-muted" />
            Go to artist
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
