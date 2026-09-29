import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Scrolling marquee for text that overflows its container.
 * If the text fits, it just renders normally (no animation).
 * If the text is too long, it scrolls with a pause at start/end.
 */
export function MarqueeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const check = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        setShouldScroll(textWidth > containerWidth + 4);
      }
    };
    check();
    // Re-check on resize
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [text]);

  if (!shouldScroll) {
    return (
      <div ref={containerRef} className={cn("overflow-hidden whitespace-nowrap", className)}>
        <span ref={textRef} className="inline-block">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("marquee-container", className)}>
      <span
        ref={textRef}
        className="marquee-scroll"
        style={{
          "--marquee-distance": "-50%",
        } as React.CSSProperties}
      >
        {text}
        <span className="inline-block px-8 text-muted/50" aria-hidden>•</span>
        {text}
      </span>
    </div>
  );
}
