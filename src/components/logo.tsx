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

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      style={{ width: size, height: size }}
      aria-label="Sonara Sounding Instrument"
    >
      <defs>
        <radialGradient id={`bg-${safeId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-surface)" />
          <stop offset="100%" stopColor="var(--color-bg)" />
        </radialGradient>
      </defs>
      <rect x="4" y="4" width="92" height="92" rx="22" fill={`url(#bg-${safeId})`} stroke="var(--color-accent)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="36" stroke="#8f6a34" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="50" cy="50" r="26" stroke="var(--color-accent)" strokeWidth="1" opacity="0.7" />
      <circle cx="50" cy="50" r="16" stroke="#8f6a34" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.6" />
      <line x1="50" y1="10" x2="50" y2="90" stroke="var(--color-accent)" strokeWidth="0.75" opacity="0.4" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="var(--color-accent)" strokeWidth="0.75" opacity="0.4" />
      <polygon points="50,20 54,48 50,52 46,48" fill="var(--color-accent)" />
      <polygon points="50,80 53,52 50,48 47,52" fill="#8f6a34" opacity="0.8" />
      <circle cx="50" cy="50" r="4" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="2" fill="#4a8f7f" />
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
        className={cn("relative shrink-0", compact ? "w-10 h-10 overflow-hidden" : "")}
        whileHover="hover"
        whileTap="tap"
        initial="idle"
      >
        <svg 
          viewBox="0 0 400 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn("drop-shadow-sm", compact ? "h-full w-full object-left" : "h-10 md:h-14 w-auto max-w-[200px]")}
        >
          <defs>
            <linearGradient id="sunGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#7a0303" />
              <stop offset="35%" stopColor="#c71f00" />
              <stop offset="100%" stopColor="#ff8c00" />
            </linearGradient>

            <linearGradient id="textGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fffcf8" />
              <stop offset="50%" stopColor="#ffeadd" />
              <stop offset="100%" stopColor="#ffcda8" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#5a0000" floodOpacity="0.85"/>
              <feDropShadow dx="-1" dy="-1" stdDeviation="1" floodColor="#ffffff" floodOpacity="0.4"/>
            </filter>

            <clipPath id="leftCut">
              <polygon points="10,120 160,0 400,0 400,120" />
            </clipPath>
          </defs>

          {/* Staggered Horizontal Lines & Sweeping Arcs */}
          <motion.g 
            clipPath="url(#leftCut)"
            variants={{
              hover: { x: 5, transition: { type: "spring", stiffness: 300, damping: 20 } },
              tap: { x: -5, scale: 0.95 },
              idle: { x: 0 }
            }}
          >
            <g stroke="url(#sunGrad)" strokeWidth="7.5" strokeLinecap="round" fill="none">
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
          {!compact && (
            <motion.text 
              x="180" 
              y="94" 
              fontFamily="system-ui, -apple-system, sans-serif" 
              fontSize="78" 
              fontWeight="900" 
              fontStyle="italic"
              fill="url(#textGrad)"
              filter="url(#glow)"
              textAnchor="middle"
              variants={{
                hover: { scale: 1.04, x: 2, transition: { type: "spring", stiffness: 400, damping: 25 } },
                tap: { scale: 0.95 },
                idle: { scale: 1, x: 0 }
              }}
              style={{ transform: "skewX(-16deg)", letterSpacing: "0.02em" }}
            >
              sonara
            </motion.text>
          )}

          {/* The Sparkle / Star */}
          <motion.path 
            d="M 345 35 Q 347 62 385 65 Q 347 68 345 95 Q 343 68 305 65 Q 343 62 345 35 Z" 
            fill="url(#textGrad)"
            filter="url(#glow)"
            variants={{
              hover: { 
                rotate: 90, 
                scale: 1.25,
                transition: { type: "spring", stiffness: 200, damping: 10 }
              },
              tap: { scale: 0.5, rotate: -45 },
              idle: { rotate: 0, scale: 1 }
            }}
            style={{ transformOrigin: "345px 65px" }}
          />
        </svg>
      </motion.div>
    </Link>
  );
}
