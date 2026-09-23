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
              className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-[--radius-md]
                         hover:bg-[--bg-input] transition-colors"
            >
              <span className="text-xs font-mono font-bold text-[--text-hint] font-tabular w-12">
                {r.number}
              </span>
              <span className="text-sm text-[--text-muted] truncate">{r.name}</span>
            </Link>
            <button
              onClick={() => removeRecent(r.number)}
              aria-label={`Remove ${r.name} from recents`}
              className="shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100
                         hover:bg-[--bg-input] transition-all"
            >
              <X size={13} className="text-[--text-hint]" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
