import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MarqueeTextProps {
  text: string;
  className?: string;
  /** Speed multiplier (lower = faster, default ~0.35s per character) */
  speedMultiplier?: number;
}

/**
 * Apple Music Grade Continuous Marquee Text Engine
 * - Tracks container width via ResizeObserver to handle player expand/drawer/flex changes.
 * - Normalized duration according to character count.
 * - Subtle left/right gradient mask-image fade so text gracefully rolls into view.
 * - Dual-track seamless translation from 0% to -50% without awkward snap or jump.
 * - Pauses on hover/focus for readability.
 */
export function MarqueeText({
  text,
  className,
  speedMultiplier = 0.35,
}: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measurerRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkOverflow = () => {
      const containerWidth = container.clientWidth;
      const contentWidth = measurerRef.current?.scrollWidth || 0;
      // Buffer of 4px to avoid sub-pixel jitter
      setIsOverflowing(contentWidth > containerWidth + 4);
    };

    // Initial check
    checkOverflow();

    // ResizeObserver tracks container width changes during drawer animations, window resizes, etc.
    const observer = new ResizeObserver(() => {
      checkOverflow();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [text]);

  // Normalized scroll duration: short overflows don't crawl, long titles don't fly
  const durationSeconds = Math.max(8, Math.min(26, Math.round(text.length * speedMultiplier + 4)));

  return (
    <div
      ref={containerRef}
      title={text}
      data-overflow={isOverflowing}
      className={cn(
        "marquee-container group/marquee relative overflow-hidden min-w-0 max-w-full select-none",
        isOverflowing && "cursor-default",
        className
      )}
      style={{
        "--marquee-duration": `${durationSeconds}s`,
      } as React.CSSProperties}
    >
      {/* Hidden measurer to continuously track natural single-line text width */}
      <span
        ref={measurerRef}
        className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap opacity-0"
        aria-hidden="true"
      >
        {text}
      </span>

      {!isOverflowing ? (
        <span className="block truncate leading-normal">
          {text}
        </span>
      ) : (
        <div className="marquee-track flex w-max items-center whitespace-nowrap">
          <span className="marquee-item inline-block shrink-0 pr-8">
            {text}
          </span>
          <span className="inline-block shrink-0 px-3 text-white/30 text-xs select-none" aria-hidden="true">
            •
          </span>
          <span className="marquee-item inline-block shrink-0 pr-8" aria-hidden="true">
            {text}
          </span>
          <span className="inline-block shrink-0 px-3 text-white/30 text-xs select-none" aria-hidden="true">
            •
          </span>
        </div>
      )}
    </div>
  );
}
