"use client";

import { useState, useEffect } from "react";
import type { Journey, Stop } from "@/types/models";
import { StatusChip } from "@/components/ui/StatusChip";
import { RelativeTime } from "@/components/journey/RelativeTime";
import { StationPlaque } from "@/components/journey/StationPlaque";
import { ProgressRail } from "@/components/journey/ProgressRail";
import { WeatherTrio } from "@/components/journey/WeatherTrio";
import { formatTime } from "@/lib/format/time";
import { Clock, MapPin, CheckCircle2 } from "lucide-react";

interface StatusTabProps {
  journey: Journey;
  onRefresh: () => void;
  isRefreshing: boolean;
  myStationStop?: Stop | null;
}

function formatCountdown(targetIso?: string | null): string {
  if (!targetIso) return "--";
  const diffMs = new Date(targetIso).getTime() - Date.now();
  if (diffMs <= 0) return "Arrived";
  const totalMin = Math.round(diffMs / 60000);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} min`;
}

export function StatusTab({
  journey,
  onRefresh,
  isRefreshing,
  myStationStop,
}: StatusTabProps) {
  const nextStop = journey.stops.find((s) => s.station.code === journey.nextStop);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    if (!myStationStop) return;
    const target = myStationStop.expArr ?? myStationStop.schArr;
    setCountdown(formatCountdown(target));

    const interval = setInterval(() => {
      setCountdown(formatCountdown(target));
    }, 30000); // tick every 30s
    return () => clearInterval(interval);
  }, [myStationStop]);

  const targetArr = myStationStop?.expArr ?? myStationStop?.schArr;
  const isArrived = myStationStop?.status === "passed";

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

      {/* My Station Countdown Card (PRD F1.5 & Phase 3) */}
      {myStationStop && (
        <div className="bg-[--accent-light] border-2 border-[--accent] rounded-[--radius-lg] p-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[--accent] flex items-center gap-1">
              <MapPin size={12} /> My Station
            </span>
            <span className="text-xs font-bold text-[--accent] bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-[--accent]/30">
              {isArrived ? (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <CheckCircle2 size={12} /> Reached
                </span>
              ) : (
                `Arriving in ${countdown}`
              )}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <p className="text-lg font-black text-[--text] leading-snug">
                {myStationStop.station.name}
              </p>
              <p className="text-xs text-[--text-muted]">
                Code: <span className="font-bold">{myStationStop.station.code}</span>
                {myStationStop.platform ? ` · Platform ${myStationStop.platform}` : ""}
              </p>
            </div>

            <div className="text-right font-tabular">
              <p className="text-xs text-[--text-hint]">Expected Time</p>
              <p className="text-base font-bold text-[--text]">
                {targetArr ? formatTime(targetArr) : "--"}
              </p>
            </div>
          </div>

          {myStationStop.delayMin != null && myStationStop.delayMin > 0 && (
            <div className="mt-2.5 pt-2 border-t border-[--accent]/20 flex items-center justify-between text-xs">
              <span className="text-[--text-muted]">Scheduled: {myStationStop.schArr ? formatTime(myStationStop.schArr) : "--"}</span>
              <span className="font-bold text-[--color-delayed]">
                +{myStationStop.delayMin} min delay
              </span>
            </div>
          )}
        </div>
      )}

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

      {/* Next station quick summary card */}
      {nextStop && (
        <div className="bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-3.5 flex items-center justify-between text-sm shadow-[var(--shadow-xs)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[--accent-light] flex items-center justify-center text-[--accent] shrink-0">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-[--text-hint] uppercase tracking-wider">
                Upcoming Stop
              </span>
              <p className="font-bold text-sm sm:text-base text-[--text] truncate">
                {nextStop.station.name}
              </p>
              {nextStop.platform && (
                <span className="inline-block text-[11px] font-bold text-amber-900 bg-amber-100 dark:bg-amber-950 dark:text-amber-200 px-1.5 py-0.2 rounded border border-amber-300/60 mt-0.5">
                  Platform {nextStop.platform}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-bold text-[--text-hint] uppercase tracking-wider">
              ETA
            </span>
            <p className="font-black text-sm sm:text-base text-[--text] font-tabular">
              {nextStop.expArr ? formatTime(nextStop.expArr) : nextStop.schArr ? formatTime(nextStop.schArr) : "--"}
            </p>
            {nextStop.delayMin != null && nextStop.delayMin > 0 && (
              <span className="text-[11px] font-bold text-[--color-delayed] font-tabular block">
                +{nextStop.delayMin}m delay
              </span>
            )}
          </div>
        </div>
      )}

      {/* Weather Trio (Source, Train Location, Destination) */}
      <WeatherTrio journey={journey} />
    </div>
  );
}
