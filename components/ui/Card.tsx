"use client";

import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

export function Card({ children, className, onClick, hover = false, padding = "md" }: CardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={clsx(
        "bg-[--bg-card] border border-[--border] rounded-[--radius-lg]",
        "shadow-[var(--shadow-sm)] text-left w-full",
        padding === "sm" && "p-3",
        padding === "md" && "p-4",
        padding === "lg" && "p-5",
        hover &&
          "transition-all duration-150 cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[--accent]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </Tag>
  );
}
