"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useTrainLive } from "@/hooks/useTrainLive";
import { useUIStore } from "@/store/ui";
import { useFavourites } from "@/hooks/useFavourites";
import { useRecents } from "@/hooks/useRecents";
import { SkeletonPanel } from "@/components/ui/Skeleton";
import { StatusChip } from "@/components/ui/StatusChip";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { JourneyPanelContent } from "@/components/journey/JourneyPanelContent";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

// Dynamic client-only import for MapLibre map
const JourneyMap = dynamic(() => import("@/components/map/JourneyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#E2E8F0] gap-3">
      <div className="w-8 h-8 rounded-full border-3 border-[--color-brand] border-t-transparent animate-spin" />
      <span className="text-xs font-semibold text-[--text-muted]">Loading map...</span>
    </div>
  ),
});

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
      <div className="w-full h-full overflow-y-auto">
        <SkeletonPanel />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-[--bg]">
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
  const nextStop = journey.stops.find((s) => s.station.code === journey.nextStop);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Screen reader live region */}
      <div ref={announceRef} aria-live="polite" className="sr-only" />

      {/* Desktop Layout: Split view (panel on left, map on right) */}
      <div className="hidden lg:flex w-full h-full">
        {/* Left Side Panel */}
        <aside
          className="w-[440px] shrink-0 border-r border-[--border] bg-[--bg] flex flex-col h-full overflow-hidden shadow-lg z-10"
          aria-label="Journey details"
        >
          <JourneyPanelContent
            journey={journey}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onRefresh={() => refetch()}
            isFetching={isFetching}
            myStationStop={myStationStop}
            isFavourite={fav}
            onToggleFavourite={() =>
              toggleFavourite({
                number: journey.train.number,
                name: journey.train.name,
              })
            }
            date={date}
          />
        </aside>

        {/* Right Side Map */}
        <div className="flex-1 h-full relative bg-[#E2E8F0]">
          <JourneyMap
            journey={journey}
            padding={{ top: 50, bottom: 50, left: 50, right: 50 }}
          />
        </div>
      </div>

      {/* Mobile Layout: Full-screen map with draggable bottom sheet */}
      <div className="lg:hidden w-full h-full relative">
        {/* Full-screen background map */}
        <div className="absolute inset-0 z-0 bg-[#E2E8F0]">
          <JourneyMap
            journey={journey}
            padding={{ top: 30, bottom: 220, left: 20, right: 20 }}
          />
        </div>

        {/* Draggable Bottom Sheet */}
        <BottomSheet
          snapPoint="half"
          peekHeader={
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold text-[--text] truncate">
                  {journey.train.name}
                </div>
                <div className="text-[11px] text-[--text-muted]">
                  Next: {nextStop?.station.name ?? "–"}
                </div>
              </div>
              <StatusChip status={journey.status} delayMin={journey.delayMin} />
            </div>
          }
        >
          <JourneyPanelContent
            journey={journey}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onRefresh={() => refetch()}
            isFetching={isFetching}
            myStationStop={myStationStop}
            isFavourite={fav}
            onToggleFavourite={() =>
              toggleFavourite({
                number: journey.train.number,
                name: journey.train.name,
              })
            }
            date={date}
          />
        </BottomSheet>
      </div>
    </div>
  );
}
