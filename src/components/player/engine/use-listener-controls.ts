import { useEffect } from "react";
import { toast } from "sonner";
import { usePlayer } from "@/lib/player-store";
import type { Deck } from "./use-deck";

/** Volume, mute and speed on both elements, plus seek requests from the UI. */
export function useDeckSettings(deck: Deck) {
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const playbackRate = usePlayer((s) => s.playbackRate);
  const pendingSeek = usePlayer((s) => s.pendingSeek);
  const clearPendingSeek = usePlayer((s) => s.clearPendingSeek);

  useEffect(() => {
    [deck.audio1Ref.current, deck.audio2Ref.current].forEach((audio) => {
      if (!audio) return;
      audio.volume = volume;
      audio.muted = muted;
      audio.playbackRate = playbackRate || 1.0;
    });
  }, [deck, volume, muted, playbackRate]);

  useEffect(() => {
    const audio = deck.getActive();
    if (!audio || pendingSeek == null) return;
    try {
      audio.currentTime = pendingSeek;
    } catch {
      // Live streams can't seek.
    }
    clearPendingSeek();
  }, [deck, pendingSeek, clearPendingSeek]);
}

/** Pauses when the sleep timer runs out. */
export function useSleepTimer() {
  const sleepTimer = usePlayer((s) => s.sleepTimer);
  const setPlaying = usePlayer((s) => s.setPlaying);
  const setSleepTimer = usePlayer((s) => s.setSleepTimer);

  useEffect(() => {
    if (!sleepTimer) return;
    const interval = setInterval(() => {
      if (Date.now() >= sleepTimer) {
        setPlaying(false);
        setSleepTimer(null);
        toast.info("Sleep timer ended", { description: "Audio playback has been paused.", duration: 4000 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimer, setPlaying, setSleepTimer]);
}

/** Space toggles playback, Escape closes overlays, headphones unplugging pauses. */
export function useShortcuts() {
  const toggle = usePlayer((s) => s.toggle);
  const setPlaying = usePlayer((s) => s.setPlaying);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      // Leave Space and Escape to whatever control has focus (buttons, inputs, menus).
      if (target?.closest("input, textarea, select, button, a, [role=button], [role=slider], [role=menuitem], [role=dialog]")) {
        return;
      }
      if (e.code === "Space") {
        // With nothing focused, the remote-navigation handler in lib/tv.ts already toggles
        // playback. Handling it here too would toggle twice and cancel out.
        const nothingFocused = !document.activeElement || document.activeElement === document.body;
        if (nothingFocused) return;
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

  useEffect(() => {
    const onNoisy = () => setPlaying(false);
    window.addEventListener("sonara:audio-becoming-noisy", onNoisy);
    return () => window.removeEventListener("sonara:audio-becoming-noisy", onNoisy);
  }, [setPlaying]);
}
