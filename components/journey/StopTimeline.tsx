"use client";

import { useRef, useEffect } from "react";
import type { Stop } from "@/types/models";
import { clsx } from "clsx";
import { formatTime } from "@/lib/format/time";
import { StatusChip } from "@/components/ui/StatusChip";

interface StopTimelineProps {
  stops: Stop[];
}

export function StopTimeline({ stops }: StopTimelineProps) {
  const currentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current station on mount
  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Show all halts + current non-halt if current
  const filtered = stops.filter(
    (s) => s.isHalt || s.status === "current"
  );

  return (
    <div className="flex flex-col" role="list" aria-label="Station timeline">
      {filtered.map((stop, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === filtered.length - 1;
        const isPassed = stop.status === "passed";
        const isCurrent = stop.status === "current";
        const isSkipped = stop.status === "skipped";

        return (
          <div
            key={stop.station.code}
            ref={isCurrent ? currentRef : undefined}
            role="listitem"
            className={clsx(
              "flex items-start gap-3 py-3 relative",
              isSkipped && "opacity-50"
            )}
          >
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center shrink-0 w-6 mt-1">
              {/* Top connector */}
              {!isFirst && (
                <div
                  className="w-0.5 h-3 -mt-3 mb-0"
                  style={{
                    background: isPassed || isCurrent
                      ? "var(--color-brand)"
                      : "var(--border)",
                  }}
                />
              )}

              {/* Dot */}
              <div className="relative flex items-center justify-center">
                {isCurrent && (
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: 24,
                      height: 24,
                      background: "var(--color-plaque-bg)",
                      opacity: 0.3,
                      animation: "pulse-ring 1.5s ease-out infinite",
                    }}
                    aria-hidden
                  />
                )}
                <div
                  className="rounded-full z-10 relative"
                  style={{
                    width: isCurrent ? 14 : isFirst || isLast ? 12 : 10,
                    height: isCurrent ? 14 : isFirst || isLast ? 12 : 10,
                    background: isCurrent
                      ? "var(--color-plaque-bg)"
                      : isPassed
                      ? "var(--color-brand)"
                      : "white",
                    border: `2px solid ${
                      isCurrent
                        ? "#92400E"
                        : isPassed
                        ? "var(--color-brand)"
                        : "var(--border)"
                    }`,
                    transition: "all 200ms ease",
                  }}
                />
              </div>

              {/* Bottom connector */}
              {!isLast && (
                <div
                  className="w-0.5 flex-1 mt-0 min-h-[16px]"
                  style={{
                    background: isPassed
                      ? "var(--color-brand)"
                      : "var(--border)",
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div
              className={clsx(
                "flex-1 min-w-0 transition-colors rounded-xl p-2",
                isCurrent && "bg-[--accent-light]/30 border border-[--accent]/30 shadow-[var(--shadow-xs)]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Station info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={clsx(
                        "text-sm sm:text-base font-bold tracking-tight",
                        isCurrent
                          ? "text-[--accent]"
                          : isPassed
                          ? "text-[--text-muted]"
                          : "text-[--text]"
                      )}
                    >
                      {stop.station.name}
                    </span>
                    <span className="text-xs text-[--text-hint] font-mono font-bold">
                      {stop.station.code}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#1C1917] text-[#FBBF24]">
                        CURRENT STOP
                      </span>
                    )}
                  </div>

                  {/* Platform + halt details */}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {stop.platform && (
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                        Platform {stop.platform}
                      </span>
                    )}
                    {stop.haltMin != null && stop.haltMin > 0 && (
                      <span className="text-xs text-[--text-hint] font-medium">
                        {stop.haltMin}m halt
                      </span>
                    )}
                    {stop.distanceKm > 0 && (
                      <span className="text-xs text-[--text-hint] font-tabular">
                        · {Math.round(stop.distanceKm)} km
                      </span>
                    )}
                  </div>
                </div>

                {/* Time info */}
                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  {/* Scheduled time */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[--text-hint] uppercase">Sch</span>
                    <span
                      className={clsx(
                        "text-sm font-tabular font-bold",
                        isPassed ? "text-[--text-hint] line-through" : "text-[--text]"
                      )}
                    >
                      {formatTime(stop.schArr ?? stop.schDep)}
                    </span>
                  </div>

                  {/* Expected / actual time if different */}
                  {stop.expArr && stop.expArr !== stop.schArr && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[--text-hint] uppercase">Live</span>
                      <span
                        className="text-xs sm:text-sm font-tabular font-bold"
                        style={{
                          color:
                            (stop.delayMin ?? 0) > 30
                              ? "var(--color-late)"
                              : (stop.delayMin ?? 0) > 5
                              ? "var(--color-delayed)"
                              : "var(--color-on-time)",
                        }}
                      >
                        {formatTime(stop.expArr)}
                      </span>
                    </div>
                  )}

                  {/* Delay chip */}
                  {stop.delayMin != null && stop.delayMin > 5 && (
                    <StatusChip
                      status="delayed"
                      delayMin={stop.delayMin}
                      size="sm"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
