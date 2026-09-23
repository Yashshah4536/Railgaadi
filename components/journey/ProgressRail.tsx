"use client";

import type { Journey } from "@/types/models";
import { clsx } from "clsx";

interface ProgressRailProps {
  journey: Journey;
  className?: string;
}

export function ProgressRail({ journey, className }: ProgressRailProps) {
  const { completionPct, distance, stops } = journey;

  // Only show halt stations as ticks
  const haltStops = stops.filter((s) => s.isHalt);
  const totalKm = distance.totalKm;

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {/* Rail container */}
      <div
        className="relative h-2 rounded-full overflow-visible"
        style={{ background: "var(--color-route-remaining)" }}
        role="progressbar"
        aria-valuenow={Math.round(completionPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Journey ${Math.round(completionPct)}% complete`}
      >
        {/* Filled portion */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000"
          style={{
            width: `${Math.min(completionPct, 100)}%`,
            background:
              "linear-gradient(90deg, var(--color-brand-dark), var(--color-brand))",
          }}
        />

        {/* Station ticks */}
        {haltStops.map((stop) => {
          const pct = totalKm > 0 ? (stop.distanceKm / totalKm) * 100 : 0;
          const isPassed = stop.status === "passed";
          const isCurrent = stop.status === "current";

          return (
            <div
              key={stop.station.code}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pct}%` }}
              title={stop.station.name}
            >
              <div
                className="rounded-full"
                style={{
                  width: isCurrent ? 14 : 6,
                  height: isCurrent ? 14 : 8,
                  background: isCurrent
                    ? "var(--color-plaque-bg)"
                    : "white",
                  border: `2px solid ${
                    isPassed
                      ? "var(--color-brand)"
                      : isCurrent
                      ? "#92400E"
                      : "var(--color-route-remaining)"
                  }`,
                  transition: "all 300ms ease",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Distance labels */}
      <div className="flex justify-between text-[11px] text-[--text-hint] font-tabular">
        <span>{journey.origin.name.split(" ")[0]}</span>
        <span className="text-[--text-muted] font-semibold">
          {Math.round(distance.coveredKm)} km /{" "}
          {Math.round(distance.totalKm)} km
        </span>
        <span>{journey.destination.name.split(" ")[0]}</span>
      </div>
    </div>
  );
}
