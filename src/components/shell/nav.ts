import { Compass, Heart, History, Home, Library, ArrowDownToLine, Radio, Search, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/" | "/explore" | "/radio" | "/search" | "/library";
  label: string;
  icon: LucideIcon;
};

/** Tabs shown in the bottom bar (portrait) and the side rail (landscape / TV). */
export const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Browse", icon: Compass },
  { to: "/search", label: "Search", icon: Search },
  { to: "/radio", label: "Radio", icon: Radio },
  { to: "/library", label: "Library", icon: Library },
];

export type LibraryTab = "recents" | "favorites" | "playlists" | "downloads" | "radios";

export const LIBRARY_SHORTCUTS: Array<{ tab: LibraryTab; label: string; icon: LucideIcon }> = [
  { tab: "favorites", label: "Liked songs", icon: Heart },
  { tab: "recents", label: "Recently played", icon: History },
  { tab: "downloads", label: "Downloads", icon: ArrowDownToLine },
];

export function isNavActive(pathname: string, to: NavItem["to"]): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}
