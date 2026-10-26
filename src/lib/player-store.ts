import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RepeatMode, Track, UserPlaylist } from "./types";
import { CURATED_TRACKS } from "./music-api";
import { tapFeedback } from "./haptics";

/** A library edit waiting to be sent to the server (kept across reloads while offline). */
export type LibraryChange =
  | { type: "createPlaylist"; id: string; name: string; tracks: Track[] }
  | { type: "renamePlaylist"; id: string; name: string }
  | { type: "deletePlaylist"; id: string }
  | { type: "addTrack"; playlistId: string; track: Track }
  | { type: "removeTrack"; playlistId: string; trackId: string }
  | { type: "setLiked"; track: Track; liked: boolean }
  | { type: "saveSettings" };

/** Playback preferences that follow a signed-in user between devices. */
export type SyncedSettings = {
  autoplay: boolean;
  volumeNormalization: boolean;
  equalizerEnabled: boolean;
  equalizerBands: [number, number, number, number, number];
  bassBoost: number;
  equalizerPreset: string;
  playbackRate: number;
};

export type LibraryData = {
  playlists: UserPlaylist[];
  likedTracks: Track[];
  recentlyPlayed: Track[];
  settings: Partial<SyncedSettings> | null;
};

export const LIKED_PLAYLIST_ID = "likes";

export type EqualizerPresetName =
  | "Flat"
  | "Bass Boost"
  | "Vocal"
  | "Rock"
  | "EDM"
  | "Acoustic"
  | "Treble Boost"
  | "Late Night";

export const EQUALIZER_PRESETS: Record<EqualizerPresetName, { bands: [number, number, number, number, number]; bassBoost: number }> = {
  "Flat": { bands: [0, 0, 0, 0, 0], bassBoost: 0 },
  "Bass Boost": { bands: [5, 3, 0, 0, 1], bassBoost: 6 },
  "Vocal": { bands: [-2, 0, 4, 3, 1], bassBoost: 0 },
  "Rock": { bands: [4, 2, -1, 2, 4], bassBoost: 2 },
  "EDM": { bands: [5, 3, -1, 2, 4], bassBoost: 5 },
  "Acoustic": { bands: [2, 1, 2, 3, 2], bassBoost: 0 },
  "Treble Boost": { bands: [-2, 0, 1, 4, 6], bassBoost: 0 },
  "Late Night": { bands: [-3, -1, 0, -2, -4], bassBoost: 0 },
};

type PlayerState = {
  queue: Track[];
  history: number[];
  index: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  pendingSeek: number | null;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  expanded: boolean;
  queueOpen: boolean;
  lyricsOpen: boolean;
  sleepTimer: number | null;
  playbackRate: number;
  likedIds: string[];
  recents: Track[];
  playlists: UserPlaylist[];
  recentSearches: string[];
  autoplay: boolean;
  volumeNormalization: boolean;

  equalizerOpen: boolean;
  equalizerEnabled: boolean;
  equalizerBands: [number, number, number, number, number];
  bassBoost: number;
  equalizerPreset: string;

  hydrated: boolean;
  /** Whose library is cached locally: a user id, or null for a guest. */
  libraryOwner: string | null;
  pendingChanges: LibraryChange[];
  /** Position to resume from after the app is reopened. */
  resumeAt: number;

  current: () => Track | null;
  isLiked: (id: string) => boolean;
  playTracks: (tracks: Track[], startIndex?: number) => void;
  playTrack: (track: Track, rest?: Track[]) => void;
  toggle: () => void;
  setPlaying: (v: boolean) => void;
  next: () => void;
  prev: () => void;
  seekTo: (t: number) => void;
  setCurrentTime: (t: number) => void;
  clearPendingSeek: () => void;
  setDuration: (t: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleAutoplay: () => void;
  setAutoplay: (v: boolean) => void;
  toggleVolumeNormalization: () => void;
  toggleLike: (track: Track) => void;
  addToQueue: (track: Track) => void;
  appendQueue: (tracks: Track[]) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (i: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  moveUpcoming: (fromIdx: number, toIdx: number) => void;
  jumpTo: (i: number) => void;
  setExpanded: (v: boolean) => void;
  setQueueOpen: (v: boolean) => void;
  setLyricsOpen: (v: boolean) => void;
  setSleepTimer: (minutes: number | null) => void;
  setPlaybackRate: (rate: number) => void;
  createPlaylist: (name: string, tracks?: Track[]) => string;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (id: string, track: Track) => void;
  removeFromPlaylist: (id: string, trackId: string) => void;
  deletePlaylist: (id: string) => void;
  likedTracks: () => Track[];
  rememberSearch: (q: string) => void;
  removeRecentSearch: (q: string) => void;
  clearRecents: () => void;
  clearUpcoming: () => void;
  setHydrated: () => void;

  /** Replace the local library with the server's copy for this user. */
  loadLibrary: (ownerId: string, data: LibraryData) => void;
  /** Forget the signed-in user's library (on sign-out or account switch). */
  clearLibrary: () => void;
  settingsSnapshot: () => SyncedSettings;
  dropPendingChanges: (count: number) => void;

  setEqualizerOpen: (v: boolean) => void;
  toggleEqualizer: () => void;
  setEqualizerEnabled: (v: boolean) => void;
  setEqualizerBand: (bandIndex: number, gainDb: number) => void;
  setBassBoost: (gainDb: number) => void;
  applyEqualizerPreset: (preset: EqualizerPresetName) => void;
};

const MAX_RECENTS = 40;

export function sanitizeTrack(t: Track): Track {
  if (!t) return t;
  if (t.id.startsWith("curated_") || t.streamUrl?.includes("pixabay.com")) {
    const match = CURATED_TRACKS.find(
      (c) => c.id === t.id || c.title.toLowerCase() === t.title.toLowerCase(),
    );
    if (match) return { ...t, ...match };
  }
  return t;
}

function remember(list: Track[], track: Track): Track[] {
  const cleanTrack = sanitizeTrack(track);
  return [cleanTrack, ...list.filter((t) => t.id !== cleanTrack.id).map(sanitizeTrack)].slice(0, MAX_RECENTS);
}

function triggerHaptic(style: "light" | "medium" = "light") {
  tapFeedback(style);
}

export function getNextIndex(state: PlayerState): number | null {
  const { queue, index, repeat, shuffle, history } = state;
  if (queue.length === 0) return null;
  if (repeat === "one") return index;
  if (shuffle && queue.length > 1) {
    const unplayed = Array.from({ length: queue.length }, (_, i) => i).filter(
      (i) => i !== index && !history.includes(i)
    );

    if (unplayed.length === 0) {
      if (repeat === "all") {
        const allExceptCurrent = Array.from({ length: queue.length }, (_, i) => i).filter(
          (i) => i !== index
        );
        return allExceptCurrent[Math.floor(Math.random() * allExceptCurrent.length)];
      }
      return null;
    }
    return unplayed[Math.floor(Math.random() * unplayed.length)];
  }
  if (index < queue.length - 1) return index + 1;
  if (repeat === "all") return 0;
  return null;
}

function newPlaylistId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `pl_${random}`;
}

/**
 * localStorage, but writes are batched. The store changes several times a second
 * during playback (currentTime), and serialising the whole library on every tick
 * made scrolling stutter on low-end phones and TVs.
 */
function throttledLocalStorage() {
  const pending = new Map<string, string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    timer = null;
    for (const [key, value] of pending) {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* quota exceeded or storage disabled */
      }
    }
    pending.clear();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }

  return {
    getItem: (key: string) => pending.get(key) ?? localStorage.getItem(key),
    setItem: (key: string, value: string) => {
      pending.set(key, value);
      timer ??= setTimeout(flush, 1000);
    },
    removeItem: (key: string) => {
      pending.delete(key);
      localStorage.removeItem(key);
    },
  };
}

const MAX_SAVED_QUEUE = 100;

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => {
      /** Record a library edit for the server — only when someone is signed in. */
      const queueChange = (change: LibraryChange) => {
        if (!get().libraryOwner) return;
        const pending = get().pendingChanges;
        // Settings are sent as a whole, so one queued save is enough.
        if (change.type === "saveSettings" && pending.some((c) => c.type === "saveSettings")) return;
        set({ pendingChanges: [...pending, change] });
      };
      const settingsChanged = () => queueChange({ type: "saveSettings" });

      return {
      queue: [],
      history: [],
      index: 0,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      pendingSeek: null,
      volume: 0.9,
      muted: false,
      shuffle: false,
      repeat: "off",
      expanded: false,
      queueOpen: false,
      lyricsOpen: false,
      sleepTimer: null,
      playbackRate: 1.0,
      likedIds: [],
      recents: [],
      playlists: [],
      recentSearches: [],
      autoplay: true,
      volumeNormalization: false,

      equalizerOpen: false,
      equalizerEnabled: false,
      equalizerBands: [0, 0, 0, 0, 0],
      bassBoost: 0,
      equalizerPreset: "Flat",

      hydrated: false,
      libraryOwner: null,
      pendingChanges: [],
      resumeAt: 0,

      current: () => {
        const s = get();
        return s.queue[s.index] ?? null;
      },
      isLiked: (id) => get().likedIds.includes(id),
      playTracks: (tracks, startIndex = 0) => {
        const clean = tracks.filter(Boolean).map(sanitizeTrack);
        if (!clean.length) return;
        const i = Math.min(Math.max(0, startIndex), clean.length - 1);
        const start = clean[i];
        if (!start) return;
        set({
          queue: clean,
          history: [],
          index: i,
          isPlaying: true,
          currentTime: 0,
          recents: remember(get().recents, start),
        });
      },
      playTrack: (track, rest = []) => {
        const cleanTrack = sanitizeTrack(track);
        const queue = [cleanTrack, ...rest.filter((t) => t.id !== cleanTrack.id).map(sanitizeTrack)];
        get().playTracks(queue, 0);
        // If queue is standalone (1-2 tracks), automatically fetch matching genre/artist songs
        if (queue.length <= 2) {
          void import("./music-api").then(({ fetchRelatedQueue }) => {
            void fetchRelatedQueue(track, 12, get().recents).then((related) => {
              const currentS = get();
              if (currentS.queue[currentS.index]?.id === track.id) {
                get().appendQueue(related);
              }
            });
          });
        }
      },
      toggle: () => {
        const s = get();
        if (!s.queue.length) return;
        triggerHaptic("light");
        set({ isPlaying: !s.isPlaying });
      },
      setPlaying: (v) => set({ isPlaying: v }),
      next: () => {
        const s = get();
        triggerHaptic("light");
        const n = getNextIndex(s);
        if (n == null) {
          set({ isPlaying: false });
          return;
        }

        let newHistory = [...s.history, s.index];
        if (s.shuffle && newHistory.length >= s.queue.length) {
          newHistory = [s.index];
        }

        const track = s.queue[n];
        set({
          history: newHistory,
          index: n,
          currentTime: 0,
          isPlaying: true,
          recents: track ? remember(s.recents, track) : s.recents,
        });
      },
      prev: () => {
        const s = get();
        triggerHaptic("light");
        if (s.currentTime > 3 || (s.shuffle && s.history.length === 0)) {
          set({ currentTime: 0 });
          return;
        }

        if (s.shuffle) {
          const lastIndex = s.history[s.history.length - 1];
          const track = s.queue[lastIndex];
          set({
            history: s.history.slice(0, -1),
            index: lastIndex,
            currentTime: 0,
            isPlaying: true,
            recents: track ? remember(s.recents, track) : s.recents,
          });
          return;
        }

        if (s.index > 0) {
          const n = s.index - 1;
          const track = s.queue[n];
          set({
            history: [...s.history, s.index],
            index: n,
            currentTime: 0,
            isPlaying: true,
            recents: track ? remember(s.recents, track) : s.recents,
          });
        } else {
          set({ currentTime: 0 });
        }
      },
      seekTo: (t) => set({ currentTime: Math.max(0, t), pendingSeek: Math.max(0, t) }),
      setCurrentTime: (t) => set({ currentTime: t }),
      clearPendingSeek: () => set({ pendingSeek: null }),
      setDuration: (t) => set({ duration: t }),
      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)), muted: v === 0 }),
      toggleMute: () => set({ muted: !get().muted }),
      toggleShuffle: () => set({ shuffle: !get().shuffle }),
      cycleRepeat: () => {
        const order: RepeatMode[] = ["off", "all", "one"];
        const i = order.indexOf(get().repeat);
        set({ repeat: order[(i + 1) % order.length] ?? "off" });
      },
      toggleAutoplay: () => {
        set({ autoplay: !get().autoplay });
        settingsChanged();
      },
      setAutoplay: (v: boolean) => {
        set({ autoplay: v });
        settingsChanged();
      },
      toggleVolumeNormalization: () => {
        set({ volumeNormalization: !get().volumeNormalization });
        settingsChanged();
      },
      toggleLike: (track) => {
        triggerHaptic("medium");
        const clean = sanitizeTrack(track);
        const liked = !get().likedIds.includes(clean.id);
        const playlists = get().playlists;
        const likes = playlists.find((p) => p.id === LIKED_PLAYLIST_ID) ?? {
          id: LIKED_PLAYLIST_ID,
          name: "Liked songs",
          tracks: [],
          createdAt: Date.now(),
        };
        const likesTracks = liked
          ? [clean, ...likes.tracks.filter((t) => t.id !== clean.id)]
          : likes.tracks.filter((t) => t.id !== clean.id);

        set({
          likedIds: liked ? [clean.id, ...get().likedIds] : get().likedIds.filter((id) => id !== clean.id),
          playlists: [{ ...likes, tracks: likesTracks }, ...playlists.filter((p) => p.id !== LIKED_PLAYLIST_ID)],
        });
        queueChange({ type: "setLiked", track: clean, liked });
      },
      likedTracks: () => get().playlists.find((p) => p.id === LIKED_PLAYLIST_ID)?.tracks ?? [],
      addToQueue: (track) => {
        const s = get();
        if (!s.queue.length) {
          get().playTracks([track], 0);
          return;
        }
        set({ queue: [...s.queue, track] });
      },
      appendQueue: (tracks) => {
        const s = get();
        const existingIds = new Set(s.queue.map((t) => t.id));
        const newTracks = tracks.filter((t) => !existingIds.has(t.id));
        if (newTracks.length) {
          set({ queue: [...s.queue, ...newTracks] });
        }
      },
      playNext: (track) => {
        const s = get();
        if (!s.queue.length) {
          get().playTracks([track], 0);
          return;
        }
        const queue = [...s.queue];
        queue.splice(s.index + 1, 0, track);
        set({ queue });
      },
      removeFromQueue: (i) => {
        const s = get();
        if (i < 0 || i >= s.queue.length) return;
        const queue = s.queue.filter((_, idx) => idx !== i);
        let index = s.index;
        if (i < s.index) index -= 1;
        if (i === s.index) index = Math.min(index, Math.max(0, queue.length - 1));
        set({ queue, index, history: [], isPlaying: queue.length ? s.isPlaying : false });
      },
      clearUpcoming: () => {
        const s = get();
        set({ queue: s.queue.slice(0, s.index + 1) });
      },
      jumpTo: (i) => {
        const s = get();
        const track = s.queue[i];
        if (!track) return;
        set({
          history: [...s.history, s.index],
          index: i,
          currentTime: 0,
          isPlaying: true,
          recents: remember(s.recents, track),
        });
      },
      setExpanded: (v) => set({ expanded: v, queueOpen: v ? (typeof window !== 'undefined' && window.matchMedia("(min-width: 768px)").matches ? !get().lyricsOpen : false) : false }),
      setQueueOpen: (v) => set({ queueOpen: v, lyricsOpen: v ? false : get().lyricsOpen }),
      setLyricsOpen: (v) => set({ lyricsOpen: v, queueOpen: v ? false : get().queueOpen }),
      setSleepTimer: (minutes) => {
        set({ sleepTimer: minutes ? Date.now() + minutes * 60 * 1000 : null });
      },
      setPlaybackRate: (rate) => {
        set({ playbackRate: Math.max(0.5, Math.min(3, rate)) });
        settingsChanged();
      },
      createPlaylist: (name, tracks = []) => {
        const id = newPlaylistId();
        const cleanName = name.trim() || "New playlist";
        const cleanTracks = tracks.map(sanitizeTrack);
        const likes = get().playlists.filter((p) => p.id === LIKED_PLAYLIST_ID);
        const others = get().playlists.filter((p) => p.id !== LIKED_PLAYLIST_ID);
        set({
          playlists: [...likes, { id, name: cleanName, tracks: cleanTracks, createdAt: Date.now() }, ...others],
        });
        queueChange({ type: "createPlaylist", id, name: cleanName, tracks: cleanTracks });
        return id;
      },
      renamePlaylist: (id, name) => {
        const cleanName = name.trim();
        if (!cleanName || id === LIKED_PLAYLIST_ID) return;
        set({ playlists: get().playlists.map((p) => (p.id === id ? { ...p, name: cleanName } : p)) });
        queueChange({ type: "renamePlaylist", id, name: cleanName });
      },
      addToPlaylist: (id, track) => {
        if (id === LIKED_PLAYLIST_ID) {
          if (!get().likedIds.includes(track.id)) get().toggleLike(track);
          return;
        }
        const clean = sanitizeTrack(track);
        const playlist = get().playlists.find((p) => p.id === id);
        if (!playlist || playlist.tracks.some((t) => t.id === clean.id)) return;
        set({
          playlists: get().playlists.map((p) => (p.id === id ? { ...p, tracks: [...p.tracks, clean] } : p)),
        });
        queueChange({ type: "addTrack", playlistId: id, track: clean });
      },
      removeFromPlaylist: (id, trackId) => {
        if (id === LIKED_PLAYLIST_ID) {
          const track = get().likedTracks().find((t) => t.id === trackId);
          if (track) get().toggleLike(track);
          return;
        }
        set({
          playlists: get().playlists.map((p) =>
            p.id === id ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) } : p,
          ),
        });
        queueChange({ type: "removeTrack", playlistId: id, trackId });
      },
      deletePlaylist: (id) => {
        if (id === LIKED_PLAYLIST_ID) return;
        set({ playlists: get().playlists.filter((p) => p.id !== id) });
        queueChange({ type: "deletePlaylist", id });
      },
      removeRecentSearch: (q) => {
        set({ recentSearches: get().recentSearches.filter((s) => s !== q) });
      },
      reorderQueue: (fromIndex, toIndex) => {
        const queue = [...get().queue];
        if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;
        const [moved] = queue.splice(fromIndex, 1);
        queue.splice(toIndex, 0, moved);
        set({ queue });
      },
      moveUpcoming: (fromIdx, toIdx) => {
        const state = get();
        const currentIndex = state.index;
        const actualFrom = currentIndex + 1 + fromIdx;
        const actualTo = currentIndex + 1 + toIdx;
        const queue = [...state.queue];
        if (actualFrom <= currentIndex || actualFrom >= queue.length) return;
        if (actualTo <= currentIndex || actualTo >= queue.length) return;
        const [moved] = queue.splice(actualFrom, 1);
        queue.splice(actualTo, 0, moved);
        set({ queue });
      },
      rememberSearch: (q) => {
        const v = q.trim();
        if (!v) return;
        set({
          recentSearches: [v, ...get().recentSearches.filter((s) => s !== v)].slice(0, 8),
        });
      },
      clearRecents: () => set({ recents: [] }),

      setEqualizerOpen: (v) => set({ equalizerOpen: v }),
      toggleEqualizer: () => set((s) => ({ equalizerOpen: !s.equalizerOpen })),
      setEqualizerEnabled: (v) => {
        set({ equalizerEnabled: v });
        settingsChanged();
      },
      setEqualizerBand: (bandIndex, gainDb) => {
        const s = get();
        const clamped = Math.max(-12, Math.min(12, gainDb));
        const newBands: [number, number, number, number, number] = [...s.equalizerBands];
        if (bandIndex >= 0 && bandIndex < 5) {
          newBands[bandIndex] = clamped;
          set({ equalizerBands: newBands, equalizerPreset: "Custom", equalizerEnabled: true });
          settingsChanged();
        }
      },
      setBassBoost: (gainDb) => {
        const clamped = Math.max(0, Math.min(10, gainDb));
        set({ bassBoost: clamped, equalizerPreset: "Custom", equalizerEnabled: true });
        settingsChanged();
      },
      applyEqualizerPreset: (preset) => {
        const found = EQUALIZER_PRESETS[preset];
        if (found) {
          set({
            equalizerPreset: preset,
            equalizerBands: [...found.bands],
            bassBoost: found.bassBoost,
            equalizerEnabled: true,
          });
          settingsChanged();
        }
      },

      setHydrated: () => set({ hydrated: true }),

      settingsSnapshot: () => {
        const s = get();
        return {
          autoplay: s.autoplay,
          volumeNormalization: s.volumeNormalization,
          equalizerEnabled: s.equalizerEnabled,
          equalizerBands: s.equalizerBands,
          bassBoost: s.bassBoost,
          equalizerPreset: s.equalizerPreset,
          playbackRate: s.playbackRate,
        };
      },

      loadLibrary: (ownerId, data) => {
        const liked = data.likedTracks.map(sanitizeTrack);
        const likesPlaylist: UserPlaylist = {
          id: LIKED_PLAYLIST_ID,
          name: "Liked songs",
          tracks: liked,
          createdAt: 0,
        };
        const sameOwner = get().libraryOwner === ownerId;
        // Keep this device's own recent plays on top when it's the same person.
        const recents = sameOwner
          ? [...get().recents, ...data.recentlyPlayed.filter((t) => !get().recents.some((r) => r.id === t.id))]
          : data.recentlyPlayed;

        set({
          libraryOwner: ownerId,
          likedIds: liked.map((t) => t.id),
          playlists: [likesPlaylist, ...data.playlists.map((p) => ({ ...p, tracks: p.tracks.map(sanitizeTrack) }))],
          recents: recents.map(sanitizeTrack).slice(0, MAX_RECENTS),
          ...(data.settings ?? {}),
        });
      },

      clearLibrary: () =>
        set({
          libraryOwner: null,
          pendingChanges: [],
          likedIds: [],
          playlists: [],
          recents: [],
          recentSearches: [],
          queue: [],
          index: 0,
          history: [],
          isPlaying: false,
          currentTime: 0,
          resumeAt: 0,
          expanded: false,
        }),

      dropPendingChanges: (count) => set({ pendingChanges: get().pendingChanges.slice(count) }),
      };
    },
    {
      name: "sonara-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
          : throttledLocalStorage(),
      ),
      partialize: (s) => {
        // Save a window of the queue around the current song so it can resume.
        // Live radio can't resume from a position, so it isn't saved.
        const onRadio = s.queue[s.index]?.kind === "radio";
        const start = Math.max(0, s.index - 20);
        return {
          libraryOwner: s.libraryOwner,
          pendingChanges: s.pendingChanges,
          likedIds: s.likedIds,
          recents: s.recents,
          playlists: s.playlists,
          recentSearches: s.recentSearches,
          autoplay: s.autoplay,
          volumeNormalization: s.volumeNormalization,
          equalizerEnabled: s.equalizerEnabled,
          equalizerBands: s.equalizerBands,
          bassBoost: s.bassBoost,
          equalizerPreset: s.equalizerPreset,
          playbackRate: s.playbackRate,
          volume: s.volume,
          shuffle: s.shuffle,
          repeat: s.repeat,
          queue: onRadio ? [] : s.queue.slice(start, start + MAX_SAVED_QUEUE),
          index: onRadio ? 0 : s.index - start,
          resumeAt: onRadio ? 0 : Math.floor(s.currentTime),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.recents = (state.recents || []).map(sanitizeTrack);
        state.queue = (state.queue || []).map(sanitizeTrack);
        if (state.index >= state.queue.length) state.index = 0;
        // Reopen paused, at the spot where the listener left off.
        if (state.queue.length && state.resumeAt > 0) {
          state.currentTime = state.resumeAt;
          state.pendingSeek = state.resumeAt;
        }
        state.setHydrated();
      },
    },
  ),
);
