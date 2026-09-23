"use client";

import Link from "next/link";
import { Train, ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
import { SearchCombobox } from "@/components/search/SearchCombobox";
import { clsx } from "clsx";

interface TopBarProps {
  trainNumber: string;
}

export function TopBar({ trainNumber }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className="shrink-0 h-14 px-4 flex items-center gap-3 border-b border-[--border] bg-[--bg]/90 backdrop-blur-md z-20"
      style={{ backdropFilter: "blur(12px)" }}
    >
      {/* Back button */}
      <Link
        href="/"
        className="flex items-center justify-center w-9 h-9 rounded-[--radius-md]
                   hover:bg-[--bg-input] transition-colors shrink-0"
        aria-label="Back to home"
      >
        <ArrowLeft size={18} className="text-[--text-muted]" aria-hidden />
      </Link>

      {/* Logo + train number */}
      {!searchOpen && (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--color-brand)" }}
          >
            <Train size={14} color="white" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black font-tabular leading-none">
              <span style={{ color: "var(--color-brand)" }}>Rail</span>
              <span>Gaadi</span>
            </p>
            <p className="text-[11px] text-[--text-hint] font-mono font-tabular leading-none mt-0.5">
              #{trainNumber}
            </p>
          </div>
        </div>
      )}

      {/* Inline search (when expanded) */}
      {searchOpen && (
        <div className="flex-1 min-w-0">
          <SearchCombobox autoFocus placeholder="Search another train…" />
        </div>
      )}

      {/* Search toggle */}
      <button
        onClick={() => setSearchOpen((v) => !v)}
        className={clsx(
          "flex items-center justify-center w-9 h-9 rounded-[--radius-md]",
          "transition-colors shrink-0",
          searchOpen
            ? "bg-[--accent-light] text-[--accent]"
            : "hover:bg-[--bg-input] text-[--text-muted]"
        )}
        aria-label={searchOpen ? "Close search" : "Search another train"}
        aria-expanded={searchOpen}
      >
        <Search size={16} aria-hidden />
      </button>
    </header>
  );
}
