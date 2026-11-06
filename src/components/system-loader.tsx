"use client";

import { motion } from "motion/react";
import { SystemSigil } from "./system-sigil";

export function SystemLoader({ label = "Accessing System" }: { label?: string }) {
  return (
    <div className="system-panel relative flex min-h-40 items-center gap-5 overflow-hidden p-5">
      <div className="relative grid h-16 w-16 shrink-0 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full border border-dashed border-[var(--accent-a035)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-1.5 rounded-full border border-[var(--accent2-a022)] border-t-glow"
          animate={{ rotate: -360 }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <SystemSigil className="h-9 w-9" />
        </motion.div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="hud-label hud-label--bright">{label}</p>
        <p className="mt-1 text-xs text-muted">
          Synchronizing hunter record...
        </p>
        <div className="mt-3 h-0.5 w-full overflow-hidden bg-[var(--accent-a01)]">
          <motion.div
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-glow to-transparent"
            animate={{ x: ["-120%", "360%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-a065)] to-transparent" />
    </div>
  );
}
