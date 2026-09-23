import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchCorridorPlaces } from "@/lib/providers/overpass";

const querySchema = z.object({
  bbox: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    bbox: url.searchParams.get("bbox") ?? undefined,
    lat: url.searchParams.get("lat") ?? undefined,
    lng: url.searchParams.get("lng") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid parameters" } },
      { status: 400 }
    );
  }

  let bbox = { south: 18.9, west: 72.8, north: 28.7, east: 77.3 }; // Default Mumbai-Delhi corridor

  if (parsed.data.bbox) {
    const parts = parsed.data.bbox.split(",").map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      bbox = { south: parts[0], west: parts[1], north: parts[2], east: parts[3] };
    }
  } else if (parsed.data.lat != null && parsed.data.lng != null) {
    // 0.8 degree bbox around train (~90km)
    bbox = {
      south: parsed.data.lat - 0.5,
      west: parsed.data.lng - 0.5,
      north: parsed.data.lat + 0.8,
      east: parsed.data.lng + 0.8,
    };
  }

  try {
    const trainLoc =
      parsed.data.lat != null && parsed.data.lng != null
        ? { lat: parsed.data.lat, lng: parsed.data.lng }
        : undefined;

    const places = await fetchCorridorPlaces(bbox, trainLoc);

    return NextResponse.json(
      {
        data: places,
        meta: {
          count: places.length,
          source: "overpass",
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
    console.error("[api/places] Error:", err);
    return NextResponse.json({ data: [], meta: { count: 0 } });
  }
}
