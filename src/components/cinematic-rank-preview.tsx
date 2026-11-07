"use client";

import type { Rank } from "@/lib/types";
import { RANKS } from "@/lib/game";
import { RankBadge } from "./rank-badge";
import { cn } from "@/lib/utils";

const RANK_ORDER: Rank[] = ["E", "D", "C", "B", "A", "S"];

interface CinematicRankPreviewProps {
  /** Rank to highlight as the Hunter's current awakening. Defaults to E. */
  currentRank?: Rank;
}

export function CinematicRankPreview({
  currentRank = "E",
}: CinematicRankPreviewProps = {}) {
  return (
    <div className="space-y-3">
      <div className="hud-label mb-1">Rank Awakening Path</div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {RANK_ORDER.map((rankKey) => {
          const rank = RANKS[rankKey];
          const isCurrent = rankKey === currentRank;

          return (
            <div
              key={rankKey}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-500",
                isCurrent
                  ? cn(
                      "border-[var(--accent-a045)] bg-[var(--accent2-a012)]",
                      "shadow-[0_0_24px_rgb(var(--accent-rgb)/0.35)]",
                    )
                  : "border-[var(--accent-a008)] bg-[var(--void-a04)]",
              )}
            >
              <RankBadge rank={rank} large={isCurrent} className="shrink-0" />
              <div className="text-center">
                <span
                  className="font-display text-sm font-bold tracking-[0.08em]"
                  style={{ color: rank.color }}
                >
                  {rankKey}-Rank
                </span>
                <span className="mt-0.5 text-[0.58rem] text-muted tracking-[0.12em] uppercase">
                  {rank.title}
                </span>
                <span className="mt-0.5 text-[0.55rem] text-muted font-mono">
                  Awakens at Lv. {rank.minLevel}{rankKey === "S" ? "+" : ""}
                </span>
              </div>
              <div className="mt-2 h-1 w-full rounded-full border border-[var(--accent-a008)] bg-[var(--void-a08)] overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: isCurrent ? "100%" : "33%",
                    background: isCurrent ? rank.color : "var(--accent-a02)",
                    boxShadow: isCurrent ? `0 0 10px ${rank.color}` : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[0.62rem] tracking-[0.16em] text-muted uppercase text-center">
        The System evolves with your level
      </p>
    </div>
  );
}
