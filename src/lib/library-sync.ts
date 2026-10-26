/**
 * Keeps the local library (zustand, in localStorage) and the account on the
 * server in step.
 *
 *   guest            → everything stays on the device
 *   guest signs in   → their playlists and likes are added to the account,
 *                      then the account's library replaces the local copy
 *   signed in        → edits apply locally at once and are queued; the queue
 *                      is sent in order and survives going offline
 *   different user   → the previous person's cached library is wiped first
 *   signs out        → the cached library is wiped
 */
import { LIKED_PLAYLIST_ID, usePlayer, type LibraryChange, type SyncedSettings } from "./player-store";
import type { LibrarySettings } from "./library-service";
import type { Track } from "./types";

type TrackInput = {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  artwork?: string | null;
  artworkLg?: string | null;
  duration: number;
  streamUrl: string;
  genre?: string;
  mood?: string;
  kind: "track" | "radio";
};

/** Strip a track down to what the server stores, or null if it can't be stored. */
function toInput(track: Track): TrackInput | null {
  if (!track?.id || !track.title || !track.streamUrl) return null;
  // Local files and huge data: URLs only make sense on this device.
  if (/^(blob:|data:)/.test(track.streamUrl) || track.streamUrl.length > 4000) return null;
  return {
    id: track.id,
    title: track.title.slice(0, 300),
    artist: (track.artist || "Unknown artist").slice(0, 300),
    artistId: track.artistId,
    album: track.album,
    artwork: track.artwork,
    artworkLg: track.artworkLg,
    duration: Number.isFinite(track.duration) ? Math.max(0, track.duration) : 0,
    streamUrl: track.streamUrl,
    genre: track.genre,
    mood: track.mood,
    kind: track.kind ?? "track",
  };
}

function inputs(tracks: Track[]): TrackInput[] {
  return tracks.map(toInput).filter((t): t is TrackInput => t !== null);
}

async function send(change: LibraryChange): Promise<void> {
  const api = await import("./library-service");
  switch (change.type) {
    case "createPlaylist":
      await api.createPlaylist({ data: { id: change.id, name: change.name, tracks: inputs(change.tracks) } });
      return;
    case "renamePlaylist":
      await api.renamePlaylist({ data: { id: change.id, name: change.name } });
      return;
    case "deletePlaylist":
      await api.deletePlaylist({ data: { id: change.id } });
      return;
    case "addTrack": {
      const track = toInput(change.track);
      if (track) await api.addTrackToPlaylist({ data: { playlistId: change.playlistId, track } });
      return;
    }
    case "removeTrack":
      await api.removeTrackFromPlaylist({ data: { playlistId: change.playlistId, trackId: change.trackId } });
      return;
    case "setLiked": {
      const track = toInput(change.track);
      if (track) await api.setTrackLiked({ data: { track, liked: change.liked } });
      return;
    }
    case "saveSettings":
      await api.saveSettings({ data: usePlayer.getState().settingsSnapshot() });
      return;
  }
}

/** Errors worth retrying later, as opposed to a change the server rejected. */
function isTransient(err: unknown): boolean {
  if (err instanceof TypeError) return true; // fetch failed: offline, DNS, CORS
  const message = err instanceof Error ? err.message : String(err);
  return /unauthorized|network|failed to fetch|load failed|timeout|50\d/i.test(message);
}

let flushing: Promise<boolean> | null = null;

/** Send queued changes in order. Resolves true when the queue is empty. */
export function flushChanges(): Promise<boolean> {
  flushing ??= (async () => {
    for (;;) {
      const { pendingChanges, libraryOwner } = usePlayer.getState();
      if (!libraryOwner) return true;
      const change = pendingChanges[0];
      if (!change) return true;
      try {
        await send(change);
      } catch (err) {
        if (isTransient(err)) return false;
        console.warn(`[library] server rejected "${change.type}", skipping it`, err);
      }
      usePlayer.getState().dropPendingChanges(1);
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

function toSyncedSettings(settings: LibrarySettings | null): Partial<SyncedSettings> | null {
  if (!settings) return null;
  const { equalizerBands, ...rest } = settings;
  return {
    ...rest,
    ...(equalizerBands?.length === 5
      ? { equalizerBands: equalizerBands as SyncedSettings["equalizerBands"] }
      : {}),
  };
}

let syncing: Promise<void> | null = null;
let syncingFor: string | null = null;

/** Bring the local library in line with whoever is signed in (or nobody). */
export function syncLibrary(userId: string | null): Promise<void> {
  if (syncing && syncingFor === userId) return syncing;
  syncingFor = userId;
  syncing = run(userId).finally(() => {
    syncing = null;
  });
  return syncing;
}

async function run(userId: string | null) {
  const store = usePlayer.getState();

  if (!userId) {
    if (store.libraryOwner) store.clearLibrary();
    return;
  }

  if (store.libraryOwner && store.libraryOwner !== userId) {
    store.clearLibrary();
  }

  const api = await import("./library-service");
  const wasGuest = usePlayer.getState().libraryOwner === null;

  if (wasGuest) {
    const { playlists } = usePlayer.getState();
    const guestPlaylists = playlists
      .filter((p) => p.id !== LIKED_PLAYLIST_ID && /^[A-Za-z0-9_-]{6,80}$/.test(p.id))
      .map((p) => ({ id: p.id, name: p.name.slice(0, 100) || "My playlist", tracks: inputs(p.tracks).slice(0, 500) }))
      .slice(0, 100);
    const likedTracks = inputs(usePlayer.getState().likedTracks()).slice(0, 2000);
    if (guestPlaylists.length || likedTracks.length) {
      await api.importGuestLibrary({ data: { playlists: guestPlaylists, likedTracks } });
    }
  } else {
    // Send this device's unsent edits first so the snapshot includes them.
    const done = await flushChanges();
    if (!done) return; // offline: keep the local copy for now
  }

  const snapshot = await api.getLibrarySnapshot();
  if (syncingFor !== userId) return; // the user changed while we were waiting

  usePlayer.getState().loadLibrary(userId, {
    playlists: snapshot.playlists.map((p) => ({ id: p.id, name: p.name, tracks: p.tracks, createdAt: p.createdAt })),
    likedTracks: snapshot.likedTracks,
    recentlyPlayed: snapshot.recentlyPlayed,
    // A first sign-in keeps this device's settings and uploads them.
    settings: wasGuest && !snapshot.settings ? null : toSyncedSettings(snapshot.settings),
  });

  if (!snapshot.settings) {
    usePlayer.setState((s) => ({ pendingChanges: [...s.pendingChanges, { type: "saveSettings" }] }));
    void flushChanges();
  }
}
