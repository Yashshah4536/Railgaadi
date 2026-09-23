"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  // Journey panel
  activeTab: "status" | "stops" | "insights" | "explore";
  setActiveTab: (tab: UIState["activeTab"]) => void;

  // Map
  mapStyle: "light" | "dark" | "terrain";
  setMapStyle: (style: UIState["mapStyle"]) => void;
  followTrain: boolean;
  setFollowTrain: (follow: boolean) => void;

  // My station
  myStation: string | null;
  setMyStation: (code: string | null) => void;

  // UI overlays
  isDatePickerOpen: boolean;
  setDatePickerOpen: (open: boolean) => void;
  isStationPickerOpen: boolean;
  setStationPickerOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: "status",
      setActiveTab: (tab) => set({ activeTab: tab }),

      mapStyle: "light",
      setMapStyle: (style) => set({ mapStyle: style }),
      followTrain: true,
      setFollowTrain: (follow) => set({ followTrain: follow }),

      myStation: null,
      setMyStation: (code) => set({ myStation: code }),

      isDatePickerOpen: false,
      setDatePickerOpen: (open) => set({ isDatePickerOpen: open }),
      isStationPickerOpen: false,
      setStationPickerOpen: (open) => set({ isStationPickerOpen: open }),
    }),
    {
      name: "railgaadi-ui",
      partialize: (state) => ({
        mapStyle: state.mapStyle,
        followTrain: state.followTrain,
      }),
    }
  )
);
