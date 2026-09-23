"use client";

import { Plus, Minus, Navigation, Layers, RotateCcw } from "lucide-react";
import { clsx } from "clsx";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
  mapStyle: "light" | "dark" | "terrain";
  onToggleStyle: () => void;
  className?: string;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onRecenter,
  isFollowing,
  onToggleFollow,
  mapStyle,
  onToggleStyle,
  className,
}: MapControlsProps) {
  return (
    <div
      className={clsx(
        "flex flex-col bg-[--bg]/90 backdrop-blur-md border border-[--border]",
        "rounded-[--radius-lg] shadow-[var(--shadow-md)] overflow-hidden",
        "divide-y divide-[--border]",
        className
      )}
      role="group"
      aria-label="Map navigation controls"
    >
      {/* Zoom In */}
      <button
        type="button"
        onClick={onZoomIn}
        className="w-10 h-10 flex items-center justify-center text-[--text-muted] hover:text-[--text] hover:bg-[--bg-surface] transition-colors"
        title="Zoom In"
        aria-label="Zoom in"
      >
        <Plus size={18} />
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        onClick={onZoomOut}
        className="w-10 h-10 flex items-center justify-center text-[--text-muted] hover:text-[--text] hover:bg-[--bg-surface] transition-colors"
        title="Zoom Out"
        aria-label="Zoom out"
      >
        <Minus size={18} />
      </button>

      {/* Follow Train */}
      <button
        type="button"
        onClick={onToggleFollow}
        className={clsx(
          "w-10 h-10 flex items-center justify-center transition-colors",
          isFollowing
            ? "text-[--accent] bg-[--accent-light]"
            : "text-[--text-muted] hover:text-[--text] hover:bg-[--bg-surface]"
        )}
        title={isFollowing ? "Following Train (Click to unlock)" : "Follow Train"}
        aria-pressed={isFollowing}
        aria-label="Toggle follow train camera mode"
      >
        <Navigation size={18} className={isFollowing ? "fill-current" : ""} />
      </button>

      {/* Recenter / Fit Route */}
      <button
        type="button"
        onClick={onRecenter}
        className="w-10 h-10 flex items-center justify-center text-[--text-muted] hover:text-[--text] hover:bg-[--bg-surface] transition-colors"
        title="Fit route in view"
        aria-label="Fit full railway route in view"
      >
        <RotateCcw size={16} />
      </button>

      {/* Style Switcher */}
      <button
        type="button"
        onClick={onToggleStyle}
        className="w-10 h-10 flex items-center justify-center text-[--text-muted] hover:text-[--text] hover:bg-[--bg-surface] transition-colors"
        title={`Switch to ${mapStyle === "light" ? "Dark" : "Light"} map`}
        aria-label="Switch map style"
      >
        <Layers size={18} />
      </button>
    </div>
  );
}
