"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AlertTriangle, Save, X } from "lucide-react";
import { updateSession } from "@/app/actions";
import { sessionXp } from "@/lib/game";
import type { SessionData, SubjectData } from "@/lib/types";
import { cn, focusLabel, formatNumber } from "@/lib/utils";
import { SystemPanel } from "./system-panel";

export function SessionEditDialog({
  session,
  subjects,
  todayKey,
  onClose,
  onSaved,
}: {
  session: SessionData;
  subjects: SubjectData[];
  todayKey: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [subjectId, setSubjectId] = useState(session.subjectId);
  const [topic, setTopic] = useState(session.topic);
  const [duration, setDuration] = useState(session.durationMinutes);
  const [focusRating, setFocusRating] = useState(session.focusRating);
  const [studiedAt, setStudiedAt] = useState(session.studiedAt);
  const [notes, setNotes] = useState(session.notes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await updateSession(session.id, {
        subjectId,
        topic,
        notes,
        durationMinutes: duration,
        focusRating,
        studiedAt,
      });

      if (!result.ok) {
        setError(result.error ?? "Could not update this session.");
        return;
      }

      router.refresh();
      onSaved(
        `${topic.trim()} updated. +${formatNumber(result.xpEarned ?? sessionXp(duration, focusRating))} XP`,
      );
      onClose();
    });
  }

  return (
    <motion.div
      className="overlay-backdrop z-[75]"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
    >
      <motion.div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 26, scale: 0.94, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 18, scale: 0.97, filter: "blur(6px)" }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
      >
        <SystemPanel
          hero
          label="Edit record"
          className="max-h-[92vh] overflow-y-auto"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-muted transition-colors hover:text-white"
            aria-label="Close edit dialog"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="title-display text-xl text-ice">Modify Session</h2>
          <p className="mt-1 text-xs text-muted">
            Correct the record. The System recalculates XP from the new values.
          </p>

          <form onSubmit={submit} className="mt-4 space-y-3.5">
            <div>
              <label htmlFor="edit-subject" className="hud-label mb-1.5 block">
                Subject
              </label>
              <select
                id="edit-subject"
                className="system-select"
                value={subjectId}
                onChange={(event) => setSubjectId(Number(event.target.value))}
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-topic" className="hud-label mb-1.5 block">
                Topic
              </label>
              <input
                id="edit-topic"
                className="system-input"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-duration" className="hud-label mb-1.5 block">
                  Minutes
                </label>
                <input
                  id="edit-duration"
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
                <label htmlFor="edit-date" className="hud-label mb-1.5 block">
                  Date
                </label>
                <input
                  id="edit-date"
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
              <label htmlFor="edit-notes" className="hud-label mb-1.5 block">
                Reflection notes
              </label>
              <textarea
                id="edit-notes"
                className="system-textarea min-h-20"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={2000}
              />
            </div>

            {error ? (
              <div className="flex items-start gap-2 border border-[rgb(var(--danger-rgb)/0.3)] bg-[rgb(var(--danger-rgb)/0.06)] px-3 py-2 text-sm text-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between border border-[var(--accent-a012)] bg-[var(--panel-a045)] px-3 py-2">
              <span className="hud-label">Estimated XP</span>
              <span className="font-mono text-xs text-gold">
                +{formatNumber(sessionXp(duration, focusRating))}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="system-button system-button--ghost flex-1"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="system-button flex-1"
                disabled={isPending || subjectId === 0}
              >
                {isPending ? (
                  "Updating..."
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Update record
                  </>
                )}
              </button>
            </div>
          </form>
        </SystemPanel>
      </motion.div>
    </motion.div>
  );
}
