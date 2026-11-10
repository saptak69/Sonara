import { Link } from "@tanstack/react-router";
import { Compass, Download, Heart, History, ListMusic, Radio, type LucideIcon } from "lucide-react";

const PILL =
  "tv-card inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-surface-2 px-4 text-[14px] font-medium text-fg ring-1 ring-white/[0.07] transition-colors hover:bg-surface-3 active:scale-[0.97] tvd:h-14 tvd:gap-3 tvd:px-6 tvd:text-xl";

function Label({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <>
      <Icon className="size-4 text-accent tvd:size-6" />
      {children}
    </>
  );
}

/** Shortcuts into the library and discovery. A single row that scrolls on a phone and wraps beyond it. */
export function Pills() {
  return (
    <nav
      aria-label="Shortcuts"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 short:-mx-6 short:flex-nowrap short:overflow-x-auto short:px-6 [&::-webkit-scrollbar]:hidden"
    >
      <Link to="/library" search={{ tab: "favorites" }} className={PILL}>
        <Label icon={Heart}>Liked songs</Label>
      </Link>
      <Link to="/library" search={{ tab: "recents" }} className={PILL}>
        <Label icon={History}>Recents</Label>
      </Link>
      <Link to="/library" search={{ tab: "downloads" }} className={PILL}>
        <Label icon={Download}>Downloads</Label>
      </Link>
      <Link to="/playlists" className={PILL}>
        <Label icon={ListMusic}>Playlists</Label>
      </Link>
      <Link to="/radio" className={PILL}>
        <Label icon={Radio}>Live radio</Label>
      </Link>
      <Link to="/explore" className={PILL}>
        <Label icon={Compass}>Explore</Label>
      </Link>
    </nav>
  );
}
