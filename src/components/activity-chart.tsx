import type { DayActivity } from "@/lib/types";
import { formatMinutes } from "@/lib/game";
import { cn } from "@/lib/utils";
import { CountUp } from "./motion/count-up";
import { SystemPanel } from "./system-panel";

export function ActivityChart({
  days,
  todayKey,
  weekMinutes,
}: {
  days: DayActivity[];
  todayKey: string;
  weekMinutes: number;
}) {
  const peak = Math.max(...days.map((day) => day.minutes), 0);

  return (
    <SystemPanel label="Seven-day activity" className="boot-in-delay-2 boot-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CountUp
            value={weekMinutes}
            format="minutes"
            className="block font-display text-xl text-ice"
          />
          <p className="mt-1 text-[0.62rem] tracking-[0.14em] text-muted uppercase">
            Total study this week
          </p>
        </div>
        <div className="text-right">
          <p className="hud-label">Peak</p>
          <CountUp
            value={peak}
            format="minutes"
            className="mt-1 block font-mono text-sm text-glow"
          />
        </div>
      </div>

      <div className="mt-6 flex h-44 items-end gap-1.5 sm:gap-2.5">
        {days.map((day, index) => {
          const isToday = day.date === todayKey;
          return (
            <div
              key={day.date}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="font-mono text-[0.55rem] text-muted opacity-0 transition-opacity group-hover:opacity-100">
                {day.minutes > 0 ? formatMinutes(day.minutes) : ""}
              </span>
              <div className="relative flex h-32 w-full items-end justify-center">
                <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--accent-a01)]" />
                <div
                  className={cn(
                    "bar-mark bar-rise w-full max-w-8",
                    !isToday && day.minutes === 0 && "bar-mark--muted",
                  )}
                  style={{
                    height: `${Math.max(day.minutes > 0 ? 6 : 2, day.level)}%`,
                    opacity: isToday ? 1 : 0.58,
                    animationDelay: `${index * 70}ms`,
                  }}
                  title={`${formatMinutes(day.minutes)} on ${day.date}`}
                />
                {isToday ? (
                  <span className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rotate-45 bg-glow shadow-[0_0_6px_var(--accent)]" />
                ) : null}
              </div>
              <span
                className={cn(
                  "text-[0.58rem] font-semibold tracking-[0.08em] uppercase",
                  isToday ? "text-glow" : "text-muted",
                )}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </SystemPanel>
  );
}
