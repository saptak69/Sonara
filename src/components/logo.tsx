import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
    >
      <span className="grid size-8 place-items-center rounded-md bg-accent text-accent-fg shadow-[0_6px_16px_rgb(255_42_61/0.28)]">
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M10 18.2a2.6 2.6 0 1 1-2.1-2.55V6.7c0-.5.34-.93.83-1.04l9-2.05A.85.85 0 0 1 19 4.45v9.2a2.6 2.6 0 1 1-2.1-2.55V7.15L10 8.75v9.45Z" />
        </svg>
      </span>
      <span
        className={cn(
          "text-xl font-bold tracking-tight text-fg",
          compact && "sr-only",
        )}
      >
        Sonara
      </span>
    </Link>
  );
}
