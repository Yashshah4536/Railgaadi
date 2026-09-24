import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About & Attribution — RailGaadi",
  description: "Data sources, attribution, and information about RailGaadi.",
};

export default function AboutPage() {
  return (
    <main className="min-h-svh bg-[--bg] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-2">
          <span style={{ color: "var(--color-brand)" }}>Rail</span>Gaadi
        </h1>
        <p className="text-[--text-muted] mb-8">
          A live Indian train tracker built by{" "}
          <a
            href="https://viramtech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[--accent] hover:underline"
          >
            Yash Shah · ViramTech
          </a>
        </p>

        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-[--text]">Data Sources</h2>
          <ul className="space-y-3 text-sm text-[--text-muted]">
            <li>
              <strong className="text-[--text]">Train data & live status:</strong>{" "}
              <a
                href="https://railradar.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--accent] hover:underline"
              >
                RailRadar
              </a>{" "}
              — Indian Railways running status API
            </li>
            <li>
              <strong className="text-[--text]">Maps:</strong>{" "}
              <a
                href="https://www.maptiler.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--accent] hover:underline"
              >
                MapTiler
              </a>{" "}
              © {" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--accent] hover:underline"
              >
                OpenStreetMap contributors
              </a>
            </li>
            <li>
              <strong className="text-[--text]">Weather:</strong>{" "}
              <a
                href="https://openweathermap.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--accent] hover:underline"
              >
                OpenWeatherMap
              </a>
            </li>
            <li>
              <strong className="text-[--text]">Elevation data:</strong>{" "}
              <a
                href="https://opentopography.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--accent] hover:underline"
              >
                OpenTopography
              </a>
            </li>
            <li>
              <strong className="text-[--text]">Places of interest:</strong>{" "}
              <a
                href="https://www.openstreetmap.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--accent] hover:underline"
              >
                OpenStreetMap
              </a>{" "}
              via Overpass API
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-3 text-[--text]">Technology</h2>
          <p className="text-sm text-[--text-muted]">
            Built with Next.js 15, TypeScript, MapLibre GL, Tailwind CSS, TanStack Query, and turf.js.
            RailGaadi is not affiliated with Indian Railways, IRCTC, or NTES.
          </p>
        </section>
      </div>
    </main>
  );
}
