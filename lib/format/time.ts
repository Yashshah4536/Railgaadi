/** Format delay as "+12 min" or "On time" */
export function formatDelay(delayMin: number): string {
  if (delayMin <= 5) return "On time";
  if (delayMin < 60) return `+${delayMin} min`;
  const h = Math.floor(delayMin / 60);
  const m = delayMin % 60;
  return m > 0 ? `+${h}h ${m}m` : `+${h}h`;
}

/** Format minutes as "1 h 42 m" or "42 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} m` : `${h} h`;
}

/** Format ISO datetime as "9:14 PM" */
export function formatTime(iso: string | null): string {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** "Updated 2 min ago" given an ISO timestamp */
export function formatRelativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Updated just now";
  if (diff < 3600) return `Updated ${Math.floor(diff / 60)} min ago`;
  return `Updated ${Math.floor(diff / 3600)} h ago`;
}

/** Format km as "1,388 km" */
export function formatKm(km: number): string {
  return `${Math.round(km).toLocaleString("en-IN")} km`;
}

/** Format speed as "89 km/h" */
export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

/** Format completion percentage as "42%" */
export function formatPct(pct: number): string {
  return `${Math.round(pct)}%`;
}
