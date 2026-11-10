import type { CSSProperties } from "react";
import { Radio, type LucideIcon } from "lucide-react";
import { Cover } from "@/components/cover";
import { artworkAt } from "@/lib/artwork";
import type { Track } from "@/lib/types";

/** Covers for the big Top Picks cards. Each fills its (square) parent. */

/** A song's own artwork. */
export function TrackCover({ track, priority = false }: { track: Track; priority?: boolean }) {
  return (
    <Cover
      src={track.artworkLg || track.artwork}
      alt=""
      title={track.title}
      px={640}
      priority={priority}
      className="absolute inset-0 size-full !rounded-none"
    />
  );
}

const SHADE = (hue: number): CSSProperties => ({ "--hue": hue }) as CSSProperties;

const SCRIM =
  "absolute inset-0 bg-[linear-gradient(to_top,hsl(var(--hue)_70%_9%/0.94)_0%,hsl(var(--hue)_70%_14%/0.5)_42%,transparent_72%)]";

/** A song's artwork with its name set on it, for radio stations. */
export function RadioCover({ track, name }: { track: Track; name: string }) {
  return (
    <span className="absolute inset-0 block" style={SHADE(14)}>
      <TrackCover track={track} />
      <span className={SCRIM} />
      <span className="absolute inset-x-0 bottom-0 p-4 tvd:p-6">
        <Radio className="mb-2 size-5 text-white/90 tvd:size-8" />
        <span className="line-clamp-2 block text-[26px] leading-[1.05] font-bold tracking-tight text-white tvd:text-4xl">{name}</span>
      </span>
    </span>
  );
}

/**
 * Four covers in a grid under a colour wash, with the mix's name on top: made from the
 * listener's own music. With fewer than four covers it falls back to a glowing ring pattern.
 */
export function CollageCover({
  tracks,
  hue,
  title,
  icon: Icon,
}: {
  tracks: Track[];
  hue: number;
  title: string;
  icon: LucideIcon;
}) {
  const covers = uniqueCovers(tracks).slice(0, 4);
  return (
    <span className="mix-art absolute inset-0 block" style={SHADE(hue)}>
      {covers.length === 4 ? (
        <span className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {covers.map((src) => (
            <img key={src} src={artworkAt(src, 220)} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
          ))}
        </span>
      ) : null}
      <span className={SCRIM} />
      <span className="absolute inset-x-0 bottom-0 p-4 tvd:p-6">
        <Icon className="mb-2 size-5 text-white/90 tvd:size-8" />
        <span className="block text-[28px] leading-[1.05] font-bold tracking-tight text-white tvd:text-4xl">{title}</span>
      </span>
    </span>
  );
}

function uniqueCovers(tracks: Track[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const track of tracks) {
    const src = track.artwork || track.artworkLg;
    if (!src || seen.has(src)) continue;
    seen.add(src);
    out.push(src);
  }
  return out;
}
