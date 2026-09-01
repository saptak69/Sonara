import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

type RailTo = "/explore" | "/radio" | "/library";

export function SectionHeader({
  title,
  to,
}: {
  title: string;
  to?: RailTo;
}) {
  const heading = <h2 className="text-xl font-semibold tracking-tight">{title}</h2>;
  if (!to) return heading;
  return (
    <Link to={to} className="hover:underline">
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
  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 420, behavior: "smooth" });
  };

  return (
    <section className="space-y-3">
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
