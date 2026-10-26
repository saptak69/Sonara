import { useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Music, User, Disc, ArrowUpRight, History } from "lucide-react";
import {
  fetchSearchSuggestionsServerFn,
  type SearchSuggestionResult,
  type SuggestionMatch,
} from "@/lib/suggestions-api";
import { usePlayer } from "@/lib/player-store";
import { fetchTrack } from "@/lib/music-api";
import { Cover } from "@/components/cover";
import { cn } from "@/lib/utils";

const EMPTY: SearchSuggestionResult = { queries: [], topMatches: [] };

function Item({
  children,
  onSelect,
  selected,
}: {
  children: ReactNode;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      // Keep focus in the search box so the keyboard keeps working.
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        selected ? "bg-white/15 text-white" : "text-fg/90 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-muted/80 uppercase">{children}</div>
);

export function SearchSuggestions({
  query,
  isOpen,
  onClose,
  onSelectQuery,
  onLoadingChange,
  className,
}: {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (q: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const playTrack = usePlayer((s) => s.playTrack);
  const recentSearches = usePlayer((s) => s.recentSearches);
  const [data, setData] = useState<SearchSuggestionResult>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const onLoadingChangeRef = useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;

  const trimmed = query.trim();

  // Fetch suggestions (debounced). A newer keystroke always wins over a slower older reply,
  // and a failed request just means "no suggestions", never an error.
  useEffect(() => {
    const id = ++requestId.current;
    if (trimmed.length < 2) {
      setData(EMPTY);
      setSelectedIndex(-1);
      setLoading(false);
      onLoadingChangeRef.current?.(false);
      return;
    }

    setLoading(true);
    onLoadingChangeRef.current?.(true);
    const timer = setTimeout(() => {
      fetchSearchSuggestionsServerFn({ data: { query: trimmed } })
        .then((res) => {
          if (id !== requestId.current) return;
          setData(res ?? EMPTY);
          setSelectedIndex(-1);
        })
        .catch(() => {
          if (id !== requestId.current) return;
          setData(EMPTY);
        })
        .finally(() => {
          if (id !== requestId.current) return;
          setLoading(false);
          onLoadingChangeRef.current?.(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [trimmed]);

  // Close when clicking/tapping anywhere outside the search box + its dropdown.
  useEffect(() => {
    if (!isOpen) return;
    const host = containerRef.current?.parentElement;
    const onOutside = (e: Event) => {
      if (host && !host.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [isOpen, onClose]);

  const showRecents = trimmed.length === 0;
  const displayQueries = useMemo(() => (showRecents ? recentSearches.slice(0, 6) : data.queries), [showRecents, recentSearches, data.queries]);
  const displayMatches = useMemo(() => (showRecents ? [] : data.topMatches), [showRecents, data.topMatches]);
  const totalItems = displayMatches.length + displayQueries.length;

  const handleSelectMatch = useCallback(
    (match: SuggestionMatch) => {
      onClose();
      if (match.type === "artist" && match.entityId) {
        void navigate({ to: "/artist/$id", params: { id: match.entityId } });
      } else if (match.type === "album" && match.entityId) {
        void navigate({ to: "/playlist/$id", params: { id: match.entityId } });
      } else if (match.entityId) {
        void fetchTrack(match.entityId)
          .then((track) => (track ? playTrack(track) : onSelectQuery(match.title)))
          .catch(() => onSelectQuery(match.title));
      } else {
        onSelectQuery(match.title);
      }
    },
    [onClose, navigate, playTrack, onSelectQuery],
  );

  const chooseIndex = useCallback(
    (index: number) => {
      if (index < displayMatches.length) {
        handleSelectMatch(displayMatches[index]);
      } else {
        onSelectQuery(displayQueries[index - displayMatches.length]);
        onClose();
      }
    },
    [displayMatches, displayQueries, handleSelectMatch, onSelectQuery, onClose],
  );

  // Keyboard / TV remote: only while the search box (or this list) has focus.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const host = containerRef.current?.parentElement;
      if (!host || !host.contains(document.activeElement)) return;

      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (totalItems === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i <= 0 ? totalItems - 1 : i - 1));
      } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < totalItems) {
        e.preventDefault();
        chooseIndex(selectedIndex);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, totalItems, selectedIndex, chooseIndex, onClose]);

  // Keep the highlighted row in view.
  useEffect(() => {
    if (selectedIndex < 0) return;
    containerRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;
  if (totalItems === 0 && !loading) return null;

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label="Search suggestions"
      onMouseDown={(e) => e.stopPropagation()}
      className={cn(
        "animate-in fade-in zoom-in-95 absolute top-full right-0 left-0 z-50 mt-2 max-h-[60vh] touch-pan-y overflow-y-auto overscroll-contain rounded-2xl border border-border-strong bg-surface-2 p-2 shadow-pop duration-150 [scrollbar-width:thin] sm:max-h-[70vh]",
        className,
      )}
    >
      {totalItems === 0 && loading ? (
        <div className="space-y-2 p-2" aria-label="Searching">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton size-10 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {displayMatches.length > 0 ? (
        <div>
          <Label>Top matches</Label>
          {displayMatches.map((match, idx) => (
            <Item key={match.id} selected={selectedIndex === idx} onSelect={() => handleSelectMatch(match)}>
              <Cover
                src={match.artwork}
                alt=""
                title={match.title}
                rounded={match.type === "artist" ? "full" : "lg"}
                className={cn("size-11 shrink-0", match.type === "artist" && "rounded-full")}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm leading-tight font-semibold text-white">{match.title}</span>
                <span className="block truncate text-xs text-muted">{match.subtitle}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-accent">
                {match.type === "artist" ? <User className="size-3.5" /> : match.type === "album" ? <Disc className="size-3.5" /> : <Music className="size-3.5" />}
                {match.type === "artist" ? "Artist" : match.type === "album" ? "Album" : "Play"}
              </span>
            </Item>
          ))}
        </div>
      ) : null}

      {displayQueries.length > 0 ? (
        <div>
          <Label>{showRecents ? "Recent searches" : "Suggestions"}</Label>
          {displayQueries.map((q, idx) => (
            <Item
              key={q}
              selected={selectedIndex === displayMatches.length + idx}
              onSelect={() => {
                onSelectQuery(q);
                onClose();
              }}
            >
              {showRecents ? <History className="size-4 shrink-0 text-muted" /> : <Search className="size-4 shrink-0 text-muted" />}
              <span className="min-w-0 flex-1 truncate text-sm">{q}</span>
              <ArrowUpRight className="size-3.5 shrink-0 text-muted/60" />
            </Item>
          ))}
        </div>
      ) : null}
    </div>
  );
}
