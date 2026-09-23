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

      {/* Main content with interactive map and journey panel */}
      <main
        className="flex-1 overflow-hidden relative"
        aria-label={`Journey details for train ${number}`}
      >
        <JourneyClient
          trainNumber={number}
          date={date}
          initialMyStation={stn}
        />
      </main>
    </div>
  );
}
