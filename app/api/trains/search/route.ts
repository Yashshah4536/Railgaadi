import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchTrainLookup, searchTrains, RailRadarError } from "@/lib/providers/railradar";

// Simple in-memory cache for the train lookup (large payload, changes rarely)
let cachedLookup: Awaited<ReturnType<typeof fetchTrainLookup>> | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const querySchema = z.object({
  q: z.string().min(1).max(100),
});

import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many search requests. Please slow down." } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? "" });

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Query parameter 'q' is required" } },
      { status: 400 }
    );
  }

  try {
    // Refresh lookup cache if stale
    if (!cachedLookup || Date.now() > cacheExpiry) {
      cachedLookup = await fetchTrainLookup();
      cacheExpiry = Date.now() + CACHE_TTL_MS;
    }

    const results = searchTrains(cachedLookup, parsed.data.q);

    return NextResponse.json(
      {
        data: results,
        meta: { source: "railradar-lookup", fetchedAt: new Date().toISOString() },
      },
      {
        headers: {
          "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err) {
    if (err instanceof RailRadarError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: 502 }
      );
    }
    console.error("[api/trains/search] Unexpected error:", err);
    return NextResponse.json(
      { error: { code: "UPSTREAM_ERROR", message: "Search failed" } },
      { status: 502 }
    );
  }
}
