"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Pause,
  Play,
  RotateCcw,
  Save,
  Square,
  Timer,
  X,
} from "lucide-react";
import { saveSession } from "@/app/actions";
import { RANKS, sessionXp } from "@/lib/game";
import { elapsedClock } from "@/lib/dates";
import type { SubjectData, SessionResult } from "@/lib/types";
import { cn, focusLabel, formatNumber } from "@/lib/utils";
import { RewardOverlay, type RewardState } from "./reward-overlay";
import { SystemPanel } from "./system-panel";
import { SystemToast, type ToastState } from "./system-toast";

type Phase = "idle" | "running" | "paused" | "review";

const PRESETS = [25, 50, 90];

interface FocusTimerProps {
  subjects: SubjectData[];
  defaultMinutes: number;
  todayKey: string;
  soundEnabled: boolean;
}

export function FocusTimer({
  subjects,
  defaultMinutes,
  todayKey,
  soundEnabled,
}: FocusTimerProps) {
  const initialDuration = PRESETS.includes(defaultMinutes)
    ? defaultMinutes
    : 25;
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? 0);
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(initialDuration);
  const [remaining, setRemaining] = useState(initialDuration * 60);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [focusRating, setFocusRating] = useState(4);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [reward, setReward] = useState<RewardState | null>(null);
  const [isPending, startTransition] = useTransition();
  const endAtRef = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (phase !== "running") return;

    const interval = window.setInterval(() => {
      const endAt = endAtRef.current ?? Date.now();
      const nextRemaining = Math.max(
        0,
        Math.ceil((endAt - Date.now()) / 1000),
      );
      setRemaining(nextRemaining);

      if (nextRemaining <= 0) {
        window.clearInterval(interval);
        endAtRef.current = null;
        setElapsedSeconds(duration * 60);
        setPhase("review");
        if (soundEnabled) playSystemChime();
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [phase, duration, soundEnabled]);

  const totalSeconds = duration * 60;
  const progress =
    totalSeconds > 0 ? Math.max(0, Math.min(1, remaining / totalSeconds)) : 0;
  const circumference = 2 * Math.PI * 138;
  const selectedSubject = subjects.find((subject) => subject.id === subjectId);
  const logMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
  const estimatedXp = sessionXp(logMinutes, focusRating);
  const isLocked = phase === "running" || phase === "paused";

  function selectDuration(minutes: number) {
    if (isLocked) return;
    setDuration(minutes);
    setRemaining(minutes * 60);
    setPhase("idle");
    setElapsedSeconds(0);
  }

  function start() {
    if (subjectId === 0) {
      setToast({
        title: "System warning",
        message: "Create a subject before entering the focus gate.",
        tone: "danger",
      });
      return;
    }

    const seconds = remaining > 0 ? remaining : totalSeconds;
    setRemaining(seconds);
    endAtRef.current = Date.now() + seconds * 1000;
    setPhase("running");
  }

  function pause() {
    if (phase !== "running") return;
    const nextRemaining = Math.max(
      0,
      Math.ceil(((endAtRef.current ?? Date.now()) - Date.now()) / 1000),
    );
    endAtRef.current = null;
    setRemaining(nextRemaining);
    setPhase("paused");
  }

  function resume() {
    endAtRef.current = Date.now() + remaining * 1000;
    setPhase("running");
  }

  function reset() {
    endAtRef.current = null;
    setPhase("idle");
    setRemaining(totalSeconds);
    setElapsedSeconds(0);
    setNotes("");
  }

  function finishEarly() {
    const remainingNow = Math.max(
      0,
      Math.ceil(((endAtRef.current ?? Date.now()) - Date.now()) / 1000),
    );
    const elapsed = totalSeconds - remainingNow;

    if (elapsed < 30) {
      setToast({
        title: "Session too short",
        message: "Focus for at least 30 seconds before recording a session.",
        tone: "danger",
      });
      return;
    }

    endAtRef.current = null;
    setRemaining(remainingNow);
    setElapsedSeconds(elapsed);
    setPhase("review");
  }

  function closeReview() {
    if (isPending) return;
    reset();
  }

  function save() {
    if (isPending) return;

    startTransition(async () => {
      const result: SessionResult = await saveSession({
        subjectId,
        topic: topic.trim() || "Focused Study",
        notes,
        durationMinutes: logMinutes,
        focusRating,
        studiedAt: todayKey,
      });

      if (!result.ok) {
        setToast({
          title: "System warning",
          message: result.error ?? "Could not save this session.",
          tone: "danger",
        });
        return;
      }

      router.refresh();
      reset();

      if (
        result.leveledUp ||
        result.rankedUp ||
        (result.achievements && result.achievements.length > 0)
      ) {
        setReward({
          xp: result.xpEarned ?? estimatedXp,
          level: result.level,
          rank: result.rank ? RANKS[result.rank] : undefined,
          leveledUp: result.leveledUp,
          rankedUp: result.rankedUp,
          achievements: result.achievements,
        });
      } else {
        setToast({
          title: "Session recorded",
          message: `${logMinutes} minutes logged. +${formatNumber(result.xpEarned ?? estimatedXp)} XP`,
          tone: "success",
        });
      }
    });
  }

  const ringOffset = circumference * (1 - progress);

  return (
    <>
      <SystemPanel hero className="boot-in">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="hud-label hud-label--bright">Focus gate</span>
            <span className="korean-accent">집중</span>
          </div>
          <span
            className={cn(
              "flex items-center gap-1.5 text-[0.6rem] font-semibold tracking-[0.18em] uppercase",
              phase === "running" ? "text-mint" : "text-muted",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                phase === "running"
                  ? "bg-mint shadow-[0_0_7px_#3dd6a3]"
                  : "bg-muted",
              )}
            />
            {phase === "running"
              ? "Gate open"
              : phase === "paused"
                ? "Paused"
                : "Standby"}
          </span>
        </div>

        <div className="mt-5 grid gap-7 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg
                viewBox="0 0 320 320"
                className="h-72 w-72 max-w-full sm:h-80 sm:w-80"
                aria-hidden="true"
              >
                <circle
                  cx="160"
                  cy="160"
                  r="138"
                  fill="none"
                  stroke="rgba(59,158,255,0.08)"
                  strokeWidth="3"
                />
                <circle
                  cx="160"
                  cy="160"
                  r="126"
                  fill="none"
                  stroke="rgba(84,221,255,0.09)"
                  strokeWidth="1"
                  strokeDasharray="3 9"
                />
                <circle
                  cx="160"
                  cy="160"
                  r="138"
                  fill="none"
                  stroke="#54ddff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 160 160)"
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(84,221,255,0.7))",
                    transition: "stroke-dashoffset 0.3s linear",
                  }}
                />
                <path
                  d="M160 16v10M160 294v10M16 160h10M294 160h10"
                  stroke="rgba(84,221,255,0.4)"
                  strokeWidth="1.5"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="hud-label">
                  {phase === "review" ? "Session complete" : "Time remaining"}
                </p>
                <p className="mt-2 font-mono text-4xl font-medium tracking-[0.08em] text-ice sm:text-5xl">
                  {elapsedClock(remaining)}
                </p>
                <p className="mt-2 max-w-44 truncate text-center text-[0.64rem] tracking-[0.12em] text-muted uppercase">
                  {selectedSubject?.name ?? "No subject"} · {duration} min
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {phase === "running" ? (
                <>
                  <button
                    type="button"
                    onClick={pause}
                    className="system-button"
                  >
                    <Pause className="h-4 w-4" /> Pause
                  </button>
                  <button
                    type="button"
                    onClick={finishEarly}
                    className="system-button system-button--ghost"
                  >
                    <Square className="h-3.5 w-3.5" /> Finish
                  </button>
                </>
              ) : phase === "paused" ? (
                <>
                  <button
                    type="button"
                    onClick={resume}
                    className="system-button"
                  >
                    <Play className="h-4 w-4" /> Resume
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="system-button system-button--ghost"
                  >
                    <RotateCcw className="h-4 w-4" /> Reset
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={start}
                  className="system-button min-w-44"
                >
                  <Play className="h-4 w-4" /> Begin focus
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="focus-subject" className="hud-label mb-1.5 block">
                Subject
              </label>
              <select
                id="focus-subject"
                className="system-select"
                value={subjectId}
                onChange={(event) => setSubjectId(Number(event.target.value))}
                disabled={isLocked}
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
              <label htmlFor="focus-topic" className="hud-label mb-1.5 block">
                Topic
              </label>
              <input
                id="focus-topic"
                className="system-input"
                placeholder="What are you training?"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                maxLength={120}
                disabled={isLocked}
              />
            </div>

            <div>
              <p className="hud-label mb-1.5">Session length</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => selectDuration(minutes)}
                    disabled={isLocked}
                    className={cn(
                      "border px-2 py-2 font-mono text-sm transition-colors",
                      duration === minutes
                        ? "border-[rgba(84,221,255,0.65)] bg-[rgba(59,158,255,0.16)] text-glow"
                        : "border-[rgba(84,221,255,0.14)] bg-[rgba(3,10,20,0.45)] text-mist hover:border-[rgba(84,221,255,0.35)]",
                    )}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 border border-[rgba(84,221,255,0.12)] bg-[rgba(3,10,20,0.4)] px-3 py-2">
                <Timer className="h-3.5 w-3.5 text-muted" />
                <span className="text-[0.64rem] text-muted">
                  Estimated reward
                </span>
                <span className="ml-auto font-mono text-xs text-gold">
                  +{formatNumber(sessionXp(duration, focusRating))} XP
                </span>
              </div>
            </div>

            {subjects.length === 0 ? (
              <Link
                href="/settings"
                className="flex items-center gap-2 border border-[rgba(255,191,90,0.24)] bg-[rgba(255,191,90,0.05)] px-3 py-2 text-xs text-gold"
              >
                <AlertTriangle className="h-4 w-4" />
                Add a subject in Settings to begin.
              </Link>
            ) : null}

            <p className="text-[0.64rem] leading-relaxed text-muted">
              The System records only completed focus. Stay in the gate until
              the timer ends, or finish early after 30 seconds.
            </p>
          </div>
        </div>
      </SystemPanel>

      {phase === "review" ? (
        <div className="overlay-backdrop z-[70]">
          <SystemPanel
            hero
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto"
            label="Session record"
          >
            <button
              type="button"
              onClick={closeReview}
              className="absolute top-4 right-4 text-muted transition-colors hover:text-white"
              aria-label="Close session record"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center border border-[rgba(61,214,163,0.35)] bg-[rgba(61,214,163,0.08)]">
                <Check className="h-6 w-6 text-mint" />
              </div>
              <p className="mt-3 hud-label hud-label--bright">Gate cleared</p>
              <h2 className="title-display mt-1 text-2xl text-white">
                Record Your Session
              </h2>
              <p className="mt-1 text-xs text-muted">
                {elapsedClock(elapsedSeconds)} focused · {logMinutes} minute
                {logMinutes === 1 ? "" : "s"} recorded
              </p>
            </div>

            <div className="mt-5">
              <p className="hud-label mb-1.5">Focus quality</p>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFocusRating(rating)}
                    className={cn(
                      "border py-2 font-mono text-sm transition-colors",
                      focusRating === rating
                        ? "border-[rgba(84,221,255,0.7)] bg-[rgba(59,158,255,0.18)] text-glow"
                        : "border-[rgba(84,221,255,0.12)] bg-[rgba(3,10,20,0.4)] text-mist hover:border-[rgba(84,221,255,0.35)]",
                    )}
                    aria-label={`Focus quality ${rating}: ${focusLabel(rating)}`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-center text-[0.62rem] tracking-[0.12em] text-mist uppercase">
                {focusLabel(focusRating)}
              </p>
            </div>

            <div className="mt-4">
              <label htmlFor="session-notes" className="hud-label mb-1.5 block">
                Reflection notes
              </label>
              <textarea
                id="session-notes"
                className="system-textarea"
                placeholder="What did you learn? What needs another pass?"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={2000}
              />
            </div>

            <div className="mt-4 flex items-center justify-between border border-[rgba(84,221,255,0.12)] bg-[rgba(3,10,20,0.45)] px-3 py-2.5">
              <span className="hud-label">XP reward</span>
              <span className="font-mono text-sm text-gold">
                +{formatNumber(estimatedXp)}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={closeReview}
                className="system-button system-button--ghost flex-1"
                disabled={isPending}
              >
                Discard
              </button>
              <button
                type="button"
                onClick={save}
                className="system-button flex-1"
                disabled={isPending || subjectId === 0}
              >
                {isPending ? (
                  "Recording..."
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save session
                  </>
                )}
              </button>
            </div>
          </SystemPanel>
        </div>
      ) : null}

      <RewardOverlay reward={reward} onClose={() => setReward(null)} />
      <SystemToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function playSystemChime() {
  try {
    const AudioContextClass = window.AudioContext;
    const context = new AudioContextClass();
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    gain.connect(context.destination);

    [523.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(now + index * 0.12);
      oscillator.stop(now + 1.2);
    });

    window.setTimeout(() => {
      void context.close();
    }, 1600);
  } catch {
    // Audio is optional; the visual system notification still fires.
  }
}
