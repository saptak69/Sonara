import { useId } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function SonaraIcon({
  className,
  size = 32,
}: {
  className?: string;
  size?: number | string;
}) {
  const reactId = useId();
  const safeId = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const bgGradId = `sonara-bg-${safeId}`;
  const borderGradId = `sonara-border-${safeId}`;
  const eqGradId = `sonara-eq-${safeId}`;

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
        <linearGradient id={bgGradId} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#1f0306" />
          <stop offset="50%" stopColor="#0d0103" />
          <stop offset="100%" stopColor="#050102" />
        </linearGradient>

        {/* Luminous Crimson Edge Glow */}
        <linearGradient id={borderGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff384d" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ff2a3d" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff1a2d" stopOpacity="0.8" />
        </linearGradient>

        {/* Equalizer S Radiant Gradient: Fiery Crimson to Luminous Amber-Orange */}
        <linearGradient id={eqGradId} x1="20%" y1="75%" x2="80%" y2="25%">
          <stop offset="0%" stopColor="#ff1830" />
          <stop offset="25%" stopColor="#ff2a3d" />
          <stop offset="55%" stopColor="#ff5924" />
          <stop offset="85%" stopColor="#ff8a1a" />
          <stop offset="100%" stopColor="#ffa526" />
        </linearGradient>
      </defs>

      {/* Outer Squircle Container with Glowing Border */}
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="24"
        fill={`url(#${bgGradId})`}
        stroke={`url(#${borderGradId})`}
        strokeWidth="1.8"
      />

      {/* Ambient Radial Highlights */}
      <circle cx="50" cy="20" r="26" fill="#ff2a3d" opacity="0.28" />
      <circle cx="50" cy="50" r="24" fill="#ff661a" opacity="0.16" />

      {/* Equalizer S Soundwave Bars (Capsule Width: 3.0, Radius: 1.5) */}
      <g fill={`url(#${eqGradId})`}>
        {/* BOTTOM LOOP (Sweeping leftward tail x=21.5 to center base) */}
        <rect x="21.5" y="60.5" width="3.0" height="3" rx="1.5" />
        <rect x="25.2" y="60" width="3.0" height="5.5" rx="1.5" />
        <rect x="28.9" y="60" width="3.0" height="8.5" rx="1.5" />
        <rect x="32.6" y="60" width="3.0" height="11.5" rx="1.5" />
        <rect x="36.3" y="60.5" width="3.0" height="14" rx="1.5" />
        <rect x="40" y="61.5" width="3.0" height="15.5" rx="1.5" />
        <rect x="43.7" y="62" width="3.0" height="16" rx="1.5" />
        <rect x="47.4" y="61.5" width="3.0" height="15.5" rx="1.5" />
        <rect x="51.1" y="61" width="3.0" height="14" rx="1.5" />
        <rect x="54.8" y="60.5" width="3.0" height="12" rx="1.5" />
        <rect x="58.5" y="59.5" width="3.0" height="10" rx="1.5" />

        {/* MIDDLE DIAGONAL SPINE OF S */}
        <rect x="31" y="36.5" width="3.0" height="6.5" rx="1.5" />
        <rect x="34.7" y="33" width="3.0" height="13.5" rx="1.5" />
        <rect x="38.4" y="30" width="3.0" height="18.5" rx="1.5" />
        <rect x="42.1" y="28" width="3.0" height="10" rx="1.5" />
        <rect x="42.1" y="42" width="3.0" height="9" rx="1.5" />
        <rect x="45.8" y="27" width="3.0" height="10.5" rx="1.5" />
        <rect x="45.8" y="44.5" width="3.0" height="8.5" rx="1.5" />
        <rect x="49.5" y="26.5" width="3.0" height="11.5" rx="1.5" />
        <rect x="49.5" y="47.5" width="3.0" height="7.5" rx="1.5" />
        <rect x="53.2" y="25.5" width="3.0" height="13" rx="1.5" />
        <rect x="53.2" y="49" width="3.0" height="8" rx="1.5" />
        <rect x="56.9" y="25" width="3.0" height="14" rx="1.5" />
        <rect x="56.9" y="49.5" width="3.0" height="11" rx="1.5" />
        <rect x="60.6" y="25.5" width="3.0" height="14.5" rx="1.5" />
        <rect x="60.6" y="49.5" width="3.0" height="17.5" rx="1.5" />
        <rect x="64.3" y="52" width="3.0" height="13" rx="1.5" />
        <rect x="68" y="54.5" width="3.0" height="7.5" rx="1.5" />

        {/* TOP-RIGHT ARCH & RIGHTWARD TIP */}
        <rect x="64.3" y="27" width="3.0" height="13" rx="1.5" />
        <rect x="68" y="29.5" width="3.0" height="11" rx="1.5" />
        <rect x="71.7" y="32" width="3.0" height="9" rx="1.5" />
        <rect x="75.4" y="34.5" width="3.0" height="5.5" rx="1.5" />
        <rect x="78.5" y="36.5" width="3.0" height="2.8" rx="1.5" />
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
        "flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent/40 group transition-all",
        className,
      )}
    >
      <div className="relative shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-95 shadow-[0_4px_16px_rgb(255_42_61/0.3)] rounded-[10px]">
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
