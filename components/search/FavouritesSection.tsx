"use client";

import { useFavourites } from "@/hooks/useFavourites";
import { Star } from "lucide-react";
import Link from "next/link";

export function FavouritesSection() {
  const { favourites } = useFavourites();
  if (favourites.length === 0) return null;

  return (
    <section aria-labelledby="favourites-heading">
      <h2
        id="favourites-heading"
        className="text-xs font-bold uppercase tracking-wider text-[--text-hint] mb-3 flex items-center gap-1.5"
      >
        <Star size={12} aria-hidden />
        Favourites
      </h2>
      <div className="flex flex-col gap-2">
        {favourites.map((t) => (
          <Link
            key={t.number}
            href={`/train/${t.number}`}
            className="flex items-center gap-3 p-3 rounded-[--radius-lg] border border-[--border]
                       bg-[--bg-card] hover:border-[--accent] hover:shadow-[var(--shadow-sm)]
                       transition-all duration-150 group"
          >
            <span
              className="text-xs font-mono font-bold text-[--accent] bg-[--accent-light]
                         px-2 py-0.5 rounded-md font-tabular shrink-0"
            >
              {t.number}
            </span>
            <span className="flex-1 min-w-0 text-sm font-medium text-[--text] truncate">
              {t.name}
            </span>
            <Star
              size={14}
              className="text-[--color-plaque-bg] shrink-0 fill-current"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
