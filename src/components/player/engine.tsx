import { useEffect, useRef } from "react";
import { usePlayer } from "@/lib/player-store";
import { recordStreamServerFn } from "@/lib/artist-studio";
import { toast } from "sonner";

export function PlayerEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
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
  const clearPendingSeek = usePlayer((s) => s.clearPendingSeek);

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

  // Source assignment
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.src !== current.streamUrl) {
      audio.src = current.streamUrl;
      audio.load();
    }
  }, [current?.id, current?.streamUrl]);

  // Play / Pause handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      const play = audio.play();
      if (play) play.catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, current?.id, setPlaying]);

  // Volume, Muted, and Playback Rate
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
    audio.playbackRate = playbackRate || 1.0;
  }, [volume, muted, playbackRate]);

  // Seeking
  useEffect(() => {
    const audio = audioRef.current;
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
    const audio = audioRef.current;
    if (!audio || !current) return;
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

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
      onEnded={() => next()}
      onPlay={() => setPlaying(true)}
      onPause={() => {
        if (usePlayer.getState().isPlaying) {
          /* paused externally */
        }
      }}
      onError={() => {
        const now = Date.now();
        if (now - lastErrorRef.current > 1500) {
          lastErrorRef.current = now;
          if (usePlayer.getState().isPlaying) {
            next();
          }
        } else {
          setPlaying(false);
        }
      }}
    />
  );
}
