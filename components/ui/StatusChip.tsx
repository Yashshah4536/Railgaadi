"use client";

import { type RunningStatus } from "@/types/models";
import { CheckCircle2, Clock, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { clsx } from "clsx";
import { formatDelay } from "@/lib/format/time";

interface StatusChipProps {
  status: RunningStatus;
  delayMin?: number;
  size?: "sm" | "md";
  className?: string;
}

const CONFIG: Record<
  RunningStatus,
  {
    label: string;
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    bg: string;
    text: string;
    border: string;
  }
> = {
  on_time: {
    label: "On time",
    Icon: CheckCircle2,
    bg: "bg-[--color-on-time-bg]",
    text: "text-[--color-on-time]",
    border: "border-[#bbf7d0]",
  },
  delayed: {
    label: "Delayed",
    Icon: Clock,
    bg: "bg-[--color-delayed-bg]",
    text: "text-[--color-delayed]",
    border: "border-[#fde68a]",
  },
  not_started: {
    label: "Not started",
    Icon: Clock,
    bg: "bg-[--color-surface-2]",
    text: "text-[--text-muted]",
    border: "border-[--border]",
  },
  reached: {
    label: "Reached",
    Icon: CheckCircle2,
    bg: "bg-[--color-on-time-bg]",
    text: "text-[--color-on-time]",
    border: "border-[#bbf7d0]",
  },
  cancelled: {
    label: "Cancelled",
    Icon: XCircle,
    bg: "bg-[--color-cancelled-bg]",
    text: "text-[--color-cancelled]",
    border: "border-[--border]",
  },
  diverted: {
    label: "Diverted",
    Icon: AlertTriangle,
    bg: "bg-[--color-delayed-bg]",
    text: "text-[--color-delayed]",
    border: "border-[#fde68a]",
  },
  unknown: {
    label: "Unknown",
    Icon: HelpCircle,
    bg: "bg-[--color-surface-2]",
    text: "text-[--text-muted]",
    border: "border-[--border]",
  },
};

export function StatusChip({
  status,
  delayMin,
  size = "md",
  className,
}: StatusChipProps) {
  const cfg = CONFIG[status];
  const { Icon } = cfg;

  // Refine label for delayed
  const label =
    status === "delayed" && delayMin != null
      ? formatDelay(delayMin)
      : cfg.label;

  // Use "late" red for severe delay
  const isLate = status === "delayed" && (delayMin ?? 0) > 30;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-semibold border rounded-full",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        isLate
          ? "bg-[--color-late-bg] text-[--color-late] border-[#fca5a5]"
          : [cfg.bg, cfg.text, `border ${cfg.border}`],
        className
      )}
    >
      <Icon size={size === "sm" ? 11 : 13} className="shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
