import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchTrack, searchTracks } from "@/lib/music-api";
import { usePlayer } from "@/lib/player-store";
import { Button } from "@/components/ui/button";
import { HomeSkeleton } from "@/components/home-skeleton";
import { TrackRow } from "@/components/track-row";
import { Play, Pause, Share2, Heart, Music2, Sparkles } from "lucide-react";
import { hashHue } from "@/lib/utils";
import { toast } from "sonner";

function formatSecs(sec?: number): string {
  if (!sec || Number.isNaN(sec) || !Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const Route = createFileRoute("/track/$id")({
  component: TrackPage,
});

function TrackPage() {
  const { id } = Route.useParams();
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playTrack = usePlayer((s) => s.playTrack);
  const toggle = usePlayer((s) => s.toggle);
  const isLiked = usePlayer((s) => s.isLiked(id));
  const toggleLike = usePlayer((s) => s.toggleLike);

  const trackQuery = useQuery({
    queryKey: ["track-page", id],
    queryFn: () => fetchTrack(id),
  });

  const track = trackQuery.data;

  // Recommended / Related tracks
  const relatedQuery = useQuery({
    queryKey: ["related-tracks", track?.artist, track?.genre],
    queryFn: () => (track ? searchTracks(`${track.artist} ${track.genre || ""}`, 12) : []),
    enabled: Boolean(track),
  });

  // Autoplay on page load if opened from a shared link
  useEffect(() => {
    if (!track) return;
    if (current?.id !== track.id) {
      playTrack(track);
      toast.success(`Playing: "${track.title}"`, {
        description: `by ${track.artist}`,
        duration: 4000,
      });
    }
  }, [track?.id]);

  if (trackQuery.isLoading) return <HomeSkeleton />;

  if (!track) {
    return (
      <div className="px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Track Not Found</h1>
        <p className="mt-2 text-sm text-muted">This song may no longer be available.</p>
        <Button variant="solid" className="mt-6" asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const isCurrentActive = current?.id === track.id;
  const isThisPlaying = isCurrentActive && isPlaying;
  const tone = hashHue(track.id);

  const handleShare = () => {
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
  };

  return (
    <div className="stagger-in px-4 py-6 md:px-8 space-y-10">
      {/* Hero Track Card */}
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row gap-6 md:gap-8 items-center"
        style={{
          background: `linear-gradient(135deg, hsl(${tone} 32% 16%), hsl(${tone} 16% 5%))`,
        }}
      >
        <img
          src={track.artworkLg || track.artwork || ""}
          alt={track.title}
          className="h-48 w-48 sm:h-56 sm:w-56 rounded-2xl object-cover shadow-2xl border border-white/15"
        />

        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-md">
            <Sparkles className="size-3.5 text-accent" />
            <span>{track.genre || "Shared Song"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{track.title}</h1>
          <p className="text-lg text-white/80 font-medium">{track.artist}</p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-muted">
            <span>{formatSecs(track.duration)} duration</span>
            {track.playCount ? <span>• {track.playCount.toLocaleString()} plays</span> : null}
            <span>• 320kbps Master Audio</span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
            <Button
              variant="solid"
              size="lg"
              className="gap-2 bg-white text-black hover:bg-white/90 font-semibold shadow-lg"
              onClick={() => {
                if (isCurrentActive) {
                  toggle();
                } else {
                  playTrack(track);
                }
              }}
            >
              {isThisPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
              {isThisPlaying ? "Pause" : "Play Now"}
            </Button>

            <Button
              variant="chip"
              size="lg"
              className="gap-2"
              onClick={() => toggleLike(track)}
            >
              <Heart className={`size-4.5 ${isLiked ? "fill-accent text-accent" : "text-fg"}`} />
              {isLiked ? "Liked" : "Like"}
            </Button>

            <Button
              variant="chip"
              size="lg"
              className="gap-2"
              onClick={handleShare}
            >
              <Share2 className="size-4.5 text-fg" />
              Share Link
            </Button>
          </div>
        </div>
      </div>

      {/* Recommended Songs */}
      {(relatedQuery.data ?? []).length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Music2 className="size-5 text-accent" />
            More like this
          </h2>
          <div className="space-y-1">
            {(relatedQuery.data ?? []).map((t, idx) => (
              <TrackRow key={t.id} track={t} index={idx} queue={relatedQuery.data ?? []} showPlays />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
