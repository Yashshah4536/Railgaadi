"use client";

import type { Journey } from "@/types/models";

interface StationPlaqueProps {
  journey: Journey;
}

export function StationPlaque({ journey }: StationPlaqueProps) {
  // Find current station info
  const currentStop = journey.stops.find(
    (s) => s.station.code === journey.currentStop
  );
  const nextStop = journey.stops.find(
    (s) => s.station.code === journey.nextStop
  );

  const stationName =
    currentStop?.station.name ??
    (journey.status === "not_started"
      ? journey.origin.name
      : journey.status === "reached"
      ? journey.destination.name
      : "–");

  const stationCode =
    currentStop?.station.code ??
    journey.origin.code;

  // Minutes until next station
  const nextETA = nextStop?.expArr ?? nextStop?.schArr;
  const nextMinutes =
    nextETA
      ? Math.max(
          0,
          Math.round((new Date(nextETA).getTime() - Date.now()) / 60000)
        )
      : null;

  return (
    <div className="animate-plaque-in">
        <div
          className="rounded-[14px] text-center overflow-hidden transition-transform duration-200"
          style={{
            background: "linear-gradient(180deg, #FCD34D 0%, #F59E0B 100%)",
            border: "4px solid #1C1917",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 0 0 2px #78350F",
            padding: "16px 20px",
          }}
        >
          {/* Sub header: Bilingual Railways branding */}
          <div className="flex items-center justify-center gap-2 mb-1.5 select-none">
            <span
              className="text-[11px] sm:text-xs font-black tracking-widest uppercase"
              style={{ color: "#78350F" }}
            >
              भारतीय रेल · INDIAN RAILWAYS
            </span>
          </div>

          {/* Current / Active Station Name */}
          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight leading-tight my-1 text-[#1C1917]"
            style={{
              textShadow: "0 1px 1px rgba(255,255,255,0.3)",
              letterSpacing: "-0.02em",
            }}
          >
            {stationName.toUpperCase()}
          </h2>

          {/* Station code + Status descriptor */}
          <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
            <span
              className="text-xs sm:text-sm font-mono font-black tracking-widest px-2 py-0.5 rounded bg-black/10"
              style={{ color: "#1C1917" }}
            >
              {stationCode}
            </span>
            {currentStop?.platform && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#1C1917] text-[#FBBF24]">
                Platform {currentStop.platform}
              </span>
            )}
            <span className="text-xs font-bold text-[#78350F]">
              {journey.status === "reached"
                ? "Destination Reached"
                : journey.status === "not_started"
                ? "Origin Station"
                : "Current Location"}
            </span>
          </div>

          {/* Divider */}
          <div
            className="my-3 mx-auto w-3/4"
            style={{
              height: 1.5,
              background: "rgba(120,53,15,0.25)",
            }}
          />

          {/* Next station and ETA countdown */}
          {nextStop ? (
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-[#78350F] flex-wrap">
              <span>Next:</span>
              <span className="font-black text-[#1C1917]">
                {nextStop.station.name}
              </span>
              <span className="font-mono text-[11px] text-[#78350F]">
                ({nextStop.station.code})
              </span>
              {nextMinutes !== null && (
                <span className="font-tabular bg-white/60 px-2 py-0.5 rounded font-black text-[#1C1917] border border-amber-800/20">
                  {nextMinutes < 60
                    ? `in ${nextMinutes} min`
                    : `in ${Math.floor(nextMinutes / 60)}h ${nextMinutes % 60}m`}
                </span>
              )}
              {nextStop.platform && (
                <span className="text-[11px] font-bold bg-[#1C1917]/10 px-1.5 py-0.5 rounded">
                  Pf {nextStop.platform}
                </span>
              )}
            </div>
          ) : journey.status === "reached" ? (
            <p className="text-sm font-black text-[#1C1917]">
              ✓ Journey Successfully Completed
            </p>
          ) : (
            <p className="text-xs sm:text-sm font-bold text-[#78350F]">
              {journey.origin.name} → {journey.destination.name}
            </p>
          )}
        </div>
    </div>
  );
}
