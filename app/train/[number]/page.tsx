import type { Metadata } from "next";
import { JourneyClient } from "@/components/journey/JourneyClient";
import { TopBar } from "@/components/journey/TopBar";
import { notFound } from "next/navigation";

interface TrainPageProps {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ date?: string; stn?: string; tab?: string }>;
}

export async function generateMetadata({
  params,
}: TrainPageProps): Promise<Metadata> {
  const { number } = await params;
  if (!/^\d{5}$/.test(number)) return {};
  return {
    title: `Train ${number} — RailGaadi`,
    description: `Live running status, location, delays, and route info for train ${number}.`,
  };
}

export default async function TrainPage({
  params,
  searchParams,
}: TrainPageProps) {
  const { number } = await params;
  const { date, stn } = await searchParams;

  // Validate train number format
  if (!/^\d{5}$/.test(number)) {
    notFound();
  }

  return (
    <div className="h-svh flex flex-col overflow-hidden bg-[--bg]">
      {/* Top bar */}
      <TopBar trainNumber={number} />

      {/* Main content — for Phase 1, just the panel. Map added in Phase 2. */}
      <main
        className="flex-1 overflow-hidden"
        aria-label={`Journey details for train ${number}`}
      >
        {/* Desktop layout: panel on left, placeholder map on right */}
        <div className="h-full flex">
          {/* Journey panel */}
          <aside
            className="w-full md:w-[400px] h-full flex flex-col border-r border-[--border] overflow-hidden"
            aria-label="Journey information panel"
          >
            <JourneyClient
              trainNumber={number}
              date={date}
              initialMyStation={stn}
            />
          </aside>

          {/* Map placeholder for Phase 1 (hidden on mobile) */}
          <div
            className="hidden md:flex flex-1 items-center justify-center bg-[--bg-input]"
            aria-hidden="true"
          >
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-[--radius-xl] flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--color-brand)", opacity: 0.2 }}
              />
              <p className="text-sm text-[--text-hint]">
                Map coming in Phase 2
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
