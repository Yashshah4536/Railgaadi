"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { Journey } from "@/types/models";

interface ApiSuccessResponse {
  data: Journey;
  meta: { source: string; fetchedAt: string; stale: boolean };
}

interface ApiErrorResponse {
  error: { code: string; message: string };
}

async function fetchTrainLive(
  number: string,
  date?: string
): Promise<Journey> {
  const url = `/api/train/${number}${date ? `?date=${date}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as ApiSuccessResponse | ApiErrorResponse;

  if ("error" in json) {
    const err = new Error(json.error.message);
    (err as Error & { code: string }).code = json.error.code;
    throw err;
  }

  return json.data;
}

interface UseTrainLiveOptions {
  trainNumber: string;
  date?: string;
  /** Refetch interval in ms. Default 60_000. Set to false to disable. */
  refetchInterval?: number | false;
}

export function useTrainLive({
  trainNumber,
  date,
  refetchInterval = 60_000,
}: UseTrainLiveOptions) {
  const isVisible = usePageVisibility();
  const backoffRef = useRef<number>(refetchInterval || 60_000);

  return useQuery<Journey, Error>({
    queryKey: ["train-live", trainNumber, date],
    queryFn: () => fetchTrainLive(trainNumber, date),
    // Only refetch when page is visible
    refetchInterval: isVisible
      ? (backoffRef.current as number)
      : false,
    refetchOnWindowFocus: true,
    staleTime: 25_000, // treat data as fresh for 25s (slightly less than 30s server cache)
    retry: (failureCount, error) => {
      // Exponential backoff: 2min, 4min, 8min
      const delays = [120_000, 240_000, 480_000];
      backoffRef.current = delays[Math.min(failureCount, delays.length - 1)];
      // Don't retry client errors
      const code = (error as Error & { code?: string }).code;
      if (code === "TRAIN_NOT_FOUND" || code === "VALIDATION_ERROR") return false;
      return failureCount < 3;
    },
    retryDelay: (attempt) => [120_000, 240_000, 480_000][Math.min(attempt, 2)],
  });
}

/** Returns true while the page tab is visible */
function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true
  );

  useEffect(() => {
    const handler = () => {
      setIsVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return isVisible;
}
