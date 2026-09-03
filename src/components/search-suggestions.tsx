import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Music, User, ArrowUpRight } from "lucide-react";
import {
  fetchSearchSuggestionsServerFn,
  type SearchSuggestionResult,
  type SuggestionMatch,
} from "@/lib/suggestions-api";
import { usePlayer } from "@/lib/player-store";
import { fetchTrack } from "@/lib/music-api";
import { Cover } from "@/components/cover";
import { cn } from "@/lib/utils";

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

  const totalItems = data.topMatches.length + data.queries.length;

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
        if (selectedIndex < data.topMatches.length) {
          handleSelectMatch(data.topMatches[selectedIndex]);
        } else {
          const queryIdx = selectedIndex - data.topMatches.length;
          onSelectQuery(data.queries[queryIdx]);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, totalItems, selectedIndex, data, onSelectQuery, onClose]);

  const handleSelectMatch = (match: SuggestionMatch) => {
    onClose();
    if (match.type === "artist" && match.entityId) {
      void navigate({ to: "/artist/$id", params: { id: match.entityId } });
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

  if (!isOpen || query.trim().length < 2 || (data.queries.length === 0 && data.topMatches.length === 0 && !loading)) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className={cn(
        "absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-white/15 bg-black/90 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150",
        className,
      )}
    >
      {/* Top Entity Matches (Songs / Artists) */}
      {data.topMatches.length > 0 ? (
        <div className="mb-2">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted/70">
            Top Matches
          </div>
          <div className="space-y-1">
            {data.topMatches.map((match, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={match.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectMatch(match);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectMatch(match);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectMatch(match);
                  }}
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
                    ) : (
                      <>
                        <Music className="size-3.5" />
                        <span>Play</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Query Suggestions */}
      {data.queries.length > 0 ? (
        <div>
          {data.topMatches.length > 0 ? (
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted/70">
              Suggestions
            </div>
          ) : null}
          <div className="space-y-0.5">
            {data.queries.map((q, idx) => {
              const globalIdx = data.topMatches.length + idx;
              const isSelected = selectedIndex === globalIdx;
              return (
                <button
                  key={q}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectQuery(q);
                    onClose();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectQuery(q);
                    onClose();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectQuery(q);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                    isSelected ? "bg-white/15 text-white font-medium" : "hover:bg-white/10 text-fg/90",
                  )}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Search className="size-4 shrink-0 text-muted" />
                    <span className="truncate capitalize">{q}</span>
                  </div>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted/60" />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
