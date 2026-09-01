import { useEffect, useRef } from "react";
import { usePlayer } from "@/lib/player-store";
import { recordStreamServerFn } from "@/lib/artist-studio";

export function PlayerEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const pendingSeek = usePlayer((s) => s.pendingSeek);
  const setCurrentTime = usePlayer((s) => s.setCurrentTime);
  const setDuration = usePlayer((s) => s.setDuration);
  const setPlaying = usePlayer((s) => s.setPlaying);
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

  useEffect(() => {
    playTimeRef.current = 0;
  }, [current?.id]);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.src !== current.streamUrl) {
      audio.src = current.streamUrl;
      audio.load();
    }
  }, [current?.id, current?.streamUrl]);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight") {
        next();
      } else if (e.code === "ArrowLeft") {
        prev();
      } else if (e.code === "KeyM") {
        usePlayer.getState().toggleMute();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, toggle]);

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
          /* user paused via external control */
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
