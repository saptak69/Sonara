import { useMemo, useRef, type MutableRefObject, type RefObject } from "react";

/**
 * Two <audio> elements that take turns: one plays while the other preloads the next
 * song, so the hand-over is instant.
 */
export type Deck = {
  audio1Ref: RefObject<HTMLAudioElement | null>;
  audio2Ref: RefObject<HTMLAudioElement | null>;
  activeIndexRef: MutableRefObject<1 | 2>;
  getActive: () => HTMLAudioElement | null;
  getInactive: () => HTMLAudioElement | null;
  elementAt: (index: 1 | 2) => HTMLAudioElement | null;
  swap: () => void;
};

export function useDeck(): Deck {
  const audio1Ref = useRef<HTMLAudioElement>(null);
  const audio2Ref = useRef<HTMLAudioElement>(null);
  const activeIndexRef = useRef<1 | 2>(1);

  return useMemo(() => {
    const elementAt = (index: 1 | 2) => (index === 1 ? audio1Ref.current : audio2Ref.current);
    return {
      audio1Ref,
      audio2Ref,
      activeIndexRef,
      elementAt,
      getActive: () => elementAt(activeIndexRef.current),
      getInactive: () => elementAt(activeIndexRef.current === 1 ? 2 : 1),
      swap: () => {
        activeIndexRef.current = activeIndexRef.current === 1 ? 2 : 1;
      },
    };
  }, []);
}
