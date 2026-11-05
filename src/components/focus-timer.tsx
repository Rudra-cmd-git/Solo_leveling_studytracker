"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Check,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Save,
  Square,
  Timer,
  X,
  Zap,
} from "lucide-react";
import { saveSession } from "@/app/actions";
import { RANKS, breakKindForCycle, sessionXp } from "@/lib/game";
import { elapsedClock } from "@/lib/dates";
import type { SubjectData, SessionResult } from "@/lib/types";
import { cn, focusLabel, formatNumber } from "@/lib/utils";
import { RewardOverlay, type RewardState } from "./reward-overlay";
import { SystemPanel } from "./system-panel";
import { SystemToast, type ToastState } from "./system-toast";

type Phase = "idle" | "running" | "paused" | "review" | "break";

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

  const [pomodoro, setPomodoro] = useState(false);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [breakTotal, setBreakTotal] = useState(0);
  const [breakLong, setBreakLong] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const endAtRef = useRef<number | null>(null);
  const workDoneRef = useRef(false);
  const autoSavingRef = useRef(false);
  const finishWorkRef = useRef<() => void>(() => {});
  const finishBreakRef = useRef<() => void>(() => {});
  const router = useRouter();

  const totalSeconds = duration * 60;
  const activeTotal = phase === "break" ? breakTotal : totalSeconds;
  const progress =
    activeTotal > 0 ? Math.max(0, Math.min(1, remaining / activeTotal)) : 0;
  const circumference = 2 * Math.PI * 138;
  const selectedSubject = subjects.find((subject) => subject.id === subjectId);
  const logMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
  const estimatedXp = sessionXp(logMinutes, focusRating);
  const isLocked =
    phase === "running" || phase === "paused" || phase === "break";

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
    workDoneRef.current = false;
    setRemaining(seconds);
    endAtRef.current = Date.now() + seconds * 1000;
    setBurstKey((value) => value + 1);
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
    workDoneRef.current = false;
    endAtRef.current = Date.now() + remaining * 1000;
    setPhase("running");
  }

  function reset() {
    endAtRef.current = null;
    workDoneRef.current = false;
    setPhase("idle");
    setRemaining(totalSeconds);
    setElapsedSeconds(0);
    setNotes("");
    setBreakTotal(0);
    setCompletedCycles(0);
    setBreakLong(false);
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
    workDoneRef.current = true;
    setRemaining(remainingNow);
    setElapsedSeconds(elapsed);

    if (pomodoro) {
      autoSave(Math.max(1, Math.round(elapsed / 60)));
      beginBreak();
    } else {
      setPhase("review");
    }
  }

  function beginBreak() {
    const nextCycles = completedCycles + 1;
    const isLong =
      breakKindForCycle(nextCycles, cyclesBeforeLongBreak) === "long";
    const minutes = isLong ? longBreak : shortBreak;

    setCompletedCycles(nextCycles);
    setBreakLong(isLong);
    setBreakTotal(minutes * 60);
    setRemaining(minutes * 60);
    endAtRef.current = Date.now() + minutes * 60 * 1000;
    setPhase("break");
    if (soundEnabled) playSystemChime();
  }

  function finishBreak() {
    endAtRef.current = null;
    setBreakTotal(0);
    setRemaining(totalSeconds);
    setElapsedSeconds(0);
    setPhase("idle");
    if (soundEnabled) playSystemChime();
    setToast({
      title: "Break complete",
      message: "Recovery recorded. Return to the gate when ready.",
      tone: "system",
    });
  }

  function completeWork() {
    if (workDoneRef.current) return;
    workDoneRef.current = true;
    setElapsedSeconds(duration * 60);

    if (pomodoro) {
      autoSave(duration);
      beginBreak();
    } else {
      setPhase("review");
      if (soundEnabled) playSystemChime();
    }
  }

  useEffect(() => {
    finishWorkRef.current = completeWork;
    finishBreakRef.current = finishBreak;
  });

  useEffect(() => {
    if (phase !== "running" && phase !== "break") return;

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
        if (phase === "break") {
          finishBreakRef.current();
        } else {
          finishWorkRef.current();
        }
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [phase]);

  function autoSave(minutes: number) {
    if (autoSavingRef.current) return;
    autoSavingRef.current = true;

    startTransition(async () => {
      const result: SessionResult = await saveSession({
        subjectId,
        topic: topic.trim() || "Focused Study",
        notes,
        durationMinutes: minutes,
        focusRating,
        studiedAt: todayKey,
      });
      autoSavingRef.current = false;

      if (!result.ok) {
        setToast({
          title: "System warning",
          message: result.error ?? "Could not save this session.",
          tone: "danger",
        });
        return;
      }

      router.refresh();
      setNotes("");

      if (
        result.leveledUp ||
        result.rankedUp ||
        (result.achievements && result.achievements.length > 0)
      ) {
        setReward({
          xp: result.xpEarned ?? sessionXp(minutes, focusRating),
          level: result.level,
          rank: result.rank ? RANKS[result.rank] : undefined,
          leveledUp: result.leveledUp,
          rankedUp: result.rankedUp,
          achievements: result.achievements,
        });
      } else {
        setToast({
          title: "Session recorded",
          message: `${minutes} minutes logged. +${formatNumber(result.xpEarned ?? sessionXp(minutes, focusRating))} XP`,
          tone: "success",
        });
      }
    });
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
  const cyclePosition =
    cyclesBeforeLongBreak > 0
      ? completedCycles === 0
        ? 1
        : ((completedCycles - 1) % cyclesBeforeLongBreak) + 1
      : 0;
  const ringColor = phase === "break" ? "#3dd6a3" : "#54ddff";
  const isActive = phase === "running" || phase === "break";
  const isCritical = phase === "running" && remaining <= 10 && remaining > 0;

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
              phase === "running"
                ? "text-mint"
                : phase === "break"
                  ? "text-mint"
                  : "text-muted",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                phase === "running" || phase === "break"
                  ? "bg-mint shadow-[0_0_7px_#3dd6a3]"
                  : "bg-muted",
              )}
            />
            {phase === "running"
              ? "Gate open"
              : phase === "break"
                ? breakLong
                  ? "Long break"
                  : "Break"
                : phase === "paused"
                  ? "Paused"
                  : "Standby"}
          </span>
        </div>

        <div className="mt-5 grid gap-7 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="flex flex-col items-center">
            <div className="relative">
              <motion.div
                aria-hidden="true"
                className="timer-aura pointer-events-none absolute inset-2 rounded-full"
                style={{
                  background:
                    phase === "break"
                      ? "radial-gradient(circle, rgba(61,214,163,0.2), rgba(61,214,163,0.05) 48%, transparent 72%)"
                      : undefined,
                }}
                animate={
                  isActive
                    ? { scale: [1, 1.045, 1], opacity: [0.55, 0.95, 0.55] }
                    : { scale: 1, opacity: 0.35 }
                }
                transition={
                  isActive
                    ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.4 }
                }
              />
              {/* Manhwa Battlefield Focus Speedlines */}
              {isActive && phase === "running" ? (
                <div
                  aria-hidden="true"
                  className="manhwa-speedlines pointer-events-none absolute -inset-6 rounded-full"
                />
              ) : null}
              <motion.div
                key={phase}
                aria-hidden="true"
                className="pointer-events-none absolute inset-6 rounded-full border"
                style={{ borderColor: `${ringColor}66` }}
                initial={{ opacity: 0.7, scale: 0.88 }}
                animate={{ opacity: 0, scale: 1.22 }}
                transition={{ duration: 0.75, ease: "easeOut" }}
              />
              <AnimatePresence>
                {burstKey > 0 ? (
                  <motion.div
                    key={burstKey}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-4 rounded-full border-2"
                    style={{
                      borderColor: ringColor,
                      boxShadow: `0 0 40px ${ringColor}88`,
                    }}
                    initial={{ opacity: 0.85, scale: 0.65 }}
                    animate={{ opacity: 0, scale: 1.65 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                ) : null}
              </AnimatePresence>
              <svg
                viewBox="0 0 320 320"
                className="relative h-72 w-72 max-w-full sm:h-80 sm:w-80"
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
                  stroke={ringColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 160 160)"
                  style={{
                    filter:
                      phase === "break"
                        ? "drop-shadow(0 0 6px rgba(61,214,163,0.7))"
                        : "drop-shadow(0 0 6px rgba(84,221,255,0.7))",
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
                  {phase === "review"
                    ? "Session complete"
                    : phase === "break"
                      ? breakLong
                        ? "Long break"
                        : "Short break"
                      : "Time remaining"}
                </p>
                <motion.p
                  className="mt-2 font-mono text-4xl font-medium tracking-[0.08em] text-ice sm:text-5xl"
                  animate={
                    isCritical
                      ? {
                          scale: [1, 1.06, 1],
                          color: ["#dcf6ff", "#ff9aa8", "#dcf6ff"],
                        }
                      : { scale: 1 }
                  }
                  transition={
                    isCritical
                      ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.3 }
                  }
                >
                  {elapsedClock(remaining)}
                </motion.p>
                <p className="mt-2 max-w-44 truncate text-center text-[0.64rem] tracking-[0.12em] text-muted uppercase">
                  {phase === "break"
                    ? `Recovery · ${Math.round(breakTotal / 60)} min`
                    : `${selectedSubject?.name ?? "No subject"} · ${duration} min`}
                </p>
                {pomodoro && phase !== "review" ? (
                  <p className="mt-1.5 text-[0.55rem] tracking-[0.14em] text-glow/70 uppercase">
                    Cycle {cyclePosition} / {cyclesBeforeLongBreak}
                  </p>
                ) : null}
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
              ) : phase === "break" ? (
                <button
                  type="button"
                  onClick={finishBreak}
                  className="system-button"
                >
                  <Coffee className="h-4 w-4" /> Skip break
                </button>
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
            </div>

            <div>
              <p className="hud-label mb-1.5">Focus quality</p>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFocusRating(rating)}
                    disabled={isLocked}
                    className={cn(
                      "border py-1.5 font-mono text-xs transition-colors",
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
            </div>

            <button
              type="button"
              onClick={() => setPomodoro((value) => !value)}
              disabled={isLocked}
              className={cn(
                "flex w-full items-center justify-between border px-3 py-2.5 text-left transition-colors",
                pomodoro
                  ? "border-[rgba(61,214,163,0.4)] bg-[rgba(61,214,163,0.08)]"
                  : "border-[rgba(84,221,255,0.12)] bg-[rgba(3,10,20,0.4)]",
              )}
              aria-pressed={pomodoro}
            >
              <span className="flex items-center gap-2.5">
                <Zap
                  className={cn(
                    "h-4 w-4",
                    pomodoro ? "text-mint" : "text-muted",
                  )}
                />
                <span>
                  <span className="block text-xs font-semibold text-ice">
                    Pomodoro cycles
                  </span>
                  <span className="mt-0.5 block text-[0.62rem] text-muted">
                    Auto-log work, then take a break
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "relative h-5 w-9 border transition-colors",
                  pomodoro
                    ? "border-[rgba(61,214,163,0.5)] bg-[rgba(61,214,163,0.28)]"
                    : "border-[rgba(84,221,255,0.18)] bg-[rgba(2,8,16,0.8)]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-3.5 w-3.5 transition-all",
                    pomodoro
                      ? "left-[18px] bg-mint shadow-[0_0_6px_#3dd6a3]"
                      : "left-0.5 bg-muted",
                  )}
                />
              </span>
            </button>

            {pomodoro ? (
              <div className="grid grid-cols-3 gap-2">
                <BreakField
                  id="short-break"
                  label="Short"
                  value={shortBreak}
                  onChange={setShortBreak}
                  disabled={isLocked}
                />
                <BreakField
                  id="long-break"
                  label="Long"
                  value={longBreak}
                  onChange={setLongBreak}
                  disabled={isLocked}
                />
                <BreakField
                  id="cycle-count"
                  label="Cycles"
                  value={cyclesBeforeLongBreak}
                  onChange={setCyclesBeforeLongBreak}
                  disabled={isLocked}
                />
              </div>
            ) : null}

            <div className="flex items-center gap-2 border border-[rgba(84,221,255,0.12)] bg-[rgba(3,10,20,0.4)] px-3 py-2">
              <Timer className="h-3.5 w-3.5 text-muted" />
              <span className="text-[0.64rem] text-muted">Estimated reward</span>
              <span className="ml-auto font-mono text-xs text-gold">
                +{formatNumber(sessionXp(duration, focusRating))} XP
              </span>
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
              {pomodoro
                ? "Work sessions auto-record when the timer ends, then a break begins. Breaks do not count as study time."
                : "The System records only completed focus. Stay in the gate until the timer ends, or finish early after 30 seconds."}
            </p>
          </div>
        </div>
      </SystemPanel>

      <AnimatePresence>
        {phase === "review" ? (
          <motion.div
            key="review"
            className="overlay-backdrop z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            <motion.div
              className="w-full max-w-lg"
              initial={{ opacity: 0, y: 28, scale: 0.94, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 18, scale: 0.97, filter: "blur(6px)" }}
              transition={{ type: "spring", stiffness: 220, damping: 25 }}
            >
              <SystemPanel
                hero
                className="max-h-[92vh] w-full overflow-y-auto"
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
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <RewardOverlay reward={reward} onClose={() => setReward(null)} />
      <SystemToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function BreakField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="hud-label mb-1 block text-[0.55rem]">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={1}
        max={60}
        className="system-input font-mono text-sm"
        value={value}
        onChange={(event) =>
          onChange(Math.min(60, Math.max(1, Number(event.target.value) || 1)))
        }
        disabled={disabled}
      />
    </div>
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
