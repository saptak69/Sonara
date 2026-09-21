import { Compass, Disc, Home, Info, Library, LogOut, Plus, Radio, Search, User, X, Heart, Menu, Repeat, Shuffle, SkipBack, SkipForward, Play, Pause, MonitorSpeaker, Mic2, Volume2, ListMusic } from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { SearchSuggestions } from "@/components/search-suggestions";
import { requestNotificationPermissions, scheduleWeeklyMix, scheduleRetentionNudge, cancelRetentionNudges } from "@/lib/notifications";
import { App as CapacitorApp } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { UpdatePrompt } from "@/components/update-prompt";

const SIDEBAR_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/library", label: "Your Library", icon: Library },
] as const;

const SIDEBAR_DISCOVER = [
  { to: "/explore", label: "Discover", icon: Compass },
  { to: "/radio", label: "Radio", icon: Radio },
  { to: "/library", search: { tab: "favorites" }, label: "Favorites", icon: Heart },
] as const;

const MOBILE_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Library },
  { to: "/you", label: "You", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search as Record<string, string> });
  const navigate = useNavigate();
  const { user } = useCurrentUserState();
  const hasTrack = usePlayer((s) => Boolean(s.queue[s.index]));
  const current = usePlayer((s) => s.current());
  const isPlaying = usePlayer((s) => s.isPlaying);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const progress = usePlayer((s) => s.currentTime);
  const duration = usePlayer((s) => s.duration);
  const seek = usePlayer((s) => s.seekTo);
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  
  const rawPlaylists = usePlayer((s) => s.playlists);
  const playlists = useMemo(() => rawPlaylists.filter((p) => p.id !== "likes"), [rawPlaylists]);
  const createPlaylist = usePlayer((s) => s.createPlaylist);
  const rememberSearch = usePlayer((s) => s.rememberSearch);
  
  const [q, setQ] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSuggestionsOpen, setDesktopSuggestionsOpen] = useState(false);
  const [mobileSuggestionsOpen, setMobileSuggestionsOpen] = useState(false);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Setup Notifications
    requestNotificationPermissions().then(() => {
      scheduleWeeklyMix();
    });

    const appStateSub = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        cancelRetentionNudges();
      } else {
        const lastTrack = usePlayer.getState().current();
        if (lastTrack) {
          scheduleRetentionNudge(lastTrack.title);
        }
      }
    });

    const notifSub = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const type = action.notification.extra?.action;
      if (type === 'WEEKLY_MIX') {
        void navigate({ to: '/weekly-mix' });
      }
    });

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const isSlash = e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement);

      if (isCmdK || isSlash) {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          desktopSearchInputRef.current?.focus();
          desktopSearchInputRef.current?.select();
          setDesktopSuggestionsOpen(true);
        } else {
          setMobileSearchOpen(true);
          setTimeout(() => {
            mobileSearchInputRef.current?.focus();
          }, 60);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      appStateSub.then(s => s.remove());
      notifSub.then(s => s.remove());
    };
  }, [navigate]);

  const executeSearch = (queryStr: string) => {
    const query = queryStr.trim();
    if (!query) return;
    setQ(query);
    rememberSearch(query);
    setDesktopSuggestionsOpen(false);
    setMobileSuggestionsOpen(false);
    setMobileSearchOpen(false);
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    void navigate({ to: "/search", search: { q: query } });
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    executeSearch(q);
  };

  const upNext = queue.slice(index + 1, index + 5);

  return (
    <div className="ambient-bg min-h-dvh text-fg relative isolate selection:bg-accent/30 selection:text-fg font-sans">
      <UpdatePrompt />
      <PlayerEngine />
      <Toaster
        theme="dark"
        position="bottom-center"
        offset={hasTrack ? 88 : 24}
        toastOptions={{
          className: "bg-surface text-fg border border-border font-sans text-xs shadow-2xl rounded-xl",
        }}
      />

      {/* Left Sidebar */}
      <aside className="fixed top-0 left-0 z-20 hidden h-[100dvh] w-sidebar flex-col bg-surface/40 backdrop-blur-3xl border-r border-white/5 px-6 py-6 md:flex shadow-2xl">
        <Logo compact={false} />
        
        <nav className="mt-10 flex flex-col gap-2">
          {SIDEBAR_NAV.map((item) => {
            const active = item.to === "/" ? path === "/" : (path.startsWith(item.to) && search.tab !== "favorites");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (item.to === "/") {
                    const main = document.getElementById("main-scroll-area");
                    if (main) main.scrollTo({ top: 0, behavior: "instant" });
                    window.scrollTo({ top: 0, behavior: "instant" });
                  }
                }}
                className={cn(
                  "flex h-10 items-center gap-4 rounded-lg px-3 text-sm font-medium transition-all duration-150 active:scale-[0.98]",
                  active ? "text-accent bg-accent/10" : "text-muted hover:text-fg hover:bg-hover",
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-border/50 pt-6">
          <nav className="flex flex-col gap-2">
            {SIDEBAR_DISCOVER.map((item) => {
              const active = item.to === "/library" 
                ? path.startsWith(item.to) && search.tab === "favorites"
                : path.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  search={"search" in item ? item.search : undefined}
                  className={cn(
                    "flex h-10 items-center gap-4 rounded-lg px-3 text-sm font-medium transition-all duration-150 active:scale-[0.98]",
                    active ? "text-accent bg-accent/10" : "text-muted hover:text-fg hover:bg-hover",
                  )}
                >
                  <Icon className="size-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 border-t border-border/50 pt-6 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Playlists</h3>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <button className="text-muted hover:text-fg transition-colors">
                  <Plus className="size-4" />
                </button>
              </DialogTrigger>
              <DialogContent title="New playlist">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    createPlaylist(name);
                    setName("");
                    setOpenCreate(false);
                    void navigate({ to: "/library" });
                  }}
                >
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Playlist name"
                    className="h-12 w-full rounded-xl bg-surface px-4 text-sm text-fg outline-none ring-accent/40 focus:ring-2 border border-border"
                  />
                  <Button variant="solid" className="w-full rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 h-12" type="submit">
                    Create
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] px-1 space-y-1">
            {playlists.map((p) => (
              <Link
                key={p.id}
                to="/library"
                className="block truncate rounded-lg px-2 py-2 text-sm text-muted hover:text-fg hover:bg-hover transition-colors"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        id="main-scroll-area"
        className={cn(
          "transition-all min-w-0 relative h-[100dvh] overflow-y-auto overflow-x-hidden bg-surface/30 backdrop-blur-xl shadow-2xl",
          "md:ml-sidebar",
          hasTrack ? "pb-[calc(var(--spacing-player)+var(--spacing-nav)+1rem)] md:pb-[calc(var(--spacing-player)+4rem)]" : "pb-[calc(var(--spacing-nav)+1rem)] md:pb-8",
        )}
      >
        <header className="sticky top-0 z-20 flex items-center h-[calc(4rem+env(safe-area-inset-top,0px))] md:h-[calc(5rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] px-4 md:px-8 transition-all bg-surface/40 backdrop-blur-2xl border-b border-white/5">
          <div className="flex items-center justify-between gap-4 w-full max-w-7xl mx-auto">
            {mobileSearchOpen ? (
              <div className="flex items-center gap-2 w-full animate-in fade-in duration-150 md:hidden">
                <form onSubmit={onSearch} className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
                  <input
                    ref={mobileSearchInputRef}
                    autoFocus
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setMobileSuggestionsOpen(true);
                    }}
                    onFocus={() => setMobileSuggestionsOpen(true)}
                    placeholder="Search for songs, artists..."
                    className="h-11 w-full rounded-full bg-surface pr-10 pl-11 text-sm text-fg placeholder:text-muted outline-none border border-border focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
                  />
                  {q && (
                    <button type="button" onClick={() => { setQ(""); setMobileSuggestionsOpen(false); }} className="absolute top-1/2 right-4 -translate-y-1/2 text-muted hover:text-fg">
                      <X className="size-4" />
                    </button>
                  )}
                  <SearchSuggestions query={q} isOpen={mobileSuggestionsOpen} onClose={() => setMobileSuggestionsOpen(false)} onSelectQuery={executeSearch} />
                </form>
                <button type="button" onClick={() => { setMobileSearchOpen(false); setMobileSuggestionsOpen(false); }} className="text-sm font-medium text-muted hover:text-fg px-2">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full md:hidden">
                <Logo compact={false} />
                <div className="flex items-center gap-3">
                  <Link to="/about" className="text-muted hover:text-fg p-2">
                    <Info className="size-5" />
                  </Link>
                  {user && !user.isDevFallback ? (
                    <Link to="/studio">
                      <Cover src={user.profileImageUrl} alt="User" rounded="full" className="size-8" />
                    </Link>
                  ) : (
                    <Link to="/login" className="text-sm font-medium text-accent">Sign In</Link>
                  )}
                </div>
              </div>
            )}

            <div className="hidden md:flex items-center gap-6 flex-1">
              <form onSubmit={onSearch} className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
                <input
                  ref={desktopSearchInputRef}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setDesktopSuggestionsOpen(true);
                  }}
                  onFocus={() => setDesktopSuggestionsOpen(true)}
                  placeholder="Search for songs, artists, albums, or moods..."
                  className="h-11 w-full rounded-full bg-surface hover:bg-hover focus:bg-surface pr-14 pl-11 text-sm text-fg placeholder:text-muted outline-none border border-border focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                />
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center text-xs font-medium text-muted">
                  ⌘K
                </div>
                <SearchSuggestions query={q} isOpen={desktopSuggestionsOpen} onClose={() => setDesktopSuggestionsOpen(false)} onSelectQuery={executeSearch} />
              </form>

              <div className="ml-auto flex items-center gap-4">
                <Link to="/about" className="p-2 text-muted hover:text-fg transition-colors">
                  <Info className="size-5" />
                </Link>
                {user && !user.isDevFallback ? (
                  <Link to="/studio" className="flex items-center gap-3 pl-2 border-l border-border/50 hover:opacity-80 transition-opacity">
                    <Cover src={user.profileImageUrl} alt="User" rounded="full" className="size-8" />
                    <span className="text-sm font-medium">{user.displayName || "User"}</span>
                  </Link>
                ) : (
                  <Link to="/login" className="px-5 py-2 rounded-full bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation & Global Player Bar */}
      <div className={cn("fixed inset-x-0 bottom-0 z-30 pointer-events-none flex flex-col items-center gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] px-4 md:pl-sidebar", hasTrack ? "" : "md:hidden")}>
        <div className="pointer-events-auto w-full max-w-5xl">
          <PlayerBar />
        </div>
        <nav className="pointer-events-auto flex items-center justify-around bg-surface/60 backdrop-blur-3xl border border-white/10 rounded-full px-2 py-2 w-full max-w-md mx-auto shadow-pop md:hidden">
          {MOBILE_NAV.map((item) => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link 
                key={item.to} 
                to={item.to} 
                onClick={() => {
                  if (item.to === "/") {
                    const main = document.getElementById("main-scroll-area");
                    if (main) main.scrollTo({ top: 0, behavior: "instant" });
                    window.scrollTo({ top: 0, behavior: "instant" });
                  }
                }}
                className={cn("flex flex-1 flex-col items-center justify-center gap-1 transition-transform active:scale-90", active ? "text-accent" : "text-muted hover:text-fg")}
              >
                <div className={cn("p-1.5 rounded-full transition-colors", active ? "bg-accent/20 text-accent" : "")}>
                  <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
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

function MoreHorizontal(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
  );
}
