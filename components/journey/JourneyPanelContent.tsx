"use client";

import type { Journey, Stop } from "@/types/models";
import { StatusTab } from "./StatusTab";
import { StopTimeline } from "./StopTimeline";
import { InsightsTab } from "./InsightsTab";
import { ExploreTab } from "./ExploreTab";
import { clsx } from "clsx";
import { Star, StarOff, Share2, Check } from "lucide-react";
import { useState } from "react";
import { trackTabSwitch, trackShare, trackFavourite } from "@/lib/analytics";

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
    trackShare(journey.train.number, myStationStop?.station.code);
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
        className="flex border-b border-[--border] shrink-0 bg-[--bg] px-2"
        role="tablist"
        aria-label="Journey details tabs"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => {
              trackTabSwitch(t.id);
              setActiveTab(t.id as typeof activeTab);
            }}
            className={clsx(
              "flex-1 py-3 px-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150",
              "flex items-center justify-center min-h-[46px] border-b-2 -mb-px",
              activeTab === t.id
                ? "border-[--accent] text-[--accent] bg-[--accent-light]/20"
                : "border-transparent text-[--text-muted] hover:text-[--text] hover:bg-[--bg-input]/40"
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
        {activeTab === "explore" && <ExploreTab journey={journey} />}
      </div>

      {/* Bottom Action Bar */}
      <div
        className="shrink-0 border-t border-[--border] px-4 pt-3 flex items-center gap-3 bg-[--bg]"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          onClick={() => {
            trackFavourite(journey.train.number, isFavourite ? "remove" : "add");
            onToggleFavourite();
          }}
          aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
          className="flex-1 h-11 flex items-center justify-center gap-2 px-4 rounded-[--radius-md]
                     border border-[--border] text-sm font-bold text-[--text]
                     hover:border-[--accent] hover:text-[--accent] hover:bg-[--bg-input]/50
                     active:scale-[0.98] transition-all"
        >
          {isFavourite ? (
            <Star size={16} className="fill-current text-[#FBBF24]" aria-hidden />
          ) : (
            <StarOff size={16} aria-hidden />
          )}
          {isFavourite ? "Saved" : "Save Train"}
        </button>

        <button
          onClick={handleShare}
          className="flex-1 h-11 flex items-center justify-center gap-2 px-4 rounded-[--radius-md]
                     border border-[--border] text-sm font-bold text-[--text]
                     hover:border-[--accent] hover:text-[--accent] hover:bg-[--bg-input]/50
                     active:scale-[0.98] transition-all"
          aria-label="Share journey link"
        >
          {copied ? (
            <Check size={16} className="text-green-600" />
          ) : (
            <Share2 size={16} aria-hidden />
          )}
          {copied ? "Link Copied!" : "Share Live"}
        </button>
      </div>
    </div>
  );
}
