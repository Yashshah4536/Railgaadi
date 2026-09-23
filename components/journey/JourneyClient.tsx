"use client";

import { useTrainLive } from "@/hooks/useTrainLive";
import { useUIStore } from "@/store/ui";
import { StationPlaque } from "@/components/journey/StationPlaque";
import { ProgressRail } from "@/components/journey/ProgressRail";
import { StopTimeline } from "@/components/journey/StopTimeline";
import { RelativeTime } from "@/components/journey/RelativeTime";
import { StatusChip } from "@/components/ui/StatusChip";
import { SkeletonPanel } from "@/components/ui/Skeleton";
import {
  Star,
  StarOff,
  Share2,
  AlertCircle,
} from "lucide-react";
import { useFavourites } from "@/hooks/useFavourites";
import { useRecents } from "@/hooks/useRecents";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { clsx } from "clsx";
import type { Journey } from "@/types/models";
import { formatKm, formatPct } from "@/lib/format/time";

interface JourneyClientProps {
  trainNumber: string;
  date?: string;
  initialMyStation?: string;
}

export function JourneyClient({
  trainNumber,
  date,
  initialMyStation,
}: JourneyClientProps) {
  const { activeTab, setActiveTab, myStation, setMyStation } = useUIStore();
  const { toggleFavourite, isFavourite } = useFavourites();
  const { addRecent } = useRecents();

  // Set initial myStation from URL param
  useEffect(() => {
    if (initialMyStation && !myStation) {
      setMyStation(initialMyStation);
    }
  }, [initialMyStation, myStation, setMyStation]);

  const {
    data: journey,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useTrainLive({ trainNumber, date });

  // Announce live updates to screen readers
  const announceRef = useRef<HTMLDivElement>(null);
  const prevDelayRef = useRef<number | null>(null);
  const delayMin = journey?.delayMin;
  useEffect(() => {
    if (delayMin == null || !announceRef.current) return;
    const delta = delayMin - (prevDelayRef.current ?? delayMin);
    if (Math.abs(delta) >= 2) {
      announceRef.current.textContent = `Delay now ${delayMin} minutes`;
    }
    prevDelayRef.current = delayMin;
  }, [delayMin]);

  // Save to recents when journey loads
  const resolvedNumber = journey?.train.number;
  const resolvedName = journey?.train.name;
  useEffect(() => {
    if (resolvedNumber && resolvedName) {
      addRecent({ number: resolvedNumber, name: resolvedName });
    }
  }, [resolvedNumber, resolvedName, addRecent]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <SkeletonPanel />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle size={48} className="text-[--color-cancelled]" aria-hidden />
        <div>
          <h2 className="text-lg font-bold text-[--text]">
            {(error as Error & { code?: string }).code === "TRAIN_NOT_FOUND"
              ? "Train not found"
              : "Couldn't load train data"}
          </h2>
          <p className="text-sm text-[--text-muted] mt-1">{error.message}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-[--radius-md] text-sm font-semibold text-white"
          style={{ background: "var(--color-brand)" }}
        >
          Try again
        </button>
        <Link href="/" className="text-sm text-[--text-hint] hover:text-[--accent]">
          ← Back to search
        </Link>
      </div>
    );
  }

  if (!journey) return null;

  const fav = isFavourite(journey.train.number);
  const myStationStop = myStation
    ? journey.stops.find((s) => s.station.code === myStation)
    : null;

  function handleShare() {
    const url = `${window.location.origin}/train/${journey!.train.number}${
      date ? `?date=${date}` : ""
    }${myStation ? `&stn=${myStation}` : ""}`;
    if (navigator.share) {
      navigator.share({ title: journey!.train.name, url });
    } else {
      navigator.clipboard.writeText(url);
      // Toast would go here
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Screen reader live region */}
      <div ref={announceRef} aria-live="polite" className="sr-only" />

      {/* Tabs */}
      <div
        className="flex border-b border-[--border] overflow-x-auto shrink-0"
        role="tablist"
        aria-label="Journey information tabs"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={clsx(
              "px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors",
              "border-b-2 -mb-px",
              activeTab === t.id
                ? "border-[--accent] text-[--accent]"
                : "border-transparent text-[--text-muted] hover:text-[--text]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "status" && (
          <StatusTab
            journey={journey}
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            myStationStop={myStationStop}
          />
        )}
        {activeTab === "stops" && (
          <div className="p-4">
            <StopTimeline stops={journey.stops} />
          </div>
        )}
        {activeTab === "insights" && (
          <InsightsTab journey={journey} />
        )}
        {activeTab === "explore" && (
          <div className="p-8 text-center text-[--text-hint] text-sm">
            Explore (Phase 4)
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 border-t border-[--border] px-4 py-3 flex items-center gap-2">
        <button
          onClick={() =>
            toggleFavourite({
              number: journey.train.number,
              name: journey.train.name,
            })
          }
          aria-label={fav ? "Remove from favourites" : "Add to favourites"}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[--radius-md]
                     border border-[--border] text-xs font-semibold text-[--text-muted]
                     hover:border-[--accent] hover:text-[--accent] transition-all"
        >
          {fav ? (
            <Star size={14} className="fill-current text-[--color-plaque-bg]" aria-hidden />
          ) : (
            <StarOff size={14} aria-hidden />
          )}
          {fav ? "Saved" : "Save"}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[--radius-md]
                     border border-[--border] text-xs font-semibold text-[--text-muted]
                     hover:border-[--accent] hover:text-[--accent] transition-all"
          aria-label="Share journey link"
        >
          <Share2 size={14} aria-hidden />
          Share
        </button>
      </div>
    </div>
  );
}

function StatusTab({
  journey,
  onRefresh,
  isRefreshing,
  myStationStop,
}: {
  journey: Journey;
  onRefresh: () => void;
  isRefreshing: boolean;
  myStationStop: Journey["stops"][0] | null | undefined;
}) {
  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Status header */}
      <div className="flex items-center justify-between gap-3">
        <StatusChip status={journey.status} delayMin={journey.delayMin} />
        <RelativeTime
          iso={journey.lastUpdated}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Station plaque */}
      <StationPlaque journey={journey} />

      {/* Progress rail */}
      <ProgressRail journey={journey} />

      {/* My station countdown */}
      {myStationStop && (
        <MyStationCard stop={myStationStop} />
      )}

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Completion"
          value={formatPct(journey.completionPct)}
          sub={`${Math.round(journey.distance.coveredKm)} km covered`}
        />
        <StatCard
          label="Remaining"
          value={formatKm(journey.distance.remainingKm)}
          sub={`of ${Math.round(journey.distance.totalKm)} km`}
        />
      </div>
    </div>
  );
}

function MyStationCard({ stop }: { stop: Journey["stops"][0] }) {
  const eta = stop.expArr ?? stop.schArr;
  const minutesAway = eta
    ? Math.max(0, Math.round((new Date(eta).getTime() - Date.now()) / 60000))
    : null;

  return (
    <div
      className="rounded-[--radius-lg] p-4 border"
      style={{
        background: "var(--accent-light)",
        borderColor: "rgba(26,111,232,0.2)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-[--accent] mb-1">
        My Station
      </p>
      <p className="text-base font-bold text-[--text]">{stop.station.name}</p>
      {minutesAway !== null && (
        <p className="text-2xl font-black text-[--accent] mt-1 font-tabular">
          {minutesAway < 60
            ? `${minutesAway} min`
            : `${Math.floor(minutesAway / 60)}h ${minutesAway % 60}m`}
        </p>
      )}
      {stop.platform && (
        <p className="text-xs text-[--text-muted] mt-1">
          Platform {stop.platform}
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-4">
      <p className="text-xs text-[--text-hint] mb-1">{label}</p>
      <p className="text-xl font-bold text-[--text] font-tabular">{value}</p>
      {sub && <p className="text-xs text-[--text-muted] mt-0.5">{sub}</p>}
    </div>
  );
}

function InsightsTab({ journey }: { journey: Journey }) {
  const passedStops = journey.stops.filter((s) => s.status === "passed" && s.delayMin != null);
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
        <StatCard label="Current delay" value={journey.delayMin > 0 ? `+${journey.delayMin} min` : "On time"} />
        <StatCard label="Avg delay" value={avgDelay > 0 ? `+${avgDelay} min` : "On time"} />
        <StatCard label="Max delay" value={maxDelay > 0 ? `+${maxDelay} min` : "–"} />
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
            <span className="text-[--text-muted]">Total stops</span>
            <span className="font-tabular">{journey.stops.filter(s => s.isHalt).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--text-muted]">Stops passed</span>
            <span className="font-tabular">{journey.stops.filter(s => s.status === "passed").length}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-[--text-hint]">
        Delay chart & elevation profile coming in Phase 4
      </p>
    </div>
  );
}

const TABS = [
  { id: "status", label: "Status" },
  { id: "stops", label: "Stops" },
  { id: "insights", label: "Insights" },
  { id: "explore", label: "Explore" },
] as const;
