import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Logo } from "@/components/logo";
import { SearchSuggestions } from "@/components/search-suggestions";
import { usePlayer } from "@/lib/player-store";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";

/**
 * Sticky header. Phones get the logo and account button; desktops get the
 * search field (⌘/Ctrl + K) as well. Hidden in landscape, where the rail has both.
 */
export function TopBar({ scrolled }: { scrolled: boolean }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center px-4 pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-200 short:hidden desk:h-16 desk:px-8",
        scrolled ? "border-b border-border bg-bg/85 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="flex w-full items-center justify-between gap-4 desk:hidden">
        <Link to="/" aria-label="Sonara home">
          <Logo compact className="size-8" />
        </Link>
        <AccountMenu variant="compact" />
      </div>

      <div className="hidden w-full items-center justify-between gap-6 desk:flex">
        <DesktopSearch />
        <AccountMenu />
      </div>
    </header>
  );
}

function DesktopSearch() {
  const navigate = useNavigate();
  const rememberSearch = usePlayer((s) => s.rememberSearch);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const runSearch = (value: string) => {
    const q = value.trim();
    if (!q) return;
    rememberSearch(q);
    setSuggestionsOpen(false);
    inputRef.current?.blur();
    void navigate({ to: "/search", search: { q } });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    runSearch(query);
  };

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="relative w-full max-w-[520px]">
      <form onSubmit={onSubmit} role="search">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSuggestionsOpen(true);
          }}
          onFocus={() => setSuggestionsOpen(true)}
          aria-expanded={suggestionsOpen && query.trim().length > 0}
          aria-label="Search songs, artists and albums"
          placeholder="Songs, artists, albums, moods…"
          className="h-10 w-full rounded-full border border-border bg-surface pr-16 pl-10 text-sm text-fg transition outline-none placeholder:text-subtle focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-border bg-hover px-1.5 py-0.5 font-mono text-[10px] text-subtle">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </form>
      <SearchSuggestions
        query={query}
        isOpen={suggestionsOpen}
        onClose={() => setSuggestionsOpen(false)}
        onSelectQuery={runSearch}
      />
    </div>
  );
}
