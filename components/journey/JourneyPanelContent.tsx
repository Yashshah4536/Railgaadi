"use client";

import type { Journey, Stop } from "@/types/models";
import { StatusTab } from "./StatusTab";
import { StopTimeline } from "./StopTimeline";
import { InsightsTab } from "./InsightsTab";
import { clsx } from "clsx";
import { Star, StarOff, Share2, Check } from "lucide-react";
import { useState } from "react";

const TABS = [
  { id: "status", label: "Status" },
  { id: "stops", label: "Stops" },
  { id: "insights", label: "Insights" },
  { id: "explore", label: "Explore" },
] as const;

interface JourneyPanelContentProps {
  journey: Journey;
  activeTab: "status" | "stops" | "insights" | "explore";
  setActiveTab: (tab: "status" | "stops" | "insights" | "explore") => void;
  onRefresh: () => void;
  isFetching: boolean;
  myStationStop?: Stop | null;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  date?: string;
}

export function JourneyPanelContent({
  journey,
  activeTab,
  setActiveTab,
  onRefresh,
  isFetching,
  myStationStop,
  isFavourite,
  onToggleFavourite,
  date,
}: JourneyPanelContentProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/train/${journey.train.number}${
          date ? `?date=${date}` : ""
        }${myStationStop ? `&stn=${myStationStop.station.code}` : ""}`
      : "";

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${journey.train.name} (${journey.train.number})`,
          text: `Track ${journey.train.name} live on RailGaadi`,
          url,
        });
        return;
      } catch {
        // User cancelled or fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Navigation */}
      <div
        className="flex border-b border-[--border] overflow-x-auto shrink-0 bg-[--bg]"
        role="tablist"
        aria-label="Journey details tabs"
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

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "status" && (
          <StatusTab
            journey={journey}
            onRefresh={onRefresh}
            isRefreshing={isFetching}
            myStationStop={myStationStop}
          />
        )}
        {activeTab === "stops" && (
          <div className="p-4">
            <StopTimeline stops={journey.stops} />
          </div>
        )}
        {activeTab === "insights" && <InsightsTab journey={journey} />}
        {activeTab === "explore" && (
          <div className="p-8 text-center text-[--text-hint] text-sm">
            <p className="text-2xl mb-2">🏞️</p>
            <p className="font-semibold text-[--text] mb-1">Explore Landmarks</p>
            <p className="text-xs">Bridges, tunnels, rivers, and ghat sections coming in Phase 4.</p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="shrink-0 border-t border-[--border] px-4 py-3 flex items-center gap-2 bg-[--bg]">
        <button
          onClick={onToggleFavourite}
          aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[--radius-md]
                     border border-[--border] text-xs font-semibold text-[--text-muted]
                     hover:border-[--accent] hover:text-[--accent] transition-all"
        >
          {isFavourite ? (
            <Star size={14} className="fill-current text-[#FBBF24]" aria-hidden />
          ) : (
            <StarOff size={14} aria-hidden />
          )}
          {isFavourite ? "Saved" : "Save"}
        </button>

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[--radius-md]
                     border border-[--border] text-xs font-semibold text-[--text-muted]
                     hover:border-[--accent] hover:text-[--accent] transition-all"
          aria-label="Share journey link"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} aria-hidden />}
          {copied ? "Link Copied!" : "Share"}
        </button>
      </div>
    </div>
  );
}
