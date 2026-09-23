"use client";

import type { Journey } from "@/types/models";
import { formatKm, formatPct } from "@/lib/format/time";
import { DelayChart } from "@/components/journey/DelayChart";

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

  let maxDelay = 0;
  let maxDelayStop = "";
  for (const s of passedStops) {
    if ((s.delayMin ?? 0) > maxDelay) {
      maxDelay = s.delayMin!;
      maxDelayStop = s.station.name;
    }
  }

  const haltStopsCount = journey.stops.filter((s) => s.isHalt).length;
  const onTimeHaltCount = passedStops.filter((s) => s.isHalt && (s.delayMin ?? 0) <= 5).length;
  const onTimePct = passedStops.length > 0 ? Math.round((onTimeHaltCount / passedStops.length) * 100) : 100;

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Journey Completion" value={formatPct(journey.completionPct)} />
        <StatCard label="On-Time Rate" value={`${onTimePct}%`} />
        <StatCard label="Covered Distance" value={formatKm(journey.distance.coveredKm)} />
        <StatCard label="Remaining Distance" value={formatKm(journey.distance.remainingKm)} />
        <StatCard
          label="Current Delay"
          value={journey.delayMin > 0 ? `+${journey.delayMin} min` : "On time"}
        />
        <StatCard
          label="Avg Past Delay"
          value={avgDelay > 0 ? `+${avgDelay} min` : "On time"}
        />
      </div>

      {/* Delay Trend Recharts Area Graph */}
      <DelayChart stops={journey.stops} />

      {/* Route summary */}
      <div className="bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-4">
        <h3 className="text-sm font-bold text-[--text] mb-3">Route Performance Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[--text-muted]">Origin Station</span>
            <span className="font-semibold">{journey.origin.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--text-muted]">Destination Station</span>
            <span className="font-semibold">{journey.destination.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--text-muted]">Total Halts</span>
            <span className="font-tabular font-semibold">{haltStopsCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--text-muted]">Passed Halts</span>
            <span className="font-tabular font-semibold">{passedStops.filter((s) => s.isHalt).length}</span>
          </div>
          {maxDelayStop && (
            <div className="flex justify-between">
              <span className="text-[--text-muted]">Peak Delay Station</span>
              <span className="font-semibold text-[--color-delayed]">{maxDelayStop} (+{maxDelay}m)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
