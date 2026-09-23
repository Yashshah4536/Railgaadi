import { OverpassResponseSchema } from "@/lib/schemas/overpass";
import type { Discovery, DiscoveryType } from "@/types/models";

const PRIMARY_URL = "https://overpass-api.de/api/interpreter";
const MIRROR_URL = "https://overpass.kumi.systems/api/interpreter";

const placesCache = new Map<string, { data: Discovery[]; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function classifyElement(tags: Record<string, string>): DiscoveryType | null {
  if (tags.waterway === "river" || tags.natural === "water") return "water";
  if (tags.bridge === "yes" || tags.man_made === "bridge") return "bridge";
  if (tags.tunnel === "yes") return "tunnel";
  if (tags.natural === "peak" || tags.landuse === "forest" || tags.geological) return "hill";
  if (tags.historic || tags.tourism === "attraction" || tags.tourism === "viewpoint") return "landmark";
  if (tags.place === "city" || tags.place === "town") return "city";
  return null;
}

export async function fetchCorridorPlaces(
  bbox: { south: number; west: number; north: number; east: number },
  trainLocation?: { lat: number; lng: number }
): Promise<Discovery[]> {
  const cacheKey = `${bbox.south.toFixed(2)},${bbox.west.toFixed(2)},${bbox.north.toFixed(2)},${bbox.east.toFixed(2)}`;
  const cached = placesCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const query = `[out:json][timeout:20];
(
  way["waterway"="river"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["natural"="water"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["natural"="peak"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["railway"="rail"]["bridge"="yes"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["railway"="rail"]["tunnel"="yes"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["historic"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["tourism"~"attraction|viewpoint"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["place"~"city|town"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out center tags 60;`;

  let json: unknown = null;
  const endpoints = [PRIMARY_URL, MIRROR_URL];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: {
          "User-Agent": "RailGaadi/1.0 (contact: railgaadi@example.com)",
        },
        signal: AbortSignal.timeout(18000),
      });
      if (res.ok) {
        json = await res.json();
        break;
      }
    } catch {
      // Retry next mirror
    }
  }

  if (!json) {
    // If Overpass is temporarily unavailable, return empty list gracefully
    return [];
  }

  const parsed = OverpassResponseSchema.safeParse(json);
  if (!parsed.success) {
    return [];
  }

  const discoveries: Discovery[] = [];
  const seenNames = new Set<string>();

  for (const el of parsed.data.elements) {
    const tags = el.tags;
    if (!tags) continue;
    const name = tags["name:en"] || tags.name;
    if (!name || seenNames.has(name.toLowerCase())) continue;

    const type = classifyElement(tags);
    if (!type) continue;

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;

    // Approximate distance ahead
    let kmAhead = 0;
    if (trainLocation) {
      const dLat = (lat - trainLocation.lat) * 111;
      const dLng = (lng - trainLocation.lng) * 111 * Math.cos((lat * Math.PI) / 180);
      kmAhead = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
    }

    seenNames.add(name.toLowerCase());
    discoveries.push({
      id: `${el.type}-${el.id}`,
      name,
      type,
      lat,
      lng,
      kmAhead,
    });
  }

  // Sort by distance ahead
  discoveries.sort((a, b) => a.kmAhead - b.kmAhead);

  placesCache.set(cacheKey, { data: discoveries, expiresAt: Date.now() + CACHE_TTL_MS });
  return discoveries;
}
