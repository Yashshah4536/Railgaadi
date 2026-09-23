import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sampleRouteElevation } from "@/lib/providers/opentopo";
import { checkRateLimit } from "@/lib/ratelimit";

const bodySchema = z.object({
  coords: z.array(z.tuple([z.number(), z.number()])).min(2),
  totalKm: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." } },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfterSec),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  }

  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid route coordinates" } },
        { status: 400 }
      );
    }

    const profile = await sampleRouteElevation(parsed.data.coords, parsed.data.totalKm);

    return NextResponse.json(
      {
        data: profile,
        meta: {
          source: "opentopography",
          pointsCount: profile.points.length,
          fetchedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err) {
    console.error("[api/elevation] Error:", err);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to generate elevation profile" } },
      { status: 500 }
    );
  }
}
