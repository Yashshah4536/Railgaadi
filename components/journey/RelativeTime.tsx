"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/format/time";
import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";

interface RelativeTimeProps {
  iso: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function RelativeTime({
  iso,
  onRefresh,
  isRefreshing = false,
  className,
}: RelativeTimeProps) {
  const [label, setLabel] = useState(() => formatRelativeTime(iso));

  // Tick every 30s
  useEffect(() => {
    setLabel(formatRelativeTime(iso));
    const interval = setInterval(() => {
      setLabel(formatRelativeTime(iso));
    }, 30_000);
    return () => clearInterval(interval);
  }, [iso]);

  // Warn if data is stale (>15 min)
  const isStale =
    Date.now() - new Date(iso).getTime() > 15 * 60 * 1000;

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <span
        className={clsx(
          "text-xs",
          isStale ? "text-[--color-delayed] font-semibold" : "text-[--text-hint]"
        )}
      >
        {isStale && "⚠ "}
        {label}
        {isStale && " · Live data may be outdated"}
      </span>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh live status"
          className={clsx(
            "p-1 rounded-md hover:bg-[--bg-input] transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <RefreshCw
            size={13}
            className={clsx(
              "text-[--text-hint]",
              isRefreshing && "animate-spin"
            )}
            aria-hidden
          />
        </button>
      )}
    </div>
  );
}
