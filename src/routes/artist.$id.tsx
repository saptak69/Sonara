import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Disc, Play, ShieldCheck, Sparkles, User } from "lucide-react";
import { Cover } from "@/components/cover";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount } from "@/lib/format";
import { fetchArtist, fetchArtistTracks } from "@/lib/music-api";
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
      <div className="stagger-in px-4 py-6 md:px-8 space-y-10">
        {/* Banner header if present */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-black/60 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
          {profile.bannerUrl ? (
            <div className="absolute inset-0 -z-10">
              <img
                src={profile.bannerUrl}
                alt={profile.displayName}
                className="h-full w-full object-cover opacity-35 filter brightness-90 saturate-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            </div>
          ) : (
            <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-accent/20 via-purple-900/20 to-black" />
          )}

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end">
            <Cover
              src={profile.avatarUrl}
              alt={profile.displayName}
              title={profile.displayName}
              rounded="full"
              className="size-36 shrink-0 border-2 border-white/20 shadow-2xl sm:size-44"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
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

              <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
                {profile.displayName}
              </h1>
              <p className="mt-1 text-sm font-medium text-subtle">@{profile.handle}</p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-muted">
                <span>{trackCount} published {trackCount === 1 ? "track" : "tracks"}</span>
                {totalPlays > 0 ? (
                  <>
                    <span>•</span>
                    <span>{formatCount(totalPlays)} total streams</span>
                  </>
                ) : null}
              </div>

              {profile.bio ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted line-clamp-3">
                  {profile.bio}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  variant="solid"
                  className="rounded-full px-6 shadow-lg hover:shadow-accent/25"
                  onClick={() => tracks.length && playTracks(tracks, 0)}
                  disabled={!tracks.length}
                >
                  <Play className="size-4 fill-current mr-1.5" />
                  Play All
                </Button>
              </div>
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
    <div className="stagger-in px-4 py-6 md:px-8 space-y-10">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end">
        <Cover
          src={a.artworkLg || a.artwork}
          alt={a.name}
          title={a.name}
          rounded="full"
          className="size-36 shrink-0 sm:size-44 border border-white/10 shadow-xl"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.16em] text-subtle uppercase">Artist</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight text-white">{a.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {formatCount(a.followerCount)} followers
            {a.trackCount ? ` · ${a.trackCount} tracks` : ""}
          </p>
          {a.bio ? <p className="mt-2 line-clamp-3 max-w-xl text-sm text-subtle">{a.bio}</p> : null}
          <Button
            variant="solid"
            className="mt-5 rounded-full px-6"
            onClick={() => list.length && playTracks(list, 0)}
          >
            <Play className="size-4 fill-current mr-1.5" />
            Play
          </Button>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-semibold tracking-tight">Popular</h2>
        {list.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i} queue={list} showPlays />
        ))}
      </section>
    </div>
  );
}

