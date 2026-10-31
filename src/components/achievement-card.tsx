import { Lock, Sparkles } from "lucide-react";
import type { AchievementView } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { SystemIcon } from "./system-icon";

export function AchievementCard({
  achievement,
  compact = false,
}: {
  achievement: AchievementView;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative border transition-colors",
        compact ? "p-2.5" : "p-3.5",
        achievement.earned
          ? "border-[rgba(255,191,90,0.26)] bg-[rgba(255,191,90,0.045)]"
          : "border-[rgba(84,221,255,0.1)] bg-[rgba(3,10,20,0.38)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center border",
            achievement.earned
              ? "border-[rgba(255,191,90,0.36)] bg-[rgba(255,191,90,0.08)] text-gold"
              : "border-[rgba(84,221,255,0.12)] bg-[rgba(84,221,255,0.03)] text-muted",
          )}
        >
          {achievement.earned ? (
            <SystemIcon name={achievement.icon} className="h-5 w-5" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "truncate font-display text-sm font-semibold tracking-[0.05em]",
                achievement.earned ? "text-gold" : "text-mist",
              )}
            >
              {achievement.title}
            </h3>
            <span className="flex shrink-0 items-center gap-1 font-mono text-[0.58rem] text-muted">
              <Sparkles className="h-2.5 w-2.5" />
              {achievement.xpReward}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[0.68rem] leading-snug text-muted">
            {achievement.description}
          </p>
          {!achievement.earned ? (
            <div className="mt-2">
              <div className="stat-track">
                <div
                  className="stat-fill bg-gradient-to-r from-[#2d6fa8] to-[#54ddff]/70"
                  style={{ width: `${achievement.percent}%` }}
                />
              </div>
              <p className="mt-1 text-right font-mono text-[0.52rem] text-muted">
                {formatNumber(Math.min(achievement.current, achievement.threshold))}
                {" / "}
                {formatNumber(achievement.threshold)}
              </p>
            </div>
          ) : (
            <p className="mt-1.5 text-[0.55rem] tracking-[0.16em] text-gold/70 uppercase">
              Unlocked
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
