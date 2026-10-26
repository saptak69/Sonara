import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { PRIMARY_NAV, isNavActive } from "./nav";

/** Bottom tab bar for phones held upright. */
export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl short:hidden desk:hidden"
    >
      <div className="mx-auto flex h-[60px] max-w-lg items-stretch px-1">
        {PRIMARY_NAV.map((item) => {
          const active = isNavActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-1 transition-transform active:scale-95"
            >
              <item.icon
                className={cn("size-[22px] transition-colors", active ? "text-accent" : "text-subtle")}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className={cn("text-[10.5px] leading-none", active ? "font-semibold text-fg" : "text-subtle")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Side rail for phones in landscape and for Android TV. Big, evenly spaced
 * targets so a thumb or a D-pad can hit them easily.
 */
export function NavRail() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      aria-label="Main"
      className="fixed inset-y-0 left-0 z-40 hidden w-(--spacing-rail) flex-col items-center border-r border-border bg-bg-sunken py-3 pl-[env(safe-area-inset-left)] short:flex tv:w-24"
    >
      <Link to="/" aria-label="Sonara home" className="mb-3 rounded-xl p-1">
        <Logo compact className="size-9" />
      </Link>

      <nav className="flex w-full flex-1 flex-col items-center justify-center gap-1 px-2">
        {PRIMARY_NAV.map((item) => {
          const active = isNavActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-colors tv:py-3",
                active ? "bg-accent-soft text-fg" : "text-subtle hover:bg-hover hover:text-fg",
              )}
            >
              <item.icon className={cn("size-5 tv:size-6", active && "text-accent")} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] leading-none font-medium tv:text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <AccountMenu variant="compact" side="right" />
    </aside>
  );
}
