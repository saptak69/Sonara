import { useEffect, useRef, useCallback } from "react";
import { usePlayer, getNextIndex } from "@/lib/player-store";
import { recordStreamServerFn } from "@/lib/artist-studio";
import { resolveFullTrackStreamServerFn } from "@/lib/saavn-api";
import { recordPlayHistoryServerFn } from "@/lib/library-service";
import { fetchTrack } from "@/lib/music-api";
import { getOfflineAudioUrl, isTrackDownloaded } from "@/lib/offline-cache";
import { toast } from "sonner";

import type { Track as _Track } from "@/lib/types";

function resolvePlayableUrl(track?: _Track | null): string {
  if (!track?.streamUrl) return "";
  const url = track.streamUrl;
  if (track.kind === "radio" || url.includes(".m3u8") || url.includes("/listen")) return url;
  if (url.startsWith("/api/stream") || url.startsWith("blob:") || url.startsWith("data:")) return url;

  // Major high-speed audio CDNs that have native CORS headers and HTTP 206 Byte-Range streaming.
  // Playing them directly in the browser gives zero proxy overhead, instant seeking, and zero server socket resets.
  const isDirectCdn =
    url.includes("saavncdn.com") ||
    url.includes("sndcdn.com") ||
    url.includes("archive.org") ||
    url.includes("pixabay.com");

  if (isDirectCdn) {
    return url;
  }

  // Fallback to proxy for obscure/mixed-content streams
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `/api/stream?url=${encodeURIComponent(url)}`;
  }
  return url;
}

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

  const equalizerEnabled = usePlayer((s) => s.equalizerEnabled);
  const equalizerBands = usePlayer((s) => s.equalizerBands);
  const bassBoost = usePlayer((s) => s.bassBoost);
  const volumeNormalization = usePlayer((s) => s.volumeNormalization);

  // Web Audio DSP Engine
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bassBoostNodeRef = useRef<BiquadFilterNode | null>(null);
  const bandNodesRef = useRef<BiquadFilterNode[]>([]);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const connectedElementsRef = useRef<WeakSet<HTMLAudioElement>>(new WeakSet());

  const initWebAudio = useCallback(() => {
    if (typeof window === "undefined") return;
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // 1. Bass boost (lowshelf at 80Hz)
      const bassNode = ctx.createBiquadFilter();
      bassNode.type = "lowshelf";
      bassNode.frequency.value = 80;
      bassNode.gain.value = equalizerEnabled ? bassBoost : 0;
      bassBoostNodeRef.current = bassNode;

      // 2. 5-Band Biquad Filter Equalizer
      const freqs = [60, 250, 1000, 4000, 12000];
      const types: BiquadFilterType[] = ["peaking", "peaking", "peaking", "peaking", "highshelf"];
      const bNodes: BiquadFilterNode[] = [];

      let prevNode: AudioNode = bassNode;
      freqs.forEach((freq, idx) => {
        const filter = ctx.createBiquadFilter();
        filter.type = types[idx];
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = equalizerEnabled ? (equalizerBands[idx] ?? 0) : 0;
        prevNode.connect(filter);
        prevNode = filter;
        bNodes.push(filter);
      });
      bandNodesRef.current = bNodes;

      // 3. Dynamic Sound Check Compressor
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = volumeNormalization ? -24 : 0;
      comp.knee.value = 30;
      comp.ratio.value = volumeNormalization ? 12 : 1;
      comp.attack.value = 0.003;
      comp.release.value = 0.25;
      compressorRef.current = comp;
      prevNode.connect(comp);

      // 4. Output to speakers
      comp.connect(ctx.destination);
    } catch {
      // Web Audio fallback
    }
  }, [equalizerEnabled, bassBoost, equalizerBands, volumeNormalization]);

  const connectToWebAudio = useCallback((el: HTMLAudioElement | null) => {
    if (!el || typeof window === "undefined") return;
    initWebAudio();
    const ctx = audioCtxRef.current;
    const bass = bassBoostNodeRef.current;
    if (!ctx || !bass || connectedElementsRef.current.has(el)) return;

    try {
      const source = ctx.createMediaElementSource(el);
      source.connect(bass);
      connectedElementsRef.current.add(el);
    } catch {
      // Element already connected or security restriction
    }
  }, [initWebAudio]);

  // Connect mounted audio elements
  useEffect(() => {
    connectToWebAudio(audio1Ref.current);
    connectToWebAudio(audio2Ref.current);
  }, [connectToWebAudio]);

  // React to equalizer slider changes
  useEffect(() => {
    const bass = bassBoostNodeRef.current;
    const bNodes = bandNodesRef.current;
    if (!bass || !bNodes.length) return;

    bass.gain.value = equalizerEnabled ? bassBoost : 0;
    bNodes.forEach((node, i) => {
      node.gain.value = equalizerEnabled ? (equalizerBands[i] ?? 0) : 0;
    });
  }, [equalizerEnabled, equalizerBands, bassBoost]);

  // React to volume normalization toggle
  useEffect(() => {
    const comp = compressorRef.current;
    if (!comp) return;
    comp.threshold.value = volumeNormalization ? -24 : 0;
    comp.ratio.value = volumeNormalization ? 12 : 1;
  }, [volumeNormalization]);

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
  }, [playTrack]);

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

  // Handle Audio Becoming Noisy (when headphones or Bluetooth disconnect on Android)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleNoisy = () => {
      setPlaying(false);
    };
    window.addEventListener("sonara:audio-becoming-noisy", handleNoisy);
    return () => window.removeEventListener("sonara:audio-becoming-noisy", handleNoisy);
  }, [setPlaying]);

  // Unified Media Session & Lockscreen Controls (Android 13+ & Web)
  useEffect(() => {
    if (!current?.id || !current?.title || typeof window === "undefined") return;

    const artworkSrc = current.artworkLg || current.artwork;
    const artworkArray = artworkSrc
      ? [{ src: artworkSrc, sizes: "512x512", type: "image/jpeg" }]
      : [];

    // 1. Native Android Capacitor MediaSession
    void import("@capgo/capacitor-media-session").then(({ MediaSession }) => {
      MediaSession.setMetadata({
        title: current.title,
        artist: current.artist || "Unknown Artist",
        album: current.album || "Single",
        artwork: artworkArray,
      }).catch(() => {});

      MediaSession.setPlaybackState({
        playbackState: isPlaying ? "playing" : "paused",
      }).catch(() => {});

      MediaSession.setActionHandler({ action: "play" }, () => setPlaying(true));
      MediaSession.setActionHandler({ action: "pause" }, () => setPlaying(false));
      MediaSession.setActionHandler({ action: "nexttrack" }, () => next());
      MediaSession.setActionHandler({ action: "previoustrack" }, () => prev());
      MediaSession.setActionHandler({ action: "seekforward" }, () => {
        const a = getActive();
        if (a && Number.isFinite(a.duration)) a.currentTime = Math.min(a.duration, a.currentTime + 10);
      });
      MediaSession.setActionHandler({ action: "seekbackward" }, () => {
        const a = getActive();
        if (a) a.currentTime = Math.max(0, a.currentTime - 10);
      });
    }).catch(() => {});

    // 2. Standard Web & ChromeOS MediaSession with Scrubber
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist || "Unknown Artist",
        album: current.album || "Single",
        artwork: artworkArray,
      });
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => setPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
      try {
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime != null) {
            const a = getActive();
            if (a) a.currentTime = details.seekTime;
          }
        });
      } catch {}
    }
  }, [current?.id, current?.title, current?.artist, current?.album, current?.artwork, current?.artworkLg, isPlaying, next, prev, setPlaying]);

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

  const historyRecordedRef = useRef<Set<string>>(new Set());

  // Record real play history in database after 5 seconds of playback
  useEffect(() => {
    if (!isPlaying || !current?.id) return;
    const timer = setTimeout(() => {
      if (current?.id && !historyRecordedRef.current.has(current.id)) {
        historyRecordedRef.current.add(current.id);
        void recordPlayHistoryServerFn({
          data: {
            track: current,
            sessionId: sessionIdRef.current,
          },
        }).catch(() => {
          /* ignore */
        });
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isPlaying, current]);

  const currentTrackIdRef = useRef<string | null>(null);
  const currentTrackRef = useRef<_Track | null>(null);
  const maxTimePlayedRef = useRef<number>(0);
  const completionLoggedRef = useRef<Set<string>>(new Set());
  const preloadedTrackRef = useRef<string | null>(null);

  // Synchronous, atomic track switching and playback management
  useEffect(() => {
    if (!current) {
      const a1 = audio1Ref.current;
      const a2 = audio2Ref.current;
      if (a1) { a1.pause(); a1.removeAttribute("src"); a1.load(); }
      if (a2) { a2.pause(); a2.removeAttribute("src"); a2.load(); }
      currentTrackIdRef.current = null;
      currentTrackRef.current = null;
      return;
    }

    const activeAudio = getActive();
    const inactiveAudio = getInactive();
    if (!activeAudio || !inactiveAudio) return;

    const isNewTrack = currentTrackIdRef.current !== current.id;
    if (isNewTrack) {
      // Early Skip Detection: if previous track was skipped < 30 seconds
      const prevTrack = currentTrackRef.current;
      const prevTime = maxTimePlayedRef.current;
      if (
        prevTrack?.id &&
        !completionLoggedRef.current.has(prevTrack.id) &&
        prevTime < 30 &&
        (prevTrack.duration ? prevTrack.duration >= 35 : true)
      ) {
        void recordPlayHistoryServerFn({
          data: {
            track: prevTrack,
            sessionId: sessionIdRef.current,
            durationPlayed: Math.round(prevTime),
            earlySkip: true,
            explicitSkip: true,
          },
        }).catch(() => {});
      }

      currentTrackIdRef.current = current.id;
      currentTrackRef.current = current;
      maxTimePlayedRef.current = 0;
      
      // If we preloaded this track on the inactive audio, instantly swap active player
      if (preloadedTrackRef.current === current.id) {
         activeIndexRef.current = activeIndexRef.current === 1 ? 2 : 1;
         const newActive = getActive()!;
         const oldActive = getInactive()!;
         
         oldActive.pause();
         try { oldActive.currentTime = 0; } catch { /* ignore error */ }
         oldActive.removeAttribute("src");

         if (isPlaying) {
             newActive.play().catch((err) => {
                 if (err.name !== "AbortError") setPlaying(false);
             });
         }
      } else {
         // Did not preload (e.g., user clicked a specific track from search or library)
         activeAudio.pause();
         try { activeAudio.currentTime = 0; } catch { /* ignore error */ }

         if (isTrackDownloaded(current.id)) {
           // 100% Offline playback: load cached audio blob directly
           void getOfflineAudioUrl(current.id).then((cachedBlobUrl) => {
             if (cachedBlobUrl && currentTrackIdRef.current === current.id) {
               const active = getActive();
               if (!active) return;
               active.src = cachedBlobUrl;
               active.load();
               if (usePlayer.getState().isPlaying) {
                 active.play().catch(() => {});
               }
             } else {
               // Fallback to online url if blob extraction failed
               const active = getActive();
               if (active) {
                 active.src = resolvePlayableUrl(current);
                 active.load();
                 if (usePlayer.getState().isPlaying) {
                   active.play().catch((err) => {
                     if (err.name !== "AbortError") setPlaying(false);
                   });
                 }
               }
             }
           });
         } else {
           activeAudio.src = resolvePlayableUrl(current);
           activeAudio.load();
           if (isPlaying) {
               activeAudio.play().catch((err) => {
                   if (err.name !== "AbortError") setPlaying(false);
               });
           }

           // Check offline cache in case it was stored without updated metadata
           void getOfflineAudioUrl(current.id).then((cachedBlobUrl) => {
             if (cachedBlobUrl && currentTrackIdRef.current === current.id) {
               const active = getActive();
               if (active && active.src !== cachedBlobUrl) {
                 const pos = active.currentTime;
                 const wasPlaying = !active.paused;
                 active.src = cachedBlobUrl;
                 try { active.currentTime = pos; } catch { /* ignore */ }
                 if (wasPlaying || isPlaying) {
                   active.play().catch(() => {});
                 }
               }
             }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                  if (isTrackDownloaded(nextT.id)) {
                    void getOfflineAudioUrl(nextT.id).then((blob) => {
                      if (blob) {
                        inactive.src = blob;
                        inactive.load();
                        preloadedTrackRef.current = nextT.id;
                      }
                    });
                  } else {
                    inactive.src = resolvePlayableUrl(nextT);
                    inactive.load();
                    preloadedTrackRef.current = nextT.id;
                  }
              }
          }
      });
      return unsub;
  }, []);

  // Swap 30-second preview clips for the full-length 320 kbps stream when one exists.
  useEffect(() => {
    if (!current?.id || !current?.title) return;
    const isPreview = current.streamUrl?.includes("dzcdn.net") || current.streamUrl?.includes("pixabay.com") || (current.duration && current.duration <= 35);
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

        usePlayer.setState((state) => {
          const newQueue = [...state.queue];
          const idx = state.index;
          if (newQueue[idx] && newQueue[idx].id === current.id) {
            newQueue[idx] = {
              ...newQueue[idx],
              streamUrl: full.streamUrl,
              duration: full.duration || newQueue[idx].duration,
            };
          }
          return { queue: newQueue, duration: full.duration || state.duration };
        });

        audio.src = resolvePlayableUrl({ ...current, streamUrl: full.streamUrl });
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
  }, [current, setDuration]);

  // Continuous Smart Autoplay & Infinity Queue (Spotify BART Contextual Continuity)
  const fetchingRelatedRef = useRef<string | null>(null);
  const queueLength = usePlayer((s) => s.queue.length);
  const queueIndex = usePlayer((s) => s.index);
  const autoplay = usePlayer((s) => s.autoplay);
  const recents = usePlayer((s) => s.recents);

  useEffect(() => {
    if (!current?.id || queueLength === 0 || !autoplay) return;

    // Trigger when user's current queue has 1 song remaining (queueIndex >= queueLength - 1)
    if (queueIndex >= queueLength - 1 && fetchingRelatedRef.current !== current.id) {
      fetchingRelatedRef.current = current.id;
      const historyContext = recents.length ? recents.slice(0, 5) : [current];
      void import("@/lib/recommendation-engine").then(({ getNextAutoplayTracksServerFn }) => {
        void getNextAutoplayTracksServerFn({
          data: { sessionHistory: historyContext, limit: 10 },
        }).then((autoplayTracks) => {
          if (autoplayTracks?.length) {
            usePlayer.getState().appendQueue(autoplayTracks);
          }
        }).catch(() => {});
      });
    }
  }, [current, queueLength, queueIndex, autoplay, recents]);

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

  // Space toggles playback; Escape closes the player overlays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      // Leave Space/Escape to whatever control has focus (buttons, inputs, menus).
      if (target?.closest("input, textarea, select, button, a, [role=button], [role=slider], [role=menuitem], [role=dialog]")) {
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
        const ct = e.currentTarget.currentTime;
        const dur = e.currentTarget.duration || current?.duration || 0;
        setCurrentTime(ct);
        if (ct > maxTimePlayedRef.current) {
          maxTimePlayedRef.current = ct;
        }

        // High Completion Rate (> 70%): report completion telemetry
        if (current?.id && dur > 0 && !completionLoggedRef.current.has(current.id)) {
          if (ct / dur >= 0.7) {
            completionLoggedRef.current.add(current.id);
            void recordPlayHistoryServerFn({
              data: {
                track: current,
                sessionId: sessionIdRef.current,
                durationPlayed: Math.round(ct),
                completed: true,
              },
            }).catch(() => {});
          }
        }
      }
    },
    onDurationChange: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (activeIndexRef.current === audioIndex) {
        setDuration(e.currentTarget.duration || 0);
      }
    },
    onEnded: () => {
      if (activeIndexRef.current === audioIndex) {
        if (current?.id) {
          completionLoggedRef.current.add(current.id);
          void recordPlayHistoryServerFn({
            data: {
              track: current,
              sessionId: sessionIdRef.current,
              durationPlayed: Math.round(maxTimePlayedRef.current || current.duration || 0),
              completed: true,
            },
          }).catch(() => {});
        }
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
                const a = activeIndexRef.current === 1 ? audio1Ref.current : audio2Ref.current;

                // Step 0: Try offline cache fallback if network is down or CDN failed
                void getOfflineAudioUrl(currentT.id).then((offlineBlob) => {
                  if (offlineBlob && a && usePlayer.getState().current()?.id === currentT.id) {
                    a.src = offlineBlob;
                    a.load();
                    a.play().catch(() => {});
                    toast.success("Playing from offline storage", { id: 'fallback' });
                    return;
                  }
                });

                // Step 1: If direct playback failed, try instant 160kbps fallback if 320kbps was 404, or stream proxy
                if (a && a.src && !a.src.includes("/api/stream") && currentT.streamUrl) {
                  if (currentT.streamUrl.includes("saavncdn.com") && currentT.streamUrl.includes("_320.mp4") && !a.src.includes("_160.mp4")) {
                    a.src = currentT.streamUrl.replace("_320.mp4", "_160.mp4");
                    a.load();
                    a.play().catch(() => {});
                    return;
                  }
                  a.src = `/api/stream?url=${encodeURIComponent(currentT.streamUrl)}`;
                  a.load();
                  a.play().catch(() => {});
                  return;
                }

                // Step 2: Try resolving alternative 320kbps master stream
                toast.loading(`Recovering audio for "${currentT.title}"...`, { id: 'fallback' });
                void resolveFullTrackStreamServerFn({
                   data: { title: currentT.title, artist: currentT.artist }
                }).then(full => {
                   if (full?.streamUrl && full.streamUrl !== currentT.streamUrl) {
                      usePlayer.setState((state) => {
                        const newQueue = [...state.queue];
                        const idx = state.index;
                        if (newQueue[idx] && newQueue[idx].id === currentT.id) {
                          newQueue[idx] = {
                            ...newQueue[idx],
                            streamUrl: full.streamUrl,
                            duration: full.duration || newQueue[idx].duration,
                          };
                        }
                        return { queue: newQueue, duration: full.duration || state.duration };
                      });
                      if (a && usePlayer.getState().current()?.id === currentT.id) {
                         a.src = resolvePlayableUrl({ ...currentT, streamUrl: full.streamUrl });
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
      <audio ref={audio1Ref} preload="auto" crossOrigin="anonymous" {...createEventHandlers(1)} />
      <audio ref={audio2Ref} preload="auto" crossOrigin="anonymous" {...createEventHandlers(2)} />
    </>
  );
}
