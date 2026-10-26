import { Link, useRouterState } from "@tanstack/react-router";
import { ListMusic, Plus } from "lucide-react";
import { useMemo } from "react";
import { Logo } from "@/components/logo";
import { LIKED_PLAYLIST_ID, usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { CreatePlaylistDialog } from "./create-playlist-dialog";
import { LIBRARY_SHORTCUTS, PRIMARY_NAV, isNavActive } from "./nav";

const linkBase =
  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150";
const linkIdle = "text-muted hover:bg-hover hover:text-fg";
const linkActive = "bg-accent-soft text-fg";

/** Desktop / tablet sidebar. */
export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tab = useRouterState({ select: (s) => (s.location.search as { tab?: string }).tab });
  const allPlaylists = usePlayer((s) => s.playlists);
  const playlists = useMemo(() => allPlaylists.filter((p) => p.id !== LIKED_PLAYLIST_ID), [allPlaylists]);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-(--spacing-sidebar) flex-col border-r border-border bg-bg-sunken px-3 pt-5 pb-28 select-none desk:flex">
      <Logo variant="full" size={40} className="mb-6 px-3" />

      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {PRIMARY_NAV.filter((item) => item.to !== "/search" && item.to !== "/library").map((item) => {
          const active = isNavActive(pathname, item.to);
          return (
            <Link key={item.to} to={item.to} className={cn(linkBase, active ? linkActive : linkIdle)}>
              <item.icon className={cn("size-5", active && "text-accent")} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <SectionLabel>Your library</SectionLabel>
      <nav aria-label="Library" className="flex flex-col gap-0.5">
        {LIBRARY_SHORTCUTS.map((item) => {
          const active = pathname === "/library" && (tab ?? "recents") === item.tab;
          return (
            <Link
              key={item.tab}
              to="/library"
              search={{ tab: item.tab }}
              className={cn(linkBase, active ? linkActive : linkIdle)}
            >
              <item.icon className={cn("size-5", active && "text-accent")} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 mb-1.5 flex items-center justify-between px-3">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-subtle uppercase">Playlists</span>
        <CreatePlaylistDialog
          trigger={
            <button
              type="button"
              className="grid size-7 place-items-center rounded-lg text-subtle transition hover:bg-hover hover:text-fg"
              aria-label="New playlist"
            >
              <Plus className="size-4" />
            </button>
          }
        />
      </div>

      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {playlists.length === 0 ? (
          <p className="px-3 py-2 text-xs leading-relaxed text-subtle">
            Playlists you make show up here.
          </p>
        ) : (
          playlists.map((playlist) => {
            const active = pathname === `/playlist/${playlist.id}`;
            return (
              <Link
                key={playlist.id}
                to="/playlist/$id"
                params={{ id: playlist.id }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                  active ? "bg-accent-soft text-fg" : "text-muted hover:bg-hover hover:text-fg",
                )}
              >
                <ListMusic className="size-4 shrink-0 opacity-70" />
                <span className="truncate">{playlist.name}</span>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="mt-6 mb-1.5 px-3 text-[11px] font-semibold tracking-[0.12em] text-subtle uppercase">
      {children}
    </span>
  );
}
