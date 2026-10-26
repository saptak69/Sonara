import { Link, useNavigate } from "@tanstack/react-router";
import { Info, LogOut, Mic2, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Cover } from "@/components/cover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

/**
 * Avatar button with the account menu, or a "Sign in" button for guests.
 * `variant="compact"` is the icon-only form used in the side rail and phone header.
 */
export function AccountMenu({ variant = "full", side = "bottom" }: { variant?: "full" | "compact"; side?: "bottom" | "right" }) {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (isPending) {
    return <div className={cn("skeleton rounded-full", variant === "compact" ? "size-9" : "h-9 w-28")} aria-hidden />;
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-accent font-semibold text-accent-fg transition hover:bg-accent-hover active:scale-95",
          variant === "compact" ? "size-9" : "h-9 px-4 text-[13px]",
        )}
        aria-label="Sign in"
      >
        {variant === "compact" ? <UserRound className="size-[18px]" strokeWidth={2.2} /> : "Sign in"}
      </Link>
    );
  }

  const name = user.displayName || user.email?.split("@")[0] || "You";

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      setSigningOut(false);
      toast.error(err instanceof Error ? err.message : "Couldn't sign out.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-focus",
          variant === "full" && "border border-border bg-surface py-1 pr-3 pl-1 hover:border-border-strong",
        )}
        aria-label="Account"
      >
        <Cover src={user.avatarUrl} alt={name} title={name} rounded="full" className="size-8 shrink-0" />
        {variant === "full" && <span className="max-w-28 truncate text-[13px] font-medium">{name}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={side} className="w-64">
        <div className="flex items-center gap-3 px-3 pt-2 pb-3">
          <Cover src={user.avatarUrl} alt={name} title={name} rounded="full" className="size-10 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{name}</p>
            {user.email && <p className="truncate text-xs text-subtle">{user.email}</p>}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate({ to: "/you" })}>
          <UserRound className="size-4 text-muted" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate({ to: "/studio" })}>
          <Mic2 className="size-4 text-muted" /> Artist Studio
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate({ to: "/about" })}>
          <Info className="size-4 text-muted" /> About Sonara
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut className="size-4 text-muted" /> {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
