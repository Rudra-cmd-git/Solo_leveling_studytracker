"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Timer,
  Swords,
  TrendingUp,
  Palette,
  Play,
  X,
  ChevronRight,
} from "lucide-react";
import { markCinematicSeen } from "@/app/actions";
import { CinematicRankPreview } from "./cinematic-rank-preview";
import { cn } from "@/lib/utils";

const STEP_DURATION_MS = 5000;

interface CinematicStep {
  id: string;
  title: string;
  korean: string;
  body: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  visual?: React.ReactNode;
}

const STEPS: CinematicStep[] = [
  {
    id: "awakening",
    title: "Player Awakening",
    korean: "각성",
    body:
      "The System has selected you as a Hunter. Your journey begins at E-Rank — dormant, but full of potential.",
    icon: Sparkles,
  },
  {
    id: "focus-gate",
    title: "Focus Gate",
    korean: "집중",
    body:
      "Enter the Focus Gate to begin a study session. Every minute you study earns XP toward your next level.",
    icon: Timer,
  },
  {
    id: "quests",
    title: "Daily Quests",
    korean: "퀘스트",
    body:
      "Complete daily and weekly quests to claim bonus XP. Quests refresh on schedule — clear them all to rise faster.",
    icon: Swords,
  },
  {
    id: "leveling",
    title: "Leveling Up",
    korean: "레벨업",
    body:
      "XP raises your Hunter level. Every 10 levels, your rank awakens — E → D → C → B → A → S.",
    icon: TrendingUp,
  },
  {
    id: "theme",
    title: "Theme Evolution",
    korean: "테마",
    body:
      "As your rank rises, the System's interface evolves — colors, aura, and atmosphere shift with your power.",
    icon: Palette,
    visual: <CinematicRankPreview currentRank="E" />,
  },
  {
    id: "begin",
    title: "Begin Your Journey",
    korean: "시작",
    body:
      "The System awaits your first session. Awaken your potential, Hunter.",
    icon: Play,
  },
];

export function CinematicIntro() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [isSkipping, setIsSkipping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepStartRef = useRef<number>(Date.now());
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const currentStep = STEPS[stepIndex];
  const Icon = currentStep.icon;
  const isLastStep = stepIndex === STEPS.length - 1;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advance = useCallback(() => {
    if (isLastStep) return;
    setStepIndex((i) => i + 1);
    stepStartRef.current = Date.now();
  }, [isLastStep]);

  const skipCinematic = useCallback(async () => {
    setIsSkipping(true);
    clearTimer();
    const result = await markCinematicSeen(true);
    if (result.ok) {
      router.refresh();
    }
    setIsSkipping(false);
  }, [clearTimer, router]);

  const completeCinematic = useCallback(async () => {
    setIsSkipping(true);
    clearTimer();
    const result = await markCinematicSeen(true);
    if (result.ok) {
      router.refresh();
    }
    setIsSkipping(false);
  }, [clearTimer, router]);

  // Auto-advance timer
  useEffect(() => {
    if (isReducedMotion) return;
    clearTimer();
    stepStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (Date.now() - stepStartRef.current >= STEP_DURATION_MS) {
        advance();
      }
    }, 1000);
    return clearTimer;
  }, [stepIndex, isReducedMotion, clearTimer, advance]);

  // Cleanup on unmount
  useEffect(() => clearTimer, [clearTimer]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] grid place-items-center px-4"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, rgb(var(--accent2-rgb) / 0.25), transparent 45%), rgb(var(--void-rgb) / 0.85)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Skip control top-right */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-6 right-6 z-[110]"
      >
        <button
          onClick={skipCinematic}
          disabled={isSkipping}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--accent-a022)] bg-[rgb(var(--void-rgb)/0.7)] text-[0.6rem] tracking-[0.14em] text-mist uppercase hover:border-[var(--accent-a07)] hover:text-ice transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="h-3.5 w-3.5" />
          Skip
        </button>
      </motion.div>

      {/* Main cinematic panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{
            opacity: 0,
            scale: 0.85,
            filter: "blur(12px) brightness(2)",
          }}
          animate={{
            opacity: 1,
            scale: 1,
            filter: "blur(0) brightness(1)",
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            filter: "blur(6px)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "relative z-[105] max-w-xl w-full text-left overflow-hidden",
          )}
        >
          {/* Background rays */}
          <motion.div
            className="absolute inset-[-40%] z-[-1]"
            animate={{ rotate: 360 }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              background: `conic-gradient(
                from 90deg,
                transparent 0deg,
                rgb(var(--accent-rgb) / 0.06) 8deg,
                transparent 16deg,
                transparent 30deg,
                rgb(var(--accent-rgb) / 0.04) 38deg,
                transparent 46deg
              )`,
              maskImage: "radial-gradient(circle, black, transparent 66%)",
            }}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-4 flex items-center gap-3"
          >
            <div className="h-1 w-[30%] bg-[var(--accent-a032)] rounded-full" />
            <span className="hud-label hud-label--bright">
              System Orientation
            </span>
            <span className="korean-accent">시스템 가이드</span>
            <div className="ml-auto flex items-center gap-1 text-[0.6rem] text-muted">
              <span className="font-mono">{stepIndex + 1}</span>
              <span className="text-xs">/</span>
              <span className="font-mono">{STEPS.length}</span>
            </div>
          </motion.div>

          <div className="divider-glow my-4" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--accent-a04)] bg-[rgb(var(--void-rgb)/0.8)] shadow-[0_0_20px_rgb(var(--accent-rgb)/0.2)]",
                  !isReducedMotion && "animate-pulse-dot",
                )}
              >
                <Icon className="h-6 w-6 text-[var(--accent-bright)]" size={24} />
              </div>
              <div>
                <h2 className="title-display mt-0 text-2xl text-white sm:text-3xl tracking-[0.05em]">
                  {currentStep.title}
                </h2>
                <span className="korean-accent">{currentStep.korean}</span>
              </div>
            </div>

            <p className="font-mono text-sm leading-relaxed text-mist">
              <span className="text-glow">[SYSTEM]</span>{" "}
              {currentStep.body}
            </p>

            {currentStep.visual && (
              <div className="mt-6 border border-[var(--accent-a015)] bg-[rgb(var(--void-rgb)/0.6)] p-4 rounded-lg shadow-[0_0_30px_rgb(var(--accent-rgb)/0.15)]">
                {currentStep.visual}
              </div>
            )}
          </motion.div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="h-1 w-full rounded-full border border-[var(--accent-a012)] bg-[rgb(var(--void-rgb)/0.8)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)] shadow-[0_0_12px_rgb(var(--accent-rgb)/0.5)]"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex flex-col sm:flex-row sm:justify-between items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLastStep || isSkipping}
              onClick={advance}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 border border-[var(--accent-a045)] bg-[rgb(var(--void-rgb)/0.7)] text-[0.68rem] font-semibold tracking-[0.16em] text-ice uppercase transition-all hover:border-[var(--accent-a092)] hover:bg-[rgb(var(--void-rgb)/0.9)] hover:shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)] disabled:opacity-50 disabled:cursor-not-allowed",
                isLastStep && "hidden",
              )}
            >
              <ChevronRight className="h-4 w-4" />
              Next
            </motion.button>

            {isLastStep ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSkipping}
                onClick={completeCinematic}
                className="flex items-center gap-2 px-6 py-2.5 border border-[var(--accent-a045)] bg-gradient-to-b from-[var(--accent2-rgb)/0.3] to-[rgb(var(--void-rgb)/0.8)] text-[0.68rem] font-semibold tracking-[0.16em] text-white uppercase transition-all hover:border-[var(--accent-a092)] hover:shadow-[0_0_24px_rgb(var(--accent-rgb)/0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4" />
                Enter the System
              </motion.button>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
