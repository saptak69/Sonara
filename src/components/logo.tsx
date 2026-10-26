import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Sonara has ONE logo: the "S" mark (public/brand/mark.webp, made from assets/icon.png).
 * It comes in two layouts. Never draw or recolour the logo anywhere else.
 *
 *   variant="mark"  The S on its own. Use it in square or tight spots (under ~160px wide):
 *                   phone header, compact side rail, footer, loading states, favicon, app icon.
 *
 *   variant="full"  The S plus the "sonara" wordmark. Use it where there is room for a
 *                   proper brand moment: desktop sidebar, login / sign-up, share card
 *                   (public/brand/og.png), Android TV banner, install page.
 *
 * Only one of the two is ever visible in the same place.
 */

export const LOGO_MARK_SRC = "/brand/mark.webp";

function scrollToTop() {
  document.getElementById("main-scroll-area")?.scrollTo({ top: 0, behavior: "instant" });
  window.scrollTo({ top: 0, behavior: "instant" });
}

/** The S mark. Prefer <Logo> unless you need a non-clickable mark. */
export function SonaraMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src={LOGO_MARK_SRC}
      alt=""
      width={size}
      height={size}
      draggable={false}
      decoding="async"
      className={cn("shrink-0 select-none object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Logo({
  variant = "full",
  size,
  className,
  asLink = true,
}: {
  variant?: "mark" | "full";
  /** Height of the mark in px. Defaults: 36 (mark) / 40 (full). The wordmark scales with it. */
  size?: number;
  className?: string;
  /** Set false to render a plain (non-clickable) logo, e.g. inside another link. */
  asLink?: boolean;
}) {
  const markSize = size ?? (variant === "full" ? 40 : 36);

  const content = (
    <motion.span
      className="inline-flex items-center gap-2"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <SonaraMark size={markSize} />
      {variant === "full" && (
        <span
          aria-hidden
          className="font-display font-bold leading-none tracking-tight text-[#ffeee0]"
          style={{ fontSize: Math.round(markSize * 0.62) }}
        >
          sonara
        </span>
      )}
    </motion.span>
  );

  const base = cn(
    "inline-flex items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent",
    className,
  );

  if (!asLink) return <span className={base}>{content}</span>;

  return (
    <Link to="/" onClick={scrollToTop} aria-label="Sonara home" className={base}>
      {content}
    </Link>
  );
}
