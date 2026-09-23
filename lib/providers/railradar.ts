import { env } from "@/lib/env";
import {
  ScheduleResponseSchema,
  LiveResponseSchema,
  RouteGeometryResponseSchema,
  TrainLookupResponseSchema,
  ErrorResponseSchema,
  type RawScheduleStop,
  type RawLiveStop,
} from "@/lib/schemas/railradar";
import type {
  Journey,
  Stop,
  Station,
  TrainPosition,
  RunningStatus,
  TrainSummary,
} from "@/types/models";

const BASE_URL = "https://api.railradar.in/v1";
const ROUTE_GEOMETRY_URL = `${BASE_URL}/trains`;

function authHeaders() {
  return {
    Authorization: `Bearer ${env.RAILRADAR_API_KEY}`,
    "Content-Type": "application/json",
    "User-Agent": "RailGaadi/1.0 (contact: railgaadi@example.com)",
  };
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  retries = 2,
  backoffMs = 300
): Promise<unknown> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: authHeaders(),
        next: { revalidate: 0 },
      });

      // Don't retry client errors
      if (res.status >= 400 && res.status < 500) {
        const raw: unknown = await res.json();
        const parsed = ErrorResponseSchema.safeParse(raw);
        const msg =
          parsed.success ? parsed.data.error.message : `HTTP ${res.status}`;
        throw new RailRadarError(
          parsed.success ? parsed.data.error.code : "HTTP_ERROR",
          msg,
          res.status
        );
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      if (err instanceof RailRadarError) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await sleep(backoffMs * Math.pow(3, attempt));
      }
    }
  }
  throw lastError ?? new Error("Unknown fetch error");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Custom error ──────────────────────────────────────────────────────────────

export class RailRadarError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "RailRadarError";
  }
}

// ── Adapters: raw → app models ────────────────────────────────────────────────

function mapStatus(raw: string): RunningStatus {
  switch (raw.toLowerCase()) {
    case "running":
      return "on_time"; // refined below after checking delay
    case "at-source":
    case "not started":
      return "not_started";
    case "terminated":
    case "reached":
      return "reached";
    case "cancelled":
      return "cancelled";
    case "diverted":
      return "diverted";
    default:
      return "unknown";
  }
}

function refineStatus(raw: RunningStatus, delayMin: number): RunningStatus {
  if (raw !== "on_time") return raw;
  if (delayMin <= 5) return "on_time";
  return "delayed";
}

function scheduleStopToStation(s: RawScheduleStop["station"]): Station {
  return {
    code: s.code,
    name: s.name,
    lat: s.lat ?? null,
    lng: s.lng ?? null,
  };
}

function parseHaltMin(arr?: string, dep?: string): number | null {
  if (!arr || !dep) return null;
  const [ah, am] = arr.split(":").map(Number);
  const [dh, dm] = dep.split(":").map(Number);
  const diff = (dh * 60 + dm) - (ah * 60 + am);
  return diff >= 0 ? diff : null;
}

// Merge schedule + live into a single Journey model
function buildJourney(
  schedule: ReturnType<typeof ScheduleResponseSchema.parse>,
  live: ReturnType<typeof LiveResponseSchema.parse>,
  routeCoords: [number, number][]
): Journey {
  const { data: schedData } = schedule;
  const { data: liveData } = live;

  const delayMin = liveData.delayMinutes ?? 0;
  const rawStatus = mapStatus(liveData.status);
  const status = refineStatus(rawStatus, delayMin);

  // Build a lookup from live route by stationCode → live stop
  const liveByCode = new Map<string, RawLiveStop>();
  for (const ls of liveData.route) {
    liveByCode.set(ls.stationCode, ls);
  }

  const currentCode = liveData.currentLocation?.stationCode ?? null;
  const nextCode = liveData.nextHalt?.stationCode ?? null;

  const stops: Stop[] = schedData.route.map((s): Stop => {
    const ls = liveByCode.get(s.station.code);
    let stopStatus: Stop["status"] = "upcoming";

    if (ls) {
      if (ls.status === "departed") stopStatus = "passed";
      else if (ls.status === "at-station") stopStatus = "current";
      else if (ls.status === "skipped") stopStatus = "skipped";
    }

    // Build ISO datetimes from schedule "HH:MM" + start date + day offset
    const baseDate = liveData.startDate;
    function toISO(time?: string, day?: number) {
      if (!time || !baseDate) return null;
      const d = new Date(baseDate);
      d.setDate(d.getDate() + ((day ?? 1) - 1));
      const [h, m] = time.split(":").map(Number);
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    }

    return {
      station: scheduleStopToStation(s.station),
      seq: s.sequence,
      distanceKm: s.distance,
      day: s.departureDay ?? s.arrivalDay ?? 1,
      schArr: toISO(s.arrival, s.arrivalDay),
      schDep: toISO(s.departure, s.departureDay),
      expArr: ls?.expectedArrival ?? null,
      expDep: ls?.expectedDeparture ?? null,
      actArr: ls?.actualArrival ?? null,
      actDep: ls?.actualDeparture ?? null,
      delayMin: ls?.delayMinutes ?? null,
      platform: ls?.platform ?? s.platform ?? null,
      haltMin: parseHaltMin(s.arrival, s.departure),
      isHalt: s.isHalt,
      status: stopStatus,
    };
  });

  // Compute distances
  const currentLoc = liveData.currentLocation;
  const coveredKm = currentLoc?.distanceFromOriginKm ?? 0;
  const totalKm = schedData.train.distance;
  const remainingKm = Math.max(0, totalKm - coveredKm);
  const completionPct = totalKm > 0 ? (coveredKm / totalKm) * 100 : 0;

  // Train position — use GPS if available, otherwise interpolate from station coords
  let position: TrainPosition | null = null;
  if (currentLoc) {
    const schedStop = schedData.route.find(
      (s) => s.station.code === currentLoc.stationCode
    );
    const lat = currentLoc.lat ?? schedStop?.station.lat ?? null;
    const lng = currentLoc.lng ?? schedStop?.station.lng ?? null;
    if (lat !== null && lng !== null) {
      position = {
        lat,
        lng,
        bearing: 0, // map component will compute from route
        source: currentLoc.lat ? "gps" : "interpolated",
        betweenFrom: liveData.previousHalt?.stationCode,
        betweenTo: liveData.nextHalt?.stationCode,
      };
    }
  }

  return {
    train: {
      number: schedData.train.number,
      name: schedData.train.name,
      type: schedData.train.type,
      category: schedData.train.category,
    },
    startDate: liveData.startDate,
    origin: {
      code: schedData.train.source.code,
      name: schedData.train.source.name,
      lat: schedData.train.source.lat ?? null,
      lng: schedData.train.source.lng ?? null,
    },
    destination: {
      code: schedData.train.destination.code,
      name: schedData.train.destination.name,
      lat: schedData.train.destination.lat ?? null,
      lng: schedData.train.destination.lng ?? null,
    },
    stops,
    status,
    delayMin,
    currentStop: currentCode,
    nextStop: nextCode,
    position,
    routeCoords,
    distance: { totalKm, coveredKm, remainingKm },
    completionPct,
    lastUpdated: liveData.lastUpdatedAt,
    fetchedAt: new Date().toISOString(),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Fetch combined schedule + live status and return a Journey model. */
export async function fetchJourney(
  trainNumber: string,
  date?: string
): Promise<Journey> {
  const dateParam = date ? `?date=${date}` : "";

  const [rawSchedule, rawLive, rawRoute] = await Promise.allSettled([
    fetchWithRetry(`${BASE_URL}/trains/${trainNumber}`),
    fetchWithRetry(`${BASE_URL}/trains/${trainNumber}/live${dateParam}`),
    fetchWithRetry(`${ROUTE_GEOMETRY_URL}/${trainNumber}/route`),
  ]);

  if (rawSchedule.status === "rejected") {
    if (rawSchedule.reason instanceof RailRadarError) {
      throw rawSchedule.reason;
    }
    throw new RailRadarError(
      "SCHEDULE_FETCH_FAILED",
      `Failed to fetch schedule: ${rawSchedule.reason}`
    );
  }
  if (rawLive.status === "rejected") {
    if (rawLive.reason instanceof RailRadarError) {
      throw rawLive.reason;
    }
    throw new RailRadarError(
      "LIVE_FETCH_FAILED",
      `Failed to fetch live status: ${rawLive.reason}`
    );
  }

  const scheduleParsed = ScheduleResponseSchema.safeParse(rawSchedule.value);
  if (!scheduleParsed.success) {
    console.error("[railradar] Schedule parse error:", scheduleParsed.error);
    throw new RailRadarError("PARSE_ERROR", "Failed to parse schedule response");
  }

  const liveParsed = LiveResponseSchema.safeParse(rawLive.value);
  if (!liveParsed.success) {
    console.error("[railradar] Live parse error:", liveParsed.error);
    throw new RailRadarError("PARSE_ERROR", "Failed to parse live response");
  }

  // Route geometry is optional — fall back to station coordinates
  let routeCoords: [number, number][] = [];
  if (rawRoute.status === "fulfilled") {
    const routeParsed = RouteGeometryResponseSchema.safeParse(rawRoute.value);
    if (routeParsed.success) {
      routeCoords = routeParsed.data.data.geojson.geometry.coordinates;
    }
  }

  // If no route geometry from dedicated endpoint, build from schedule station coords
  if (routeCoords.length === 0) {
    routeCoords = scheduleParsed.data.data.route
      .filter((s) => s.station.lat != null && s.station.lng != null)
      .map((s) => [s.station.lng!, s.station.lat!] as [number, number]);
  }

  return buildJourney(scheduleParsed.data, liveParsed.data, routeCoords);
}

/** Fetch all trains from the lookup endpoint for search. Cached 24h. */
export async function fetchTrainLookup(): Promise<TrainSummary[]> {
  const raw = await fetchWithRetry(`${BASE_URL}/lookup/trains`);
  const parsed = TrainLookupResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new RailRadarError("PARSE_ERROR", "Failed to parse train lookup");
  }
  return Object.entries(parsed.data.data).map(([number, name]) => ({
    number,
    name,
  }));
}

/** Search trains by number prefix or name substring. */
export function searchTrains(
  lookup: TrainSummary[],
  query: string
): TrainSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return lookup
    .filter(
      (t) =>
        t.number.startsWith(q) || t.name.toLowerCase().includes(q)
    )
    .slice(0, 12);
}
