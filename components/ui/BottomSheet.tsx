"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { clsx } from "clsx";

export type SnapPoint = "peek" | "half" | "full";

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoint?: SnapPoint;
  onSnapChange?: (snap: SnapPoint) => void;
  className?: string;
  peekHeader?: React.ReactNode;
}

const SNAP_HEIGHTS: Record<SnapPoint, number> = {
  peek: 84, // 84px peek header
  half: 44, // 44% of viewport
  full: 88, // 88% of viewport
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

    // Significant drag (> 40px)
    if (deltaY < -40) {
      // Dragged UP
      if (startSnapRef.current === "peek") setSnap("half");
      else if (startSnapRef.current === "half") setSnap("full");
    } else if (deltaY > 40) {
      // Dragged DOWN
      if (startSnapRef.current === "full") setSnap("half");
      else if (startSnapRef.current === "half") setSnap("peek");
    }
  };

  return (
    <div
      ref={sheetRef}
      className={clsx(
        "fixed inset-x-0 bottom-0 z-30 flex flex-col bg-[--bg] rounded-t-[--radius-2xl]",
        "border-t border-[--border] shadow-[var(--shadow-xl)] transition-all duration-300 ease-out",
        className
      )}
      style={{
        height:
          currentSnap === "peek"
            ? `${SNAP_HEIGHTS.peek}px`
            : `${SNAP_HEIGHTS[currentSnap]}vh`,
      }}
      role="region"
      aria-label="Journey details sheet"
    >
      {/* Drag handle pill */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (currentSnap === "peek") setSnap("half");
          else if (currentSnap === "half") setSnap("full");
          else setSnap("peek");
        }}
        className="w-full py-2.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shrink-0 select-none"
        title="Tap or drag to resize"
      >
        <div className="w-10 h-1.5 rounded-full bg-[--border] hover:bg-[--text-hint] transition-colors" />
      </div>

      {/* Peek header (visible in peek mode) */}
      {peekHeader && currentSnap === "peek" && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setSnap("half")}
          className="px-4 pb-2 shrink-0 cursor-pointer"
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
