import { z } from "zod";

const envSchema = z.object({
  RAILRADAR_API_KEY: z.string().min(1, "RAILRADAR_API_KEY is required"),
  OPENWEATHER_API_KEY: z.string().min(1, "OPENWEATHER_API_KEY is required"),
  OPENTOPOGRAPHY_API_KEY: z
    .string()
    .min(1, "OPENTOPOGRAPHY_API_KEY is required"),
  NEXT_PUBLIC_MAPTILER_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_MAPTILER_KEY is required"),
});

function loadEnv() {
  const result = envSchema.safeParse({
    RAILRADAR_API_KEY: process.env.RAILRADAR_API_KEY,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    OPENTOPOGRAPHY_API_KEY: process.env.OPENTOPOGRAPHY_API_KEY,
    NEXT_PUBLIC_MAPTILER_KEY: process.env.NEXT_PUBLIC_MAPTILER_KEY,
  });

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(
      `[env] Missing or invalid environment variables: ${missing}. ` +
        `Copy .env.example to .env.local and fill in values.`
    );
  }

  return result.data;
}

// Singleton — evaluated once at module load (server side only).
// Throws loudly at startup so the issue is impossible to miss.
export const env = loadEnv();
