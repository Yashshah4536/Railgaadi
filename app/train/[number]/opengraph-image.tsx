import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "RailGaadi Live Train Journey";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0F172A",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          color: "#FFFFFF",
        }}
      >
        {/* Top header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#1A6FE8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
              }}
            >
              🚂
            </div>
            <div style={{ display: "flex", fontSize: "32px", fontWeight: "900", letterSpacing: "-0.02em" }}>
              <span style={{ color: "#1A6FE8" }}>Rail</span>
              <span>Gaadi</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              padding: "10px 24px",
              borderRadius: "9999px",
              backgroundColor: "rgba(26, 111, 232, 0.2)",
              border: "2px solid #1A6FE8",
              fontSize: "22px",
              fontWeight: "800",
              color: "#60A5FA",
            }}
          >
            Live Tracking
          </div>
        </div>

        {/* Center Plaque */}
        <div
          style={{
            backgroundColor: "#FBBF24",
            borderRadius: "16px",
            border: "8px solid #92400E",
            padding: "36px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "18px",
              fontWeight: "800",
              color: "#78350F",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            Indian Railways
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "52px",
              fontWeight: "900",
              color: "#1C1917",
              letterSpacing: "-0.03em",
              textAlign: "center",
            }}
          >
            TRAIN #{number}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "20px",
            color: "#94A3B8",
            borderTop: "1px solid #334155",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex" }}>
            Interactive Route Map · Live Delays · Weather & Elevation
          </div>
          <div style={{ display: "flex", fontWeight: "700", color: "#F8FAFC" }}>
            railgaadi.in
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
