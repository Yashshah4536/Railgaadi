import { env } from "@/lib/env";
import { OWCurrentSchema, type RawOWCurrent } from "@/lib/schemas/openweather";
import type { WeatherSnapshot } from "@/types/models";

const BASE_URL = "https://api.openweathermap.org/data/2.5";

// In-memory cache for weather snapshots by rounded coordinate key (15 min TTL)
const weatherCache = new Map<string, { data: WeatherSnapshot; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function getCoordKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

export class OpenWeatherError extends Error {
  constructor(public readonly code: string, message: string, public readonly status?: number) {
    super(message);
    this.name = "OpenWeatherError";
  }
}

/**
 * Maps raw OpenWeather current payload to canonical WeatherSnapshot model.
 */
export function mapOWCurrentToWeather(raw: RawOWCurrent, lat: number, lng: number): WeatherSnapshot {
  const w = raw.weather[0] ?? { main: "Clear", description: "clear sky", icon: "01d" };
  const rainAmount = raw.rain?.["1h"] ?? raw.rain?.["3h"] ?? 0;

  return {
    lat,
    lng,
    at: new Date(raw.dt * 1000).toISOString(),
    tempC: Math.round(raw.main.temp),
    feelsC: Math.round(raw.main.feels_like),
    humidity: raw.main.humidity,
    windKph: Math.round(raw.wind.speed * 3.6),
    condition: w.description.charAt(0).toUpperCase() + w.description.slice(1),
    icon: w.icon,
    rainProb: rainAmount > 0 ? Math.min(100, Math.round(rainAmount * 25)) : 0,
  };
}

/**
 * Fetch current weather for given latitude and longitude.
 */
export async function fetchCurrentWeather(lat: number, lng: number): Promise<WeatherSnapshot> {
  const key = getCoordKey(lat, lng);
  const cached = weatherCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const url = `${BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${env.OPENWEATHER_API_KEY}&units=metric`;

  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) {
      throw new OpenWeatherError(
        "UPSTREAM_ERROR",
        `OpenWeather HTTP ${res.status}: ${res.statusText}`,
        res.status
      );
    }

    const raw = await res.json();
    const parsed = OWCurrentSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("[openweather] Parse error:", parsed.error);
      throw new OpenWeatherError("PARSE_ERROR", "Failed to parse weather data");
    }

    const mapped = mapOWCurrentToWeather(parsed.data, lat, lng);
    weatherCache.set(key, { data: mapped, expiresAt: Date.now() + CACHE_TTL_MS });
    return mapped;
  } catch (err) {
    if (err instanceof OpenWeatherError) throw err;
    console.error("[openweather] Fetch error:", err);
    throw new OpenWeatherError("NETWORK_ERROR", "Failed to fetch weather data");
  }
}
