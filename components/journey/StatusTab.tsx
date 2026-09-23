"use client";

import type { Journey, Stop } from "@/types/models";
import { StatusChip } from "@/components/ui/StatusChip";
import { RelativeTime } from "@/components/journey/RelativeTime";
import { StationPlaque } from "@/components/journey/StationPlaque";
import { ProgressRail } from "@/components/journey/ProgressRail";
import { formatTime } from "@/lib/format/time";
import { Clock, MapPin } from "lucide-react";

interface StatusTabProps {
  journey: Journey;
  onRefresh: () => void;
  isRefreshing: boolean;
  myStationStop?: Stop | null;
}

export function StatusTab({
  journey,
  onRefresh,
  isRefreshing,
  myStationStop,
}: StatusTabProps) {
  const nextStop = journey.stops.find((s) => s.station.code === journey.nextStop);

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Status header with live pulse chip and relative time */}
      <div className="flex items-center justify-between gap-3">
        <StatusChip status={journey.status} delayMin={journey.delayMin} />
        <RelativeTime
          iso={journey.lastUpdated}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Station plaque (iconic Indian Railways yellow board) */}
      <StationPlaque journey={journey} />

      {/* Progress rail with station halt ticks */}
      <div className="bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-[--text-muted] mb-2.5">
          <span>Journey Progress</span>
          <span className="font-bold text-[--text] font-tabular">
            {Math.round(journey.completionPct)}%
          </span>
        </div>
        <ProgressRail journey={journey} />
      </div>

      {/* My Station Countdown Card (if set) */}
      {myStationStop && (
        <div className="bg-[--accent-light] border border-[--accent]/30 rounded-[--radius-lg] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[--accent] flex items-center gap-1">
              <MapPin size={12} /> My Station
            </span>
            <p className="text-base font-bold text-[--text] mt-0.5">
              {myStationStop.station.name} ({myStationStop.station.code})
            </p>
            <p className="text-xs text-[--text-muted] mt-0.5">
              Expected Arr: {myStationStop.expArr ? formatTime(myStationStop.expArr) : "--"}
              {myStationStop.platform ? ` · Pf ${myStationStop.platform}` : ""}
            </p>
          </div>
          {myStationStop.delayMin != null && myStationStop.delayMin > 0 && (
            <div className="text-right">
              <span className="text-xs font-bold text-[--color-delayed] bg-[--color-delayed-bg] px-2 py-1 rounded-md">
                +{myStationStop.delayMin}m
              </span>
            </div>
          )}
        </div>
      )}

      {/* Next station quick summary card */}
      {nextStop && (
        <div className="bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-3.5 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[--bg-input] flex items-center justify-center text-[--accent]">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-xs text-[--text-muted]">Upcoming Stop</p>
              <p className="font-bold text-[--text]">{nextStop.station.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[--text-muted]">ETA</p>
            <p className="font-bold text-[--text] font-tabular">
              {nextStop.expArr ? formatTime(nextStop.expArr) : nextStop.schArr ? formatTime(nextStop.schArr) : "--"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
