"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface XpBarProps {
  percent: number;
  className?: string;
}

export function XpBar({ percent, className }: XpBarProps) {
  const safePercent = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={cn("xp-track", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safePercent)}
    >
      <motion.div
        className="xp-fill"
        initial={{ width: 0 }}
        animate={{ width: `${safePercent}%` }}
        transition={{ type: "spring", stiffness: 110, damping: 20, mass: 0.7 }}
        style={{ transition: "none" }}
      />
    </div>
  );
}
