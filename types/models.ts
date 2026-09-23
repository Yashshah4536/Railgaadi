// ─── App Domain Models ────────────────────────────────────────────────────────
// These types are the internal representation used across UI, hooks, and
// services. Provider adapters map raw API shapes into these types.

export type StationCode = string;

export interface Station {
  code: StationCode;
  name: string;
  lat: number | null;
  lng: number | null;
  state?: string;
}

export interface Stop {
  station: Station;
  seq: number;
  /** Distance from origin in km */
  distanceKm: number;
  /** Journey day (1, 2, 3…) */
  day: number;
  schArr: string | null; // ISO datetime
  schDep: string | null;
  expArr: string | null;
  expDep: string | null;
  actArr: string | null;
  actDep: string | null;
  delayMin: number | null;
  platform: string | null;
  haltMin: number | null;
  isHalt: boolean;
  status: "passed" | "current" | "upcoming" | "skipped";
}

export type RunningStatus =
  | "not_started"
  | "on_time"
  | "delayed"
  | "reached"
  | "cancelled"
  | "diverted"
  | "unknown";

export interface TrainPosition {
  lat: number;
  lng: number;
  bearing: number;
  source: "gps" | "interpolated";
  betweenFrom?: StationCode;
  betweenTo?: StationCode;
}

export interface Journey {
  train: { number: string; name: string; type?: string; category?: string };
  startDate: string; // YYYY-MM-DD
  origin: Station;
  destination: Station;
  stops: Stop[];
  status: RunningStatus;
  delayMin: number;
  currentStop: StationCode | null;
  nextStop: StationCode | null;
  position: TrainPosition | null;
  /** GeoJSON LineString coordinates [lng, lat][] for the full route */
  routeCoords: [number, number][];
  distance: {
    totalKm: number;
    coveredKm: number;
    remainingKm: number;
  };
  completionPct: number;
  lastUpdated: string; // ISO from provider
  fetchedAt: string; // ISO local
}

export interface TrainSummary {
  number: string;
  name: string;
  from?: StationCode;
  to?: StationCode;
}

export interface WeatherSnapshot {
  lat: number;
  lng: number;
  at: string; // ISO
  tempC: number;
  feelsC: number;
  humidity: number;
  windKph: number;
  condition: string;
  icon: string;
  rainProb?: number;
}

export interface ElevationProfile {
  points: { km: number; m: number; lat: number; lng: number }[];
  max: { km: number; m: number; label?: string };
  min: { km: number; m: number };
}

export type DiscoveryType =
  | "water"
  | "hill"
  | "bridge"
  | "tunnel"
  | "landmark"
  | "city";

export interface Discovery {
  id: string;
  name: string;
  type: DiscoveryType;
  lat: number;
  lng: number;
  kmAhead: number;
  etaISO?: string;
}

// ─── LocalStorage Models ──────────────────────────────────────────────────────

export interface SavedTrain {
  number: string;
  name: string;
  savedAt: string; // ISO
}

export interface Prefs {
  mapStyle: "light" | "dark" | "terrain";
  followTrain: boolean;
}

// ─── API Response Envelope ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  meta: {
    source?: string;
    fetchedAt: string;
    stale?: boolean;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
