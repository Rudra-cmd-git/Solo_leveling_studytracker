"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { SessionData } from "@/lib/types";
import { formatMinutes } from "@/lib/game";
import { cn } from "@/lib/utils";
import { SystemPanel } from "./system-panel";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const LEVEL_STYLES = [
  {
    background: "var(--accent2-a0035)",
    borderColor: "var(--accent-a006)",
    boxShadow: "none",
  },
  {
    background: "var(--accent2-a018)",
    borderColor: "var(--accent-a012)",
    boxShadow: "none",
  },
  {
    background: "var(--accent2-a034)",
    borderColor: "var(--accent-a02)",
    boxShadow: "none",
  },
  {
    background: "var(--accent-a055)",
    borderColor: "var(--accent-a032)",
    boxShadow: "0 0 6px var(--accent-a018)",
  },
  {
    background: "var(--accent)",
    borderColor: "rgb(var(--ice-rgb) / 0.45)",
    boxShadow: "0 0 9px var(--accent-a044)",
  },
];

const LEGEND = [
  { level: 0, label: "No study" },
  { level: 1, label: "<30m" },
  { level: 2, label: "30m+" },
  { level: 3, label: "60m+" },
  { level: 4, label: "120m+" },
];

function levelForMinutes(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes >= 120) return 4;
  if (minutes >= 60) return 3;
  if (minutes >= 30) return 2;
  return 1;
}

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function StudyCalendar({
  sessions,
  todayKey,
}: {
  sessions: SessionData[];
  todayKey: string;
}) {
  const [todayYear, todayMonth] = todayKey.split("-").map(Number);
  const [cursor, setCursor] = useState({
    year: todayYear,
    month: todayMonth - 1,
  });

  const minutesByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of sessions) {
      map.set(
        session.studiedAt,
        (map.get(session.studiedAt) ?? 0) + session.durationMinutes,
      );
    }
    return map;
  }, [sessions]);

  const firstWeekday = new Date(
    Date.UTC(cursor.year, cursor.month, 1),
  ).getUTCDay();
  const leadingBlanks = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const daysInMonth = new Date(
    Date.UTC(cursor.year, cursor.month + 1, 0),
  ).getUTCDate();

  const cells: Array<string | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      toKey(cursor.year, cursor.month, index + 1),
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(cursor.year, cursor.month, 1)));

  const monthMinutes = cells.reduce(
    (sum, dateKey) => sum + (dateKey ? (minutesByDate.get(dateKey) ?? 0) : 0),
    0,
  );
  const activeDays = cells.filter(
    (dateKey) => dateKey && (minutesByDate.get(dateKey) ?? 0) > 0,
  ).length;

  function shiftMonth(delta: number) {
    setCursor((current) => {
      const next = new Date(Date.UTC(current.year, current.month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  function goToToday() {
    setCursor({ year: todayYear, month: todayMonth - 1 });
  }

  return (
    <SystemPanel label="Study calendar" className="boot-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="title-display text-xl text-ice">{monthLabel}</p>
          <p className="mt-1 text-[0.62rem] tracking-[0.14em] text-muted uppercase">
            {activeDays} active days · {formatMinutes(monthMinutes)} recorded
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goToToday}
            className="icon-button h-7 w-auto border-[var(--accent-a016)] px-2 text-[0.55rem] tracking-[0.1em] uppercase"
            aria-label="Go to current month"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="icon-button h-7 w-7 border-[var(--accent-a016)]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="icon-button h-7 w-7 border-[var(--accent-a016)]"
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="pb-1 text-center text-[0.52rem] tracking-[0.1em] text-muted uppercase"
          >
            {weekday}
          </span>
        ))}
        {cells.map((dateKey, index) => {
          if (!dateKey) {
            return <span key={`blank-${index}`} aria-hidden="true" />;
          }

          const minutes = minutesByDate.get(dateKey) ?? 0;
          const level = levelForMinutes(minutes);
          const style = LEVEL_STYLES[level];
          const day = Number(dateKey.slice(-2));
          const isToday = dateKey === todayKey;

          return (
            <div
              key={dateKey}
              title={`${dateKey} · ${formatMinutes(minutes)}`}
              className={cn(
                "relative flex aspect-square min-h-9 flex-col items-center justify-center border text-[0.62rem] font-mono transition-colors",
                level >= 3 ? "text-void" : "text-mist",
                isToday && "ring-1 ring-white/50",
              )}
              style={style}
            >
              <span className={level >= 4 ? "font-semibold" : undefined}>
                {day}
              </span>
              {minutes > 0 ? (
                <span
                  className={cn(
                    "mt-0.5 text-[0.44rem] leading-none",
                    level >= 3 ? "text-void/80" : "text-muted",
                  )}
                >
                  {minutes >= 60
                    ? `${Math.round(minutes / 60)}h`
                    : `${minutes}m`}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--accent-a008)] pt-3">
        <span className="flex items-center gap-1.5 text-[0.56rem] tracking-[0.12em] text-muted uppercase">
          <CalendarDays className="h-3 w-3" /> Monthly record
        </span>
        <div className="flex flex-wrap items-center gap-2 text-[0.52rem] text-muted">
          {LEGEND.map((item) => (
            <span key={item.level} className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 border"
                style={LEVEL_STYLES[item.level]}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </SystemPanel>
  );
}
