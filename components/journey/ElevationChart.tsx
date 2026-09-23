"use client";

import { useEffect, useState } from "react";
import type { ElevationProfile } from "@/types/models";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Mountain } from "lucide-react";

interface ElevationChartProps {
  coords: [number, number][];
  totalKm: number;
  coveredKm: number;
  className?: string;
}

export function ElevationChart({
  coords,
  totalKm,
  coveredKm,
  className = "",
}: ElevationChartProps) {
  const [profile, setProfile] = useState<ElevationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!coords || coords.length < 2) return;

    let isMounted = true;
    setIsLoading(true);

    fetch("/api/elevation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coords, totalKm }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (isMounted && json.data) {
          setProfile(json.data);
        }
      })
      .catch((err) => {
        console.error("[ElevationChart] Fetch failed:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [coords, totalKm]);

  if (isLoading) {
    return (
      <div className="h-44 w-full bg-[--bg-card] border border-[--border] rounded-[--radius-lg] flex flex-col items-center justify-center gap-2 animate-pulse">
        <Mountain size={24} className="text-[--text-hint]" />
        <span className="text-xs text-[--text-muted]">Sampling route elevation...</span>
      </div>
    );
  }

  if (!profile || profile.points.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[--text-hint] flex items-center gap-1.5">
          <Mountain size={14} className="text-[--accent]" />
          Route Elevation Profile
        </h3>
        <span className="text-[10px] text-[--text-hint]">
          Summit: <b>{profile.max.m}m</b> ({profile.max.km} km)
        </span>
      </div>

      <div className="h-48 w-full bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-2.5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={profile.points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="km"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fontSize: 10, fill: "var(--text-hint)" }}
              tickFormatter={(v) => `${v} km`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--text-hint)" }}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-[--bg] border border-[--border] shadow-[var(--shadow-md)] rounded-[--radius-md] p-2 text-xs">
                    <p className="font-bold text-[--text]">{d.km} km from source</p>
                    <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                      Elevation: {d.m} meters
                    </p>
                  </div>
                );
              }}
            />
            {coveredKm > 0 && (
              <ReferenceLine
                x={Math.round(coveredKm)}
                stroke="#1A6FE8"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: "Train",
                  fill: "#1A6FE8",
                  fontSize: 10,
                  position: "top",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="m"
              stroke="#059669"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#elevationGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
