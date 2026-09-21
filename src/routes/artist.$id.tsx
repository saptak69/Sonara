import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Disc, Play, ShieldCheck, Sparkles, User } from "lucide-react";
import { Cover } from "@/components/cover";
import { TrackRow } from "@/components/track-row";
import { Rail } from "@/components/rail";
import { PlaylistCard } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount } from "@/lib/format";
import { fetchArtist, fetchArtistTracks, fetchArtistAlbums } from "@/lib/music-api";
import {
  getPublicArtistProfileServerFn,
  getPublicArtistTracksServerFn,
} from "@/lib/artist-studio";
import { usePlayer } from "@/lib/player-store";
import type { Track } from "@/lib/types";

export const Route = createFileRoute("/artist/$id")({ component: ArtistPage });

function ArtistPage() {
  const { id } = Route.useParams();
  const playTracks = usePlayer((s) => s.playTracks);

  // 1. Try fetching as community artist profile
  const communityProfileQuery = useQuery({
    queryKey: ["community-artist-profile", id],
    queryFn: async () => {
      try {
        return await getPublicArtistProfileServerFn({ data: { idOrHandle: id } });
      } catch {
        return null;
      }
    },
  });

  const communityTracksQuery = useQuery({
    queryKey: ["community-artist-tracks", id],
    queryFn: async () => {
      try {
        const rows = await getPublicArtistTracksServerFn({
          data: { artistId: id, limit: 50 },
        });
        return rows.map(
          (r): Track => ({
            id: r.id,
            title: r.title,
            artist: r.artistName || "Independent Artist",
            artistId: r.artistId,
            artwork: r.coverArtUrl,
            artworkLg: r.coverArtUrl,
            duration: r.duration,
            streamUrl: r.audioUrl,
            genre: r.genre || undefined,
            mood: r.mood || undefined,
            description: r.description || undefined,
            lyrics: r.lyrics || undefined,
            playCount: r.playCount,
            kind: "track",
          }),
        );
      } catch {
        return [];
      }
    },
    enabled: Boolean(communityProfileQuery.data),
  });

  // 2. Try fetching as remote Audius/Jamendo artist if community artist not found
  const remoteArtistQuery = useQuery({
    queryKey: ["remote-artist", id],
    queryFn: () => fetchArtist(id),
    enabled: !communityProfileQuery.isLoading && !communityProfileQuery.data,
  });

  const remoteTracksQuery = useQuery({
    queryKey: ["remote-artist-tracks", id],
    queryFn: () => fetchArtistTracks(id, 40),
    enabled: !communityProfileQuery.isLoading && !communityProfileQuery.data && Boolean(remoteArtistQuery.data),
  });

  const remoteAlbumsQuery = useQuery({
    queryKey: ["remote-artist-albums", id],
    queryFn: () => fetchArtistAlbums(id, 20),
    enabled: !communityProfileQuery.isLoading && !communityProfileQuery.data && Boolean(remoteArtistQuery.data),
  });

  const isLoading =
    communityProfileQuery.isLoading ||
    (!communityProfileQuery.data && remoteArtistQuery.isLoading);

  if (isLoading) {
    return (
      <div className="px-4 py-8 md:px-8">
        <div className="flex items-center gap-5">
          <Skeleton className="size-36 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  const isCommunity = Boolean(communityProfileQuery.data);

  if (isCommunity && communityProfileQuery.data) {
    const { profile, trackCount, totalPlays } = communityProfileQuery.data;
    const tracks = communityTracksQuery.data ?? [];

    return (
      <div className="relative min-h-dvh stagger-in">
        {/* Background Aura (Mobile) */}
        <div className="absolute top-0 left-0 w-full h-[60vh] -z-10 overflow-hidden md:hidden">
          {profile.bannerUrl || profile.avatarUrl ? (
            <img
              src={profile.bannerUrl || profile.avatarUrl}
              alt=""
              className="w-full h-full object-cover opacity-50 blur-[80px] scale-125"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-accent/20 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/80 to-bg" />
        </div>

        <div className="px-4 py-6 md:px-8 pt-4 md:pt-12 space-y-10">
          <div className="flex flex-col items-center text-center gap-6 md:flex-row md:items-end md:text-left">
            <Cover
              src={profile.avatarUrl}
              alt={profile.displayName}
              title={profile.displayName}
              rounded="full"
              className="size-64 md:size-52 shrink-0 shadow-2xl mx-auto md:mx-0 border border-white/10"
            />
            
            <div className="min-w-0 flex flex-col items-center md:items-start w-full">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2 md:mb-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-0.5 text-xs font-semibold text-accent border border-accent/30">
                  <Sparkles className="size-3.5" />
                  Independent Artist
                </span>
                {profile.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/30">
                    <CheckCircle2 className="size-3.5" />
                    Verified
                  </span>
                ) : null}
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                {profile.displayName}
              </h1>
              <p className="mt-1 text-sm font-medium text-white/60">@{profile.handle}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-white/70">
                <span>{trackCount} published {trackCount === 1 ? "track" : "tracks"}</span>
                {totalPlays > 0 ? (
                  <>
                    <span>•</span>
                    <span>{formatCount(totalPlays)} total streams</span>
                  </>
                ) : null}
              </div>

              {profile.bio ? (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/50 line-clamp-3">
                  {profile.bio}
                </p>
              ) : null}

              <div className="mt-8 flex items-center justify-center md:justify-start gap-3 w-full md:w-auto">
                <Button
                  variant="solid"
                  className="rounded-full w-full max-w-[240px] md:w-auto md:px-10 h-14 text-base font-bold shadow-lg active:scale-95 transition-transform"
                  onClick={() => tracks.length && playTracks(tracks, 0)}
                  disabled={!tracks.length}
                >
                  <Play className="size-6 fill-current mr-1.5" />
                  Play All
                </Button>
              </div>
            </div>
          </div>

        {/* Tracks section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Releases & Discography</h2>
              <p className="text-xs text-muted">Official audio uploaded and verified by {profile.displayName}</p>
            </div>
          </div>

          {tracks.length ? (
            <div className="space-y-1">
              {tracks.map((t, i) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  index={i}
                  queue={tracks}
                  showPlays
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
              <Disc className="mx-auto size-10 text-muted opacity-60" />
              <p className="mt-3 text-sm font-medium text-fg">No public releases yet</p>
              <p className="mt-1 text-xs text-muted">
                This artist hasn't published any public tracks on Sonara yet.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
    );
  }

  // Remote Audius/Jamendo artist view
  const a = remoteArtistQuery.data;
  if (!a) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-lg font-semibold">Artist not found</p>
        <p className="mt-1 text-sm text-muted">The requested artist profile could not be found.</p>
      </div>
    );
  }

  const list = remoteTracksQuery.data ?? [];

  return (
    <div className="relative min-h-dvh stagger-in">
      {/* Background Aura (Mobile) */}
      <div className="absolute top-0 left-0 w-full h-[60vh] -z-10 overflow-hidden md:hidden">
        {a.artworkLg || a.artwork ? (
          <img
            src={a.artworkLg || a.artwork}
            alt=""
            className="w-full h-full object-cover opacity-50 blur-[80px] scale-125"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/80 to-bg" />
      </div>

      <div className="px-4 py-6 md:px-8 pt-4 md:pt-12 space-y-10">
        <div className="flex flex-col items-center text-center gap-6 md:flex-row md:items-end md:text-left">
          <Cover
            src={a.artworkLg || a.artwork}
            alt={a.name}
            title={a.name}
            rounded="full"
            className="size-64 md:size-52 shrink-0 shadow-2xl mx-auto md:mx-0 border border-white/10"
          />
          <div className="min-w-0 flex flex-col items-center md:items-start w-full">
            <p className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase mb-2 md:mb-1">Artist</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">{a.name}</h1>
            <p className="mt-2 text-sm text-white/70 font-medium">
              {formatCount(a.followerCount)} followers
              {a.trackCount ? ` · ${a.trackCount} tracks` : ""}
            </p>
            {a.bio ? <p className="mt-3 line-clamp-3 max-w-2xl text-sm text-white/50">{a.bio}</p> : null}
            
            <div className="mt-8 flex items-center justify-center md:justify-start gap-3 w-full md:w-auto">
              <Button 
                variant="solid" 
                className="rounded-full w-full max-w-[240px] md:w-auto md:px-10 h-14 text-base font-bold shadow-lg active:scale-95 transition-transform" 
                onClick={() => list.length && playTracks(list, 0)}
              >
                <Play className="size-6 fill-current mr-1.5" />
                Play All
              </Button>
            </div>
          </div>
        </div>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">Popular</h2>
        {list.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i} queue={list} showPlays />
        ))}
      </section>

      {(remoteAlbumsQuery.data ?? []).length ? (
        <section className="mt-10 pb-8">
          <Rail title="Albums">
            {(remoteAlbumsQuery.data ?? []).map((album) => (
              <PlaylistCard key={album.id} playlist={album} />
            ))}
          </Rail>
        </section>
      ) : null}
      </div>
    </div>
  );
}

