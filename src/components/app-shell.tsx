import { Compass, Disc, Home, Library, LogOut, Plus, Radio, Search, User, X } from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { Logo } from "@/components/logo";
import { PlayerEngine } from "@/components/player/engine";
import { PlayerBar } from "@/components/player/bar";
import { FullPlayer } from "@/components/player/full";
import { QueuePanel } from "@/components/player/queue";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { Toaster, toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { signOut } from "@/lib/auth/client";
import { Cover } from "@/components/cover";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/studio", label: "Studio", icon: Disc },
  { to: "/radio", label: "Radio", icon: Radio },
  { to: "/library", label: "Library", icon: Library },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useCurrentUserState();
  const hasTrack = usePlayer((s) => Boolean(s.queue[s.index]));
  const rawPlaylists = usePlayer((s) => s.playlists);
  const playlists = useMemo(() => rawPlaylists.filter((p) => p.id !== "likes"), [rawPlaylists]);
  const createPlaylist = usePlayer((s) => s.createPlaylist);
  const rememberSearch = usePlayer((s) => s.rememberSearch);
  const [q, setQ] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    rememberSearch(query);
    void navigate({ to: "/search", search: { q: query } });
  };

  return (
    <div className="min-h-dvh bg-transparent text-fg relative isolate selection:bg-accent/40 selection:text-white">
      {/* Background cinematic glowing flower video */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
        aria-hidden="true"
      >
        <video
          className="absolute inset-0 h-full w-full object-cover object-center opacity-90 scale-100 filter brightness-105 contrast-110 saturate-135"
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_064556_051587f1-74a1-4336-8c05-4dde3594ed05.mp4"
            type="video/mp4"
          />
        </video>
        {/* Soft cinematic dark glass vignette: vibrant center, smooth edges */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/75" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/15 to-black/60" />
      </div>

      <PlayerEngine />
      <Toaster
        theme="dark"
        position="bottom-center"
        offset={hasTrack ? 88 : 24}
        toastOptions={{
          className: "bg-black/80 backdrop-blur-2xl text-fg border-white/15 shadow-2xl",
        }}
      />

      <aside className="fixed top-0 left-0 z-20 hidden h-dvh w-sidebar flex-col bg-black/40 backdrop-blur-3xl border-r border-white/10 px-4 pt-5 pb-player md:flex">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-4 rounded-xl px-3.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-white/15 text-fg shadow-sm border border-white/20 backdrop-blur-md"
                    : "text-muted hover:bg-white/10 hover:text-fg",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6">
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 rounded-xl px-3.5 text-muted hover:text-fg hover:bg-white/10"
              >
                <span className="grid size-6 place-items-center rounded-md bg-white/10 border border-white/15">
                  <Plus className="size-4" />
                </span>
                New playlist
              </Button>
            </DialogTrigger>
            <DialogContent title="New playlist">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const id = createPlaylist(name);
                  setName("");
                  setOpenCreate(false);
                  void navigate({ to: "/library" });
                  void id;
                }}
              >
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Playlist name"
                  className="h-11 w-full rounded-xl bg-black/60 px-3.5 text-sm outline-none ring-accent/50 focus:ring-2 border border-white/20"
                />
                <Button variant="solid" className="w-full rounded-xl" type="submit">
                  Create
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto [scrollbar-width:none]">
          {playlists.map((p) => (
            <Link
              key={p.id}
              to="/library"
              className="block truncate rounded-lg px-3 py-2 text-sm text-muted hover:text-fg hover:bg-white/10 transition-colors"
            >
              {p.name}
            </Link>
          ))}
        </div>

        {/* User Profile / Auth Block */}
        <div className="mt-auto pt-4 border-t border-white/10">
          {user && !user.isDevFallback ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/5 border border-white/10">
              <Link to="/studio" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity">
                <Cover
                  src={user.profileImageUrl}
                  alt={user.displayName || "User"}
                  title={user.displayName || "User"}
                  rounded="full"
                  className="size-8 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-fg truncate">{user.displayName || "Artist"}</p>
                  <p className="text-[10px] text-muted truncate">Artist Studio</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => {
                  void signOut().then(() => toast.success("Signed out"));
                }}
                className="p-1.5 text-muted hover:text-red-400 transition-colors rounded-lg hover:bg-white/10"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent font-medium text-xs border border-accent/30 transition-all shadow-sm"
            >
              <User className="size-3.5" />
              Sign In / Artist Join
            </Link>
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex flex-col justify-center bg-black/45 backdrop-blur-3xl border-b border-white/10 px-4 md:px-8 transition-all md:ml-sidebar pt-[env(safe-area-inset-top,0px)] shadow-lg">
        <div className="flex h-16 md:h-18 items-center justify-between gap-3 sm:gap-6 w-full">
          {/* Mobile view: Either Logo + User Avatar + Search Icon, or Full Expanded Search Input */}
          {mobileSearchOpen ? (
            <div className="flex items-center gap-2 w-full animate-in fade-in duration-150 md:hidden">
              <form
                onSubmit={(e) => {
                  onSearch(e);
                  setMobileSearchOpen(false);
                }}
                className="relative flex-1"
              >
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search songs, artists, radio..."
                  className="h-10 w-full rounded-full bg-black/80 pr-9 pl-10 text-xs text-fg outline-none ring-accent/50 focus:ring-2 border border-white/20 backdrop-blur-2xl shadow-inner"
                />
                {q ? (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-fg"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </form>
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-fg active:scale-95 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full md:hidden">
              <Logo compact={false} />
              <div className="flex items-center gap-2">
                {user && !user.isDevFallback ? (
                  <Link
                    to="/studio"
                    className="grid size-9 place-items-center rounded-full overflow-hidden border border-white/20 bg-white/10"
                    title="Artist Studio"
                  >
                    <Cover
                      src={user.profileImageUrl}
                      alt={user.displayName || "User"}
                      title={user.displayName || "User"}
                      rounded="full"
                      className="size-9"
                    />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-full bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 text-[11px] font-semibold transition-all"
                  >
                    Sign In
                  </Link>
                )}
                <button
                  type="button"
                  aria-label="Open search"
                  onClick={() => setMobileSearchOpen(true)}
                  className="grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-fg border border-white/15 backdrop-blur-xl transition-all shadow-sm"
                >
                  <Search className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* Desktop Search bar & User Profile */}
          <div className="hidden md:flex items-center justify-between gap-4 flex-1">
            <form onSubmit={onSearch} className="relative flex-1 max-w-xl">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted/70 transition-colors" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search songs, artists, radio..."
                className="h-11 w-full rounded-full bg-white/10 hover:bg-white/15 focus:bg-black/80 pr-4 pl-10 text-sm text-fg outline-none ring-accent/50 placeholder:text-white/45 focus:ring-2 border border-white/15 backdrop-blur-2xl transition-all shadow-inner"
              />
            </form>

            <div className="flex items-center gap-3">
              {user && !user.isDevFallback ? (
                <Link
                  to="/studio"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-fg border border-white/15 backdrop-blur-xl transition-all"
                >
                  <Cover
                    src={user.profileImageUrl}
                    alt={user.displayName || "User"}
                    title={user.displayName || "User"}
                    rounded="full"
                    className="size-6"
                  />
                  <span className="max-w-28 truncate">{user.displayName || "Studio"}</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent hover:bg-accent/90 text-white text-xs font-semibold shadow-md shadow-accent/20 transition-all"
                >
                  <User className="size-3.5" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "md:ml-sidebar transition-all",
          hasTrack
            ? "pb-[calc(var(--spacing-player)+var(--spacing-nav)+1rem)] md:pb-player"
            : "pb-[calc(var(--spacing-nav)+1rem)] md:pb-8",
        )}
      >
        {children}
      </main>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30",
          hasTrack ? "" : "md:hidden",
        )}
      >
        <PlayerBar />
        <nav className="flex h-nav items-center justify-around border-t border-white/10 bg-black/60 backdrop-blur-3xl pb-[env(safe-area-inset-bottom)] md:hidden">
          {NAV.map((item) => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-w-16 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-all active:scale-95",
                  active ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full transition-colors",
                    active && "bg-white/15 text-accent border border-white/20 backdrop-blur-md",
                  )}
                >
                  <Icon className="size-4.5" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className={cn(active ? "font-semibold text-fg" : "text-subtle")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <FullPlayer />
      <QueuePanel />
    </div>
  );
}
