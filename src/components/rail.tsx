import { ChevronLeft, ChevronRight, ChevronRight as Arrow } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type RailLink = "/explore" | "/playlists" | "/radio" | "/library";

export function SectionHeader({ title, subtitle, to }: { title: string; subtitle?: string; to?: RailLink }) {
  const heading = (
    <div className="min-w-0">
      <h2 className="flex items-center gap-1 text-xl font-semibold tracking-tight text-fg sm:text-[22px]">
        <span className="truncate">{title}</span>
        {to && <Arrow className="size-5 shrink-0 text-subtle transition-colors group-hover:text-accent" />}
      </h2>
      {subtitle && <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>}
    </div>
  );
  if (!to) return heading;
  return (
    <Link to={to} className="group min-w-0 rounded-lg">
      {heading}
    </Link>
  );
}

/**
 * A titled, horizontally scrolling shelf of cards.
 * Shows placeholders while `loading`, and renders nothing when it has no cards.
 */
export function Rail({
  title,
  subtitle,
  to,
  loading = false,
  placeholder = "square",
  children,
}: {
  title: string;
  subtitle?: string;
  to?: RailLink;
  loading?: boolean;
  placeholder?: "square" | "large" | "round";
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const count = Children.toArray(children).length;

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [measure, count]);

  if (!loading && count === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrowClass =
    "grid size-8 place-items-center rounded-full border border-border text-muted transition hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-30";

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <SectionHeader title={title} subtitle={subtitle} to={to} />
        <div className="hover-only hidden shrink-0 items-center gap-1.5 desk:flex">
          <button type="button" className={arrowClass} disabled={edges.start} onClick={() => scrollBy(-1)} aria-label={`Scroll ${title} back`} data-tv-skip>
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" className={arrowClass} disabled={edges.end} onClick={() => scrollBy(1)} aria-label={`Scroll ${title} forward`} data-tv-skip>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className={cn(
          "shelf",
          !edges.end && "[mask-image:linear-gradient(to_right,black_calc(100%-56px),transparent)]",
        )}
      >
        {loading && count === 0 ? <Placeholders shape={placeholder} /> : children}
      </div>
    </section>
  );
}

function Placeholders({ shape }: { shape: "square" | "large" | "round" }) {
  const width = shape === "large" ? "w-[210px] sm:w-[230px]" : shape === "round" ? "w-32 sm:w-36" : "w-36 sm:w-44";
  return (
    <>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={cn("shrink-0", width)} aria-hidden>
          <div className={cn("skeleton aspect-square w-full", shape === "round" ? "rounded-full" : "rounded-xl")} />
          <div className="skeleton mt-3 h-3 w-3/4 rounded" />
          <div className="skeleton mt-2 h-3 w-1/2 rounded" />
        </div>
      ))}
    </>
  );
}
