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
        {/* Solid dark abyss container */}
        <radialGradient id={`bg-${safeId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-surface)" />
          <stop offset="100%" stopColor="var(--color-bg)" />
        </radialGradient>
      </defs>

      {/* Instrument Casing: Outer Squircle / Circle with Brass Rim */}
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="22"
        fill={`url(#bg-${safeId})`}
        stroke="var(--color-accent)"
        strokeWidth="1.5"
      />

      {/* Concentric Sonar Bathymetry Rings */}
      <circle cx="50" cy="50" r="36" stroke="#8f6a34" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="50" cy="50" r="26" stroke="var(--color-accent)" strokeWidth="1" opacity="0.7" />
      <circle cx="50" cy="50" r="16" stroke="#8f6a34" strokeWidth="0.75" strokeDasharray="2 2" opacity="0.6" />

      {/* Nautical Compass / Sounding Crosshairs */}
      <line x1="50" y1="10" x2="50" y2="90" stroke="var(--color-accent)" strokeWidth="0.75" opacity="0.4" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="var(--color-accent)" strokeWidth="0.75" opacity="0.4" />

      {/* Sounding Needle (Bearing Indicator) */}
      <polygon points="50,20 54,48 50,52 46,48" fill="var(--color-accent)" />
      <polygon points="50,80 53,52 50,48 47,52" fill="#8f6a34" opacity="0.8" />

      {/* Center Pivot & Verdigris Sounding Signal */}
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
      <div className={cn("relative shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-95", compact ? "w-12 h-12 overflow-hidden" : "")}>
        <img src="/sonara-logo.png" alt="Sonara" className={cn("object-contain drop-shadow-md", compact ? "h-full w-full object-left" : "h-14 md:h-20 w-auto max-w-[240px]")} />
      </div>
    </Link>
  );
}
