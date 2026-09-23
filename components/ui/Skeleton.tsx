"use client";

import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
}

const RADIUS: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  full: "9999px",
};

export function Skeleton({
  className,
  width,
  height,
  rounded = "sm",
}: SkeletonProps) {
  return (
    <div
      className={clsx("skeleton", className)}
      style={{ width, height, borderRadius: RADIUS[rounded] }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "bg-[--bg-card] border border-[--border] p-5",
        className
      )}
      style={{ borderRadius: "16px" }}
      aria-hidden="true"
    >
      <Skeleton height={12} width="40%" className="mb-3" />
      <Skeleton height={20} width="70%" className="mb-2" />
      <Skeleton height={12} width="50%" />
    </div>
  );
}

export function SkeletonPanel() {
  return (
    <div
      className="flex flex-col gap-4 p-5"
      aria-label="Loading…"
      role="status"
    >
      <div className="flex items-center gap-3">
        <Skeleton width={48} height={48} rounded="md" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton height={14} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
      <Skeleton height={8} rounded="full" className="w-full" />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard />
    </div>
  );
}
