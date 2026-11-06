import { ChevronRight } from "lucide-react";
import { RANKS } from "@/lib/game";
import type { ProgressInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

const RANK_ORDER = ["E", "D", "C", "B", "A", "S"] as const;

export function RankLadder({ progress }: { progress: ProgressInfo }) {
  const currentIndex = RANK_ORDER.indexOf(progress.rank.rank);
  const nextRank = RANK_ORDER[currentIndex + 1];

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="hud-label">Rank path</p>
        <p className="text-[0.6rem] tracking-[0.1em] text-muted uppercase">
          {nextRank
            ? `Next at level ${RANKS[nextRank].minLevel}`
            : "Highest rank achieved"}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
        {RANK_ORDER.map((rankKey, index) => {
          const rank = RANKS[rankKey];
          const isCurrent = rankKey === progress.rank.rank;
          const isPassed = index < currentIndex;

          return (
            <div key={rankKey} className="flex min-w-0 flex-1 items-center gap-1">
              <div
                style={{ animationDelay: `${index * 70}ms` }}
                className={cn(
                  "rank-step flex min-w-0 flex-1 flex-col items-center border px-1 py-2 text-center transition-colors",
                  isCurrent
                    ? "border-[var(--accent-a045)] bg-[var(--accent2-a012)]"
                    : isPassed
                      ? "border-[var(--accent-a012)] bg-[var(--accent2-a004)]"
                      : "border-[var(--accent-a007)] bg-[var(--void-a04)]",
                )}
              >
                <span
                  className="font-display text-lg font-bold"
                  style={{
                    color: isCurrent ? rank.color : isPassed ? `${rank.color}aa` : "var(--text-muted)",
                    textShadow: isCurrent ? `0 0 10px ${rank.color}` : "none",
                  }}
                >
                  {rankKey}
                </span>
                <span className="mt-0.5 text-[0.47rem] tracking-[0.08em] text-muted uppercase">
                  Lv.{rank.minLevel}
                  {rankKey === "S"
                    ? "+"
                    : `-${rankKey === "E" ? 9 : rank.minLevel + 9}`}
                </span>
              </div>
              {index < RANK_ORDER.length - 1 ? (
                <ChevronRight
                  className={cn(
                    "h-2.5 w-2.5 shrink-0",
                    isPassed || isCurrent ? "text-glow/40" : "text-muted/25",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
