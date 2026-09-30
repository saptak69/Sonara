import { Compass, Disc, Home, Info, Library, LogOut, Plus, Radio, Search, User, X, Heart, Menu, Repeat, Shuffle, SkipBack, SkipForward, Play, Pause, MonitorSpeaker, Mic2, Volume2, ListMusic, LayoutGrid } from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "@/components/logo";
import { PlayerEngine } from "@/components/player/engine";
import { PlayerBar } from "@/components/player/bar";
import { FullPlayer } from "@/components/player/full";
import { QueuePanel } from "@/components/player/queue";
import { LyricsDrawer } from "@/components/player/lyrics";
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
import { motion } from "framer-motion";

const SIDEBAR_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Browse", icon: Compass },
  { to: "/radio", label: "Radio", icon: Radio },
] as const;

const SIDEBAR_LIBRARY = [
  { to: "/library", label: "Recently Added", icon: ListMusic },
  { to: "/library", search: { tab: "favorites" }, label: "Favorites", icon: Heart },
] as const;

// Custom Icons for Mobile Nav to match Apple Music exact look
const IconHome = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
    {active ? (
      <path d="M12 3L4 9v11h5v-6h6v6h5V9z" />
    ) : (
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    )}
  </svg>
);
const IconNew = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const IconRadio = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2.5" fill={active ? "currentColor" : "none"} />
    <path d="M16 8a5.5 5.5 0 0 1 0 8M19 5a9.5 9.5 0 0 1 0 14M8 8a5.5 5.5 0 0 0 0 8M5 5a9.5 9.5 0 0 0 0 14" />
  </svg>
);
const IconLibrary = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
    {active ? (
      <>
        <path d="M7 4h10v2H7z" />
        <path d="M5 8h14v2H5z" />
        <rect x="3" y="12" width="18" height="10" rx="2" />
        <path d="M9 18v-2h3v1a1 1 0 1 1-2 1v-2" fill="white" stroke="white" strokeWidth="0.5" />
      </>
    ) : (
      <>
        <path d="M8 4h8" />
        <path d="M6 8h12" />
        <rect x="4" y="12" width="16" height="10" rx="2" />
      </>
    )}
  </svg>
);
const IconSearch = ({ active }: { active?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 3 : 2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const MOBILE_NAV = [
  { to: "/", label: "Home", icon: IconHome },
  { to: "/explore", label: "New", icon: IconNew },
  { to: "/radio", label: "Radio", icon: IconRadio },
  { to: "/library", label: "Library", icon: IconLibrary },
  { to: "/search", label: "Search", icon: IconSearch },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search as Record<string, string> });
  const navigate = useNavigate();
  const { user } = useCurrentUserState();
  const hasTrack = usePlayer((s) => Boolean(s.queue[s.index]));
  const current = usePlayer((s) => s.queue[s.index]);
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
  const [isSearchingDesktop, setIsSearchingDesktop] = useState(false);
  const [mobileSuggestionsOpen, setMobileSuggestionsOpen] = useState(false);
  const [isSearchingMobile, setIsSearchingMobile] = useState(false);
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
    <div className="bg-transparent min-h-dvh w-full text-fg relative isolate selection:bg-accent/30 selection:text-fg font-sans">
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
      {/* Mobile Dynamic Full-Screen Background */}
      <div className="fixed inset-0 z-[-2] lg:hidden pointer-events-none overflow-hidden bg-background">
        {hasTrack && current?.artwork && (
          <motion.div
            key={current.artwork}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img
              src={current.artwork}
              alt=""
              className="w-full h-[120%] object-cover opacity-[0.85] saturate-[200%] blur-[100px] transform scale-125 origin-top"
            />
            {/* Overlay to ensure contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
          </motion.div>
        )}
      </div>

      {/* Left Sidebar */}
      <aside className="fixed top-0 left-0 z-20 hidden h-[100dvh] w-sidebar flex-col bg-bg/80 backdrop-blur-2xl border-r border-white/5 px-5 py-5 lg:flex">
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
                className="group relative isolate flex h-10 items-center gap-4 rounded-lg px-3 text-sm font-medium transition-all duration-150 active:scale-[0.98]"
              >
                {active && (
                  <motion.div
                    layoutId="desktop-nav-glow"
                    className="absolute inset-0 z-[-1] rounded-lg bg-white/5 border border-white/5"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={cn("size-5 shrink-0 transition-colors", active ? "text-accent" : "text-muted group-hover:text-fg")} strokeWidth={active ? 2.5 : 2} />
                <span className={cn("transition-colors", active ? "text-accent" : "text-muted group-hover:text-fg")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-2">
          <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted mb-2">Library</h3>
          <nav className="flex flex-col gap-2">
            {SIDEBAR_LIBRARY.map((item) => {
              const active = item.to === "/library" 
                ? path.startsWith(item.to) && search.tab === "favorites" && item.label === "Favorites"
                  || (path.startsWith(item.to) && (!search.tab || search.tab === "recent") && item.label === "Recently Added")
                : path.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  search={"search" in item ? item.search : undefined}
                  className="group relative isolate flex h-10 items-center gap-4 rounded-lg px-3 text-sm font-medium transition-all duration-150 active:scale-[0.98]"
                >
                  {active && (
                    <motion.div
                      layoutId="desktop-nav-glow"
                      className="absolute inset-0 z-[-1] rounded-lg bg-white/5 border border-white/5"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className={cn("size-5 shrink-0 transition-colors", active ? "text-accent" : "text-muted group-hover:text-fg")} strokeWidth={active ? 2.5 : 2} />
                  <span className={cn("transition-colors", active ? "text-accent" : "text-muted group-hover:text-fg")}>{item.label}</span>
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
          "transition-all min-w-0 relative h-[100dvh] overflow-y-auto overflow-x-hidden bg-transparent lg:bg-surface/30 lg:backdrop-blur-xl lg:shadow-2xl",
          "lg:ml-sidebar",
          hasTrack ? "pb-[calc(var(--spacing-player)+var(--spacing-nav)+max(env(safe-area-inset-bottom,0px),24px))] lg:pb-[calc(var(--spacing-player)+4rem)]" : "pb-[calc(var(--spacing-nav)+max(env(safe-area-inset-bottom,0px),24px))] lg:pb-8",
        )}
      >
        <header className="sticky top-0 z-20 flex items-center h-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:h-[calc(4rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] pl-[max(env(safe-area-inset-left,0px),16px)] pr-[max(env(safe-area-inset-right,0px),16px)] lg:px-8 transition-all bg-transparent lg:liquid-glass lg:border-b border-transparent">
          <div className="flex items-center justify-between gap-4 w-full max-w-7xl mx-auto">
            {mobileSearchOpen ? (
              <div className="flex items-center gap-2 w-full animate-in fade-in duration-150 lg:hidden">
                <form onSubmit={onSearch} className="relative z-50 flex-1">
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
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Search for songs, artists..."
                    className="h-11 w-full rounded-full bg-surface pr-10 pl-11 text-sm text-fg placeholder:text-muted outline-none border border-border focus:border-accent/50 focus:ring-1 focus:ring-accent/50 text-[16px]"
                  />
                  {q && (
                    <button type="button" onClick={() => { setQ(""); setMobileSuggestionsOpen(false); }} className="absolute top-1/2 right-4 -translate-y-1/2 text-muted hover:text-fg min-h-[44px] min-w-[44px] flex items-center justify-center">
                      {isSearchingMobile ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                    </button>
                  )}
                  <SearchSuggestions query={q} isOpen={mobileSuggestionsOpen} onClose={() => setMobileSuggestionsOpen(false)} onSelectQuery={executeSearch} onLoadingChange={setIsSearchingMobile} />
                </form>
                <button type="button" onClick={() => { setMobileSearchOpen(false); setMobileSuggestionsOpen(false); }} className="text-sm font-medium text-muted hover:text-fg min-h-[44px] px-2 flex items-center justify-center">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full lg:hidden pt-4 pb-2">
                <h1 className="text-[32px] leading-none font-bold tracking-tight text-fg">
                  {path === "/" ? "Listen Now" : 
                   path.startsWith("/explore") ? "Browse" : 
                   path.startsWith("/radio") ? "Radio" : 
                   path.startsWith("/library") ? "Library" : 
                   path.startsWith("/search") ? "Search" : "Sonara"}
                </h1>
                <div className="flex items-center gap-3">
                  {user && !user.isDevFallback ? (
                    <Link to="/studio" className="flex items-center justify-center min-h-[44px] min-w-[44px]">
                      <Cover src={user.profileImageUrl} alt="User" rounded="full" className="size-8 shadow-sm" />
                    </Link>
                  ) : (
                    <Link to="/login" className="flex items-center justify-center size-8 rounded-full bg-[#f42c4f] text-white shadow-sm hover:bg-[#d62646] transition-colors">
                      <User className="size-4" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="hidden lg:flex items-center gap-6 flex-1">
              <form onSubmit={onSearch} className="relative z-50 w-full max-w-md">
                <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
                <input
                  ref={desktopSearchInputRef}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setDesktopSuggestionsOpen(true);
                  }}
                  onFocus={() => setDesktopSuggestionsOpen(true)}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Search for songs, artists, albums, or moods..."
                  className="h-11 w-full rounded-full bg-surface hover:bg-hover focus:bg-surface pr-14 pl-11 text-sm text-fg placeholder:text-muted outline-none border border-border focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                />
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center text-xs font-medium text-muted">
                  {isSearchingDesktop ? <Loader2 className="size-4 animate-spin" /> : "⌘K"}
                </div>
                <SearchSuggestions query={q} isOpen={desktopSuggestionsOpen} onClose={() => setDesktopSuggestionsOpen(false)} onSelectQuery={executeSearch} onLoadingChange={setIsSearchingDesktop} />
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

        <div className="max-w-7xl mx-auto pb-32 lg:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation & Global Player Bar */}
      <div className={cn("fixed inset-x-0 bottom-0 z-50 pointer-events-none flex flex-col items-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] transition-transform duration-500 gap-2 lg:hidden")}>
        <div className="pointer-events-auto w-full max-w-[440px] flex flex-col items-center">
          <PlayerBar />
        </div>
        <div className="pointer-events-auto w-full max-w-[440px] rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-[40px] border border-white/60 dark:border-white/20 shadow-xl overflow-hidden relative">
          <nav className="relative isolate flex items-center justify-between px-2 h-[72px] w-full">
            {MOBILE_NAV.map((item) => {
               const active = item.to === "/" ? path === "/" : (path.startsWith(item.to) && search.tab !== "favorites");
               const Icon = item.icon;
               return (
                 <Link 
                   key={item.to} 
                   to={item.to} 
                   onPointerDown={() => {
                     try {
                       import("@capacitor/haptics").then(({ Haptics, ImpactStyle }) => {
                         Haptics.impact({ style: ImpactStyle.Light });
                       }).catch(() => {});
                     } catch(e) { /* ignore */ }
                   }}
                   onClick={() => {
                     if (item.to === "/") {
                       const main = document.getElementById("main-scroll-area");
                       if (main) main.scrollTo({ top: 0, behavior: "instant" });
                       window.scrollTo({ top: 0, behavior: "instant" });
                     }
                   }}
                   className="group relative isolate flex flex-1 flex-col items-center justify-center h-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.92]"
                 >
                   {active && (
                     <motion.div
                       layoutId="mobile-nav-active-bg"
                       className="absolute inset-y-1.5 inset-x-2 z-[-1] rounded-[24px] bg-black/10 dark:bg-white/10"
                       transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                     />
                   )}
                   <motion.div
                     animate={{ scale: active ? 1.05 : 1, y: active ? -2 : 0 }}
                     transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                     className={cn("transition-colors relative flex flex-col items-center gap-[4px]", active ? "text-[#e85a4f]" : "text-black/60 dark:text-white/60 group-hover:opacity-70")}
                   >
                     <div className="size-[26px] flex items-center justify-center">
                       <Icon active={active} />
                     </div>
                     <span className={cn("text-[10px] font-semibold leading-none tracking-tight", active ? "font-bold" : "")}>{item.label}</span>
                   </motion.div>
                 </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="hidden lg:block">
        <PlayerBar />
      </div>
      <FullPlayer />
      <QueuePanel />
      <LyricsDrawer />
    </div>
  );
}

function MoreHorizontal(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
  );
}
