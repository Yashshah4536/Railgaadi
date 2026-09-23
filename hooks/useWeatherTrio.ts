"use client";

import { useQuery } from "@tanstack/react-query";
import type { WeatherSnapshot } from "@/types/models";

interface LatLng {
  lat: number | null | undefined;
  lng: number | null | undefined;
  name?: string;
}

interface WeatherTrioPoints {
  origin?: LatLng;
  current?: LatLng;
  destination?: LatLng;
}

export interface WeatherTrioData {
  origin?: WeatherSnapshot | null;
  current?: WeatherSnapshot | null;
  destination?: WeatherSnapshot | null;
}

async function fetchPointWeather(pt?: LatLng): Promise<WeatherSnapshot | null> {
  if (!pt || pt.lat == null || pt.lng == null) return null;
  try {
    const res = await fetch(`/api/weather?lat=${pt.lat}&lng=${pt.lng}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch (err) {
    console.error("[useWeatherTrio] Point fetch failed:", err);
    return null;
  }
}

export function useWeatherTrio({ origin, current, destination }: WeatherTrioPoints) {
  return useQuery<WeatherTrioData>({
    queryKey: [
      "weather-trio",
      origin?.lat?.toFixed(2),
      origin?.lng?.toFixed(2),
      current?.lat?.toFixed(2),
      current?.lng?.toFixed(2),
      destination?.lat?.toFixed(2),
      destination?.lng?.toFixed(2),
    ],
    queryFn: async () => {
      const [originW, currentW, destW] = await Promise.all([
        fetchPointWeather(origin),
        fetchPointWeather(current),
        fetchPointWeather(destination),
      ]);
      return {
        origin: originW,
        current: currentW,
        destination: destW,
      };
    },
    enabled: Boolean(
      (origin?.lat != null && origin?.lng != null) ||
      (current?.lat != null && current?.lng != null) ||
      (destination?.lat != null && destination?.lng != null)
    ),
    staleTime: 15 * 60 * 1000, // 15 min
    gcTime: 30 * 60 * 1000,
  });
}
