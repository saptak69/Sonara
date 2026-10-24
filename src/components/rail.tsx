import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useRef, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type RailTo = "/explore" | "/radio" | "/library";

export function SectionHeader({
  title,
  to,
}: {
  title: string;
  to?: RailTo;
}) {
  if (!title) return null;
  const heading = (
    <h2 className="text-xl sm:text-[22px] font-semibold text-[#F4EFEA] tracking-normal flex items-center gap-1.5 group select-none">
      <span className={cn(to && "group-hover:text-[#FF5B2E] transition-colors")}>{title}</span>
      {to && (
        <svg className="size-4 text-[#7A726C] group-hover:text-[#FF5B2E] transition-colors mt-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      )}
    </h2>
  );
  if (!to) return heading;
  return (
    <Link to={to} className="transition-colors w-fit">
      {heading}
    </Link>
  );
}

export function Rail({
  title,
  to,
  children,
}: {
  title: string;
  to?: RailTo;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 420, behavior: "smooth" });
  };

  return (
    <section className="space-y-4">
      {/* Header and Controls sharing the exact content left edge */}
      <div className="flex items-center justify-between gap-3 px-0">
        <SectionHeader title={title} to={to} />
        
        {/* 32px Ghost Circular Button Pair */}
        <div className="hidden items-center gap-1.5 md:flex select-none">
          <button
            type="button"
            disabled={!canScrollLeft}
            aria-label="Previous"
            onClick={() => scroll(-1)}
            className="size-8 rounded-full flex items-center justify-center border border-white/[0.08] text-[#A9A19B] hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
          >
            <ChevronLeft className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            disabled={!canScrollRight}
            aria-label="Next"
            onClick={() => scroll(1)}
            className="size-8 rounded-full flex items-center justify-center border border-white/[0.08] text-[#A9A19B] hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
          >
            <ChevronRight className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Rail with Right-edge Fade Mask */}
      <div 
        ref={ref} 
        className="flex gap-4 overflow-x-auto [scrollbar-width:none] snap-x snap-mandatory scroll-smooth pb-1 -mr-4 pr-4 sm:mr-0 sm:pr-0 [mask-image:linear-gradient(to_right,black_calc(100%-48px),transparent_100%)]"
      >
        {children}
      </div>
    </section>
  );
}
