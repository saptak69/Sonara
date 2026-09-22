import { useEffect, useRef, useState } from "react";
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

function SuggestionItemButton({
  children,
  onSelect,
  className,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  className?: string;
}) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isScrollingRef = useRef(false);

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent blurring search input on desktop mouse click
        e.preventDefault();
      }}
      onClick={(e) => {
        // Desktop click or synthetic click
        e.preventDefault();
        e.stopPropagation();
        onSelect();
      }}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
        isScrollingRef.current = false;
      }}
      onTouchMove={(e) => {
        if (!touchStartRef.current) return;
        const touch = e.touches[0];
        const diffY = Math.abs(touch.clientY - touchStartRef.current.y);
        const diffX = Math.abs(touch.clientX - touchStartRef.current.x);
        // If finger moved more than 8px, user is scrolling, not tapping
        if (diffY > 8 || diffX > 8) {
          isScrollingRef.current = true;
        }
      }}
      onTouchEnd={(e) => {
        // Only trigger search if user was tapping, not scrolling/swiping
        if (!isScrollingRef.current && touchStartRef.current) {
          const elapsed = Date.now() - touchStartRef.current.time;
          if (elapsed < 500) {
            e.preventDefault();
            e.stopPropagation();
            onSelect();
          }
        }
        touchStartRef.current = null;
        isScrollingRef.current = false;
      }}
      className={className}
    >
      {children}
    </button>
  );
}

export function SearchSuggestions({
  query,
  isOpen,
  onClose,
  onSelectQuery,
  className,
}: {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (q: string) => void;
  className?: string;
}) {
  const navigate = useNavigate();
  const playTrack = usePlayer((s) => s.playTrack);
  const [data, setData] = useState<SearchSuggestionResult>({ queries: [], topMatches: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions with 150ms debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setData({ queries: [], topMatches: [] });
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      void fetchSearchSuggestionsServerFn({ data: { query: trimmed } })
        .then((res) => {
          setData(res);
          setSelectedIndex(-1);
        })
        .finally(() => setLoading(false));
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const recentSearches = usePlayer((s) => s.recentSearches);
  const showRecents = query.trim().length === 0;
  
  const displayQueries = showRecents ? recentSearches : data.queries;
  const displayMatches = showRecents ? [] : data.topMatches;
  const totalItems = displayMatches.length + displayQueries.length;

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen || totalItems === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        if (selectedIndex < displayMatches.length) {
          handleSelectMatch(displayMatches[selectedIndex]);
        } else {
          const queryIdx = selectedIndex - displayMatches.length;
          onSelectQuery(displayQueries[queryIdx]);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, totalItems, selectedIndex, displayMatches, displayQueries, onSelectQuery, onClose]);

  const handleSelectMatch = (match: SuggestionMatch) => {
    onClose();
    if (match.type === "artist" && match.entityId) {
      void navigate({ to: "/artist/$id", params: { id: match.entityId } });
    } else if (match.type === "album" && match.entityId) {
      void navigate({ to: "/playlist/$id", params: { id: match.entityId } });
    } else if (match.entityId) {
      // Play track directly
      void (async () => {
        try {
          const track = await fetchTrack(match.entityId!);
          if (track) {
            playTrack(track);
          }
        } catch {
          // fallback to search
          onSelectQuery(match.title);
        }
      })();
    } else {
      onSelectQuery(match.title);
    }
  };

  if (!isOpen || (displayQueries.length === 0 && displayMatches.length === 0 && !loading)) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => e.stopPropagation()}
      className={cn(
        "absolute left-0 right-0 top-full mt-2 z-50 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-bg p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150 [scrollbar-width:thin] touch-pan-y",
        className,
      )}
    >
      {/* Top Entity Matches (Songs / Artists) */}
      {displayMatches.length > 0 ? (
        <div className="mb-2">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted/70">
            Top Matches
          </div>
          <div className="space-y-1">
            {displayMatches.map((match, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <SuggestionItemButton
                  key={match.id}
                  onSelect={() => handleSelectMatch(match)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer",
                    isSelected ? "bg-white/15 text-white" : "hover:bg-white/10 text-fg",
                  )}
                >
                  <Cover
                    src={match.artwork}
                    alt={match.title}
                    title={match.title}
                    className="size-9 shrink-0 rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight text-white">{match.title}</p>
                    <p className="text-xs text-muted truncate">{match.subtitle}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-medium text-accent">
                    {match.type === "artist" ? (
                      <>
                        <User className="size-3.5" />
                        <span>Artist</span>
                      </>
                    ) : match.type === "album" ? (
                      <>
                        <Disc className="size-3.5" />
                        <span>Album</span>
                      </>
                    ) : (
                      <>
                        <Music className="size-3.5" />
                        <span>Play</span>
                      </>
                    )}
                  </div>
                </SuggestionItemButton>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Query Suggestions */}
      {displayQueries.length > 0 ? (
        <div>
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted/70">
            {showRecents ? "Recent Searches" : "Search Suggestions"}
          </div>
          <div className="space-y-0.5">
            {displayQueries.map((q, idx) => {
              const globalIdx = displayMatches.length + idx;
              const isSelected = selectedIndex === globalIdx;
              return (
                <SuggestionItemButton
                  key={q}
                  onSelect={() => {
                    onSelectQuery(q);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                    isSelected ? "bg-white/15 text-white font-medium" : "hover:bg-white/10 text-fg/90",
                  )}
                >
                  <div className="flex items-center gap-3 truncate">
                    {showRecents ? <History className="size-4 shrink-0 text-muted" /> : <Search className="size-4 shrink-0 text-muted" />}
                    <span className="truncate capitalize">{q}</span>
                  </div>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted/60" />
                </SuggestionItemButton>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Footer Navigation Hints */}
      <div className="mt-2 flex items-center justify-between border-t border-white/10 px-3 pt-2 text-[10px] text-muted/70">
        <span className="flex items-center gap-1.5">
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/80">↑</kbd>
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/80">↓</kbd>
          navigate
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/80">↵</kbd>
          select
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/80">esc</kbd>
          close
        </span>
      </div>
    </div>
  );
}
