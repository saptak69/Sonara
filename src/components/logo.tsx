import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function SonaraIcon({
  className,
  size = 32,
}: {
  className?: string;
  size?: number | string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      style={{ width: size, height: size }}
      aria-label="Sonara Icon"
    >
      <defs>
        {/* Background Squircle Gradient */}
        <linearGradient id="sonaraBgGrad" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#1f0306" />
          <stop offset="45%" stop-color="#0d0103" />
          <stop offset="100%" stop-color="#050102" />
        </linearGradient>

        {/* Luminous Crimson Edge Glow */}
        <linearGradient id="sonaraBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff384d" stop-opacity="0.85" />
          <stop offset="50%" stop-color="#ff2a3d" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#ff1a2d" stop-opacity="0.75" />
        </linearGradient>

        {/* Equalizer S Radiant Gradient: Fiery Crimson to Luminous Amber-Orange */}
        <linearGradient id="sonaraEqGrad" x1="20%" y1="75%" x2="80%" y2="25%">
          <stop offset="0%" stop-color="#ff1f35" />
          <stop offset="25%" stop-color="#ff2a3d" />
          <stop offset="55%" stop-color="#ff5924" />
          <stop offset="85%" stop-color="#ff851a" />
          <stop offset="100%" stop-color="#ffa026" />
        </linearGradient>

        {/* Outer Glow for Dark Backdrops */}
        <filter id="sonaraGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Squircle Container with Glowing Border */}
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="24"
        fill="url(#sonaraBgGrad)"
        stroke="url(#sonaraBorderGrad)"
        stroke-width="1.6"
      />

      {/* Top Ambient Glow */}
      <circle cx="50" cy="18" r="28" fill="#ff2a3d" opacity="0.25" filter="blur(16px)" />
      <circle cx="50" cy="50" r="26" fill="#ff661a" opacity="0.14" filter="blur(14px)" />

      {/* Equalizer S Soundwave Bars (Capsule Width: 2.8, Radius: 1.4) */}
      <g fill="url(#sonaraEqGrad)" filter="url(#sonaraGlow)">
        {/* BOTTOM LOOP (Sweeping leftward tail x=21.5 to center base) */}
        <rect x="21.5" y="60.5" width="2.8" height="3" rx="1.4" />
        <rect x="25.2" y="60" width="2.8" height="5.5" rx="1.4" />
        <rect x="28.9" y="60" width="2.8" height="8.5" rx="1.4" />
        <rect x="32.6" y="60" width="2.8" height="11.5" rx="1.4" />
        <rect x="36.3" y="60.5" width="2.8" height="14" rx="1.4" />
        <rect x="40" y="61.5" width="2.8" height="15.5" rx="1.4" />
        <rect x="43.7" y="62" width="2.8" height="16" rx="1.4" />
        <rect x="47.4" y="61.5" width="2.8" height="15.5" rx="1.4" />
        <rect x="51.1" y="61" width="2.8" height="14" rx="1.4" />
        <rect x="54.8" y="60.5" width="2.8" height="12" rx="1.4" />
        <rect x="58.5" y="59.5" width="2.8" height="10" rx="1.4" />

        {/* MIDDLE DIAGONAL SPINE OF S */}
        <rect x="31" y="36.5" width="2.8" height="6.5" rx="1.4" />
        <rect x="34.7" y="33" width="2.8" height="13.5" rx="1.4" />
        <rect x="38.4" y="30" width="2.8" height="18.5" rx="1.4" />
        <rect x="42.1" y="28" width="2.8" height="10" rx="1.4" />
        <rect x="42.1" y="42" width="2.8" height="9" rx="1.4" />
        <rect x="45.8" y="27" width="2.8" height="10.5" rx="1.4" />
        <rect x="45.8" y="44.5" width="2.8" height="8.5" rx="1.4" />
        <rect x="49.5" y="26.5" width="2.8" height="11.5" rx="1.4" />
        <rect x="49.5" y="47.5" width="2.8" height="7.5" rx="1.4" />
        <rect x="53.2" y="25.5" width="2.8" height="13" rx="1.4" />
        <rect x="53.2" y="49" width="2.8" height="8" rx="1.4" />
        <rect x="56.9" y="25" width="2.8" height="14" rx="1.4" />
        <rect x="56.9" y="49.5" width="2.8" height="11" rx="1.4" />
        <rect x="60.6" y="25.5" width="2.8" height="14.5" rx="1.4" />
        <rect x="60.6" y="49.5" width="2.8" height="17.5" rx="1.4" />
        <rect x="64.3" y="52" width="2.8" height="13" rx="1.4" />
        <rect x="68" y="54.5" width="2.8" height="7.5" rx="1.4" />

        {/* TOP-RIGHT ARCH & RIGHTWARD TIP */}
        <rect x="64.3" y="27" width="2.8" height="13" rx="1.4" />
        <rect x="68" y="29.5" width="2.8" height="11" rx="1.4" />
        <rect x="71.7" y="32" width="2.8" height="9" rx="1.4" />
        <rect x="75.4" y="34.5" width="2.8" height="5.5" rx="1.4" />
        <rect x="78.5" y="36.5" width="2.8" height="2.8" rx="1.4" />
      </g>
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
      className={cn(
        "flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent/40 group transition-all",
        className,
      )}
    >
      <div className="relative shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-95 shadow-[0_4px_20px_rgb(255_42_61/0.3)] rounded-[10px]">
        <SonaraIcon size={34} />
      </div>
      <span
        className={cn(
          "text-xl font-bold tracking-tight text-fg transition-colors group-hover:text-white flex items-center gap-1",
          compact && "sr-only",
        )}
      >
        <span>Sonara</span>
      </span>
    </Link>
  );
}
