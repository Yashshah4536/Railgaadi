"use client";

import { useEffect, useState, useMemo } from "react";
import type { Journey, Discovery, DiscoveryType } from "@/types/models";
import { Waves, Mountain, Landmark, Building2, Layers, Compass } from "lucide-react";
import { clsx } from "clsx";

interface ExploreTabProps {
  journey: Journey;
}

const CATEGORIES: { id: string; label: string; type?: DiscoveryType }[] = [
  { id: "all", label: "All" },
  { id: "water", label: "Rivers", type: "water" },
  { id: "bridge", label: "Bridges", type: "bridge" },
  { id: "tunnel", label: "Tunnels", type: "tunnel" },
  { id: "hill", label: "Ghats & Hills", type: "hill" },
  { id: "landmark", label: "Monuments", type: "landmark" },
];

function getCategoryIcon(type: DiscoveryType) {
  switch (type) {
    case "water":
      return <Waves size={16} className="text-blue-500" />;
    case "hill":
      return <Mountain size={16} className="text-emerald-600" />;
    case "bridge":
      return <Layers size={16} className="text-amber-600" />;
    case "tunnel":
      return <Compass size={16} className="text-purple-600" />;
    case "landmark":
      return <Landmark size={16} className="text-orange-500" />;
    case "city":
      return <Building2 size={16} className="text-slate-500" />;
    default:
      return <Compass size={16} className="text-[--accent]" />;
  }
}

export function ExploreTab({ journey }: ExploreTabProps) {
  const [places, setPlaces] = useState<Discovery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const trainLat = journey.position?.lat ?? journey.origin.lat;
  const trainLng = journey.position?.lng ?? journey.origin.lng;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const url = `/api/places?lat=${trainLat}&lng=${trainLng}`;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (isMounted && json.data) {
          setPlaces(json.data);
        }
      })
      .catch((err) => {
        console.error("[ExploreTab] Failed to fetch places:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [trainLat, trainLng]);

  const filteredPlaces = useMemo(() => {
    if (filter === "all") return places;
    return places.filter((p) => p.type === filter);
  }, [places, filter]);

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-[--text]">What&apos;s Along Your Route</h3>
        <p className="text-xs text-[--text-muted] mt-0.5">
          Rivers, ghats, tunnels, and historic monuments in your travel corridor
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={clsx(
              "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
              filter === cat.id
                ? "bg-[--accent] text-white shadow-[var(--shadow-sm)]"
                : "bg-[--bg-card] border border-[--border] text-[--text-muted] hover:text-[--text]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-3 flex items-center gap-3 animate-pulse"
            >
              <div className="w-8 h-8 rounded-full bg-[--bg-input]" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3 w-28 bg-[--bg-input] rounded" />
                <div className="h-2.5 w-16 bg-[--bg-input] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPlaces.length === 0 ? (
        <div className="text-center py-8 bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-4">
          <p className="text-2xl mb-1">🧭</p>
          <p className="text-xs font-semibold text-[--text]">No landmarks matching this filter</p>
          <p className="text-[11px] text-[--text-hint] mt-1">Try selecting &apos;All&apos; to view nearby discoveries.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredPlaces.map((item) => (
            <div
              key={item.id}
              className="bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-3 flex items-center justify-between gap-3 hover:border-[--accent] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[--bg-surface] flex items-center justify-center shrink-0">
                  {getCategoryIcon(item.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[--text] truncate">{item.name}</p>
                  <p className="text-[10px] uppercase font-semibold text-[--text-hint] tracking-wider mt-0.5">
                    {item.type}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-[--accent] font-tabular">
                  {item.kmAhead} km
                </span>
                <p className="text-[10px] text-[--text-hint]">ahead</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
