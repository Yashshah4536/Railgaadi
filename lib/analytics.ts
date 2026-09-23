/**
 * Lightweight, privacy-respecting client event telemetry.
 * Dispatches custom window events and console telemetry (ready for Plausible, PostHog, or Google Analytics).
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
}

export function trackEvent(name: string, properties?: Record<string, string | number | boolean | null | undefined>) {
  if (typeof window === "undefined") return;

  const payload: AnalyticsEvent = {
    event: name,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
  };

  // Dispatch custom DOM event for pluggable integrations
  window.dispatchEvent(new CustomEvent("railgaadi:analytics", { detail: payload }));

  // In development, log cleanly
  if (process.env.NODE_ENV === "development") {
    // Development telemetry breadcrumb
  }
}

export function trackSearch(query: string, resultCount: number) {
  trackEvent("train_search", { queryLength: query.length, resultCount });
}

export function trackShare(trainNumber: string, stationCode?: string | null) {
  trackEvent("journey_share", { trainNumber, stationCode: stationCode ?? "none" });
}

export function trackFavourite(trainNumber: string, action: "add" | "remove") {
  trackEvent("favourite_toggle", { trainNumber, action });
}

export function trackMyStation(trainNumber: string, stationCode: string) {
  trackEvent("my_station_set", { trainNumber, stationCode });
}

export function trackTabSwitch(tabName: string) {
  trackEvent("tab_switch", { tabName });
}
