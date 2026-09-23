import { z } from "zod";

// ── OpenWeather Current Weather: GET /data/2.5/weather ───────────────────────
// Derived from fixtures/openweather/current.json

export const OWCurrentSchema = z.object({
  coord: z.object({ lon: z.number(), lat: z.number() }),
  weather: z.array(z.object({
    id: z.number(),
    main: z.string(),
    description: z.string(),
    icon: z.string(),
  })),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    pressure: z.number(),
    humidity: z.number(),
  }),
  wind: z.object({
    speed: z.number(),
    deg: z.number().optional(),
    gust: z.number().optional(),
  }),
  rain: z.object({ "1h": z.number().optional(), "3h": z.number().optional() }).optional(),
  clouds: z.object({ all: z.number() }).optional(),
  dt: z.number(),
  name: z.string().optional(),
  cod: z.union([z.number(), z.string()]),
});

export type RawOWCurrent = z.infer<typeof OWCurrentSchema>;

// ── OpenWeather Forecast: GET /data/2.5/forecast ─────────────────────────────

export const OWForecastItemSchema = z.object({
  dt: z.number(),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    humidity: z.number(),
  }),
  weather: z.array(z.object({
    main: z.string(),
    description: z.string(),
    icon: z.string(),
  })),
  wind: z.object({ speed: z.number() }),
  pop: z.number().optional(), // probability of precipitation 0–1
  rain: z.object({ "3h": z.number().optional() }).optional(),
  dt_txt: z.string(),
});

export const OWForecastSchema = z.object({
  cod: z.union([z.number(), z.string()]),
  list: z.array(OWForecastItemSchema),
  city: z.object({
    name: z.string().optional(),
    coord: z.object({ lat: z.number(), lon: z.number() }).optional(),
  }).optional(),
});

export type RawOWForecast = z.infer<typeof OWForecastSchema>;
export type RawOWForecastItem = z.infer<typeof OWForecastItemSchema>;
