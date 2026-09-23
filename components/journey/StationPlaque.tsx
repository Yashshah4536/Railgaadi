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
        className="rounded-[--radius-md] text-center overflow-hidden"
        style={{
          background: "var(--color-plaque-bg)",
          border: "4px solid #92400E",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.3), var(--shadow-md)",
          padding: "var(--space-4) var(--space-6)",
        }}
      >
        {/* Sub header */}
        <p
          className="text-[11px] font-bold tracking-widest uppercase mb-1"
          style={{ color: "var(--color-plaque-sub)" }}
        >
          भारतीय रेल · Indian Railways
        </p>

        {/* Station name */}
        <h2
          className="text-2xl font-black tracking-tight leading-tight"
          style={{
            color: "var(--color-plaque-text)",
            letterSpacing: "-0.02em",
          }}
        >
          {stationName.toUpperCase()}
        </h2>

        {/* Station code */}
        <p
          className="text-xs font-bold tracking-[0.15em] uppercase mt-0.5"
          style={{ color: "var(--color-plaque-sub)" }}
        >
          {stationCode}
        </p>

        {/* Divider */}
        <div
          className="my-3"
          style={{
            height: 1,
            background: "rgba(120,53,15,0.3)",
          }}
        />

        {/* Next station */}
        {nextStop ? (
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--color-plaque-sub)" }}
          >
            Next:{" "}
            <span className="font-black">
              {nextStop.station.name}
            </span>
            {nextMinutes !== null && (
              <>
                {" · "}
                <span className="font-tabular">
                  {nextMinutes < 60
                    ? `${nextMinutes} min`
                    : `${Math.floor(nextMinutes / 60)}h ${nextMinutes % 60}m`}
                </span>
              </>
            )}
            {nextStop.platform && (
              <span className="ml-2 text-xs opacity-75">
                Pf {nextStop.platform}
              </span>
            )}
          </p>
        ) : journey.status === "reached" ? (
          <p
            className="text-sm font-bold"
            style={{ color: "var(--color-plaque-sub)" }}
          >
            Journey Complete ✓
          </p>
        ) : (
          <p
            className="text-sm"
            style={{ color: "var(--color-plaque-sub)" }}
          >
            {journey.origin.name} → {journey.destination.name}
          </p>
        )}
      </div>
    </div>
  );
}
