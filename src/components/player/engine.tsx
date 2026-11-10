import { usePlayer } from "@/lib/player-store";
import { useDeck } from "./engine/use-deck";
import { useEqualizer } from "./engine/use-equalizer";
import { useDeckSettings, useShortcuts, useSleepTimer } from "./engine/use-listener-controls";
import { useMediaSession } from "./engine/use-media-session";
import { usePlayTelemetry } from "./engine/use-play-telemetry";
import { useQueueRefill } from "./engine/use-queue-refill";
import { useSharedLink } from "./engine/use-shared-link";
import { useStreamRecovery } from "./engine/use-stream-recovery";
import { useTrackPlayback } from "./engine/use-track-playback";

/**
 * Owns the two <audio> elements. The work is split into hooks under ./engine:
 * playback and preloading, stream recovery, equalizer, media session, queue refill,
 * listening telemetry and keyboard shortcuts. This component only connects them and
 * forwards the elements' events to the store.
 */
export function PlayerEngine() {
  const deck = useDeck();
  const current = usePlayer((s) => s.queue[s.index]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const setCurrentTime = usePlayer((s) => s.setCurrentTime);
  const setDuration = usePlayer((s) => s.setDuration);
  const setPlaying = usePlayer((s) => s.setPlaying);
  const next = usePlayer((s) => s.next);

  const telemetry = usePlayTelemetry(current, isPlaying);
  const recoverFromError = useStreamRecovery(deck);

  useEqualizer(deck);
  useSharedLink();
  useMediaSession(deck);
  useSleepTimer();
  useTrackPlayback(deck, telemetry);
  useQueueRefill();
  useDeckSettings(deck);
  useShortcuts();

  const handlersFor = (index: 1 | 2) => {
    const isActive = () => deck.activeIndexRef.current === index;
    return {
      onTimeUpdate: (e: React.SyntheticEvent<HTMLAudioElement>) => {
        if (!isActive()) return;
        const seconds = e.currentTarget.currentTime;
        setCurrentTime(seconds);
        telemetry.progressed(seconds, e.currentTarget.duration || current?.duration || 0);
      },
      onDurationChange: (e: React.SyntheticEvent<HTMLAudioElement>) => {
        if (isActive()) setDuration(e.currentTarget.duration || 0);
      },
      onEnded: () => {
        if (!isActive()) return;
        telemetry.ended();
        next();
      },
      onPlay: () => {
        if (isActive()) setPlaying(true);
      },
      onError: () => {
        if (isActive()) void recoverFromError(index);
      },
    };
  };

  return (
    <>
      <audio ref={deck.audio1Ref} preload="auto" crossOrigin="anonymous" {...handlersFor(1)} />
      <audio ref={deck.audio2Ref} preload="auto" crossOrigin="anonymous" {...handlersFor(2)} />
    </>
  );
}
