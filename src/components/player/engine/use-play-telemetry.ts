import { useCallback, useEffect, useRef } from "react";
import { recordStreamServerFn } from "@/lib/artist-studio";
import { recordPlayHistoryServerFn } from "@/lib/library-service";
import type { Track } from "@/lib/types";

const SESSION_KEY = "sonara_session_id";

function loadSessionId(): string {
  if (typeof window === "undefined") return "sess_default";
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = `sess_${Math.random().toString(36).substring(2, 15)}`;
  window.sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

/**
 * What Sonara learns from listening: play history after 5 s, completions at 70%,
 * early skips (under 30 s), and creator stream counts after 30 s of an uploaded song.
 */
export function usePlayTelemetry(current: Track | undefined, isPlaying: boolean) {
  const currentRef = useRef(current);
  currentRef.current = current;

  const sessionIdRef = useRef<string>(loadSessionId());
  const previousTrackRef = useRef<Track | null>(null);
  const furthestSecondRef = useRef(0);
  const completionLoggedRef = useRef<Set<string>>(new Set());
  const historyRecordedRef = useRef<Set<string>>(new Set());
  const countedStreamsRef = useRef<Set<string>>(new Set());
  const listenSecondsRef = useRef(0);

  const send = useCallback((track: Track, extra: Record<string, unknown> = {}) => {
    void recordPlayHistoryServerFn({
      data: { track, sessionId: sessionIdRef.current, ...extra },
    }).catch(() => {});
  }, []);

  useEffect(() => {
    listenSecondsRef.current = 0;
  }, [current?.id]);

  useEffect(() => {
    if (!isPlaying || !current?.id) return;
    const interval = setInterval(() => {
      listenSecondsRef.current += 1;
      if (
        listenSecondsRef.current >= 30 &&
        current.id.startsWith("track_") &&
        !countedStreamsRef.current.has(current.id)
      ) {
        countedStreamsRef.current.add(current.id);
        void recordStreamServerFn({
          data: { trackId: current.id, sessionId: sessionIdRef.current, durationPlayed: listenSecondsRef.current },
        }).catch(() => {});
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, current?.id]);

  useEffect(() => {
    if (!isPlaying || !current?.id) return;
    const timer = setTimeout(() => {
      if (!historyRecordedRef.current.has(current.id)) {
        historyRecordedRef.current.add(current.id);
        send(current);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isPlaying, current, send]);

  /** Call when the song changes (or stops, with null). Logs the song just left if it was skipped early. */
  const trackChanged = useCallback(
    (next: Track | null) => {
      if (!next) {
        previousTrackRef.current = null;
        return;
      }
      const previous = previousTrackRef.current;
      const heard = furthestSecondRef.current;
      if (
        previous?.id &&
        !completionLoggedRef.current.has(previous.id) &&
        heard < 30 &&
        (previous.duration ? previous.duration >= 35 : true)
      ) {
        send(previous, { durationPlayed: Math.round(heard), earlySkip: true, explicitSkip: true });
      }
      previousTrackRef.current = next;
      furthestSecondRef.current = 0;
    },
    [send],
  );

  /** Call on every time update of the playing element. */
  const progressed = useCallback(
    (seconds: number, duration: number) => {
      if (seconds > furthestSecondRef.current) furthestSecondRef.current = seconds;
      const track = currentRef.current;
      if (track?.id && duration > 0 && !completionLoggedRef.current.has(track.id) && seconds / duration >= 0.7) {
        completionLoggedRef.current.add(track.id);
        send(track, { durationPlayed: Math.round(seconds), completed: true });
      }
    },
    [send],
  );

  /** Call when the playing element reaches its end. */
  const ended = useCallback(() => {
    const track = currentRef.current;
    if (!track?.id) return;
    completionLoggedRef.current.add(track.id);
    send(track, { durationPlayed: Math.round(furthestSecondRef.current || track.duration || 0), completed: true });
  }, [send]);

  return { trackChanged, progressed, ended };
}

export type PlayTelemetry = ReturnType<typeof usePlayTelemetry>;
