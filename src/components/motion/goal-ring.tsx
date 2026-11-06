"use client";

import { motion } from "motion/react";
import { CountUp } from "./count-up";

interface GoalRingProps {
  minutes: number;
  goal: number;
  percent: number;
}

const SIZE = 168;
const RADIUS = 76;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function GoalRing({ minutes, goal, percent }: GoalRingProps) {
  const safePercent = Math.min(100, Math.max(0, percent));

  return (
    <div className="relative grid h-40 w-40 place-items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          style={{ stroke: "var(--accent2-a009)" }}
          strokeWidth={3}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{
            strokeDashoffset: CIRCUMFERENCE * (1 - safePercent / 100),
          }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            stroke: "var(--accent)",
            filter: "drop-shadow(0 0 7px var(--accent-a06))",
          }}
        />
      </svg>
      <div className="absolute inset-[4px] rounded-full border border-[var(--accent-a028)] bg-[var(--bg-deep)]" />
      <div className="relative text-center">
        <p className="hud-label">Today</p>
        <CountUp
          value={minutes}
          format="minutes"
          className="mt-1 block font-display text-3xl font-semibold text-ice"
        />
        <p className="mt-1 text-[0.6rem] tracking-[0.15em] text-muted uppercase">
          of {goal}m goal
        </p>
      </div>
    </div>
  );
}
