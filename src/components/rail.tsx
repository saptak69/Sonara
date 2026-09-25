import { ChevronLeft, ChevronRight, ChevronRightIcon } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

type RailTo = "/explore" | "/radio" | "/library";

export function SectionHeader({
  title,
  to,
}: {
  title: ReactNode;
  to?: string;
}) {
  const heading = <h2 className="text-xl md:text-[22px] font-bold text-fg tracking-tight flex items-center gap-1 cursor-pointer group w-fit">{title}</h2>;
  if (!to) return heading;
  return (
    <Link to={to} className="group">
      <h2 className="text-xl md:text-[22px] font-bold text-fg tracking-tight flex items-center gap-1 w-fit">
        <span className="group-hover:underline decoration-1 underline-offset-2">{title}</span>
        <ChevronRightIcon className="size-4 text-muted group-hover:text-fg transition-colors mt-0.5" strokeWidth={2.5} />
      </h2>
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
  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 420, behavior: "smooth" });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <SectionHeader title={title} to={to} />
        <div className="hidden items-center gap-1 md:flex">
          <Button variant="chip" size="iconSm" aria-label="Previous" onClick={() => scroll(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="chip" size="iconSm" aria-label="Next" onClick={() => scroll(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div ref={ref} className="rail -mx-4 px-4 sm:mx-0 sm:px-1">
        {children}
      </div>
    </section>
  );
}
