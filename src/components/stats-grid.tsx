import type { StatView } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatsGrid({
  stats,
  compact = false,
}: {
  stats: StatView[];
  compact?: boolean;
}) {
  return (
    <>
      {stats.map((stat) => (
        <div
          key={stat.key}
          className={cn(
            "group",
            compact
              ? "border-l border-[rgba(84,221,255,0.1)] px-2 first:border-l-0 sm:px-3"
              : "border border-[rgba(84,221,255,0.12)] bg-[rgba(3,10,20,0.4)] p-3",
          )}
        >
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-[0.62rem] font-semibold text-glow">
                {stat.key}
              </span>
              <span className="text-[0.64rem] font-semibold tracking-[0.08em] text-mist uppercase">
                {stat.label}
              </span>
            </div>
            <span className="font-mono text-[0.6rem] text-muted">
              LV {stat.level}
            </span>
          </div>
          <div className="mt-2 stat-track">
            <div
              className="stat-fill"
              style={{ width: `${Math.max(stat.percent, stat.xp > 0 ? 3 : 0)}%` }}
            />
          </div>
          {!compact ? (
            <div className="mt-1.5 flex items-center justify-between text-[0.55rem] tracking-[0.1em] text-muted uppercase">
              <span>{stat.korean}</span>
              <span>
                {stat.xpIntoLevel}/{stat.xpForNext}
              </span>
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
}
