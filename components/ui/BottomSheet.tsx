"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import { ChevronUp, ChevronDown } from "lucide-react";

export type SnapPoint = "peek" | "half" | "full";

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoint?: SnapPoint;
  onSnapChange?: (snap: SnapPoint) => void;
  className?: string;
  peekHeader?: React.ReactNode;
}

const SNAP_HEIGHTS: Record<SnapPoint, number> = {
  peek: 96, // 96px peek header with safe space
  half: 48, // 48% of viewport
  full: 90, // 90% of viewport
};

export function BottomSheet({
  children,
  snapPoint = "half",
  onSnapChange,
  className = "",
  peekHeader,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(snapPoint);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const startSnapRef = useRef<SnapPoint>(currentSnap);

  useEffect(() => {
    setCurrentSnap(snapPoint);
  }, [snapPoint]);

  const setSnap = useCallback(
    (snap: SnapPoint) => {
      setCurrentSnap(snap);
      onSnapChange?.(snap);
    },
    [onSnapChange]
  );

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    startSnapRef.current = currentSnap;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - dragStartY.current;
    dragStartY.current = null;

    // Significant drag (> 35px)
    if (deltaY < -35) {
      // Dragged UP
      if (startSnapRef.current === "peek") setSnap("half");
      else if (startSnapRef.current === "half") setSnap("full");
    } else if (deltaY > 35) {
      // Dragged DOWN
      if (startSnapRef.current === "full") setSnap("half");
      else if (startSnapRef.current === "half") setSnap("peek");
    }
  };

  return (
    <div
      ref={sheetRef}
      className={clsx(
        "fixed inset-x-0 bottom-0 z-30 flex flex-col bg-[--bg] rounded-t-[24px]",
        "border-t border-[--border] shadow-[0_-8px_32px_rgba(0,0,0,0.14)]",
        "transition-all duration-300 ease-out",
        className
      )}
      style={{
        height:
          currentSnap === "peek"
            ? `${SNAP_HEIGHTS.peek}px`
            : `${SNAP_HEIGHTS[currentSnap]}vh`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      role="region"
      aria-label="Journey details sheet"
    >
      {/* Top Handle & Controls Bar */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full shrink-0 flex flex-col items-center select-none pt-2.5 pb-1 px-4 cursor-pointer bg-[--bg] rounded-t-[24px]"
        onClick={() => {
          if (currentSnap === "peek") setSnap("half");
        }}
      >
        {/* Grab bar */}
        <div className="w-12 h-1.5 rounded-full bg-[--border] hover:bg-[--text-hint] transition-colors" />

        {/* Quick expand/collapse helper for older users */}
        <div className="w-full flex items-center justify-between mt-1 text-xs text-[--text-muted]">
          <span className="text-[11px] font-semibold text-[--text-hint] tracking-wide uppercase">
            {currentSnap === "peek" ? "Tap or drag up for details" : currentSnap === "half" ? "Journey Details" : "Full View"}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (currentSnap === "peek") setSnap("half");
              else if (currentSnap === "half") setSnap("full");
              else setSnap("half");
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[--bg-input] text-[--text-muted] transition-colors"
            aria-label={currentSnap === "full" ? "Collapse to half" : "Expand sheet"}
          >
            {currentSnap === "full" ? (
              <ChevronDown size={18} />
            ) : currentSnap === "half" ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronUp size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Peek header (visible in peek mode) */}
      {peekHeader && currentSnap === "peek" && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setSnap("half")}
          className="px-4 pb-2.5 shrink-0 cursor-pointer"
        >
          {peekHeader}
        </div>
      )}

      {/* Main scrollable body */}
      <div
        className={clsx(
          "flex-1 overflow-y-auto flex flex-col min-h-0",
          currentSnap === "peek" && "hidden"
        )}
      >
        {children}
      </div>
    </div>
  );
}
