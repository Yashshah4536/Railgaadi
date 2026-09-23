import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow maplibre-gl and turf to be bundled
  transpilePackages: [],
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.maptiler.com https://openweathermap.org https://*.openstreetmap.org",
              "connect-src 'self' https://*.maptiler.com https://api.railradar.in https://api.openweathermap.org https://overpass-api.de https://overpass.kumi.systems https://api.opentopography.org blob:",
              "worker-src blob: 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
