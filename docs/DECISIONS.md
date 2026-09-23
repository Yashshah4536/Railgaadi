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
