import { lineString, point } from "@turf/helpers";
import length from "@turf/length";
import lineSliceAlong from "@turf/line-slice-along";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import bearing from "@turf/bearing";
import along from "@turf/along";

export interface SplitRoute {
  completed: GeoJSON.LineString | null;
  remaining: GeoJSON.LineString | null;
  totalKm: number;
  coveredKm: number;
  trainPosition: [number, number]; // [lng, lat]
  trainBearing: number; // degrees 0-360
}

/**
 * Splits a route polyline into completed and remaining segments based on current train coordinates.
 */
export function calculateRouteSplit(
  routeCoords: [number, number][],
  trainPos?: { lat: number; lng: number; bearing?: number | null } | null
): SplitRoute | null {
  if (!routeCoords || routeCoords.length < 2) {
    return null;
  }

  try {
    const fullLine = lineString(routeCoords);
    const totalKm = length(fullLine, { units: "kilometers" });

    if (totalKm <= 0) return null;

    let coveredKm = 0;
    let trainLngLat: [number, number] = routeCoords[0];
    let computedBearing = 0;

    if (trainPos && trainPos.lat != null && trainPos.lng != null) {
      const trainPt = point([trainPos.lng, trainPos.lat]);
      const snapped = nearestPointOnLine(fullLine, trainPt, {
        units: "kilometers",
      });
      coveredKm = snapped.properties.location ?? 0;
      trainLngLat = [
        snapped.geometry.coordinates[0],
        snapped.geometry.coordinates[1],
      ];

      // Calculate bearing from small step ahead along the line
      if (trainPos.bearing != null && !isNaN(trainPos.bearing)) {
        computedBearing = trainPos.bearing;
      } else {
        const stepAheadKm = Math.min(totalKm, coveredKm + 0.1);
        const nextPt = along(fullLine, stepAheadKm, { units: "kilometers" });
        computedBearing = bearing(
          point(trainLngLat),
          point([nextPt.geometry.coordinates[0], nextPt.geometry.coordinates[1]])
        );
      }
    }

    // Clamp coveredKm between 0 and totalKm
    coveredKm = Math.max(0, Math.min(coveredKm, totalKm));

    let completed: GeoJSON.LineString | null = null;
    let remaining: GeoJSON.LineString | null = null;

    if (coveredKm > 0.05) {
      completed = lineSliceAlong(fullLine, 0, coveredKm, {
        units: "kilometers",
      }).geometry as GeoJSON.LineString;
    }

    if (coveredKm < totalKm - 0.05) {
      remaining = lineSliceAlong(fullLine, coveredKm, totalKm, {
        units: "kilometers",
      }).geometry as GeoJSON.LineString;
    } else if (!completed) {
      remaining = fullLine.geometry as GeoJSON.LineString;
    }

    return {
      completed,
      remaining: remaining ?? (completed ? null : (fullLine.geometry as GeoJSON.LineString)),
      totalKm,
      coveredKm,
      trainPosition: trainLngLat,
      trainBearing: (computedBearing + 360) % 360,
    };
  } catch (err) {
    console.error("[geo/route] Error computing route split:", err);
    return null;
  }
}
