"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useDebounce } from "./useDebounce";
import type { TrainSummary } from "@/types/models";

interface SearchResponse {
  data: TrainSummary[];
  meta: { source: string; fetchedAt: string };
}

interface ErrorResponse {
  error: { code: string; message: string };
}

async function fetchSearch(query: string): Promise<TrainSummary[]> {
  const res = await fetch(
    `/api/trains/search?q=${encodeURIComponent(query)}`
  );
  const json = (await res.json()) as SearchResponse | ErrorResponse;
  if ("error" in json) throw new Error(json.error.message);
  return json.data;
}

export function useTrainSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  const isActive = debouncedQuery.length >= 2;

  const { data, isLoading, error } = useQuery<TrainSummary[], Error>({
    queryKey: ["train-search", debouncedQuery],
    queryFn: () => fetchSearch(debouncedQuery),
    enabled: isActive,
    staleTime: 24 * 60 * 60 * 1000, // 24h
    gcTime: 24 * 60 * 60 * 1000,
  });

  const handleChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  return {
    query,
    setQuery: handleChange,
    results: data ?? [],
    isLoading: isActive && isLoading,
    error,
    isActive,
  };
}
