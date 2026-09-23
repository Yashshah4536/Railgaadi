"use client";

import type { Journey, WeatherSnapshot } from "@/types/models";
import { useWeatherTrio } from "@/hooks/useWeatherTrio";
import { CloudRain, Wind, Droplets, Sun, Cloud, CloudLightning } from "lucide-react";
import { clsx } from "clsx";

interface WeatherTrioProps {
  journey: Journey;
  className?: string;
}

function getWeatherIcon(condition: string = "", iconCode: string = "") {
  const cond = condition.toLowerCase();
  if (cond.includes("thunder") || cond.includes("lightning")) {
    return <CloudLightning size={20} className="text-amber-500" />;
  }
  if (cond.includes("rain") || cond.includes("drizzle") || iconCode.startsWith("10") || iconCode.startsWith("09")) {
    return <CloudRain size={20} className="text-blue-500" />;
  }
  if (cond.includes("cloud") || iconCode.startsWith("03") || iconCode.startsWith("04")) {
    return <Cloud size={20} className="text-slate-400" />;
  }
  return <Sun size={20} className="text-amber-500" />;
}

function WeatherCard({
  title,
  subTitle,
  weather,
  isLoading,
  highlight = false,
}: {
  title: string;
  subTitle: string;
  weather?: WeatherSnapshot | null;
  isLoading: boolean;
  highlight?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex-1 bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-3 flex flex-col gap-2 min-w-[100px] animate-pulse">
        <div className="h-3 w-12 bg-[--bg-input] rounded" />
        <div className="h-6 w-10 bg-[--bg-input] rounded" />
        <div className="h-3 w-16 bg-[--bg-input] rounded" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex-1 bg-[--bg-card] border border-[--border] rounded-[--radius-lg] p-3 flex flex-col min-w-[100px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[--text-hint]">{title}</span>
        <span className="text-xs font-semibold text-[--text] truncate">{subTitle}</span>
        <span className="text-xs text-[--text-muted] mt-2">–</span>
      </div>
    );
  }

  const hasRain = (weather.rainProb != null && weather.rainProb > 0) || weather.condition.toLowerCase().includes("rain");

  return (
    <div
      className={clsx(
        "flex-1 bg-[--bg-card] border rounded-[--radius-lg] p-3 flex flex-col justify-between min-w-[105px] transition-all",
        highlight
          ? "border-[--accent] bg-[--accent-light]/20 shadow-[var(--shadow-sm)]"
          : "border-[--border]"
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[--text-hint] truncate">
            {title}
          </span>
          {getWeatherIcon(weather.condition, weather.icon)}
        </div>
        <p className="text-xs font-bold text-[--text] truncate" title={subTitle}>
          {subTitle}
        </p>
      </div>

      <div className="mt-2.5">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-[--text] font-tabular tracking-tight">
            {weather.tempC}°
          </span>
          <span className="text-[10px] text-[--text-hint]">
            feels {weather.feelsC}°
          </span>
        </div>

        <p className="text-[11px] font-semibold text-[--text-muted] truncate mt-0.5">
          {weather.condition}
        </p>

        {hasRain && (
          <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            <CloudRain size={10} /> Rain Alert
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[--border] text-[10px] text-[--text-hint]">
          <span className="flex items-center gap-0.5" title="Humidity">
            <Droplets size={10} /> {weather.humidity}%
          </span>
          <span className="flex items-center gap-0.5" title="Wind speed">
            <Wind size={10} /> {weather.windKph} km/h
          </span>
        </div>
      </div>
    </div>
  );
}

export function WeatherTrio({ journey, className = "" }: WeatherTrioProps) {
  const currentStation = journey.stops.find((s) => s.station.code === journey.currentStop);

  const { data, isLoading } = useWeatherTrio({
    origin: {
      lat: journey.origin.lat,
      lng: journey.origin.lng,
      name: journey.origin.name,
    },
    current: {
      lat: journey.position?.lat ?? currentStation?.station.lat ?? journey.origin.lat,
      lng: journey.position?.lng ?? currentStation?.station.lng ?? journey.origin.lng,
      name: currentStation?.station.name ?? "On Board",
    },
    destination: {
      lat: journey.destination.lat,
      lng: journey.destination.lng,
      name: journey.destination.name,
    },
  });

  return (
    <section className={clsx("flex flex-col gap-2", className)} aria-label="Route weather summary">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[--text-hint]">
          Route Weather
        </h3>
        <span className="text-[10px] text-[--text-hint]">Live via OpenWeather</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <WeatherCard
          title="Source"
          subTitle={journey.origin.name.split(" ")[0]}
          weather={data?.origin}
          isLoading={isLoading}
        />
        <WeatherCard
          title="On Board"
          subTitle={currentStation?.station.name.split(" ")[0] ?? "Current"}
          weather={data?.current}
          isLoading={isLoading}
          highlight
        />
        <WeatherCard
          title="Destination"
          subTitle={journey.destination.name.split(" ")[0]}
          weather={data?.destination}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}
