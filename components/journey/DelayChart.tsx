"use client";

import { useMemo } from "react";
import type { Stop } from "@/types/models";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DelayChartProps {
  stops: Stop[];
  className?: string;
}

interface ChartDataPoint {
  code: string;
  name: string;
  delayMin: number;
  isPassed: boolean;
  status: string;
}

export function DelayChart({ stops, className = "" }: DelayChartProps) {
  // Only plot halt stations or stations with recorded delay
  const data: ChartDataPoint[] = useMemo(() => {
    return stops
      .filter((s) => s.isHalt)
      .map((s) => ({
        code: s.station.code,
        name: s.station.name,
        delayMin: Math.max(0, s.delayMin ?? 0),
        isPassed: s.status === "passed",
        status: s.status,
      }));
  }, [stops]);

  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-[--text-hint]">
        No delay history available for this train.
      </div>
    );
  }

  const maxDelay = Math.max(...data.map((d) => d.delayMin), 10);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[--text-hint]">
          Live Delay Trend Along Route
        </h3>
        <span className="text-[10px] text-[--text-hint]">Minutes delayed per stop</span>
      </div>

      <div className="h-48 w-full bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-2.5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="delayGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
            <XAxis
              dataKey="code"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fontSize: 10, fill: "var(--text-hint)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={[0, Math.ceil(maxDelay * 1.15)]}
              tick={{ fontSize: 10, fill: "var(--text-hint)" }}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as ChartDataPoint;
                return (
                  <div className="bg-[--bg] border border-[--border] shadow-[var(--shadow-md)] rounded-[--radius-md] p-2 text-xs">
                    <p className="font-bold text-[--text]">{d.name} ({d.code})</p>
                    <p className="text-[11px] text-[--text-muted] mt-0.5">
                      Delay:{" "}
                      <span className={d.delayMin > 0 ? "font-bold text-[--color-delayed]" : "font-bold text-[--color-on-time]"}>
                        {d.delayMin > 0 ? `+${d.delayMin} min` : "On time"}
                      </span>
                    </p>
                    <p className="text-[10px] text-[--text-hint] capitalize mt-0.5">Status: {d.status}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="delayMin"
              stroke="#D97706"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#delayGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible table summary for screen readers (PRD §12) */}
      <table className="sr-only">
        <caption>Delay trend across journey halt stations</caption>
        <thead>
          <tr>
            <th>Station</th>
            <th>Delay (Minutes)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.code}>
              <td>{d.name} ({d.code})</td>
              <td>{d.delayMin} minutes</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
