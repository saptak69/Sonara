import { useEffect, useState } from "react";

/**
 * True once the element is within `margin` of the visible area (and stays true).
 * Lets sections below the fold wait to load their data until the listener scrolls toward them.
 * Use the returned function as the element's `ref`; the element may appear later than the first render.
 */
export function useNearViewport<T extends Element = HTMLDivElement>(margin = "480px") {
  const [element, setElement] = useState<T | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near || !element) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${margin} 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [near, element, margin]);

  return [setElement, near] as const;
}

/** False on the server and during hydration, true afterwards. For UI that depends on the clock or local storage. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
