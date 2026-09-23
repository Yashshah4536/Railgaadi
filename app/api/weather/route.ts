import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchCurrentWeather, OpenWeatherError } from "@/lib/providers/openweather";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng") ?? url.searchParams.get("lon"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Valid 'lat' and 'lng' parameters required" } },
      { status: 400 }
    );
  }

  try {
    const weather = await fetchCurrentWeather(parsed.data.lat, parsed.data.lng);
    return NextResponse.json(
      {
        data: weather,
        meta: {
          source: "openweather",
          fetchedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Cache-Control": "s-maxage=900, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    if (err instanceof OpenWeatherError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status ?? 502 }
      );
    }
    console.error("[api/weather] Error:", err);
    return NextResponse.json(
      { error: { code: "UPSTREAM_ERROR", message: "Failed to fetch weather" } },
      { status: 502 }
    );
  }
}
