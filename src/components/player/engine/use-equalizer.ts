import { useCallback, useEffect, useRef } from "react";
import { usePlayer } from "@/lib/player-store";
import type { Deck } from "./use-deck";

const BAND_FREQUENCIES = [60, 250, 1000, 4000, 12000];
const BAND_TYPES: BiquadFilterType[] = ["peaking", "peaking", "peaking", "peaking", "highshelf"];

/**
 * Web Audio chain shared by both audio elements:
 * bass boost -> 5-band equalizer -> compressor ("sound check") -> speakers.
 */
export function useEqualizer(deck: Deck) {
  const equalizerEnabled = usePlayer((s) => s.equalizerEnabled);
  const equalizerBands = usePlayer((s) => s.equalizerBands);
  const bassBoost = usePlayer((s) => s.bassBoost);
  const volumeNormalization = usePlayer((s) => s.volumeNormalization);

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
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const bassNode = ctx.createBiquadFilter();
      bassNode.type = "lowshelf";
      bassNode.frequency.value = 80;
      bassNode.gain.value = equalizerEnabled ? bassBoost : 0;
      bassBoostNodeRef.current = bassNode;

      const bandNodes: BiquadFilterNode[] = [];
      let previous: AudioNode = bassNode;
      BAND_FREQUENCIES.forEach((frequency, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = BAND_TYPES[i];
        filter.frequency.value = frequency;
        filter.Q.value = 1.0;
        filter.gain.value = equalizerEnabled ? (equalizerBands[i] ?? 0) : 0;
        previous.connect(filter);
        previous = filter;
        bandNodes.push(filter);
      });
      bandNodesRef.current = bandNodes;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = volumeNormalization ? -24 : 0;
      compressor.knee.value = 30;
      compressor.ratio.value = volumeNormalization ? 12 : 1;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorRef.current = compressor;
      previous.connect(compressor);
      compressor.connect(ctx.destination);
    } catch {
      // Web Audio unavailable: playback continues without the equalizer.
    }
  }, [equalizerEnabled, bassBoost, equalizerBands, volumeNormalization]);

  const connect = useCallback(
    (element: HTMLAudioElement | null) => {
      if (!element || typeof window === "undefined") return;
      initWebAudio();
      const ctx = audioCtxRef.current;
      const bass = bassBoostNodeRef.current;
      if (!ctx || !bass || connectedElementsRef.current.has(element)) return;
      try {
        ctx.createMediaElementSource(element).connect(bass);
        connectedElementsRef.current.add(element);
      } catch {
        // Already connected, or the browser refuses (cross-origin audio without CORS).
      }
    },
    [initWebAudio],
  );

  useEffect(() => {
    connect(deck.audio1Ref.current);
    connect(deck.audio2Ref.current);
  }, [connect, deck]);

  useEffect(() => {
    const bass = bassBoostNodeRef.current;
    const bands = bandNodesRef.current;
    if (!bass || !bands.length) return;
    bass.gain.value = equalizerEnabled ? bassBoost : 0;
    bands.forEach((node, i) => {
      node.gain.value = equalizerEnabled ? (equalizerBands[i] ?? 0) : 0;
    });
  }, [equalizerEnabled, equalizerBands, bassBoost]);

  useEffect(() => {
    const compressor = compressorRef.current;
    if (!compressor) return;
    compressor.threshold.value = volumeNormalization ? -24 : 0;
    compressor.ratio.value = volumeNormalization ? 12 : 1;
  }, [volumeNormalization]);
}
