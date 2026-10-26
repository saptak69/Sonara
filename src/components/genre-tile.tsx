import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { hashHue } from "@/lib/utils";

/** A photo tile tinted with a colour derived from the genre, linking to its page. */
export function GenreTile({ slug, label, hint, image }: { slug: string; label: string; hint: string; image?: string }) {
  const hue = hashHue(slug);
  return (
    <Link
      to="/genre/$slug"
      params={{ slug }}
      className="tv-card group relative isolate flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-white/[0.08] p-4 transition-transform duration-200 active:scale-[0.97] sm:aspect-[16/10]"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 32%), hsl(${(hue + 40) % 360} 65% 16%))` }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="absolute inset-0 -z-10 size-full object-cover opacity-90 transition-transform duration-500 ease-out lg:group-hover:scale-110"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 mix-blend-multiply" style={{ background: `hsl(${hue} 75% 45% / 0.75)` }} />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
      <ArrowUpRight className="absolute top-3 right-3 size-5 text-white/60 transition group-hover:text-white" />
      <span className="text-base leading-tight font-semibold tracking-tight text-white sm:text-lg">{label}</span>
      <span className="mt-0.5 line-clamp-1 text-xs text-white/70">{hint}</span>
    </Link>
  );
}
