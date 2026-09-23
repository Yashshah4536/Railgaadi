"use client";

import type { Journey } from "@/types/models";
import { formatKm, formatPct } from "@/lib/format/time";

interface InsightsTabProps {
  journey: Journey;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-3 flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-[--text-muted]">{label}</span>
      <span className="text-lg font-black text-[--text] font-tabular">{value}</span>
    </div>
  );
}

export function InsightsTab({ journey }: InsightsTabProps) {
  const passedStops = journey.stops.filter((s) => s.status === "passed");
  const avgDelay =
    passedStops.length > 0
      ? Math.round(
          passedStops.reduce((a, b) => a + (b.delayMin ?? 0), 0) / passedStops.length
        )
      : 0;
  const maxDelay = Math.max(...passedStops.map((s) => s.delayMin ?? 0), 0);

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Completion" value={formatPct(journey.completionPct)} />
        <StatCard label="Total distance" value={formatKm(journey.distance.totalKm)} />
        <StatCard label="Covered" value={formatKm(journey.distance.coveredKm)} />
        <StatCard
          label="Current delay"
          value={journey.delayMin > 0 ? `+${journey.delayMin} min` : "On time"}
        />
        <StatCard
          label="Avg delay"
          value={avgDelay > 0 ? `+${avgDelay} min` : "On time"}
        />
        <StatCard
          label="Max delay"
          value={maxDelay > 0 ? `+${maxDelay} min` : "–"}
        />
      </div>

      {/* Route summary */}
      <div className="bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-4">
        <h3 className="text-sm font-bold text-[--text] mb-3">Route Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[--text-muted]">From</span>
            <span className="font-semibold">{journey.origin.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--text-muted]">To</span>
            <span className="font-semibold">{journey.destination.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--text-muted]">Total halts</span>
            <span className="font-tabular">
              {journey.stops.filter((s) => s.isHalt).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--text-muted]">Passed halts</span>
            <span className="font-tabular">
              {journey.stops.filter((s) => s.status === "passed" && s.isHalt).length}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-[--text-hint]">
        Delay chart & elevation profile coming in Phase 3/4
      </p>
    </div>
  );
}
