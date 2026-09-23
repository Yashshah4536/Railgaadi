"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedTrain } from "@/types/models";

const STORAGE_KEY = "railgaadi-favourites";
const MAX_FAVOURITES = 20;

function readStorage(): SavedTrain[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedTrain[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(trains: SavedTrain[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trains));
  } catch {}
}

export function useFavourites() {
  const [favourites, setFavourites] = useState<SavedTrain[]>([]);

  useEffect(() => {
    setFavourites(readStorage());
  }, []);

  const isFavourite = useCallback(
    (number: string) => favourites.some((f) => f.number === number),
    [favourites]
  );

  const addFavourite = useCallback((train: Omit<SavedTrain, "savedAt">) => {
    setFavourites((prev) => {
      if (prev.some((f) => f.number === train.number)) return prev;
      const next = [
        { ...train, savedAt: new Date().toISOString() },
        ...prev,
      ].slice(0, MAX_FAVOURITES);
      writeStorage(next);
      return next;
    });
  }, []);

  const removeFavourite = useCallback((number: string) => {
    setFavourites((prev) => {
      const next = prev.filter((f) => f.number !== number);
      writeStorage(next);
      return next;
    });
  }, []);

  const toggleFavourite = useCallback(
    (train: Omit<SavedTrain, "savedAt">) => {
      if (isFavourite(train.number)) {
        removeFavourite(train.number);
      } else {
        addFavourite(train);
      }
    },
    [isFavourite, addFavourite, removeFavourite]
  );

  return { favourites, isFavourite, addFavourite, removeFavourite, toggleFavourite };
}
