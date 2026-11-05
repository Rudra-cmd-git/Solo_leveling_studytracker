"use client";

import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface AnimatedBarProps {
  percent: number;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  duration?: number;
}

export function AnimatedBar({
  percent,
  className,
  style,
  delay = 0,
  duration = 0.9,
}: AnimatedBarProps) {
  const safePercent = Math.min(100, Math.max(0, percent));

  return (
    <motion.div
      className={cn(className)}
      initial={{ width: 0 }}
      whileInView={{ width: `${safePercent}%` }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transition: "none", ...style }}
    />
  );
}
