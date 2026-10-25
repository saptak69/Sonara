import { 
  Compass, 
  Home, 
  Info, 
  LogOut, 
  Plus, 
  Radio, 
  Search, 
  User, 
  X, 
  Heart, 
  Clock, 
  Library, 
  ArrowDownCircle,
  Command
} from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/logo";
import { PlayerEngine } from "@/components/player/engine";
import { PlayerBar } from "@/components/player/bar";
import { FullPlayer } from "@/components/player/full";
import { QueuePanel } from "@/components/player/queue";
import { LyricsDrawer } from "@/components/player/lyrics";
import { EqualizerModal } from "@/components/player/equalizer-modal";
import { PlaylistImportModal } from "@/components/playlist-import-modal";
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
import { MahalayaPrompt } from "@/components/mahalaya-prompt";
import { motion } from "framer-motion";

const SIDEBAR_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Browse", icon: Compass },
  { to: "/radio", label: "Radio", icon: Radio },
] as const;

const SIDEBAR_LIBRARY = [
  { to: "/library", label: "Recently Added", icon: Clock },
  { to: "/library", search: { tab: "favorites" }, label: "Favorites", icon: Heart },
  { to: "/library", search: { tab: "downloads" }, label: "Offline Downloads", icon: ArrowDownCircle },
] as const;

const MOBILE_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Browse", icon: Compass },
  { to: "/radio", label: "Radio", icon: Radio },
  { to: "/library", label: "Library", icon: Library },
  { to: "/search", label: "Search", icon: Search },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search as Record<string, string> });
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
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSuggestionsOpen, setDesktopSuggestionsOpen] = useState(false);
  const [isSearchingDesktop, setIsSearchingDesktop] = useState(false);
  const [mobileSuggestionsOpen, setMobileSuggestionsOpen] = useState(false);
  const [isSearchingMobile, setIsSearchingMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (window.innerWidth >= 1024) {
          desktopSearchInputRef.current?.focus();
        } else {
          setMobileSearchOpen(true);
          setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Track main area scroll for header surface styling
  useEffect(() => {
    const mainEl = document.getElementById("main-scroll-area");
    if (!mainEl) return;
    const handleScroll = () => {
      setIsScrolled(mainEl.scrollTop > 10);
    };
    mainEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Android Native Hardware / Gesture Back Navigation
  useEffect(() => {
    if (typeof window === "undefined") return;

    let backPressCount = 0;
    let backPressTimer: ReturnType<typeof setTimeout> | null = null;
    let handle: { remove: () => Promise<void> } | null = null;

    void CapacitorApp.addListener("backButton", () => {
      // 1. Modals & Search Overlays
      if (mobileSearchOpen) {
        setMobileSearchOpen(false);
        return;
      }
      if (openCreate) {
        setOpenCreate(false);
        return;
      }
      if (importModalOpen) {
        setImportModalOpen(false);
        return;
      }

      // 2. Full Player / Drawers
      const ps = usePlayer.getState();
      if (ps.expanded) {
        ps.setExpanded(false);
        return;
      }
      if (ps.queueOpen) {
        ps.setQueueOpen(false);
        return;
      }
      if (ps.lyricsOpen) {
        ps.setLyricsOpen(false);
        return;
      }
      if (ps.equalizerOpen) {
        ps.setEqualizerOpen(false);
        return;
      }

      // 3. Navigation History (if not at root)
      if (window.location.pathname !== "/") {
        window.history.back();
        return;
      }

      // 4. Double back to exit at root Home
      backPressCount++;
      if (backPressCount === 1) {
        toast("Press back again to exit", { duration: 1500 });
        backPressTimer = setTimeout(() => {
          backPressCount = 0;
        }, 1500);
      } else if (backPressCount >= 2) {
        if (backPressTimer) clearTimeout(backPressTimer);
        void CapacitorApp.exitApp();
      }
    }).then((h) => {
      handle = h;
    }).catch(() => {
      // Browser environment where native backButton listener is not available
    });

    return () => {
      if (handle) void handle.remove();
      if (backPressTimer) clearTimeout(backPressTimer);
    };
  }, [mobileSearchOpen, openCreate, importModalOpen]);

  const executeSearch = (query: string) => {
    const cleanQ = query.trim();
    if (!cleanQ) return;
    rememberSearch(cleanQ);
    navigate({
      to: "/search",
      search: { q: cleanQ },
    });
    setDesktopSuggestionsOpen(false);
    setMobileSuggestionsOpen(false);
    setMobileSearchOpen(false);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    executeSearch(q);
  };

  return (
    <div className="bg-[#0B0A0A] min-h-dvh w-full text-[#F4EFEA] relative isolate selection:bg-[#FF5B2E]/25 selection:text-white font-sans">
      <MahalayaPrompt />
      <PlayerEngine />
      
      {/* Top-center Toast to never overlap transport controls */}
      <Toaster
        theme="dark"
        position="top-center"
        offset={20}
        toastOptions={{
          className: "bg-[#151211] text-[#F4EFEA] border border-[rgba(255,238,225,0.08)] font-sans text-xs shadow-2xl rounded-2xl p-3.5",
        }}
      />

      {/* Mobile Landscape Left Rail */}
      <aside className="mobile-landscape-rail fixed top-0 bottom-0 left-0 z-30 hidden w-16 flex-col items-center justify-between py-3 bg-[#0B0A0A]/95 backdrop-blur-md border-r border-[rgba(255,238,225,0.07)] pl-[env(safe-area-inset-left,0px)]">
        <Logo compact={true} className="size-8 rounded-lg hover:bg-white/5 transition-colors" />

        <nav className="flex flex-col items-center gap-1.5 w-full px-2">
          {MOBILE_NAV.map((item) => {
            const active = item.to === "/" ? path === "/" : (path.startsWith(item.to) && search.tab !== "favorites");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-11 rounded-xl transition-all active:scale-95",
                  active ? "text-[#FF5B2E] bg-[#FF5B2E]/10" : "text-[#A9A19B] hover:text-[#F4EFEA] hover:bg-white/[0.04]"
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                <span className="text-[9px] font-medium leading-none mt-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-2">
          <Link to="/about" className="flex items-center justify-center size-8 rounded-full text-[#A9A19B] hover:text-[#F4EFEA] hover:bg-white/[0.04] transition-colors" title="About">
            <Info className="size-4" strokeWidth={1.75} />
          </Link>
          {user && !user.isDevFallback ? (
            <Link to="/studio" className="size-7 rounded-full overflow-hidden border border-white/20 active:scale-95" title={user.displayName || "User"}>
              <Cover src={user.profileImageUrl} alt="User" rounded="full" className="size-full" />
            </Link>
          ) : (
            <Link to="/login" className="flex items-center justify-center size-7 rounded-full bg-[#FF5B2E] text-black active:scale-95" title="Sign In">
              <User className="size-4" strokeWidth={2.2} />
            </Link>
          )}
        </div>
      </aside>

      {/* Desktop Left Sidebar (220px, 16px left-aligned) */}
      <aside className="fixed top-0 left-0 z-20 hidden h-[100dvh] w-[220px] flex-col bg-[#090808] border-r border-[rgba(255,238,225,0.07)] px-4 py-5 lg:flex select-none">
        <div className="pl-0 pb-6">
          <Logo compact={false} />
        </div>
        
        {/* Primary Navigation */}
        <nav className="flex flex-col gap-1">
          {SIDEBAR_NAV.map((item) => {
            const active = item.to === "/" ? path === "/" : (path.startsWith(item.to) && search.tab !== "favorites");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex h-10 items-center gap-3.5 rounded-xl px-3 text-[14px] font-medium transition-colors duration-150",
                  active
                    ? "bg-[#FF5B2E]/10 text-[#F4EFEA]"
                    : "text-[#A9A19B] hover:text-[#F4EFEA] hover:bg-white/[0.04]"
                )}
              >
                <Icon className={cn("size-5 shrink-0", active ? "text-[#FF5B2E]" : "text-[#A9A19B]")} strokeWidth={active ? 2.25 : 1.75} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Library Section */}
        <div className="mt-7">
          <h3 className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A726C] mb-1.5">
            Library
          </h3>
          <nav className="flex flex-col gap-1">
            {SIDEBAR_LIBRARY.map((item) => {
              const active = item.to === "/library" 
                ? (path.startsWith(item.to) && search.tab === "favorites" && item.label === "Favorites")
                  || (path.startsWith(item.to) && search.tab === "downloads" && item.label === "Offline Downloads")
                  || (path.startsWith(item.to) && (!search.tab || search.tab === "recent" || search.tab === "recents") && item.label === "Recently Added")
                : path.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  search={"search" in item ? item.search : undefined}
                  className={cn(
                    "relative flex h-10 items-center gap-3.5 rounded-xl px-3 text-[14px] font-medium transition-colors duration-150",
                    active
                      ? "bg-[#FF5B2E]/10 text-[#F4EFEA]"
                      : "text-[#A9A19B] hover:text-[#F4EFEA] hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className={cn("size-5 shrink-0", active ? "text-[#FF5B2E]" : "text-[#A9A19B]")} strokeWidth={active ? 2.25 : 1.75} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Playlists Section */}
        <div className="mt-7 flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A726C]">
              Playlists
            </h3>
            <div className="flex items-center gap-1">
              <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogTrigger asChild>
                  <button 
                    type="button" 
                    className="p-1 rounded-md text-[#7A726C] hover:text-[#F4EFEA] hover:bg-white/[0.06] transition-colors"
                    title="New Playlist"
                  >
                    <Plus className="size-4" strokeWidth={2} />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-[#151211] border border-[rgba(255,238,225,0.08)] rounded-2xl p-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const trimmed = name.trim();
                      if (!trimmed) return;
                      const id = createPlaylist(trimmed);
                      setName("");
                      setOpenCreate(false);
                      navigate({ to: "/playlist/$id", params: { id } });
                    }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-semibold text-white">Create Playlist</h2>
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Playlist"
                      className="h-10 w-full rounded-xl bg-[#1E1A18] px-3.5 text-sm text-[#F4EFEA] placeholder:text-[#7A726C] outline-none border border-[rgba(255,238,225,0.08)] focus:border-[#FF5B2E]/60 focus:ring-1 focus:ring-[#FF5B2E]/60"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="ghost" onClick={() => setOpenCreate(false)} className="rounded-full text-sm">
                        Cancel
                      </Button>
                      <Button type="submit" className="rounded-full bg-white text-black hover:bg-white/90 font-semibold text-sm px-5">
                        Create
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 px-1 py-1">
            {playlists.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[#7A726C] font-normal">
                No playlists yet
              </p>
            ) : (
              playlists.map((pl) => (
                <Link
                  key={pl.id}
                  to="/playlist/$id"
                  params={{ id: pl.id }}
                  className={cn(
                    "block truncate rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    path === `/playlist/${pl.id}`
                      ? "text-[#FF5B2E] bg-[#FF5B2E]/10"
                      : "text-[#A9A19B] hover:text-[#F4EFEA] hover:bg-white/[0.04]"
                  )}
                >
                  {pl.name}
                </Link>
              ))
            )}
          </div>
        </div>

        <PlaylistImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />
      </aside>

      {/* Main Content Workspace */}
      <main
        id="main-scroll-area"
        className={cn(
          "min-w-0 relative h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#0B0A0A]",
          "lg:ml-[220px]",
          hasTrack 
            ? "pb-[calc(var(--spacing-player)+var(--spacing-nav)+max(env(safe-area-inset-bottom,0px),24px))] lg:pb-[calc(var(--spacing-player)+3rem)]" 
            : "pb-[calc(var(--spacing-nav)+max(env(safe-area-inset-bottom,0px),24px))] lg:pb-8",
        )}
      >
        {/* Sticky Desktop Top Bar & Mobile Compact Bar */}
        <header 
          className={cn(
            "sticky top-0 z-20 flex items-center h-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:h-[calc(4rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] px-4 lg:px-8 transition-all duration-200",
            isScrolled 
              ? "bg-[#0B0A0A]/85 backdrop-blur-md border-b border-[rgba(255,238,225,0.07)] shadow-sm" 
              : "bg-transparent border-b border-transparent"
          )}
        >
          <div className="flex items-center justify-between gap-4 w-full max-w-[1280px]">
            {/* Mobile Search Overlay Input */}
            {mobileSearchOpen ? (
              <div className="flex items-center gap-2 w-full animate-in fade-in duration-150 lg:hidden">
                <form onSubmit={onSearch} className="relative z-50 flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#7A726C]" />
                  <input
                    ref={mobileSearchInputRef}
                    autoFocus
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setMobileSuggestionsOpen(true);
                    }}
                    onFocus={() => setMobileSuggestionsOpen(true)}
                    placeholder="Search songs, artists, albums..."
                    className="h-10 w-full rounded-full bg-[#151211] pr-9 pl-10 text-sm text-[#F4EFEA] placeholder:text-[#7A726C] outline-none border border-[rgba(255,238,225,0.08)] focus:border-[#FF5B2E]/60 focus:ring-1 focus:ring-[#FF5B2E]/60"
                  />
                  {q && (
                    <button type="button" onClick={() => { setQ(""); setMobileSuggestionsOpen(false); }} className="absolute top-1/2 right-3 -translate-y-1/2 text-[#7A726C] hover:text-[#F4EFEA] p-1">
                      <X className="size-4" />
                    </button>
                  )}
                  <SearchSuggestions query={q} isOpen={mobileSuggestionsOpen} onClose={() => setMobileSuggestionsOpen(false)} onSelectQuery={executeSearch} onLoadingChange={setIsSearchingMobile} />
                </form>
                <button type="button" onClick={() => { setMobileSearchOpen(false); setMobileSuggestionsOpen(false); }} className="text-sm font-medium text-[#A9A19B] hover:text-[#F4EFEA] px-2 py-1">
                  Cancel
                </button>
              </div>
            ) : (
              /* Mobile Compact Top Bar: Logo left, Actions right (NO duplicate title!) */
              <div className="flex items-center justify-between w-full lg:hidden">
                <Logo compact={true} className="size-8 active:scale-95 transition-transform" />
                
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setMobileSearchOpen(true);
                      setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
                    }}
                    className="p-2 text-[#A9A19B] hover:text-[#F4EFEA] transition-colors"
                    title="Search"
                  >
                    <Search className="size-5" strokeWidth={1.75} />
                  </button>
                  <Link to="/about" className="p-2 text-[#A9A19B] hover:text-[#F4EFEA] transition-colors" title="About">
                    <Info className="size-5" strokeWidth={1.75} />
                  </Link>
                  {user && !user.isDevFallback ? (
                    <Link to="/studio" className="size-8 rounded-full overflow-hidden border border-white/20 active:scale-95" title={user.displayName || "User"}>
                      <Cover src={user.profileImageUrl} alt="User" rounded="full" className="size-full" />
                    </Link>
                  ) : (
                    <Link to="/login" className="flex items-center justify-center size-8 rounded-full bg-[#FF5B2E] text-black active:scale-95" title="Sign In">
                      <User className="size-4" strokeWidth={2.2} />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Desktop Top Bar: Search Left-aligned, Actions Right */}
            <div className="hidden lg:flex items-center justify-between w-full">
              {/* Search Pill (max 560px, left-aligned) */}
              <div className="relative w-full max-w-[540px]">
                <form onSubmit={onSearch} className="relative w-full">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#7A726C]" />
                  <input
                    ref={desktopSearchInputRef}
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setDesktopSuggestionsOpen(true);
                    }}
                    onFocus={() => setDesktopSuggestionsOpen(true)}
                    placeholder="Search for songs, artists, albums, or moods..."
                    className="h-10 w-full rounded-full bg-[#151211] pr-16 pl-10 text-sm text-[#F4EFEA] placeholder:text-[#7A726C] outline-none border border-[rgba(255,238,225,0.07)] focus:border-[#FF5B2E]/60 focus:ring-1 focus:ring-[#FF5B2E]/60 transition-all"
                  />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-[rgba(255,238,225,0.08)] bg-white/[0.04] text-[10px] font-mono text-[#7A726C]">
                    <Command className="size-2.5" />
                    <span>K</span>
                  </div>
                </form>
                <SearchSuggestions query={q} isOpen={desktopSuggestionsOpen} onClose={() => setDesktopSuggestionsOpen(false)} onSelectQuery={executeSearch} onLoadingChange={setIsSearchingDesktop} />
              </div>

              {/* Right Utilities */}
              <div className="flex items-center gap-3">
                <Link 
                  to="/about" 
                  className="p-2 rounded-full text-[#A9A19B] hover:text-[#F4EFEA] hover:bg-white/[0.04] transition-colors" 
                  title="About Sonara"
                >
                  <Info className="size-5" strokeWidth={1.75} />
                </Link>

                {user && !user.isDevFallback ? (
                  <div className="flex items-center gap-2">
                    <Link to="/studio" className="flex items-center gap-2 py-1 pl-1 pr-3 rounded-full bg-[#151211] border border-[rgba(255,238,225,0.07)] hover:border-white/20 transition-all">
                      <Cover src={user.profileImageUrl} alt="User" rounded="full" className="size-7" />
                      <span className="text-xs font-medium text-[#F4EFEA] max-w-[100px] truncate">{user.displayName || "Artist"}</span>
                    </Link>
                    <button
                      onClick={async () => {
                        await signOut();
                        window.location.href = "/";
                      }}
                      className="p-2 rounded-full text-[#7A726C] hover:text-[#F4EFEA] hover:bg-white/[0.04] transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="size-4" strokeWidth={1.75} />
                    </button>
                  </div>
                ) : (
                  <Link 
                    to="/login" 
                    className="h-9 px-4 rounded-full bg-[#FF5B2E] text-black hover:bg-[#FF6E45] active:bg-[#E64E24] active:scale-95 transition-all font-semibold text-xs flex items-center justify-center shadow-sm"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {isOffline && (
          <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:top-[calc(4rem+env(safe-area-inset-top,0px))] z-30 flex items-center justify-center gap-2.5 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs font-medium text-amber-300 backdrop-blur-md transition-all">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="truncate">You&apos;re offline · Playing songs from your offline downloads cache</span>
            <Link to="/library" search={{ tab: "downloads" }} className="underline font-semibold hover:text-white shrink-0 ml-1">
              Downloads
            </Link>
          </div>
        )}

        {/* Content Container (Max 1280px, left-aligned) */}
        <div className="max-w-[1280px] px-4 sm:px-6 lg:px-8 pb-32 lg:pb-12">
          {children}
        </div>
      </main>

      {/* Mobile Stacked Mini-Player + Docked Full-Width Bottom Nav */}
      <div className="mobile-dock-container lg:hidden">
        {/* Floating Mini Player directly above docked nav */}
        <div className="fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom,0px))] z-40 px-3 pb-1 pointer-events-none flex justify-center">
          <div className="w-full max-w-[440px] pointer-events-auto">
            <PlayerBar />
          </div>
        </div>

        {/* Docked Full-Width Bottom Navigation Bar (Solid 92% near-black, zero gap) */}
        <div className="mobile-nav-dock fixed inset-x-0 bottom-0 z-40 bg-[#0B0A0A]/95 backdrop-blur-md border-t border-[rgba(255,238,225,0.07)] pb-[env(safe-area-inset-bottom,0px)]">
          <nav className="flex items-center justify-around h-[58px] max-w-lg mx-auto px-1 select-none">
            {MOBILE_NAV.map((item) => {
              const active = item.to === "/" ? path === "/" : (path.startsWith(item.to) && search.tab !== "favorites");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-1 flex-col items-center justify-center h-full active:scale-95 transition-transform"
                >
                  <Icon 
                    className={cn("size-5 transition-colors", active ? "text-[#FF5B2E]" : "text-[#7A726C]")} 
                    strokeWidth={active ? 2.25 : 1.75} 
                  />
                  <span className={cn("text-[10px] font-medium mt-1 leading-none transition-colors", active ? "text-[#FF5B2E] font-semibold" : "text-[#7A726C]")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop Player Bar */}
      <div className="hidden lg:block">
        <PlayerBar />
      </div>

      <FullPlayer />
      <QueuePanel />
      <LyricsDrawer />
      <EqualizerModal />
    </div>
  );
}
