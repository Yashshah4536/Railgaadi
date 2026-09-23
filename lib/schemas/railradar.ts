import { z } from "zod";

// ─── Raw Provider Shapes ──────────────────────────────────────────────────────
// Derived from fixtures/railradar/live_12951.json and schedule_12951.json
// DO NOT import these types in UI code — go through the Journey service.

const StationInfoSchema = z.object({
  code: z.string(),
  name: z.string(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

// ── Schedule Endpoint: GET /v1/trains/{number} ────────────────────────────────

const ScheduleRouteStopSchema = z.object({
  sequence: z.number(),
  station: StationInfoSchema,
  isHalt: z.boolean(),
  platform: z.string().nullable().optional(),
  speedToNextStationKmph: z.number().optional(),
  arrival: z.string().optional(),   // "HH:MM"
  arrivalDay: z.number().optional(),
  departure: z.string().optional(),
  departureDay: z.number().optional(),
  distance: z.number(),             // km from origin
  isReversal: z.boolean().optional(),
  coachPosition: z.string().optional(),
});

export const ScheduleResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    train: z.object({
      number: z.string(),
      name: z.string(),
      type: z.string().optional(),
      category: z.string().optional(),
      source: StationInfoSchema,
      destination: StationInfoSchema,
      runDays: z.array(z.string()),
      distance: z.number(),
      duration: z.number(), // minutes
      avgSpeed: z.number().optional(),
      totalHalts: z.number().optional(),
    }),
    route: z.array(ScheduleRouteStopSchema),
  }),
});

export type RawScheduleResponse = z.infer<typeof ScheduleResponseSchema>;
export type RawScheduleStop = z.infer<typeof ScheduleRouteStopSchema>;

// ── Live Endpoint: GET /v1/trains/{number}/live ───────────────────────────────

const LiveRouteStopSchema = z.object({
  sequence: z.number(),
  stationCode: z.string(),
  stationName: z.string(),
  isHalt: z.boolean(),
  status: z.enum(["departed", "at-station", "upcoming", "skipped"]),
  scheduledArrival: z.string().optional(),   // ISO datetime
  arrivalDay: z.number().optional(),
  scheduledDeparture: z.string().optional(),
  departureDay: z.number().optional(),
  actualArrival: z.string().optional(),
  actualDeparture: z.string().optional(),
  expectedArrival: z.string().optional(),
  expectedDeparture: z.string().optional(),
  delayMinutes: z.number().optional(),
  platform: z.string().nullable().optional(),
  haltMinutes: z.number().optional(),
  distance: z.number().optional(),
  coachPosition: z.string().optional(),
});

export const LiveResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    trainNumber: z.string(),
    trainName: z.string(),
    startDate: z.string(),
    lastUpdatedAt: z.string(),
    status: z.string(), // "running", "at-source", "terminated", "cancelled"
    isLive: z.boolean().optional(),
    trackingMode: z.string().optional(),
    previousHalt: z.object({
      stationCode: z.string(),
      stationName: z.string(),
      sequence: z.number(),
      distance: z.number().optional(),
    }).optional(),
    nextHalt: z.object({
      stationCode: z.string(),
      stationName: z.string(),
      sequence: z.number(),
      distance: z.number().optional(),
    }).optional(),
    delayMinutes: z.number(),
    currentLocation: z.object({
      stationCode: z.string(),
      stationName: z.string(),
      sequence: z.number(),
      status: z.string(),
      isHalt: z.boolean(),
      distanceFromOriginKm: z.number(),
      distanceFromLastStationKm: z.number().optional(),
      delayMinutes: z.number().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }).optional(),
    train: z.object({
      number: z.string(),
      name: z.string(),
      type: z.string().optional(),
      category: z.string().optional(),
      source: StationInfoSchema,
      destination: StationInfoSchema,
      distance: z.number().optional(),
    }).optional(),
    route: z.array(LiveRouteStopSchema),
  }),
});

export type RawLiveResponse = z.infer<typeof LiveResponseSchema>;
export type RawLiveStop = z.infer<typeof LiveRouteStopSchema>;

// ── Route Geometry: GET /v1/trains/{number}/route ─────────────────────────────

export const RouteGeometryResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    trainNumber: z.string(),
    format: z.string(),
    geojson: z.object({
      type: z.literal("Feature"),
      geometry: z.object({
        type: z.literal("LineString"),
        coordinates: z.array(z.tuple([z.number(), z.number()])),
      }),
    }),
  }),
});

export type RawRouteGeometryResponse = z.infer<typeof RouteGeometryResponseSchema>;

// ── Train Search: GET /v1/lookup/trains ──────────────────────────────────────
// Returns { "12951": "Train Name", ... }

export const TrainLookupResponseSchema = z.object({
  success: z.literal(true),
  data: z.record(z.string(), z.string()),
});

export type RawTrainLookupResponse = z.infer<typeof TrainLookupResponseSchema>;

// ── Error Response ────────────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
