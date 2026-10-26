import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { AccountMenu } from "@/components/shell/account-menu";
import { PRIMARY_NAV, isNavActive } from "@/components/shell/nav";
import { cn } from "@/lib/utils";

/**
 * TV navigation: a row of tabs across the top, like YouTube Music / Apple Music on TV.
 * The focused tab turns into a white pill; the current page keeps an accent underline.
 * Only visible on the TV app (`tvd`).
 */
export function TvTopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header
      aria-label="Sonara"
      data-tv-chrome
      className="fixed inset-x-0 top-0 z-30 hidden h-[76px] items-center gap-5 bg-gradient-to-b from-bg via-bg/90 to-transparent px-(--tv-edge) tvd:flex"
    >
      <Logo variant="mark" size={38} asLink={false} />

      <nav aria-label="Main" className="flex items-center gap-1.5">
        {PRIMARY_NAV.map((item) => {
          const active = isNavActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "tv-tab relative flex h-11 items-center gap-2 rounded-full px-4 text-base font-semibold transition-colors",
                active ? "text-fg" : "text-muted",
              )}
            >
              <item.icon className="size-[18px]" strokeWidth={active ? 2.4 : 2} />
              {item.label}
              {active && <span className="absolute inset-x-4 -bottom-0.5 h-[3px] rounded-full bg-accent" aria-hidden />}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto">
        <AccountMenu variant="compact" />
      </div>
    </header>
  );
}
