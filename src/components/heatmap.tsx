import type { HeatmapDay } from "@/lib/types";
import { formatMinutes } from "@/lib/game";
import { monthDay } from "@/lib/dates";
import { SystemPanel } from "./system-panel";

const LEGEND = [
  { level: 0, label: "No study" },
  { level: 1, label: "Under 30m" },
  { level: 2, label: "30m+" },
  { level: 3, label: "60m+" },
  { level: 4, label: "120m+" },
];

export function Heatmap({ days }: { days: HeatmapDay[] }) {
  const activeDays = days.filter((day) => day.minutes > 0).length;
  const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0);
  const weeks = Array.from({ length: 12 }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );

  return (
    <SystemPanel label="Study heatmap" className="boot-in boot-in-delay-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="title-display text-xl text-ice">12-Week Record</p>
          <p className="mt-1 text-[0.62rem] tracking-[0.14em] text-muted uppercase">
            {activeDays} active days · {formatMinutes(totalMinutes)} recorded
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[0.55rem] text-muted">
          {LEGEND.map((item) => (
            <span key={item.level} className="flex items-center gap-1">
              <span
                className="heat-cell h-2.5 w-2.5"
                data-level={item.level}
                title={item.label}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          <div className="grid grid-rows-7 gap-1 pt-0">
            {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="flex h-3.5 items-center pr-1 text-[0.52rem] text-muted sm:h-4"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {weeks.flatMap((week) =>
              week.map((day) => (
                <span
                  key={day.date}
                  className="heat-cell h-3.5 w-3.5 sm:h-4 sm:w-4"
                  data-level={day.level}
                  title={`${monthDay(day.date)} · ${formatMinutes(day.minutes)}`}
                />
              )),
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[rgba(84,221,255,0.08)] pt-3">
        <span className="text-[0.56rem] tracking-[0.13em] text-muted uppercase">
          Less
        </span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="heat-cell h-2.5 w-2.5"
              data-level={level}
            />
          ))}
        </div>
        <span className="text-[0.56rem] tracking-[0.13em] text-muted uppercase">
          More
        </span>
      </div>
    </SystemPanel>
  );
}
