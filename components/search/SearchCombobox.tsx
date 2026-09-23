"use client";

import { useRef, useState, useId, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useTrainSearch } from "@/hooks/useTrainSearch";
import { useRouter } from "next/navigation";
import { useRecents } from "@/hooks/useRecents";
import { trackSearch } from "@/lib/analytics";
import type { TrainSummary } from "@/types/models";

interface SearchComboboxProps {
  onSelect?: (train: TrainSummary) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export function SearchCombobox({
  onSelect,
  autoFocus = false,
  placeholder = "Train number or name",
}: SearchComboboxProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const router = useRouter();
  const { query, setQuery, results, isLoading, isActive } = useTrainSearch();
  const { recents, addRecent } = useRecents();

  // Track search completions
  useEffect(() => {
    if (query.trim().length >= 2 && !isLoading) {
      trackSearch(query.trim(), results.length);
    }
  }, [query, isLoading, results.length]);

  // Show recents when not searching
  const showRecents = !isActive && recents.length > 0;
  const suggestions = isActive ? results : [];

  function handleSelect(train: TrainSummary) {
    addRecent({ number: train.number, name: train.name });
    setOpen(false);
    setQuery("");
    onSelect?.(train);
    router.push(`/train/${train.number}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const items = suggestions;
    if (!open || items.length === 0) {
      if (e.key === "Enter" && /^\d{5}$/.test(query.trim())) {
        router.push(`/train/${query.trim()}`);
        addRecent({ number: query.trim(), name: query.trim() });
        setQuery("");
        setOpen(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIdx >= 0 && items[activeIdx]) handleSelect(items[activeIdx]);
        else if (/^\d{5}$/.test(query.trim())) {
          router.push(`/train/${query.trim()}`);
          setQuery("");
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIdx(-1);
        break;
    }
  }

  useEffect(() => {
    setActiveIdx(-1);
  }, [results]);

  return (
    <div
      className="relative w-full"
      role="combobox"
      aria-expanded={open}
      aria-controls={listId}
      aria-haspopup="listbox"
    >
      {/* Input */}
      <div
        className={clsx(
          "flex items-center gap-3 h-14 px-5 rounded-[--radius-xl]",
          "bg-[--bg] border transition-all duration-150",
          "shadow-[var(--shadow-md)]",
          open
            ? "border-[--accent] shadow-[var(--shadow-lg),0_0_0_3px_var(--accent-light)]"
            : "border-[--border]"
        )}
      >
        {isLoading ? (
          <Loader2
            size={20}
            className="text-[--accent] shrink-0 animate-spin"
            aria-hidden
          />
        ) : (
          <Search size={20} className="text-[--text-hint] shrink-0" aria-hidden />
        )}

        <input
          ref={inputRef}
          id="train-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={
            activeIdx >= 0 ? `suggestion-${activeIdx}` : undefined
          }
          className={clsx(
            "flex-1 min-w-0 bg-transparent outline-none",
            "text-base text-[--text] placeholder:text-[--text-hint]",
            "font-tabular"
          )}
        />

        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="shrink-0 p-1 rounded-full hover:bg-[--bg-input] transition-colors"
            aria-label="Clear search"
          >
            <X size={16} className="text-[--text-hint]" aria-hidden />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (isActive || showRecents) && (
        <div
          id={listId}
          role="listbox"
          aria-label="Train suggestions"
          className={clsx(
            "absolute top-[calc(100%+8px)] left-0 right-0 z-50",
            "bg-[--bg] border border-[--border] rounded-[--radius-lg]",
            "shadow-[var(--shadow-lg)] overflow-hidden",
            "max-h-80 overflow-y-auto"
          )}
        >
          {/* Section header */}
          {showRecents && !isActive && (
            <div className="px-4 pt-3 pb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[--text-hint]">
                Recent
              </span>
            </div>
          )}

          {/* No results */}
          {isActive && !isLoading && suggestions.length === 0 && (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-[--text-muted]">
                No train found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-[--text-hint] mt-1">
                Try the 5-digit train number, e.g. 12951
              </p>
            </div>
          )}

          {/* Suggestions or Recents */}
          {(isActive ? suggestions : recents.map(r => ({ number: r.number, name: r.name }))).map(
            (item, idx) => (
              <SuggestionRow
                key={item.number}
                id={`suggestion-${idx}`}
                number={item.number}
                name={item.name}
                query={isActive ? query : ""}
                isActive={activeIdx === idx}
                onSelect={() => handleSelect(item)}
                onMouseEnter={() => setActiveIdx(idx)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionRow({
  id,
  number,
  name,
  query,
  isActive,
  onSelect,
  onMouseEnter,
}: {
  id: string;
  number: string;
  name: string;
  query: string;
  isActive: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <button
      id={id}
      role="option"
      aria-selected={isActive}
      type="button"
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      className={clsx(
        "w-full text-left px-4 py-3 flex items-center gap-3",
        "transition-colors duration-75",
        isActive ? "bg-[--bg-input]" : "hover:bg-[--bg-card]"
      )}
    >
      {/* Number badge */}
      <span
        className="shrink-0 text-xs font-mono font-bold text-[--accent]
                   bg-[--accent-light] px-2 py-0.5 rounded-md font-tabular"
      >
        {number}
      </span>
      {/* Name with highlight */}
      <span className="flex-1 min-w-0 text-sm text-[--text] truncate">
        <HighlightedText text={name} query={query} />
      </span>
    </button>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        className="bg-[--accent-light] text-[--accent] rounded-sm"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
