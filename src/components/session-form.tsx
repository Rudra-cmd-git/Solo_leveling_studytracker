"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Save, Sparkles } from "lucide-react";
import { saveSession } from "@/app/actions";
import { RANKS, sessionXp } from "@/lib/game";
import type { SubjectData } from "@/lib/types";
import { cn, focusLabel, formatNumber } from "@/lib/utils";
import { RewardOverlay, type RewardState } from "./reward-overlay";
import { SystemPanel } from "./system-panel";
import { SystemToast, type ToastState } from "./system-toast";

export function SessionForm({
  subjects,
  todayKey,
}: {
  subjects: SubjectData[];
  todayKey: string;
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? 0);
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(30);
  const [focusRating, setFocusRating] = useState(3);
  const [studiedAt, setStudiedAt] = useState(todayKey);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [reward, setReward] = useState<RewardState | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      const result = await saveSession({
        subjectId,
        topic,
        notes,
        durationMinutes: duration,
        focusRating,
        studiedAt,
      });

      if (!result.ok) {
        setToast({
          title: "System warning",
          message: result.error ?? "Could not record this session.",
          tone: "danger",
        });
        return;
      }

      router.refresh();
      setTopic("");
      setNotes("");
      setStudiedAt(todayKey);

      if (
        result.leveledUp ||
        result.rankedUp ||
        (result.achievements && result.achievements.length > 0)
      ) {
        setReward({
          xp: result.xpEarned ?? sessionXp(duration, focusRating),
          level: result.level,
          rank: result.rank ? RANKS[result.rank] : undefined,
          leveledUp: result.leveledUp,
          rankedUp: result.rankedUp,
          achievements: result.achievements,
        });
      } else {
        setToast({
          title: "Session recorded",
          message: `${duration} minutes logged. +${formatNumber(result.xpEarned ?? sessionXp(duration, focusRating))} XP`,
          tone: "success",
        });
      }
    });
  }

  return (
    <>
      <SystemPanel label="Manual record" className="boot-in">
        <h2 className="title-display text-xl text-ice">Log Session</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Record study completed outside the focus gate. Honest records build
          real attributes.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label htmlFor="manual-subject" className="hud-label mb-1.5 block">
              Subject
            </label>
            <select
              id="manual-subject"
              className="system-select"
              value={subjectId}
              onChange={(event) => setSubjectId(Number(event.target.value))}
              disabled={subjects.length === 0}
            >
              {subjects.length === 0 ? (
                <option value={0}>No subjects available</option>
              ) : null}
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="manual-topic" className="hud-label mb-1.5 block">
              Topic
            </label>
            <input
              id="manual-topic"
              className="system-input"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Chapter, problem set, project..."
              maxLength={120}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="manual-duration" className="hud-label mb-1.5 block">
                Minutes
              </label>
              <input
                id="manual-duration"
                type="number"
                min={1}
                max={600}
                className="system-input font-mono"
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                required
              />
            </div>
            <div>
              <label htmlFor="manual-date" className="hud-label mb-1.5 block">
                Date
              </label>
              <input
                id="manual-date"
                type="date"
                className="system-input font-mono text-sm"
                value={studiedAt}
                max={todayKey}
                onChange={(event) => setStudiedAt(event.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <p className="hud-label mb-1.5">Focus quality</p>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFocusRating(rating)}
                  className={cn(
                    "border py-1.5 font-mono text-xs transition-colors",
                    focusRating === rating
                      ? "border-[var(--accent-a07)] bg-[var(--accent2-a018)] text-glow"
                      : "border-[var(--accent-a012)] bg-[var(--panel-a04)] text-mist hover:border-[var(--accent-a035)]",
                  )}
                  aria-label={`Focus quality ${rating}: ${focusLabel(rating)}`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="manual-notes" className="hud-label mb-1.5 block">
              Reflection notes
            </label>
            <textarea
              id="manual-notes"
              className="system-textarea min-h-20"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional reflection..."
              maxLength={2000}
            />
          </div>

          <div className="flex items-center justify-between border border-[var(--accent-a012)] bg-[var(--panel-a045)] px-3 py-2">
            <span className="flex items-center gap-1.5 text-[0.62rem] tracking-[0.1em] text-muted uppercase">
              <Sparkles className="h-3 w-3 text-gold" /> Estimated
            </span>
            <span className="font-mono text-xs text-gold">
              +{formatNumber(sessionXp(duration, focusRating))} XP
            </span>
          </div>

          {subjects.length === 0 ? (
            <Link
              href="/settings"
              className="flex items-center gap-2 border border-[rgb(var(--gold-rgb)/0.24)] bg-[rgb(var(--gold-rgb)/0.05)] px-3 py-2 text-xs text-gold"
            >
              <AlertTriangle className="h-4 w-4" />
              Add a subject first
            </Link>
          ) : (
            <button
              type="submit"
              className="system-button w-full"
              disabled={isPending || subjectId === 0}
            >
              {isPending ? (
                "Recording..."
              ) : (
                <>
                  <Save className="h-4 w-4" /> Record session
                </>
              )}
            </button>
          )}
        </form>
      </SystemPanel>

      <RewardOverlay reward={reward} onClose={() => setReward(null)} />
      <SystemToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
