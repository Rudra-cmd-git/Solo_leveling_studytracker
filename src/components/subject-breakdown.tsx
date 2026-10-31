import { BookOpen } from "lucide-react";
import type { SubjectActivity } from "@/lib/types";
import { formatMinutes } from "@/lib/game";
import { SystemPanel } from "./system-panel";

export function SubjectBreakdown({
  subjects,
}: {
  subjects: SubjectActivity[];
}) {
  return (
    <SystemPanel label="Subject mastery" className="boot-in boot-in-delay-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="title-display text-xl text-ice">Study Split</p>
          <p className="mt-1 text-[0.62rem] tracking-[0.14em] text-muted uppercase">
            Time invested by discipline
          </p>
        </div>
        <BookOpen className="h-4 w-4 text-glow/60" />
      </div>

      {subjects.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center text-center">
          <BookOpen className="h-6 w-6 text-muted" />
          <p className="mt-3 text-sm text-mist">No study data yet.</p>
          <p className="mt-1 text-xs text-muted">
            Record sessions to reveal your subject split.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {subjects.map((subject) => (
            <div key={subject.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rotate-45"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="truncate text-xs font-semibold text-ice">
                    {subject.name}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[0.6rem] text-muted">
                  {formatMinutes(subject.minutes)} · {Math.round(subject.percent)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 border border-[rgba(84,221,255,0.1)] bg-[rgba(1,6,12,0.8)]">
                <div
                  className="h-full"
                  style={{
                    width: `${subject.percent}%`,
                    backgroundColor: subject.color,
                    boxShadow: `0 0 8px ${subject.color}66`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SystemPanel>
  );
}
