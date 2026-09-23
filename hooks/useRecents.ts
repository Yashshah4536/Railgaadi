"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "railgaadi-recents";
const MAX_RECENTS = 8;

export interface RecentSearch {
  number: string;
  name: string;
  searchedAt: string;
}

function readStorage(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentSearch[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: RecentSearch[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useRecents() {
  const [recents, setRecents] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setRecents(readStorage());
  }, []);

  const addRecent = useCallback((item: Omit<RecentSearch, "searchedAt">) => {
    setRecents((prev) => {
      const filtered = prev.filter((r) => r.number !== item.number);
      const next = [
        { ...item, searchedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_RECENTS);
      writeStorage(next);
      return next;
    });
  }, []);

  const removeRecent = useCallback((number: string) => {
    setRecents((prev) => {
      const next = prev.filter((r) => r.number !== number);
      writeStorage(next);
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    writeStorage([]);
  }, []);

  return { recents, addRecent, removeRecent, clearRecents };
}
