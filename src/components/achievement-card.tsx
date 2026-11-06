import { Lock, Sparkles } from "lucide-react";
import type { AchievementView } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { AnimatedBar } from "./motion/animated-bar";
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
        "achievement-card relative border transition-colors",
        compact ? "p-2.5" : "p-3.5",
        achievement.earned
          ? "border-[rgb(var(--gold-rgb)/0.26)] bg-[rgb(var(--gold-rgb)/0.045)]"
          : "border-[var(--accent-a01)] bg-[var(--panel-a038)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center border",
            achievement.earned
              ? "border-[rgb(var(--gold-rgb)/0.36)] bg-[rgb(var(--gold-rgb)/0.08)] text-gold"
              : "border-[var(--accent-a012)] bg-[var(--accent-a003)] text-muted",
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
                <AnimatedBar
                  className="stat-fill bg-gradient-to-r from-[var(--accent-deep)] to-[var(--accent-a07)]"
                  percent={achievement.percent}
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
