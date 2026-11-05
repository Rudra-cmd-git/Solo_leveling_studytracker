"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, X } from "lucide-react";
import type { AchievementAward, RankInfo } from "@/lib/types";
import { fireRewardConfetti } from "@/lib/confetti";
import { formatNumber } from "@/lib/utils";
import { CountUp } from "./motion/count-up";

export interface RewardState {
  xp: number;
  level?: number;
  rank?: RankInfo;
  leveledUp?: boolean;
  rankedUp?: boolean;
  achievements?: AchievementAward[];
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function RewardOverlay({
  reward,
  onClose,
}: {
  reward: RewardState | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!reward) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reward, onClose]);

  useEffect(() => {
    if (!reward) return;
    void fireRewardConfetti({ rankedUp: Boolean(reward.rankedUp) });
  }, [reward]);

  const heading = reward?.rankedUp
    ? "RANK UP"
    : reward?.leveledUp
      ? "LEVEL UP"
      : "SYSTEM ALERT";

  return (
    <AnimatePresence>
      {reward ? (
        <motion.div
          className="overlay-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={heading}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <motion.div
            className="level-overlay"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.78, filter: "blur(16px) brightness(2.6)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 190, damping: 22, mass: 0.8 }}
            style={{ animation: "none" }}
          >
            <motion.span
              aria-hidden="true"
              className="reward-flash"
              initial={{ opacity: 0.95 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
            />
            <motion.span
              aria-hidden="true"
              className="reward-shockwave"
              initial={{ opacity: 0.85, scale: 0.2 }}
              animate={{ opacity: 0, scale: 2.8 }}
              transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            />
            <motion.span
              aria-hidden="true"
              className="reward-shockwave reward-shockwave--late"
              initial={{ opacity: 0.6, scale: 0.2 }}
              animate={{ opacity: 0, scale: 2.2 }}
              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
            />

            <motion.div
              className="level-rays"
              animate={{ rotate: 360 }}
              transition={{ duration: reward.rankedUp ? 6 : 16, repeat: Infinity, ease: "linear" }}
              style={{ animation: "none" }}
            />

            <motion.div
              className="mb-4 flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.5, ease: EASE }}
            >
              <motion.span
                className="h-px w-12 bg-gradient-to-r from-transparent to-glow/70"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
              />
              <Sparkles className="h-4 w-4 text-glow" />
              <span className="hud-label hud-label--bright">System notification</span>
              <Sparkles className="h-4 w-4 text-glow" />
              <motion.span
                className="h-px w-12 bg-gradient-to-l from-transparent to-glow/70"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
              />
            </motion.div>

            <h2 className="level-word flex justify-center text-white" aria-label={heading}>
              {heading.split("").map((char, index) => (
                <motion.span
                  key={`${char}-${index}`}
                  className="inline-block"
                  aria-hidden="true"
                  initial={{ opacity: 0, y: 24, scale: 0.7, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  transition={{
                    delay: 0.22 + index * 0.045,
                    duration: 0.55,
                    ease: EASE,
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </h2>

            <motion.p
              className="mt-3 font-display text-sm tracking-[0.25em] text-mist uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
            >
              {reward.rankedUp && reward.rank ? (
                <span className="text-lg tracking-[0.24em] text-glow">
                  {reward.rank.rank}-RANK · {reward.rank.title}
                </span>
              ) : (
                "The System acknowledges your progress"
              )}
            </motion.p>

            <motion.div
              className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62, duration: 0.5, ease: EASE }}
            >
              <div className="border border-[rgba(84,221,255,0.24)] bg-[rgba(59,158,255,0.08)] px-5 py-2 text-center">
                <p className="hud-label">XP gained</p>
                <CountUp
                  value={reward.xp}
                  prefix="+"
                  duration={1.2}
                  className="mt-0.5 block font-mono text-xl font-semibold text-glow"
                />
              </div>
              {reward.level ? (
                <div className="border border-[rgba(84,221,255,0.18)] bg-[rgba(4,12,23,0.6)] px-5 py-2 text-center">
                  <p className="hud-label">Level</p>
                  <CountUp
                    value={reward.level}
                    duration={1.1}
                    className="mt-0.5 block font-display text-xl font-semibold text-ice"
                  />
                </div>
              ) : null}
            </motion.div>

            {reward.achievements && reward.achievements.length > 0 ? (
              <div className="mx-auto mt-5 max-w-md space-y-2 text-left">
                <motion.p
                  className="hud-label text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  Achievements unlocked
                </motion.p>
                {reward.achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.title}
                    className="flex items-center gap-3 border border-[rgba(84,221,255,0.16)] bg-[rgba(59,158,255,0.06)] px-3 py-2"
                    initial={{ opacity: 0, x: -18, filter: "blur(4px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    transition={{
                      delay: 0.86 + index * 0.1,
                      duration: 0.45,
                      ease: EASE,
                    }}
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-gold" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ice">
                        {achievement.title}
                      </p>
                      <p className="truncate text-[0.68rem] text-muted">
                        {achievement.description}
                      </p>
                    </div>
                    <span className="font-mono text-[0.65rem] text-gold">
                      +{formatNumber(achievement.xpReward)}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : null}

            <motion.button
              type="button"
              onClick={onClose}
              className="system-button mt-7 min-w-40"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              whileTap={{ scale: 0.96 }}
            >
              Continue
            </motion.button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close notification"
              className="absolute top-4 right-4 text-mist transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
