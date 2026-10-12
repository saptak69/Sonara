import { useId } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function SonaraIcon({
  className,
  size = 32,
}: {
  className?: string;
  size?: number | string;
}) {
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const sunGradId = `sunGrad-${safeId}`;
  const textGradId = `textGrad-${safeId}`;
  const glowId = `glow-${safeId}`;
  const leftCutId = `leftCut-${safeId}`;

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none drop-shadow-sm", className)}
      style={{ width: size, height: size }}
      aria-label="Sonara Icon"
    >
      <defs>
        <linearGradient id={sunGradId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#7a0303" />
          <stop offset="35%" stopColor="#c71f00" />
          <stop offset="100%" stopColor="#ff8c00" />
        </linearGradient>

        <linearGradient id={textGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffcf8" />
          <stop offset="50%" stopColor="#ffeadd" />
          <stop offset="100%" stopColor="#ffcda8" />
        </linearGradient>

        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#5a0000" floodOpacity="0.85" />
          <feDropShadow dx="-1" dy="-1" stdDeviation="1" floodColor="#ffffff" floodOpacity="0.4" />
        </filter>

        <clipPath id={leftCutId}>
          <polygon points="6,120 45,0 120,0 120,120" />
        </clipPath>
      </defs>

      {/* Staggered Red Speed Lines */}
      <g clipPath={`url(#${leftCutId})`}>
        <g stroke={`url(#${sunGradId})`} strokeWidth="8" strokeLinecap="round" fill="none">
          <path d="M -10 18 L 75 18" />
          <path d="M -10 34 L 92 34" />
          <path d="M -10 50 L 108 50" />
          <path d="M -10 66 L 114 66" />
          <path d="M -10 82 L 102 82" />
          <path d="M -10 98 L 78 98 A 24 24 0 0 0 102 74" />
          <path d="M -10 112 L 78 112 A 38 38 0 0 0 116 74" />
        </g>
      </g>

      {/* The Signature White "S" in the same theme as the Sonara logo */}
      <text
        x="58"
        y="92"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="86"
        fontWeight="900"
        fontStyle="italic"
        fill={`url(#${textGradId})`}
        filter={`url(#${glowId})`}
        textAnchor="middle"
        style={{ transform: "skewX(-14deg)", transformOrigin: "58px 92px" }}
      >
        S
      </text>

      {/* The Sparkle / Star in top-right */}
      <path
        d="M 98 12 Q 99 24 111 26 Q 99 28 98 40 Q 97 28 85 26 Q 97 24 98 12 Z"
        fill={`url(#${textGradId})`}
        filter={`url(#${glowId})`}
      />
    </svg>
  );
}

export function Logo({
  compact,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const sunGradId = `sunGrad-${safeId}`;
  const textGradId = `textGrad-${safeId}`;
  const glowId = `glow-${safeId}`;
  const leftCutId = `leftCut-${safeId}`;

  if (compact) {
    return (
      <Link
        to="/"
        onClick={() => {
          const main = document.getElementById("main-scroll-area");
          if (main) main.scrollTo({ top: 0, behavior: "instant" });
          window.scrollTo({ top: 0, behavior: "instant" });
        }}
        aria-label="Sonara Home"
        className={cn(
          "inline-flex items-center justify-center rounded-xl outline-none focus-visible:ring-1 focus-visible:ring-accent group transition-all",
          className,
        )}
      >
        <motion.div
          className="relative size-full flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial="idle"
        >
          <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-full drop-shadow-sm select-none"
          >
            <defs>
              <linearGradient id={sunGradId} x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#7a0303" />
                <stop offset="35%" stopColor="#c71f00" />
                <stop offset="100%" stopColor="#ff8c00" />
              </linearGradient>

              <linearGradient id={textGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fffcf8" />
                <stop offset="50%" stopColor="#ffeadd" />
                <stop offset="100%" stopColor="#ffcda8" />
              </linearGradient>

              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1.5" dy="2.5" stdDeviation="2" floodColor="#5a0000" floodOpacity="0.85" />
                <feDropShadow dx="-1" dy="-1" stdDeviation="1" floodColor="#ffffff" floodOpacity="0.4" />
              </filter>

              <clipPath id={leftCutId}>
                <polygon points="6,120 45,0 120,0 120,120" />
              </clipPath>
            </defs>

            {/* Staggered Red Speed Lines */}
            <motion.g
              clipPath={`url(#${leftCutId})`}
              variants={{
                hover: { x: 3, transition: { type: "spring", stiffness: 300, damping: 20 } },
                tap: { x: -3, scale: 0.95 },
                idle: { x: 0 },
              }}
            >
              <g stroke={`url(#${sunGradId})`} strokeWidth="8" strokeLinecap="round" fill="none">
                <path d="M -10 18 L 75 18" />
                <path d="M -10 34 L 92 34" />
                <path d="M -10 50 L 108 50" />
                <path d="M -10 66 L 114 66" />
                <path d="M -10 82 L 102 82" />
                <path d="M -10 98 L 78 98 A 24 24 0 0 0 102 74" />
                <path d="M -10 112 L 78 112 A 38 38 0 0 0 116 74" />
              </g>
            </motion.g>

            {/* The Signature White "S" */}
            <motion.text
              x="58"
              y="92"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="86"
              fontWeight="900"
              fontStyle="italic"
              fill={`url(#${textGradId})`}
              filter={`url(#${glowId})`}
              textAnchor="middle"
              variants={{
                hover: { scale: 1.08, transition: { type: "spring", stiffness: 400, damping: 25 } },
                tap: { scale: 0.92 },
                idle: { scale: 1 },
              }}
              style={{ transform: "skewX(-14deg)", transformOrigin: "58px 92px" }}
            >
              S
            </motion.text>

            {/* The Sparkle / Star in top-right */}
            <motion.path
              d="M 98 12 Q 99 24 111 26 Q 99 28 98 40 Q 97 28 85 26 Q 97 24 98 12 Z"
              fill={`url(#${textGradId})`}
              filter={`url(#${glowId})`}
              variants={{
                hover: {
                  rotate: 90,
                  scale: 1.25,
                  transition: { type: "spring", stiffness: 200, damping: 10 },
                },
                tap: { scale: 0.5, rotate: -45 },
                idle: { rotate: 0, scale: 1 },
              }}
              style={{ transformOrigin: "98px 26px" }}
            />
          </svg>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link
      to="/"
      onClick={() => {
        const main = document.getElementById("main-scroll-area");
        if (main) main.scrollTo({ top: 0, behavior: "instant" });
        window.scrollTo({ top: 0, behavior: "instant" });
      }}
      className={cn(
        "flex items-center rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-brass/60 group transition-all",
        className,
      )}
    >
      <motion.div
        className="relative shrink-0"
        whileHover="hover"
        whileTap="tap"
        initial="idle"
      >
        <svg
          viewBox="0 0 400 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm h-9 w-[120px] md:h-12 md:w-[160px]"
        >
          <defs>
            <linearGradient id={sunGradId} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#7a0303" />
              <stop offset="35%" stopColor="#c71f00" />
              <stop offset="100%" stopColor="#ff8c00" />
            </linearGradient>

            <linearGradient id={textGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fffcf8" />
              <stop offset="50%" stopColor="#ffeadd" />
              <stop offset="100%" stopColor="#ffcda8" />
            </linearGradient>

            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#5a0000" floodOpacity="0.85" />
              <feDropShadow dx="-1" dy="-1" stdDeviation="1" floodColor="#ffffff" floodOpacity="0.4" />
            </filter>

            <clipPath id={leftCutId}>
              <polygon points="10,120 160,0 400,0 400,120" />
            </clipPath>
          </defs>

          {/* Staggered Horizontal Lines & Sweeping Arcs */}
          <motion.g
            clipPath={`url(#${leftCutId})`}
            variants={{
              hover: { x: 5, transition: { type: "spring", stiffness: 300, damping: 20 } },
              tap: { x: -5, scale: 0.95 },
              idle: { x: 0 },
            }}
          >
            <g stroke={`url(#${sunGradId})`} strokeWidth="7.5" strokeLinecap="round" fill="none">
              <path d="M -50 15 L 245 15" />
              <path d="M -50 29 L 280 29" />
              <path d="M -50 43 L 305 43" />
              <path d="M -50 57 L 320 57" />
              <path d="M -50 71 L 325 71" />
              {/* Bottom lines sweeping up on the right */}
              <path d="M -50 85 L 290 85 A 35 35 0 0 0 325 50" />
              <path d="M -50 99 L 290 99 A 49 49 0 0 0 339 50" />
              <path d="M -50 113 L 290 113 A 63 63 0 0 0 353 50" />
            </g>
          </motion.g>

          {/* The Text "sonara" */}
          <motion.text
            x="180"
            y="94"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="78"
            fontWeight="900"
            fontStyle="italic"
            fill={`url(#${textGradId})`}
            filter={`url(#${glowId})`}
            textAnchor="middle"
            variants={{
              hover: { scale: 1.04, x: 2, transition: { type: "spring", stiffness: 400, damping: 25 } },
              tap: { scale: 0.95 },
              idle: { scale: 1, x: 0 },
            }}
            style={{ transform: "skewX(-16deg)", letterSpacing: "0.02em" }}
          >
            sonara
          </motion.text>

          {/* The Sparkle / Star */}
          <motion.path
            d="M 345 35 Q 347 62 385 65 Q 347 68 345 95 Q 343 68 305 65 Q 343 62 345 35 Z"
            fill={`url(#${textGradId})`}
            filter={`url(#${glowId})`}
            variants={{
              hover: {
                rotate: 90,
                scale: 1.25,
                transition: { type: "spring", stiffness: 200, damping: 10 },
              },
              tap: { scale: 0.5, rotate: -45 },
              idle: { rotate: 0, scale: 1 },
            }}
            style={{ transformOrigin: "345px 65px" }}
          />
        </svg>
      </motion.div>
    </Link>
  );
}
