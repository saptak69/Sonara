import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { App as CapacitorApp } from "@capacitor/app";
import { WifiOff } from "lucide-react";
import { Toaster, toast } from "sonner";
import { MahalayaPrompt } from "@/components/mahalaya-prompt";
import { DesktopPlayerBar, MiniPlayer } from "@/components/player/bar";
import { PlayerEngine } from "@/components/player/engine";
import { EqualizerModal } from "@/components/player/equalizer-modal";
import { FullPlayer } from "@/components/player/full";
import { LyricsDrawer } from "@/components/player/lyrics";
import { QueuePanel } from "@/components/player/queue";
import { onSignOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { flushChanges, syncLibrary } from "@/lib/library-sync";
import { usePlayer } from "@/lib/player-store";
import { closeTopLayer, installRemoteNavigation } from "@/lib/tv";
import { cn } from "@/lib/utils";
import { BottomNav, NavRail } from "./shell/compact-nav";
import { Sidebar } from "./shell/sidebar";
import { TopBar } from "./shell/top-bar";

/**
 * Page chrome. Three layouts, switched purely in CSS (see styles.css):
 *   phone portrait   top bar · content · mini player · bottom tabs
 *   short (landscape phone, Android TV)   side rail · content · mini player
 *   desk (tablet landscape, desktop)      sidebar · top bar · content · floating player
 */
export function AppShell({ children }: { children: ReactNode }) {
  const hasTrack = usePlayer((s) => Boolean(s.queue[s.index]));
  const scrolled = useMainScrolled();
  const offline = useOffline();

  useAndroidBackButton();
  useEffect(() => installRemoteNavigation(), []);

  return (
    <div className="relative isolate min-h-dvh w-full bg-bg font-sans text-fg selection:bg-accent/25">
      <PlayerEngine />
      <LibrarySync />
      <MahalayaPrompt />
      <Toaster
        theme="dark"
        position="top-center"
        offset={16}
        toastOptions={{
          className: "!bg-surface-2 !text-fg !border !border-border-strong !rounded-2xl !font-sans !text-[13px] !shadow-2xl",
        }}
      />

      <Sidebar />
      <NavRail />

      <main
        id="main-scroll-area"
        className={cn(
          "relative h-dvh min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain",
          "short:ml-(--spacing-rail) desk:ml-(--spacing-sidebar) tv:short:ml-24",
          hasTrack
            ? "pb-[calc(60px+76px+env(safe-area-inset-bottom))] short:pb-20 desk:pb-32"
            : "pb-[calc(60px+24px+env(safe-area-inset-bottom))] short:pb-6 desk:pb-10",
        )}
      >
        <TopBar scrolled={scrolled} />

        {offline && (
          <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 flex items-center justify-center gap-2 border-b border-warn/20 bg-warn/10 px-4 py-2 text-xs font-medium text-warn backdrop-blur-md short:top-0 desk:top-16">
            <WifiOff className="size-3.5 shrink-0" />
            <span className="truncate">You're offline. Downloaded songs still play.</span>
            <Link to="/library" search={{ tab: "downloads" }} className="shrink-0 font-semibold underline underline-offset-2">
              Downloads
            </Link>
          </div>
        )}

        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </main>

      {/* Mini player: above the tabs in portrait, bottom-right of the rail in landscape */}
      <div
        className={cn(
          "pointer-events-none fixed z-40 desk:hidden",
          "inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] px-3 pb-2",
          "short:inset-x-auto short:right-3 short:bottom-2 short:left-[calc(var(--spacing-rail)+0.75rem)] short:px-0 short:pb-0",
        )}
      >
        <div className="pointer-events-auto mx-auto w-full max-w-[480px] short:mr-0 short:max-w-[440px]">
          <MiniPlayer />
        </div>
      </div>

      <BottomNav />
      <DesktopPlayerBar />

      <FullPlayer />
      <QueuePanel />
      <LyricsDrawer />
      <EqualizerModal />
    </div>
  );
}

/** Keeps the local library matched to whoever is signed in (see lib/library-sync.ts). */
function LibrarySync() {
  const { user, isPending, isUnknown } = useCurrentUserState();
  const hydrated = usePlayer((s) => s.hydrated);
  const pendingCount = usePlayer((s) => s.pendingChanges.length);
  const userId = user?.id ?? null;

  useEffect(() => onSignOut(() => usePlayer.getState().clearLibrary()), []);

  useEffect(() => {
    // Wait for both the saved library and the session; never wipe on "couldn't check".
    if (!hydrated || isPending || isUnknown) return;
    syncLibrary(userId).catch((err) => console.warn("[library] sync failed", err));
  }, [hydrated, isPending, isUnknown, userId]);

  useEffect(() => {
    if (!userId || pendingCount === 0) return;
    const timer = setTimeout(() => void flushChanges(), 500);
    return () => clearTimeout(timer);
  }, [userId, pendingCount]);

  useEffect(() => {
    if (!userId) return;
    let lastSync = Date.now();
    const refresh = () => {
      void flushChanges();
      // Pick up changes made on other devices when the app comes back to the front.
      if (document.visibilityState === "visible" && Date.now() - lastSync > 60_000) {
        lastSync = Date.now();
        syncLibrary(userId).catch(() => {});
      }
    };
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [userId]);

  return null;
}

function useMainScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const main = document.getElementById("main-scroll-area");
    if (!main) return;
    const onScroll = () => setScrolled(main.scrollTop > 8);
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function useOffline() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return offline;
}

/**
 * Android back button / TV remote Back: close the top layer first, then go back
 * a page, and on Home ask for a second press before leaving the app.
 */
function useAndroidBackButton() {
  useEffect(() => {
    let lastPress = 0;
    let handle: { remove: () => Promise<void> } | undefined;
    let disposed = false;

    CapacitorApp.addListener("backButton", () => {
      if (closeTopLayer()) return;
      if (window.location.pathname !== "/") {
        window.history.back();
        return;
      }
      const now = Date.now();
      if (now - lastPress < 1800) {
        void CapacitorApp.exitApp();
        return;
      }
      lastPress = now;
      toast("Press back again to exit", { duration: 1800 });
    })
      .then((h) => {
        if (disposed) void h.remove();
        else handle = h;
      })
      .catch(() => {
        /* not running inside the Android app */
      });

    return () => {
      disposed = true;
      void handle?.remove();
    };
  }, []);
}
