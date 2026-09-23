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
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                {/* Station info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={clsx(
                        "text-sm font-semibold",
                        isCurrent
                          ? "text-[--color-brand]"
                          : isPassed
                          ? "text-[--text-muted]"
                          : "text-[--text]"
                      )}
                    >
                      {stop.station.name}
                    </span>
                    <span className="text-[11px] text-[--text-hint] font-mono">
                      {stop.station.code}
                    </span>
                    {isCurrent && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "var(--color-plaque-bg)",
                          color: "var(--color-plaque-sub)",
                        }}
                      >
                        HERE
                      </span>
                    )}
                  </div>

                  {/* Platform + halt */}
                  <div className="flex items-center gap-2 mt-0.5">
                    {stop.platform && (
                      <span className="text-[11px] text-[--text-hint]">
                        Pf {stop.platform}
                      </span>
                    )}
                    {stop.haltMin != null && stop.haltMin > 0 && (
                      <span className="text-[11px] text-[--text-hint]">
                        · {stop.haltMin} min halt
                      </span>
                    )}
                    {stop.distanceKm > 0 && (
                      <span className="text-[11px] text-[--text-hint] font-tabular">
                        · {Math.round(stop.distanceKm)} km
                      </span>
                    )}
                  </div>
                </div>

                {/* Time info */}
                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  {/* Scheduled time */}
                  <span
                    className={clsx(
                      "text-sm font-tabular font-semibold",
                      isPassed ? "text-[--text-hint] line-through" : "text-[--text]"
                    )}
                  >
                    {formatTime(stop.schArr ?? stop.schDep)}
                  </span>

                  {/* Expected / actual time if different */}
                  {stop.expArr && stop.expArr !== stop.schArr && (
                    <span
                      className="text-xs font-tabular"
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
