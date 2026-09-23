import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchJourney, RailRadarError } from "@/lib/providers/railradar";

const paramsSchema = z.object({
  number: z.string().regex(/^\d{5}$/, "Train number must be exactly 5 digits"),
});

const querySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const resolvedParams = await params;

  // Validate path param
  const paramsParsed = paramsSchema.safeParse(resolvedParams);
  if (!paramsParsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid train number format" } },
      { status: 400 }
    );
  }

  // Validate query params
  const url = new URL(request.url);
  const queryParsed = querySchema.safeParse({
    date: url.searchParams.get("date") ?? undefined,
  });
  if (!queryParsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid date format" } },
      { status: 400 }
    );
  }

  try {
    const journey = await fetchJourney(
      paramsParsed.data.number,
      queryParsed.data.date
    );

    return NextResponse.json(
      {
        data: journey,
        meta: {
          source: "railradar",
          fetchedAt: new Date().toISOString(),
          stale: false,
        },
      },
      {
        headers: {
          "Cache-Control": "s-maxage=30, stale-while-revalidate=30",
        },
      }
    );
  } catch (err) {
    if (err instanceof RailRadarError) {
      const status =
        err.code === "TRAIN_NOT_FOUND"
          ? 404
          : err.code === "RATE_LIMITED"
          ? 429
          : 502;
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status }
      );
    }

    console.error("[api/train] Unexpected error:", err);
    return NextResponse.json(
      { error: { code: "UPSTREAM_ERROR", message: "Failed to fetch train data" } },
      { status: 502 }
    );
  }
}
