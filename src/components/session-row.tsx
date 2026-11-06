"use client";

import { motion } from "motion/react";
import { Clock, Sparkles, Target } from "lucide-react";
import type { SessionData } from "@/lib/types";
import { formatMinutes } from "@/lib/game";
import { formatDateKey } from "@/lib/dates";
import { cn, focusLabel, focusTone } from "@/lib/utils";

export function SessionRow({
  session,
  actions,
  className,
  index = 0,
}: {
  session: SessionData;
  actions?: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.03, 0.24),
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "session-row flex items-center gap-3 border-b border-[var(--accent-a008)] py-3 last:border-b-0",
        className,
      )}
    >
      <div
        className="grid h-9 w-9 shrink-0 place-items-center border text-xs font-bold"
        style={{
          color: session.subjectColor,
          borderColor: `${session.subjectColor}55`,
          backgroundColor: `${session.subjectColor}0d`,
        }}
      >
        {session.subjectName.slice(0, 2).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ice">
            {session.topic}
          </p>
          {session.notes.trim().length >= 10 ? (
            <span title="Has reflection notes">
              <Target className="h-3 w-3 shrink-0 text-glow/60" />
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.62rem] tracking-[0.06em] text-muted uppercase">
          <span style={{ color: `${session.subjectColor}bb` }}>
            {session.subjectName}
          </span>
          <span className="text-muted/40">·</span>
          <span>{formatDateKey(session.studiedAt, { month: "short", day: "numeric" })}</span>
          <span className="text-muted/40">·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {formatMinutes(session.durationMinutes)}
          </span>
          <span className="text-muted/40">·</span>
          <span className={focusTone(session.focusRating)}>
            {focusLabel(session.focusRating)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="flex items-center gap-1 font-mono text-[0.62rem] text-gold">
          <Sparkles className="h-2.5 w-2.5" />+{session.xpEarned}
        </span>
        {actions}
      </div>
    </motion.div>
  );
}
