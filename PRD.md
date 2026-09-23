# RailGaadi — Product Requirements Document

Version 1.1 · Owner: Yash Shah · Built at *Build & Beyond* (ISTE KJSCE)
Companion files: `DESIGN.md` (visual system). Read both before writing code.

---

## 0. How to use this document (for the Antigravity agent)

This PRD is the single source of truth. Build in the phase order in §13. After each phase, run the app, check every acceptance criterion listed for that phase, and fix failures before moving on.

**Agent rules**

1. Never hardcode API keys. Read them only from environment variables listed in §11. Never print them in logs, UI, or commits.
2. All third-party calls that need a key go through the server route handlers in `app/api/*`. The browser never calls RailRadar, OpenWeather, or OpenTopography directly.
3. Do not invent API response fields. Before writing a provider adapter, make one real request, save the raw JSON to `fixtures/<provider>/<name>.json`, and write the TypeScript types from that sample. Every adapter maps the raw provider shape into the app's own models in §8, so UI code never touches provider shapes.
4. If an endpoint path in this doc turns out wrong, check the provider's docs, fix the adapter, and note the change in `docs/DECISIONS.md`.
5. Every screen needs all four states: loading (skeleton), empty, error, success.
6. Keep components small (under ~200 lines). Put logic in hooks and services, not components.
7. TypeScript strict mode. No `any` in app code; `unknown` plus a parser at the boundary is fine.
8. Commit after each phase with a message naming the phase.

---

## 1. Product vision

**Overview.** RailGaadi is a live Indian train tracker that turns running-status data into a calm, map-first journey view. Search a train, watch it move across India on an animated map, see delays and ETAs, and learn what's along the route: weather, rivers, ghats, bridges, tunnels, monuments.

**Problem.** Existing tools (NTES, WhereIsMyTrain, IRCTC) are data-dense, ad-heavy, and text-first. Passengers and people waiting for them want three answers fast: *where is it, is it late, when does it reach my station*. Nobody makes the journey itself feel interesting.

**Target audience.**
- Passengers on board checking progress and upcoming stops.
- Family and friends tracking someone's train for pickup.
- Rail enthusiasts who enjoy routes, elevation, and landmarks.

**Goals (MVP).**
- Answer "where is my train and how late" within 3 seconds of search.
- Make the map the hero: smooth, legible, beautiful on mobile.
- Add context (weather, landmarks, elevation) that other trackers don't show.

**Non-goals (MVP).** Ticket booking, PNR status, seat availability, user accounts, push notifications.

**Success metrics.**

| Metric | MVP target |
|---|---|
| Time from search submit to first map render (p75, 4G) | < 3 s |
| Live status refresh success rate | > 97% |
| Lighthouse performance (mobile) | ≥ 85 |
| Lighthouse accessibility | ≥ 95 |
| Share-link opens that load a live journey | > 90% |
| Return visits using Recent/Favourites (post-launch) | 30% of weekly users |

---

## 2. User personas

**Priya, 27, daily-ish traveller (primary).** Takes overnight trains Mumbai ↔ Ahmedabad. Wants: current station, delay, ETA to her stop. Pain: NTES is slow and cluttered; apps are full of ads.

**Rakesh, 52, picking up family (primary).** Not tech-savvy, uses WhatsApp. Receives a shared link. Wants: one number — minutes until arrival at his station. Pain: can't interpret status tables; doesn't know the train number.

**Aarav, 19, rail enthusiast (secondary).** Tracks Vande Bharats and ghat sections. Wants: route geometry, elevation, bridges, tunnels, history. Pain: no tool visualises the journey.

---

## 3. Functional requirements

Priority: **P0** = MVP must-have, **P1** = MVP if time allows, **P2** = post-MVP.

### 3.1 Live train tracking

**F1.1 Search by number or name (P0)**
- User story: As a traveller, I type "12951" or "Rajdhani" and pick my train.
- Flow: focus search → type → debounced (250 ms) suggestions after 2 characters → select with click/Enter/arrow keys → navigate to `/train/[number]`.
- Validation: numeric input must be exactly 5 digits to submit directly. Name input matches case-insensitively against a train list.
- Suggestion source: a static `data/trains.json` (number, name, from, to) bundled or fetched once and cached; fall back to RailRadar search if available.
- Empty: before typing, show Recent Searches and Favourites (F5.8, F5.9). No match: "No train found for '…'. Check the number, or try the train name."
- Error: network failure shows inline retry; never clears what the user typed.

**F1.2 Live location on map (P0)**
- Train marker placed at the latest reported position. If the API gives coordinates, use them. If it gives only last/next station and progress, interpolate along the route line with `turf.along`.
- Marker animates between updates (F2.2); never teleports.

**F1.3 Current and next station (P0)**
- Show current station (or "Between A and B") and next station with scheduled vs expected arrival and platform if available.

**F1.4 Running status (P0)**
- States: `On time` (delay ≤ 5 min), `Delayed` (show "+N min"), `Not started`, `Reached destination`, `Cancelled`, `Diverted`, `Unknown`.
- Colours and labels per DESIGN.md; never colour-only.

**F1.5 ETA to upcoming stations (P0)**
- Timeline list of all stops: scheduled time, expected time, delay, platform, halt duration, distance from source.
- User can mark "My station"; the header then shows a big countdown to that station.

**F1.6 Distance covered and remaining (P0)**
- From API if provided; otherwise compute with `turf.length` on the route split at the train position.

**F1.7 Journey progress indicator (P0)**
- Horizontal bar with station ticks; percentage = distance covered / total.

**F1.8 Last update timestamp (P0)**
- "Updated 2 min ago", ticking every 30 s. If older than 15 min, show a warning: "Live data may be outdated."

**F1.9 Auto refresh (P0)**
- Poll every 60 s while the tab is visible; pause when hidden (Page Visibility API); refresh immediately on return. Manual refresh button. Back off to 2, 4, 8 min after consecutive failures.

**F1.10 Share live journey (P0)**
- Share button uses `navigator.share` on mobile; copy-link fallback on desktop with toast "Link copied".
- URL: `/train/12951?date=2026-09-23&stn=BRC` (stn = the sharer's "My station", optional).
- Open Graph image (P1): dynamic image with train name, status, delay.

**Edge cases for tracking:** train runs on multiple start dates at once (ask the user to pick the journey date); train not running today; API returns partial data; train number valid but no live data yet; midnight crossover in times; station codes with no coordinates (skip on map, keep in timeline).

### 3.2 Immersive journey map

- **F2.1 (P0)** Full-screen MapLibre map of India, MapTiler style.
- **F2.2 (P0)** Animated marker: tween position over 1.5 s with `requestAnimationFrame`, along the route (not straight line), and rotate to bearing (`turf.bearing`).
- **F2.3 (P0)** Full route polyline from station coordinates (MVP). Upgrade path (P2): snap to real track geometry from Overpass `railway=rail`.
- **F2.4 (P0)** Completed segment solid and coloured; remaining segment muted/dashed. Split with `turf.lineSliceAlong`.
- **F2.5 (P0)** Current station highlighted with a pulsing ring; stations as dots with labels at zoom ≥ 7.
- **F2.6 (P1)** Follow-train mode toggle: camera eases to the marker on each update; any user pan disables follow, a "Recenter" button re-enables it.
- **F2.7 (P0)** Zoom, rotate, pitch controls; keyboard accessible. Reset-north button.
- **F2.8 (P1)** Map style toggle: Light (default, matches white UI) / Dark ("night journey") / Terrain.
- **F2.9 (P1)** Route glow: a blurred wider line under the completed segment. Disabled with `prefers-reduced-motion`.
- **F2.10 (P0)** Smart loading: show skeleton map card, then fit bounds to the route with a 900 ms ease; lazy-load MapLibre.

Edge cases: WebGL unavailable → show static timeline only with a note. Very long routes (Vivek Express) → simplify line with `turf.simplify` at low zoom.

### 3.3 Journey analytics

- **F3.1 (P0)** Completion %.
- **F3.2 (P0)** Delay analysis: line chart of delay (min) per station passed; average, max, recovered minutes.
- **F3.3 (P0)** Distance: total, covered, remaining, average speed (distance ÷ elapsed running time).
- **F3.4 (P1)** Elevation profile along route: area chart, x = distance km, y = metres. Mark train position.
  - Implementation: sample the route every ~2 km (max 400 points). Primary source: MapTiler terrain (`map.queryTerrainElevation` after adding a raster-dem source). Fallback: OpenTopography Global DEM through `/api/elevation` (server fetches a small bbox raster per segment and samples it). Cache per train number; elevation never changes.
- **F3.5 (P1)** Highest point reached with station/place name.
- **F3.6 (P0)** Travel timeline and station arrival history (actual vs scheduled for passed stops).
- **F3.7 (P0)** Stats dashboard cards: completion, delay, distance, speed, stops passed, time on board.
- **F3.8 (P0)** Route summary: origin → destination, total stops, total distance, zones/states crossed (states P1 via reverse geocode or a states GeoJSON + `turf.booleanPointInPolygon`).

### 3.4 Smart travel companion

- **F4.1–F4.4 (P0)** Weather for current station, next station, and destination: temperature, feels-like, humidity, wind, condition icon. OpenWeather current + 5-day/3-hour forecast; show forecast for the expected arrival time.
- **F4.5 (P1)** Rain along route: for 6–10 sampled points ahead of the train, flag any 3-hour window with rain probability > 50%. Show "Rain likely near Vapi around 9 PM".
- **F4.6–F4.10 (P1)** Along-route discoveries from Overpass within a 3 km buffer of the upcoming 150 km of route:
  - Rivers and lakes: `waterway=river`, `natural=water` with a name.
  - Mountains and ghats: `natural=peak`, `natural=ridge`, names containing "Ghat".
  - Bridges and tunnels: `railway=rail` with `bridge=yes` or `tunnel=yes`.
  - Monuments and attractions: `historic=*`, `tourism=attraction`, `tourism=viewpoint`.
  - Cities and districts: `place=city|town`.
- Each discovery: name, type icon, distance ahead ("in 42 km"), approximate time, tap to fly the map there.
- Only named features; deduplicate by name; cap 30 items; cache 24 h by route segment.

Edge cases: Overpass timeouts (retry once against a mirror, then show "Couldn't load places right now"); no weather for a small station (use nearest city coordinates).

### 3.5 Premium user experience

- **F5.1 (P0)** White theme UI as specified in `DESIGN.md`.
- **F5.2 (P0)** Apple Maps-inspired layout: map fills the screen, content lives in a floating panel (desktop) or bottom sheet (mobile).
- **F5.3 (P0)** Micro-animations: sheet snap, card expand, status change pulse, button press.
- **F5.4 (P1)** Animated counters for distance, delay, completion (count up on first load only).
- **F5.5 (P0)** Skeletons for every async region.
- **F5.6 (P1)** Page transitions between Home and Train views (View Transitions API with fallback).
- **F5.7 (P0)** Responsive from 360 px wide.
- **F5.8 (P0)** Recent searches: last 8, localStorage, removable.
- **F5.9 (P0)** Favourite trains: star toggle, localStorage, shown on Home with live status mini-cards.
- **F5.10 (P0)** Clean minimal dashboard: Home shows search, favourites, recents, nothing else.

---

## 4. Information architecture

```
/                         Home: search, favourites, recents
/train/[number]           Journey view (map + panel)
   ?date=YYYY-MM-DD       journey start date
   &stn=CODE              "my station"
   &tab=status|stops|insights|explore
/about                    Data sources and attribution (required by OSM/MapTiler)
/404, error boundary
```

**Journey panel tabs**
1. **Status** — hero status, my-station countdown, progress bar, current/next station, weather trio.
2. **Stops** — full station timeline.
3. **Insights** — stats cards, delay chart, elevation profile, route summary.
4. **Explore** — along-route discoveries and rain alerts.

**Layout hierarchy (journey view)**
```
Desktop ≥ 1024                          Mobile < 768
┌──────────────────────────────────┐    ┌──────────────┐
│ [Top bar: logo · search · ★ ⤴]   │    │ top bar      │
│┌────────────┐                    │    │              │
││ Panel 400px│      MAP           │    │     MAP      │
││ tabs       │                    │    │              │
││ content    │        [map ctrls] │    ├──────────────┤
│└────────────┘                    │    │ bottom sheet │
└──────────────────────────────────┘    │ peek/half/full
                                        └──────────────┘
```
Tablet 768–1023: panel 360 px, collapsible.

---

## 5. UI/UX specification

Visual tokens, type, colour, and motion live in `DESIGN.md`. This section defines screens and behaviour.

### 5.1 Home
- Centred search field (large, 56 px tall), placeholder "Train number or name".
- Below: "Favourites" row of mini-cards (train number, name, status chip, delay). Empty: "Star a train to keep it here."
- "Recent" list with remove (×) buttons. Empty state hidden if favourites also empty; then show 3 example trains as tappable suggestions.
- Background: a faint static map of India with the Indian rail network as thin lines (one pre-rendered SVG, lightweight).

### 5.2 Search suggestions (combobox)
- Dropdown under field; each row: number (tabular numerals), name, "FROM → TO". Highlight matched text. Arrow keys move, Enter selects, Esc closes. ARIA combobox pattern.

### 5.3 Journey view — Status tab
- **Station plaque** (signature element, see DESIGN.md): current station name in the yellow Indian station-board style, with "Next: VAPI · 18 min" beneath.
- Status chip + delay; "Updated 1 min ago" + refresh button.
- My-station countdown card (if set): "Reaches Vadodara in 1 h 42 m · 9:14 PM · Platform 3". Button "Change my station".
- Progress bar with station ticks; distance covered / remaining.
- Weather trio: Now · Next stop · Destination.

### 5.4 Stops tab
- Vertical timeline. Passed stations muted with actual time; current highlighted; upcoming show expected time and delay chip.
- Each row: station name + code, platform, sched/exp times, halt, km. Tap row → fly map to station, open a small popover.
- Long lists (100+ stops): virtualise (TanStack Virtual). Auto-scroll to current station on open.

### 5.5 Insights tab
- 2×3 stat cards (1 column on mobile).
- Delay chart (line) and Elevation profile (area) using Recharts; train position marked as a vertical line.
- Route summary card.

### 5.6 Explore tab
- Filter chips: All · Water · Hills · Bridges & tunnels · Landmarks · Cities.
- List of discoveries sorted by distance ahead. Rain alert banner at top if any.

### 5.7 Map controls (floating, right side)
Zoom in/out, compass/reset north, pitch toggle (2D/3D), follow train, style switcher, recenter. 44 × 44 px hit targets.

### 5.8 Modals, drawers, toasts
- Journey date picker modal (when multiple running instances exist).
- "My station" picker drawer with search.
- Toasts: link copied, favourite added/removed, refresh failed.

### 5.9 Dark mode
MVP ships the white theme only (per brief). The map itself can switch to the dark style (F2.8). Full dark UI is P2; all colours must come from CSS variables so it's a token swap later.

### 5.10 Motion summary
One orchestrated moment: on opening a journey, the map fits to the route, the completed segment draws in, then the marker drops in. Everything else is response-to-action. Respect `prefers-reduced-motion` (no draw, no glow, instant transitions).

---

## 6. Technical architecture

**Stack**
- Next.js 15 (App Router) + TypeScript + React 19
- Tailwind CSS v4 with CSS-variable tokens from DESIGN.md
- MapLibre GL JS + MapTiler styles/terrain
- turf.js (modular imports: `@turf/along`, `@turf/length`, `@turf/line-slice-along`, `@turf/bearing`, `@turf/buffer`, `@turf/simplify`, `@turf/nearest-point-on-line`)
- TanStack Query (server state, polling, caching)
- Zustand (UI state: follow mode, selected tab, map style, my station)
- Recharts (charts), Framer Motion (UI motion), TanStack Virtual (long lists)
- Zod (runtime validation of API responses at the adapter boundary)
- Vitest + Testing Library; Playwright for one smoke flow

**Layers**
```
UI components  ──►  hooks (useTrainLive, useWeather…)  ──►  client API (fetch /api/*)
                                                               │
                              Next.js route handlers (/app/api/*)  ◄── keys live here
                                                               │
                             services (business logic, caching)
                                                               │
                             providers (one adapter per external API, Zod-parsed)
```

**Folder structure**
```
app/
  page.tsx                      Home
  train/[number]/page.tsx       Journey view
  about/page.tsx
  api/
    train/[number]/route.ts     live status + schedule (RailRadar)
    trains/search/route.ts      search
    weather/route.ts            OpenWeather
    elevation/route.ts          OpenTopography fallback
    places/route.ts             Overpass
components/
  map/        JourneyMap, TrainMarker, RouteLayer, StationLayer, MapControls
  journey/    StationPlaque, StatusChip, ProgressRail, StopTimeline, MyStationCard
  insights/   StatCard, DelayChart, ElevationChart, RouteSummary
  explore/    DiscoveryList, DiscoveryItem, RainAlert, FilterChips
  search/     SearchCombobox, RecentList, FavouriteCard
  ui/         Button, Chip, Card, Sheet, Tabs, Toast, Skeleton, Modal, IconButton
hooks/        useTrainLive, useTrainSearch, useWeather, useElevationProfile,
              useDiscoveries, useFavourites, useRecents, useMyStation,
              useAnimatedPosition, useVisibilityPolling, useMediaQuery, useDebounce
lib/
  providers/  railradar.ts, openweather.ts, opentopo.ts, overpass.ts, maptiler.ts
  services/   journey.ts (merge schedule+live → Journey), geo.ts, cache.ts
  geo/        route.ts (build LineString, split, interpolate), sampling.ts
  format/     time.ts, distance.ts, delay.ts
  schemas/    zod schemas for provider responses and app models
  env.ts      validated env access (throws at boot if missing)
store/        ui.ts (zustand)
types/        models.ts (§8)
data/         trains.json, stations.json (code, name, lat, lng)
fixtures/     raw provider samples
docs/         DECISIONS.md
```

**Data flow for a journey**
1. `/train/12951` server component fetches schedule + live once (fast first paint, SSR skeleton otherwise).
2. Client hydrates `useTrainLive(number, date)` (TanStack Query, `refetchInterval` 60 s, visibility-aware).
3. `services/journey.ts` merges schedule + live → `Journey` model, builds route `LineString` from station coordinates, computes train position, covered/remaining lines.
4. Map layers subscribe to `Journey`; `useAnimatedPosition` tweens the marker.
5. Secondary queries (weather, elevation, places) start after the map is ready, keyed on the route.

---

## 7. API design

All internal endpoints return `{ data, meta: { source, fetchedAt, stale } }` or `{ error: { code, message } }` with correct HTTP status.

### 7.1 RailRadar (live status, schedule, search)
- Base URL: `https://api.railradar.org/api/v1` (confirm in RailRadar docs). Auth header per docs, key from `RAILRADAR_API_KEY`.
- **Before coding**, list the available endpoints in the docs and save fixtures for: train live status, train schedule/route, train search.
- Internal: `GET /api/train/[number]?date=` → `Journey`. `GET /api/trains/search?q=` → `TrainSummary[]`.
- Caching: live status `s-maxage=30, stale-while-revalidate=30`; schedule 24 h; search 24 h.
- Retry: 2 retries, exponential backoff (300 ms, 900 ms) on 5xx/network; none on 4xx.
- Errors mapped to codes: `TRAIN_NOT_FOUND`, `NOT_RUNNING`, `NO_LIVE_DATA`, `UPSTREAM_ERROR`, `RATE_LIMITED`.

### 7.2 OpenWeather
- `GET https://api.openweathermap.org/data/2.5/weather?lat=&lon=&units=metric&appid=`
- `GET https://api.openweathermap.org/data/2.5/forecast?lat=&lon=&units=metric&appid=`
- Internal: `GET /api/weather?points=lat,lng;lat,lng&at=ISO` → `WeatherSnapshot[]` (batch up to 10 points server-side).
- Cache: round coords to 2 decimals as key; current 10 min, forecast 30 min.
- Retry: 1 retry on 5xx. On 429, serve stale if available.

### 7.3 OpenTopography (elevation fallback)
- Global DEM API (SRTMGL3) by bounding box, key from `OPENTOPOGRAPHY_API_KEY`.
- Internal: `POST /api/elevation` body `{ points: [lng,lat][] }` → `number[]` metres.
- Cache forever by train number + route hash. Max 400 points.

### 7.4 Overpass
- `POST https://overpass-api.de/api/interpreter` (mirror: `https://overpass.kumi.systems/api/interpreter`), no key. Send a descriptive `User-Agent`.
- Internal: `GET /api/places?bbox=s,w,n,e&types=water,hills,bridges,landmarks,cities`.
- Query template (bbox around the upcoming route segment; then filter to a 3 km buffer with turf server-side):
```
[out:json][timeout:20];
(
  way["waterway"="river"]["name"]({{bbox}});
  way["natural"="water"]["name"]({{bbox}});
  node["natural"="peak"]["name"]({{bbox}});
  way["railway"="rail"]["bridge"="yes"]({{bbox}});
  way["railway"="rail"]["tunnel"="yes"]({{bbox}});
  node["historic"]["name"]({{bbox}});
  node["tourism"~"attraction|viewpoint"]["name"]({{bbox}});
  node["place"~"city|town"]["name"]({{bbox}});
);
out center tags 200;
```
- Cache 24 h by rounded bbox. Timeout 20 s; one retry on the mirror.

### 7.5 MapTiler
- Client-side style URL `https://api.maptiler.com/maps/{style}/style.json?key=` with `NEXT_PUBLIC_MAPTILER_KEY`. This key is necessarily public; restrict it to allowed origins in the MapTiler dashboard.
- Terrain: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=`.

---

## 8. Data models

```ts
type StationCode = string;

interface Station {
  code: StationCode;
  name: string;
  lat: number | null;
  lng: number | null;
  state?: string;
}

interface Stop {
  station: Station;
  seq: number;
  distanceKm: number;            // from origin
  day: number;                   // journey day 1,2,3
  schArr: string | null;         // ISO
  schDep: string | null;
  expArr: string | null;
  expDep: string | null;
  actArr: string | null;
  actDep: string | null;
  delayMin: number | null;
  platform: string | null;
  haltMin: number | null;
  status: 'passed' | 'current' | 'upcoming' | 'skipped';
}

type RunningStatus =
  | 'not_started' | 'on_time' | 'delayed' | 'reached'
  | 'cancelled' | 'diverted' | 'unknown';

interface TrainPosition {
  lat: number;
  lng: number;
  bearing: number;
  source: 'gps' | 'interpolated';
  betweenFrom?: StationCode;
  betweenTo?: StationCode;
}

interface Journey {
  train: { number: string; name: string; type?: string };
  startDate: string;             // YYYY-MM-DD
  origin: Station;
  destination: Station;
  stops: Stop[];
  status: RunningStatus;
  delayMin: number;
  currentStop: StationCode | null;
  nextStop: StationCode | null;
  position: TrainPosition | null;
  distance: { totalKm: number; coveredKm: number; remainingKm: number };
  completionPct: number;
  lastUpdated: string;           // ISO from provider
  fetchedAt: string;
}

interface TrainSummary { number: string; name: string; from: StationCode; to: StationCode }

interface WeatherSnapshot {
  lat: number; lng: number;
  at: string;
  tempC: number; feelsC: number;
  humidity: number; windKph: number;
  condition: string; icon: string;
  rainProb?: number;
}

interface ElevationProfile {
  points: { km: number; m: number; lat: number; lng: number }[];
  max: { km: number; m: number; label?: string };
  min: { km: number; m: number };
}

type DiscoveryType = 'water' | 'hill' | 'bridge' | 'tunnel' | 'landmark' | 'city';
interface Discovery {
  id: string; name: string; type: DiscoveryType;
  lat: number; lng: number;
  kmAhead: number; etaISO?: string;
}

// localStorage
interface SavedTrain { number: string; name: string; savedAt: string }
interface Prefs { mapStyle: 'light' | 'dark' | 'terrain'; followTrain: boolean }
```

No database for MVP. Server-side cache: in-memory LRU (dev) → Vercel KV / Upstash Redis (prod) behind `services/cache.ts` so the swap is one file.

---

## 9. Component inventory

**Primitives (`ui/`)**: Button (primary, secondary, ghost, icon), IconButton, Chip, StatusChip, Card, Tabs, Sheet (bottom sheet, 3 snap points), Panel, Modal, Drawer, Toast, Tooltip, Skeleton (text, card, map), EmptyState, ErrorState, Spinner (rare), AnimatedNumber, RelativeTime.

**Search**: SearchCombobox, SuggestionRow, RecentList, FavouriteCard, ExampleTrains.

**Journey**: TopBar, StationPlaque, StatusHeader, MyStationCard, ProgressRail, StopTimeline, StopRow, WeatherTrio, WeatherCard, ShareButton, FavouriteToggle, RefreshButton, DatePickerModal, StationPickerDrawer.

**Map**: JourneyMap, RouteLayer (completed/remaining/glow), StationLayer, TrainMarker, DiscoveryLayer, MapControls, StyleSwitcher, RecenterButton, MapFallback.

**Insights**: StatCard, StatGrid, DelayChart, ElevationChart, RouteSummary.

**Explore**: FilterChips, DiscoveryList, DiscoveryItem, RainAlert.

---

## 10. Performance strategy

- **Code splitting**: `next/dynamic` for JourneyMap (ssr: false), charts, and Explore tab.
- **Lazy loading**: weather/elevation/places start only after the map's `load` event; Insights and Explore data only when those tabs open (prefetch on hover/intent).
- **Memoisation**: route LineString, split lines, and sampled points computed with `useMemo` keyed on stop coordinates; MapLibre sources updated via `setData` rather than re-adding layers.
- **Animation**: marker tween on rAF, no React re-render per frame (update the GeoJSON source directly).
- **API caching**: TanStack Query `staleTime` matches server cache; server responses carry `Cache-Control`; coordinate rounding for cache keys.
- **Virtualisation**: StopTimeline beyond 40 rows.
- **Debouncing**: search 250 ms; map `moveend` handlers 200 ms.
- **Payload**: modular turf imports; `stations.json` split by first letter or served from an API if > 300 KB.
- **Images/icons**: inline SVG icon set (Lucide), no raster images except OG.
- **Budget**: initial JS on Home < 150 KB gzipped; map chunk loaded on journey only.

---

## 11. Security

- **Env vars** (`.env.local`, validated in `lib/env.ts` with Zod):
  - `RAILRADAR_API_KEY` (server only)
  - `OPENWEATHER_API_KEY` (server only)
  - `OPENTOPOGRAPHY_API_KEY` (server only)
  - `NEXT_PUBLIC_MAPTILER_KEY` (public; restrict by origin)
- `.env*` in `.gitignore`. Provide `.env.example` with empty values.
- **Auth/authorisation**: none for MVP (no accounts). All user data is local.
- **Input validation**: Zod on every route handler — train number `^\d{5}$`, date ISO, coordinates in India's bbox (lat 6–37, lng 68–98), max point counts.
- **API security**: server proxies only call allow-listed hosts; no user-supplied URLs; strip upstream error bodies before returning.
- **Rate limiting**: per-IP token bucket on `/api/*` (e.g. 60 req/min; 10 req/min for `/api/places` and `/api/elevation`) via Upstash Ratelimit in prod, in-memory in dev.
- **Headers**: CSP allowing MapTiler, OpenStreetMap tile attribution, self; `Referrer-Policy: strict-origin-when-cross-origin`.
- **Attribution**: show © MapTiler © OpenStreetMap contributors on the map, and data sources on `/about`.

---

## 12. Accessibility (WCAG 2.2 AA)

- Colour contrast ≥ 4.5:1 for text, 3:1 for UI and chart lines. Status never shown by colour alone (icon + text).
- Full keyboard use: search combobox, tabs (arrow keys), bottom sheet (focus trap when full), map controls; visible focus ring from DESIGN.md.
- Map: `aria-label` on the canvas region; everything shown on the map is also available as text (Stops tab), so the map is supplementary.
- Live updates announced politely via an `aria-live="polite"` region ("Delay now 12 minutes"), only on meaningful change.
- Charts include a visually hidden data table summary.
- Touch targets ≥ 44 × 44 px. Text resizes to 200% without breaking layout.
- `prefers-reduced-motion`: disable route draw, glow, marker tween (jump instead), counters.
- Semantic landmarks: `header`, `main`, `nav` (tabs), `aside` (panel).

---

## 13. Development roadmap

Each phase ends with a working, demoable app.

**Phase 0 — Setup (30 min)**
Next.js + TS + Tailwind, tokens from DESIGN.md, `lib/env.ts`, `.env.example`, folder structure, fixtures captured from each API.
✅ `npm run dev` works; missing env var fails loudly; fixtures saved.

**Phase 1 — Core tracking (P0, the workshop MVP)**
Search combobox, `/api/train/[number]`, Journey model, Status tab (plaque, status, progress, next station, last updated), Stops tab, auto refresh.
✅ Searching "12951" shows live status in < 3 s; refresh every 60 s; errors and empty states render.

**Phase 2 — The map**
MapLibre + MapTiler light style, route line, completed/remaining split, station dots, animated marker with bearing, fit bounds, controls, follow mode.
✅ Marker moves smoothly between updates; mobile bottom sheet works at 360 px.

**Phase 3 — Companion + analytics**
Weather trio, stat cards, delay chart, route summary, my-station countdown, share link, favourites, recents.
✅ Shared link opens the same journey with "my station" set.

**Phase 4 — Delight**
Elevation profile, Explore tab (Overpass), rain alerts, route glow, dark map style, animated counters, page transitions, OG image.
✅ Lighthouse perf ≥ 85, a11y ≥ 95 on mobile.

**Phase 5 — Production hardening**
Redis cache, rate limiting, CSP, error monitoring (Sentry), analytics events (search, share, favourite), Playwright smoke test, deploy to Vercel.

**Post-MVP ideas (P2)**
Real track geometry snapping, PWA with install + offline last-known status, arrival notifications, full dark UI, Hindi and Marathi UI, station-level "trains arriving here" view.

---

## Appendix A — Kickoff prompt for Antigravity

> Read `PRD.md` and `DESIGN.md` fully. Follow the Agent rules in §0. Start with Phase 0, then Phase 1. Before writing any provider adapter, fetch one real response, save it to `fixtures/`, and derive types from it. Stop after Phase 1, run the app, and report which acceptance criteria pass.
