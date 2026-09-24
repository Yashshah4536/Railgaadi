"use client";

import { useRecents } from "@/hooks/useRecents";
import { Clock, X } from "lucide-react";
import Link from "next/link";

export function RecentsSection() {
  const { recents, removeRecent } = useRecents();
  if (recents.length === 0) return null;

  return (
    <section aria-labelledby="recents-heading">
      <h2
        id="recents-heading"
        className="text-xs font-bold uppercase tracking-wider text-[--text-hint] mb-3 flex items-center gap-1.5"
      >
        <Clock size={12} aria-hidden />
        Recent Searches
      </h2>
      <div className="flex flex-col gap-1">
        {recents.map((r) => (
          <div key={r.number} className="flex items-center gap-2 group">
            <Link
              href={`/train/${r.number}`}
              className="flex-1 flex items-center gap-3 px-3.5 py-3 rounded-[--radius-md]
                         hover:bg-[--bg-input] active:bg-[--bg-input] transition-colors min-h-[46px]"
            >
              <span className="text-xs sm:text-sm font-mono font-black text-[--accent] bg-[--accent-light] px-2 py-0.5 rounded font-tabular">
                {r.number}
              </span>
              <span className="text-sm sm:text-base font-semibold text-[--text] truncate">{r.name}</span>
            </Link>
            <button
              onClick={() => removeRecent(r.number)}
              aria-label={`Remove ${r.name} from recents`}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full opacity-70 sm:opacity-0 sm:group-hover:opacity-100
                         hover:bg-[--bg-input] active:bg-[--bg-input] transition-all"
            >
              <X size={15} className="text-[--text-hint]" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
