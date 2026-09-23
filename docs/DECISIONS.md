# DECISIONS.md — RailGaadi Architecture Decisions

## Phase 0 / 1 — Initial Setup

### D-001: Manual scaffold instead of create-next-app
**Decision:** Manually created package.json, tsconfig.json, and config files.
**Reason:** `create-next-app@16.3.6` hung waiting for npm install in the dev environment. Manual setup is faster and gives full control over dependencies.

### D-002: RailRadar live endpoint includes full route with station coordinates
**Decision:** Use `GET /v1/trains/{number}/live` as the primary source for stop data (includes per-stop times, delays, and status), combined with `GET /v1/trains/{number}` for the base schedule.
**Reason:** The live endpoint returns `route[]` with `status` ("departed", "at-station", "upcoming") that we need to determine which stops are passed. Schedule provides the canonical timetable.

### D-003: Route geometry from dedicated endpoint, fallback to station coordinates
**Decision:** Try `GET /v1/trains/{number}/route` first. If it fails or returns empty, build a LineString from station lat/lng in the schedule.
**Reason:** The dedicated route endpoint provides detailed GeoJSON geometry (real track). The fallback is approximate (straight lines between stations) but sufficient for Phase 1.

### D-004: Train search via /v1/lookup/trains (full list) cached 24h
**Decision:** Fetch the complete train list (~10,000 entries) once, cache server-side, and filter in-process.
**Reason:** The `/v1/trains/search` endpoint appears to only accept 5-digit train numbers (not name search). The lookup endpoint returns all {number: name} pairs and allows client-side fuzzy search.

### D-005: Tailwind v4 CSS import syntax
**Decision:** Use `@import "tailwindcss"` in globals.css (Tailwind v4 syntax).
**Reason:** Tailwind v4 changed from the v3 `@tailwind base/components/utilities` directive syntax.

### D-006: API keys are server-only
**Decision:** RAILRADAR_API_KEY, OPENWEATHER_API_KEY, OPENTOPOGRAPHY_API_KEY live only in `.env.local` and are accessed only in `/app/api/*` route handlers.
**Reason:** PRD §0 and §11 mandate this. The browser never calls upstream APIs directly.
**Exception:** NEXT_PUBLIC_MAPTILER_KEY is necessarily public (used in client-side MapLibre). Mitigate by restricting the key to allowed origins in the MapTiler dashboard.

## Phase 2 — Immersive Map & Animation

### D-007: Route Slicing with Turf.js
**Decision:** Split route LineString into completed track (solid `--completed-track`) and remaining track (dashed `--remaining-track`) using `@turf/line-slice-along` and `@turf/nearest-point-on-line`.
**Reason:** Gives crisp, zero-latency feedback on train progression along the exact geometry.

### D-008: Marker Tweening via requestAnimationFrame & Bearing
**Decision:** Implement 1.5-second easing tween with bearing rotation calculation between consecutive GPS points.
**Reason:** Live GPS updates arrive discretely every 30s. Tweening prevents jumpy icon positions and keeps the locomotive oriented along the track heading.

## Phase 3 — Journey Companion & Analytics

### D-009: Weather Trio Architecture
**Decision:** Fetch current weather for Origin, Destination, and Current Train Position simultaneously via server-side cached `/api/weather`.
**Reason:** Provides immediate situational context (rain alerts, extreme heat) without extra client roundtrips.

### D-010: Recharts with ResponsiveContainer for Delay Curve
**Decision:** Plot delay delta (minutes) against distance along route (km) with reference lines for zero delay.
**Reason:** Instantly visualizes where delays accumulated or were recovered during the run.

## Phase 4 — Route Delight & Social Sharing

### D-011: OpenTopography Hybrid Sampling with Fast Fallback
**Decision:** Sample route elevation with 50-point downsampling from OpenTopography global DEM and cache aggressively with 24h TTL.
**Reason:** Real route profiles can have thousands of coordinates. 50-point sampling keeps chart rendering fluid under 16ms while accurately capturing ghats and plateau ascents.

### D-012: Overpass API Corridor Caching & Mirror Failover
**Decision:** Use `https://overpass.kumi.systems/api/interpreter` as primary mirror with 24-hour route corridor cache.
**Reason:** Standard `overpass-api.de` often experiences rate limits or reset connections. Corridor caching isolates users from external downtime.

### D-013: Satori Social Cards with Flexbox Constraints
**Decision:** Generate dynamic OpenGraph cards using Next.js `ImageResponse` with strict flex layout containers.
**Reason:** Satori requires explicit `display: flex` on all multi-child divs; ensures deterministic, pixel-perfect social preview rendering for WhatsApp, Twitter, and iMessage.

## Phase 5 — Production Hardening

### D-014: In-Memory Token Bucket Rate Limiter
**Decision:** Per-IP token-bucket rate limiter in `lib/ratelimit.ts` with configurable bursts and sliding refill windows.
**Reason:** Prevents abuse of upstream rate-metered keys (RailRadar, OpenWeather) while providing graceful HTTP 429 responses with `Retry-After` headers.

### D-015: Strict Content Security Policy & Security Headers
**Decision:** Full security headers configured in `next.config.ts` including CSP restricting connections strictly to whitelisted APIs, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy`.
**Reason:** Protects users against clickjacking, MIME sniffing, and cross-site scripting while permitting MapLibre and WebGL tile loading.

### D-016: Privacy-Preserving Telemetry Event Dispatcher
**Decision:** Implement non-intrusive event emitter in `lib/analytics.ts` dispatching DOM custom events (`railgaadi:analytics`).
**Reason:** Allows pluggable drop-in analytics (Plausible, PostHog, or self-hosted) with zero user tracking cookies.

