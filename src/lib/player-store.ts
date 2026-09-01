import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RepeatMode, Track, UserPlaylist } from "./types";

type PlayerState = {
  queue: Track[];
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
  likedIds: string[];
  recents: Track[];
  playlists: UserPlaylist[];
  recentSearches: string[];
  hydrated: boolean;
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
  toggleLike: (track: Track) => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (i: number) => void;
  jumpTo: (i: number) => void;
  setExpanded: (v: boolean) => void;
  setQueueOpen: (v: boolean) => void;
  setLyricsOpen: (v: boolean) => void;
  createPlaylist: (name: string, tracks?: Track[]) => string;
  addToPlaylist: (id: string, track: Track) => void;
  removeFromPlaylist: (id: string, trackId: string) => void;
  deletePlaylist: (id: string) => void;
  rememberSearch: (q: string) => void;
  clearRecents: () => void;
  setHydrated: () => void;
};

const MAX_RECENTS = 40;

function remember(list: Track[], track: Track): Track[] {
  return [track, ...list.filter((t) => t.id !== track.id)].slice(0, MAX_RECENTS);
}

function nextIndex(state: PlayerState): number | null {
  const { queue, index, repeat, shuffle } = state;
  if (queue.length === 0) return null;
  if (repeat === "one") return index;
  if (shuffle && queue.length > 1) {
    let n = index;
    while (n === index) n = Math.floor(Math.random() * queue.length);
    return n;
  }
  if (index < queue.length - 1) return index + 1;
  if (repeat === "all") return 0;
  return null;
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
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
      likedIds: [],
      recents: [],
      playlists: [],
      recentSearches: [],
      hydrated: false,
      current: () => {
        const s = get();
        return s.queue[s.index] ?? null;
      },
      isLiked: (id) => get().likedIds.includes(id),
      playTracks: (tracks, startIndex = 0) => {
        const clean = tracks.filter(Boolean);
        if (!clean.length) return;
        const i = Math.min(Math.max(0, startIndex), clean.length - 1);
        const start = clean[i];
        if (!start) return;
        set({
          queue: clean,
          index: i,
          isPlaying: true,
          currentTime: 0,
          recents: remember(get().recents, start),
        });
      },
      playTrack: (track, rest = []) => {
        const queue = [track, ...rest.filter((t) => t.id !== track.id)];
        get().playTracks(queue, 0);
      },
      toggle: () => {
        const s = get();
        if (!s.queue.length) return;
        set({ isPlaying: !s.isPlaying });
      },
      setPlaying: (v) => set({ isPlaying: v }),
      next: () => {
        const s = get();
        const n = nextIndex(s);
        if (n == null) {
          set({ isPlaying: false });
          return;
        }
        const track = s.queue[n];
        set({
          index: n,
          currentTime: 0,
          isPlaying: true,
          recents: track ? remember(s.recents, track) : s.recents,
        });
      },
      prev: () => {
        const s = get();
        if (s.currentTime > 3) {
          set({ currentTime: 0 });
          return;
        }
        if (s.index > 0) {
          const n = s.index - 1;
          const track = s.queue[n];
          set({
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
      toggleLike: (track) => {
        const liked = get().likedIds.includes(track.id);
        set({
          likedIds: liked
            ? get().likedIds.filter((id) => id !== track.id)
            : [track.id, ...get().likedIds],
          recents: remember(get().recents, track),
        });
        if (!liked) {
          const likes = get().playlists.find((p) => p.id === "likes");
          if (!likes) {
            set({
              playlists: [
                { id: "likes", name: "Liked songs", tracks: [track], createdAt: Date.now() },
                ...get().playlists,
              ],
            });
          } else {
            get().addToPlaylist("likes", track);
          }
        } else {
          get().removeFromPlaylist("likes", track.id);
        }
      },
      addToQueue: (track) => {
        const s = get();
        if (!s.queue.length) {
          get().playTracks([track], 0);
          return;
        }
        set({ queue: [...s.queue, track] });
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
        set({ queue, index, isPlaying: queue.length ? s.isPlaying : false });
      },
      jumpTo: (i) => {
        const s = get();
        const track = s.queue[i];
        if (!track) return;
        set({
          index: i,
          currentTime: 0,
          isPlaying: true,
          recents: remember(s.recents, track),
        });
      },
      setExpanded: (v) => set({ expanded: v, queueOpen: v ? get().queueOpen : false }),
      setQueueOpen: (v) => set({ queueOpen: v }),
      setLyricsOpen: (v) => set({ lyricsOpen: v }),
      createPlaylist: (name, tracks = []) => {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `pl_${Date.now()}`;
        set({
          playlists: [
            { id, name: name.trim() || "New playlist", tracks, createdAt: Date.now() },
            ...get().playlists,
          ],
        });
        return id;
      },
      addToPlaylist: (id, track) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === id && !p.tracks.some((t) => t.id === track.id)
              ? { ...p, tracks: [track, ...p.tracks] }
              : p,
          ),
        });
      },
      removeFromPlaylist: (id, trackId) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === id ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) } : p,
          ),
        });
      },
      deletePlaylist: (id) => {
        if (id === "likes") return;
        set({ playlists: get().playlists.filter((p) => p.id !== id) });
      },
      rememberSearch: (q) => {
        const v = q.trim();
        if (!v) return;
        set({
          recentSearches: [v, ...get().recentSearches.filter((s) => s !== v)].slice(0, 8),
        });
      },
      clearRecents: () => set({ recents: [] }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "sonara-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          : localStorage,
      ),
      partialize: (s) => ({
        likedIds: s.likedIds,
        recents: s.recents,
        playlists: s.playlists,
        recentSearches: s.recentSearches,
        volume: s.volume,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
