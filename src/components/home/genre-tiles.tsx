import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { SectionHeader } from "@/components/rail";
import { GENRES } from "@/lib/genres";

/** Warm hues only (reds through ambers), so the tiles stay in Sonara's palette. */
const HUES = [8, 22, 350, 34, 14, 2, 28, 358, 18, 40, 10, 26];

const SHOWN = 12;

/** Browse by genre. Colour comes from the palette, so nothing has to download. */
export function GenreTiles() {
  return (
    <section className="space-y-4">
      <SectionHeader title="Browse by Genre" to="/explore" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 desk:grid-cols-6 short:grid-cols-4 tvd:grid-cols-4 tvd:gap-5">
        {GENRES.slice(0, SHOWN).map((genre, i) => (
          <Link
            key={genre.slug}
            to="/genre/$slug"
            params={{ slug: genre.slug }}
            style={{ "--hue": HUES[i % HUES.length] } as CSSProperties}
            className="tv-card group relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-2xl bg-[linear-gradient(145deg,hsl(var(--hue)_78%_46%),hsl(var(--hue)_68%_20%))] p-3.5 transition-transform duration-200 active:scale-[0.97] tvd:p-6 lg:hover:scale-[1.02]"
          >
            <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_88%_10%,rgba(255,255,255,0.28),transparent_46%)]" />
            <span className="relative block text-[19px] leading-tight font-bold tracking-tight text-white tvd:text-3xl">{genre.label}</span>
            <span className="relative block truncate text-[12px] text-white/70 tvd:text-lg">{genre.hint}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
