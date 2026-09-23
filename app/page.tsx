import type { Metadata } from "next";
import { SearchCombobox } from "@/components/search/SearchCombobox";
import { FavouritesSection } from "@/components/search/FavouritesSection";
import { RecentsSection } from "@/components/search/RecentsSection";
import { Train } from "lucide-react";

export const metadata: Metadata = {
  title: "RailGaadi — Track any Indian train live",
  description:
    "Search any Indian train by number or name. See live position, delay, ETAs, and what's along the route.",
};

export default function HomePage() {
  return (
    <main className="min-h-svh flex flex-col bg-[--bg]">
      {/* Background rail network SVG hint */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16 pt-20 relative z-10">
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-[--radius-xl] mb-4"
            style={{
              background: "var(--color-brand)",
              boxShadow: "0 4px 24px rgba(26,111,232,0.35)",
            }}
          >
            <Train size={32} color="white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            <span style={{ color: "var(--color-brand)" }}>Rail</span>
            <span style={{ color: "var(--color-text-primary)" }}>Gaadi</span>
          </h1>
          <p className="text-base text-[--text-muted] mt-2 text-center max-w-xs">
            Track every journey.
          </p>
        </div>

        {/* Search */}
        <div className="w-full max-w-lg">
          <SearchCombobox autoFocus />
        </div>

        {/* Example suggestions when empty */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {EXAMPLE_TRAINS.map((t) => (
            <a
              key={t.number}
              href={`/train/${t.number}`}
              className="text-xs px-3 py-1.5 rounded-full border border-[--border]
                         text-[--text-muted] hover:border-[--accent] hover:text-[--accent]
                         hover:bg-[--accent-light] transition-all duration-150"
            >
              {t.number} · {t.name}
            </a>
          ))}
        </div>
      </div>

      {/* Favourites + Recents */}
      <div className="px-4 pb-12 max-w-lg mx-auto w-full space-y-6 relative z-10">
        <FavouritesSection />
        <RecentsSection />
      </div>

      {/* Footer attribution */}
      <footer className="text-center text-[11px] text-[--text-hint] pb-6 relative z-10">
        <p>
          Data: RailRadar · Map: MapTiler © OpenStreetMap contributors ·{" "}
          <a href="/about" className="underline hover:text-[--accent]">
            About & Attribution
          </a>
        </p>
        <p className="mt-1 text-[--text-hint]">
          Built at <span className="font-semibold">Build &amp; Beyond</span> · ISTE KJSCE
        </p>
      </footer>
    </main>
  );
}

const EXAMPLE_TRAINS = [
  { number: "12951", name: "Mumbai Rajdhani" },
  { number: "12301", name: "Howrah Rajdhani" },
  { number: "22221", name: "Vande Bharat" },
];
