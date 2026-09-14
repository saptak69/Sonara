import { useEffect, useRef } from "react";
import { usePlayer, getNextIndex } from "@/lib/player-store";
import { recordStreamServerFn } from "@/lib/artist-studio";
import { resolveFullTrackStreamServerFn } from "@/lib/saavn-api";
import { fetchTrack } from "@/lib/music-api";
import { toast } from "sonner";
import type { Track } from "@/lib/types";

export function PlayerEngine() {
  const audio1Ref = useRef<HTMLAudioElement>(null);
  const audio2Ref = useRef<HTMLAudioElement>(null);
  const activeIndexRef = useRef<1 | 2>(1);
  
  const getActive = () => activeIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
  const getInactive = () => activeIndexRef.current === 1 ? audio2Ref.current : audio1Ref.current;

  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const playbackRate = usePlayer((s) => s.playbackRate);
  const sleepTimer = usePlayer((s) => s.sleepTimer);
  const pendingSeek = usePlayer((s) => s.pendingSeek);
  const setCurrentTime = usePlayer((s) => s.setCurrentTime);
  const setDuration = usePlayer((s) => s.setDuration);
  const setPlaying = usePlayer((s) => s.setPlaying);
  const setSleepTimer = usePlayer((s) => s.setSleepTimer);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const toggle = usePlayer((s) => s.toggle);
  const playTrack = usePlayer((s) => s.playTrack);
  const clearPendingSeek = usePlayer((s) => s.clearPendingSeek);

  // Auto-play shared song when URL contains ?track=... or ?play=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const trackId = url.searchParams.get("track") || url.searchParams.get("play");
    if (!trackId) return;

    void (async () => {
      try {
        const track = await fetchTrack(trackId);
        if (track) {
          playTrack(track);
          toast.success(`Playing shared song: "${track.title}"`, {
            description: `by ${track.artist}`,
            duration: 4000,
          });
        }
      } catch (e) {
        console.error("Failed to autoplay shared track:", e);
      }
    })();
  }, []);

  // Anti-spam stream counting (30 seconds listening rule)
  const sessionIdRef = useRef<string>(
    typeof window !== "undefined"
      ? (window.sessionStorage.getItem("sonara_session_id") || (() => {
          const sid = "sess_" + Math.random().toString(36).substring(2, 15);
          window.sessionStorage.setItem("sonara_session_id", sid);
          return sid;
        })())
      : "sess_default"
  );
  const countedTracksRef = useRef<Set<string>>(new Set());
  const playTimeRef = useRef<number>(0);

  // Reset play time counter when track changes
  useEffect(() => {
    playTimeRef.current = 0;
  }, [current?.id]);

  // Telemetry stream recording
  useEffect(() => {
    if (!isPlaying || !current?.id) return;
    const interval = setInterval(() => {
      playTimeRef.current += 1;
      if (
        playTimeRef.current >= 30 &&
        current.id.startsWith("track_") &&
        !countedTracksRef.current.has(current.id)
      ) {
        countedTracksRef.current.add(current.id);
        void recordStreamServerFn({
          data: {
            trackId: current.id,
            sessionId: sessionIdRef.current,
            durationPlayed: playTimeRef.current,
          },
        }).catch(() => {
          /* ignore failed telemetry */
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, current?.id]);

  // Sleep Timer execution
  useEffect(() => {
    if (!sleepTimer) return;
    const interval = setInterval(() => {
      if (Date.now() >= sleepTimer) {
        setPlaying(false);
        setSleepTimer(null);
        toast.info("Sleep timer ended", {
          description: "Audio playback has been paused.",
          duration: 4000,
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimer, setPlaying, setSleepTimer]);

  const currentTrackIdRef = useRef<string | null>(null);
  const preloadedTrackRef = useRef<string | null>(null);

  // Synchronous, atomic track switching and playback management
  useEffect(() => {
    if (!current) {
      const a1 = audio1Ref.current;
      const a2 = audio2Ref.current;
      if (a1) { a1.pause(); a1.removeAttribute("src"); a1.load(); }
      if (a2) { a2.pause(); a2.removeAttribute("src"); a2.load(); }
      currentTrackIdRef.current = null;
      return;
    }

    const activeAudio = getActive();
    const inactiveAudio = getInactive();
    if (!activeAudio || !inactiveAudio) return;

    const isNewTrack = currentTrackIdRef.current !== current.id;
    if (isNewTrack) {
      currentTrackIdRef.current = current.id;
      
      // If we preloaded this track on the inactive audio, instantly swap active player
      if (preloadedTrackRef.current === current.id) {
         activeIndexRef.current = activeIndexRef.current === 1 ? 2 : 1;
         const newActive = getActive()!;
         const oldActive = getInactive()!;
         
         oldActive.pause();
         try { oldActive.currentTime = 0; } catch {}
         oldActive.removeAttribute("src");

         if (isPlaying) {
             newActive.play().catch((err) => {
                 if (err.name !== "AbortError") setPlaying(false);
             });
         }
      } else {
         // Did not preload (e.g., user clicked a specific track from search)
         activeAudio.pause();
         try { activeAudio.currentTime = 0; } catch {}
         activeAudio.src = current.streamUrl;
         activeAudio.load();
         if (isPlaying) {
             activeAudio.play().catch((err) => {
                 if (err.name !== "AbortError") setPlaying(false);
             });
         }
      }
    } else {
      // Just play/pause toggle for current track
      if (isPlaying) {
          activeAudio.play().catch((err) => {
              if (err.name !== "AbortError") setPlaying(false);
          });
      } else {
          activeAudio.pause();
      }
    }
  }, [current?.id, current?.streamUrl, isPlaying, setPlaying]);

  // Preloading Effect: Listen to store changes to preload next track for gapless playback
  useEffect(() => {
      const unsub = usePlayer.subscribe((state) => {
          const currentT = state.queue[state.index];
          if (!currentT) return;
          const nextIdx = getNextIndex(state);
          const nextT = nextIdx != null ? state.queue[nextIdx] : null;

          if (nextT && nextT.id !== preloadedTrackRef.current && nextT.id !== currentT.id) {
              const inactive = getInactive();
              if (inactive) {
                  inactive.src = nextT.streamUrl;
                  inactive.load();
                  preloadedTrackRef.current = nextT.id;
              }
          }
      });
      return unsub;
  }, []);

  // Seamlessly auto-upgrade preview streams (30s previews) to full-length 320kbps master streams
  useEffect(() => {
    if (!current?.id || !current?.title) return;
    const isPreview = current.streamUrl?.includes("dzcdn.net") || (current.duration && current.duration <= 35);
    if (!isPreview) return;

    let cancelled = false;
    void resolveFullTrackStreamServerFn({
      data: { title: current.title, artist: current.artist },
    })
      .then((full) => {
        if (cancelled || !full?.streamUrl) return;
        const audio = getActive();
        if (!audio || currentTrackIdRef.current !== current.id) return;
        const pos = audio.currentTime;
        const wasPlaying = !audio.paused;
        audio.src = full.streamUrl;
        try {
          audio.currentTime = pos;
        } catch {
          /* ignore */
        }
        if (wasPlaying) {
          audio.play().catch(() => {});
        }
        setDuration(full.duration);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [current?.id, current?.title, current?.artist, current?.streamUrl, current?.duration, setDuration]);

  // Continuous Smart Vibe Queue: dynamically fetch related tracks
  const fetchingRelatedRef = useRef<string | null>(null);
  const queueLength = usePlayer((s) => s.queue.length);
  const queueIndex = usePlayer((s) => s.index);
  const shuffle = usePlayer((s) => s.shuffle);

  useEffect(() => {
    if (!current?.id || queueLength === 0) return;
    
    // Trigger if we are near the end of the queue, OR if shuffle is on and we want to ensure similar tracks are available
    // We only fetch once per 'current.id' to avoid spamming
    if ((queueIndex >= queueLength - 2 || shuffle) && fetchingRelatedRef.current !== current.id) {
      fetchingRelatedRef.current = current.id;
      void import("@/lib/music-api").then(({ fetchRelatedQueue }) => {
        void fetchRelatedQueue(current, 10).then((related) => {
          if (related.length) {
            usePlayer.getState().appendQueue(related);
          }
        });
      });
    }
  }, [current?.id, queueLength, queueIndex, shuffle]);

  // Volume, Muted, and Playback Rate
  useEffect(() => {
    [audio1Ref.current, audio2Ref.current].forEach(audio => {
        if (!audio) return;
        audio.volume = volume;
        audio.muted = muted;
        audio.playbackRate = playbackRate || 1.0;
    });
  }, [volume, muted, playbackRate]);

  // Seeking
  useEffect(() => {
    const audio = getActive();
    if (!audio || pendingSeek == null) return;
    try {
      audio.currentTime = pendingSeek;
    } catch {
      /* live streams may reject seek */
    }
    clearPendingSeek();
  }, [pendingSeek, clearPendingSeek]);

  // MediaSession integration
  useEffect(() => {
    if (!current) return;
    // First setup the native Android Capacitor plugin (for lock screen/notifications)
    import('@capgo/capacitor-media-session')
      .then(({ MediaSession }) => {
        MediaSession.setMetadata({
          title: current.title,
          artist: current.artist,
          album: "Sonara",
          artwork: current.artworkLg
            ? [{ src: current.artworkLg, sizes: "512x512", type: "image/jpeg" }]
            : [],
        });
        MediaSession.setPlaybackState({ playbackState: isPlaying ? "playing" : "paused" });
        MediaSession.setActionHandler({ action: "play" }, () => setPlaying(true));
        MediaSession.setActionHandler({ action: "pause" }, () => setPlaying(false));
        MediaSession.setActionHandler({ action: "previoustrack" }, () => prev());
        MediaSession.setActionHandler({ action: "nexttrack" }, () => next());
      })
      .catch((e) => console.log("Capacitor MediaSession not available", e));

    // Fallback to standard web MediaSession for browsers
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        artwork: current.artworkLg
          ? [{ src: current.artworkLg, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
    }
  }, [current, isPlaying, next, prev, setPlaying]);

  // Clean standard keyboard listener (Space for toggle, Escape for closing overlays)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "Escape") {
        const s = usePlayer.getState();
        if (s.lyricsOpen) s.setLyricsOpen(false);
        else if (s.queueOpen) s.setQueueOpen(false);
        else if (s.expanded) s.setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const lastErrorRef = useRef<number>(0);

  const createEventHandlers = (audioIndex: 1 | 2) => ({
    onTimeUpdate: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (activeIndexRef.current === audioIndex) {
          setCurrentTime(e.currentTarget.currentTime);
      }
    },
    onDurationChange: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (activeIndexRef.current === audioIndex) {
          setDuration(e.currentTarget.duration || 0);
      }
    },
    onEnded: () => {
      if (activeIndexRef.current === audioIndex) {
          next();
      }
    },
    onPlay: () => {
      if (activeIndexRef.current === audioIndex) {
          setPlaying(true);
      }
    },
    onPause: () => {},
    onError: () => {
      if (activeIndexRef.current === audioIndex) {
          const now = Date.now();
          if (now - lastErrorRef.current > 1500) {
            lastErrorRef.current = now;
            const currentT = usePlayer.getState().current();
            if (currentT && usePlayer.getState().isPlaying) {
                toast.loading(`Recovering audio for "${currentT.title}"...`, { id: 'fallback' });
                void resolveFullTrackStreamServerFn({
                   data: { title: currentT.title, artist: currentT.artist }
                }).then(full => {
                   if (full?.streamUrl && full.streamUrl !== currentT.streamUrl) {
                      const a = activeIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;
                      if (a && usePlayer.getState().current()?.id === currentT.id) {
                         a.src = full.streamUrl;
                         a.load();
                         a.play().catch(() => {});
                         toast.success("Stream recovered successfully", { id: 'fallback' });
                      }
                   } else {
                      toast.error("Stream failed to play.", { id: 'fallback' });
                      next();
                   }
                }).catch(() => {
                   toast.dismiss('fallback');
                   next();
                });
            } else if (usePlayer.getState().isPlaying) {
              next();
            }
          } else {
            setPlaying(false);
          }
      }
    }
  });

  return (
    <>
      <audio ref={audio1Ref} preload="auto" {...createEventHandlers(1)} />
      <audio ref={audio2Ref} preload="auto" {...createEventHandlers(2)} />
    </>
  );
}
