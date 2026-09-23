/**
 * Phase 5 Production Hardening — Automated Smoke Test Suite
 * Tests all API routes, status codes, security headers, caching, and rate limiting.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log(`\n🚀 Starting RailGaadi Smoke Tests against ${BASE_URL}...\n`);

  // 1. Root page & Security Headers
  console.log("1. Checking Home Page & Security Headers...");
  try {
    const res = await fetch(`${BASE_URL}/`);
    assert(res.status === 200, `Home page returns 200 OK (got ${res.status})`);
    
    const headers = res.headers;
    assert(headers.get("x-frame-options") === "DENY", "X-Frame-Options: DENY");
    assert(headers.get("x-content-type-options") === "nosniff", "X-Content-Type-Options: nosniff");
    assert(headers.get("referrer-policy") === "strict-origin-when-cross-origin", "Referrer-Policy: strict-origin-when-cross-origin");
    assert(Boolean(headers.get("content-security-policy")), "Content-Security-Policy header present");
    assert(Boolean(headers.get("permissions-policy")), "Permissions-Policy header present");
  } catch (err) {
    console.error("  ❌ Home page fetch error:", err.message);
    failed++;
  }

  // 2. Search API
  console.log("\n2. Checking Search API (/api/trains/search)...");
  try {
    const res = await fetch(`${BASE_URL}/api/trains/search?q=12951`);
    assert(res.status === 200, `Search returns 200 OK (got ${res.status})`);
    const json = await res.json();
    assert(Array.isArray(json.data), "Search returns data array");
    assert(json.data.length > 0, `Search returns matching trains (got ${json.data.length})`);
    assert(Boolean(json.data[0].number), `Train has number property (${json.data[0].number})`);
  } catch (err) {
    console.error("  ❌ Search API error:", err.message);
    failed++;
  }

  // 3. Train Live API & Cache Headers
  console.log("\n3. Checking Live Train API (/api/train/12951)...");
  try {
    const res = await fetch(`${BASE_URL}/api/train/12951`);
    assert(res.status === 200, `Train API returns 200 OK (got ${res.status})`);
    const cacheControl = res.headers.get("cache-control");
    assert(
      Boolean(cacheControl && (cacheControl.includes("maxage") || cacheControl.includes("max-age"))),
      `Cache-Control header present: ${cacheControl}`
    );
    const json = await res.json();
    assert(json.data && json.data.train && json.data.train.number === "12951", "Returns 12951 train data");
    assert(Array.isArray(json.data.stops), `Stops list present (${json.data.stops?.length} stops)`);
    assert(Boolean(json.data.currentStop), "Current stop info present");
  } catch (err) {
    console.error("  ❌ Live Train API error:", err.message);
    failed++;
  }

  // 4. Invalid Train 404
  console.log("\n4. Checking Non-existent Train Route (/api/train/99999)...");
  try {
    const res = await fetch(`${BASE_URL}/api/train/99999`);
    assert(res.status === 404, `Invalid train returns 404 Not Found (got ${res.status})`);
  } catch (err) {
    console.error("  ❌ Invalid train route error:", err.message);
    failed++;
  }

  // 5. Weather API
  console.log("\n5. Checking Weather API (/api/weather)...");
  try {
    const res = await fetch(`${BASE_URL}/api/weather?lat=18.9696&lon=72.8193`);
    assert(res.status === 200, `Weather returns 200 OK (got ${res.status})`);
    const json = await res.json();
    assert(json.data && typeof json.data.tempC === "number", `Valid temp returned (${json.data?.tempC}°C)`);
    assert(Boolean(json.data.condition), `Weather condition present (${json.data?.condition})`);
  } catch (err) {
    console.error("  ❌ Weather API error:", err.message);
    failed++;
  }

  // 6. Elevation API
  console.log("\n6. Checking Elevation API (/api/elevation)...");
  try {
    const res = await fetch(`${BASE_URL}/api/elevation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coords: [
          [72.8193, 18.9696],
          [72.9, 19.1],
          [75.8, 26.9],
          [77.2167, 28.6139],
        ],
        totalKm: 1386,
      }),
    });
    assert(res.status === 200, `Elevation returns 200 OK (got ${res.status})`);
    const json = await res.json();
    assert(json.data && Array.isArray(json.data.points), `Elevation points returned (${json.data?.points?.length} points)`);
    assert(typeof json.data.max?.m === "number", `Max elevation: ${json.data?.max?.m}m`);
  } catch (err) {
    console.error("  ❌ Elevation API error:", err.message);
    failed++;
  }

  // 7. Places API
  console.log("\n7. Checking Places API (/api/places)...");
  try {
    const res = await fetch(`${BASE_URL}/api/places?lat=18.9696&lon=72.8193`);
    assert(res.status === 200, `Places returns 200 OK (got ${res.status})`);
    const json = await res.json();
    assert(Array.isArray(json.data), `Places array returned (${json.data?.length} items)`);
  } catch (err) {
    console.error("  ❌ Places API error:", err.message);
    failed++;
  }

  // 8. OpenGraph Social Image Route
  console.log("\n8. Checking OpenGraph Dynamic Image (/train/12951/opengraph-image)...");
  try {
    const res = await fetch(`${BASE_URL}/train/12951/opengraph-image`);
    assert(res.status === 200, `OG Image returns 200 OK (got ${res.status})`);
    const contentType = res.headers.get("content-type");
    assert(contentType && contentType.includes("image/"), `Content-Type is image (${contentType})`);
  } catch (err) {
    console.error("  ❌ OG Image error:", err.message);
    failed++;
  }

  // 9. Rate Limiting Test
  console.log("\n9. Checking Rate Limiting Protection (Burst requests)...");
  try {
    const requests = [];
    // Rapidly send 65 requests with an isolated client IP to exceed the 60-request bucket
    for (let i = 0; i < 65; i++) {
      requests.push(
        fetch(`${BASE_URL}/api/trains/search?q=12951`, {
          headers: { "x-forwarded-for": "203.0.113.42" },
        })
      );
    }
    const responses = await Promise.all(requests);
    const rateLimited = responses.find((r) => r.status === 429);
    assert(Boolean(rateLimited), "Server returned 429 Too Many Requests during burst traffic");
    if (rateLimited) {
      const retryAfter = rateLimited.headers.get("retry-after");
      assert(Boolean(retryAfter), `429 response contains Retry-After header (${retryAfter}s)`);
    }
  } catch (err) {
    console.error("  ❌ Rate limit test error:", err.message);
    failed++;
  }

  console.log("\n=========================================");
  console.log(`Smoke Tests Complete: ${passed} passed, ${failed} failed`);
  console.log("=========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
