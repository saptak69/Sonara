import { useRef, useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { SearchSuggestions } from "@/components/search-suggestions";
import { cn } from "@/lib/utils";

/**
 * The big search box used on the Search page: input, clear button and live suggestions.
 * The parent owns the text and decides what "run this search" means.
 */
export function SearchField({
  value,
  onChange,
  onSearch,
  placeholder = "What do you want to listen to?",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const run = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setOpen(false);
    inputRef.current?.blur();
    onSearch(trimmed);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    run(value);
  };

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={onSubmit} role="search">
        <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search songs, artists and albums"
          aria-expanded={open}
          placeholder={placeholder}
          className="h-14 w-full rounded-2xl border border-border bg-surface pr-12 pl-13 text-base text-fg outline-none transition placeholder:text-subtle focus:border-accent/60 focus:bg-surface-2 focus:ring-4 focus:ring-accent/15 [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onChange("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition hover:bg-hover hover:text-fg"
          >
            <X className="size-4.5" />
          </button>
        ) : null}
      </form>
      <SearchSuggestions
        query={value}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelectQuery={(q) => {
          onChange(q);
          run(q);
        }}
      />
    </div>
  );
}
