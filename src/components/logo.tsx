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
              <stop offset="100%" stopColor="#ffe6cc" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7a0303" floodOpacity="0.8"/>
            </filter>

            <clipPath id="sunClip">
              <circle cx="280" cy="50" r="50" />
            </clipPath>
          </defs>

          {/* Staggered Horizontal Lines (Sun & Tail) */}
          <motion.g 
            variants={{
              hover: { x: 5, transition: { type: "spring", stiffness: 300, damping: 20 } },
              tap: { x: -5, scale: 0.95 },
              idle: { x: 0 }
            }}
          >
            {/* The circular part of the sun */}
            <g clipPath="url(#sunClip)">
              <rect x="230" y="0" width="100" height="15" fill="url(#sunGrad)" />
              <rect x="230" y="20" width="100" height="12" fill="url(#sunGrad)" />
              <rect x="230" y="37" width="100" height="10" fill="url(#sunGrad)" />
              <rect x="230" y="52" width="100" height="8" fill="url(#sunGrad)" />
              <rect x="230" y="65" width="100" height="7" fill="url(#sunGrad)" />
              <rect x="230" y="77" width="100" height="6" fill="url(#sunGrad)" />
              <rect x="230" y="88" width="100" height="5" fill="url(#sunGrad)" />
            </g>

            {/* The sweeping tail lines that extend to the left */}
            <rect x="180" y="20" width="80" height="12" fill="url(#sunGrad)" className="opacity-90" />
            <rect x="150" y="37" width="120" height="10" fill="url(#sunGrad)" className="opacity-95" />
            <rect x="120" y="52" width="150" height="8" fill="url(#sunGrad)" />
            <rect x="80" y="65" width="200" height="7" fill="url(#sunGrad)" />
            
            {/* Bottom longest lines */}
            <rect x="40" y="77" width="260" height="6" fill="url(#sunGrad)" rx="3" />
            <rect x="30" y="88" width="280" height="5" fill="url(#sunGrad)" rx="2.5" />
            <rect x="20" y="98" width="290" height="4" fill="url(#sunGrad)" rx="2" />
          </motion.g>

          {/* The Text "sonara" */}
          {!compact && (
            <motion.text 
              x="30" 
              y="75" 
              fontFamily="system-ui, -apple-system, sans-serif" 
              fontSize="68" 
              fontWeight="900" 
              fontStyle="italic"
              fill="url(#textGrad)"
              filter="url(#glow)"
              textLength="280"
              lengthAdjust="spacingAndGlyphs"
              variants={{
                hover: { scale: 1.02, x: 2, transition: { type: "spring", stiffness: 400, damping: 25 } },
                tap: { scale: 0.95 },
                idle: { scale: 1, x: 0 }
              }}
              style={{ letterSpacing: "-0.02em" }}
            >
              sonara
            </motion.text>
          )}

          {/* The Sparkle / Star */}
          <motion.path 
            d="M 330 30 Q 335 50 355 55 Q 335 60 330 80 Q 325 60 305 55 Q 325 50 330 30 Z" 
            fill="#ffebd6"
            filter="url(#glow)"
            variants={{
              hover: { 
                rotate: 90, 
                scale: 1.2,
                transition: { type: "spring", stiffness: 200, damping: 10 }
              },
              tap: { scale: 0.5, rotate: -45 },
              idle: { rotate: 0, scale: 1 }
            }}
            style={{ transformOrigin: "330px 55px" }}
          />
        </svg>
      </motion.div>
    </Link>
  );
}
