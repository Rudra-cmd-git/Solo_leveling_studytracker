"use client";

import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import type { AchievementAward, RankInfo } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export interface RewardState {
  xp: number;
  level?: number;
  rank?: RankInfo;
  leveledUp?: boolean;
  rankedUp?: boolean;
  achievements?: AchievementAward[];
}

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

  if (!reward) return null;

  const heading = reward.rankedUp
    ? "RANK UP"
    : reward.leveledUp
      ? "LEVEL UP"
      : "SYSTEM ALERT";

  return (
    <div
      className="overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={onClose}
    >
      <div className="level-overlay" onClick={(event) => event.stopPropagation()}>
        <div className="level-rays" />
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-glow/70" />
          <Sparkles className="h-4 w-4 text-glow" />
          <span className="hud-label hud-label--bright">System notification</span>
          <Sparkles className="h-4 w-4 text-glow" />
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-glow/70" />
        </div>

        <h2 className="level-word text-white">{heading}</h2>

        {reward.rankedUp && reward.rank ? (
          <p className="mt-3 font-display text-lg tracking-[0.24em] text-glow">
            {reward.rank.rank}-RANK · {reward.rank.title}
          </p>
        ) : (
          <p className="mt-3 font-display text-sm tracking-[0.25em] text-mist uppercase">
            The System acknowledges your progress
          </p>
        )}

        <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-3">
          <div className="border border-[rgba(84,221,255,0.24)] bg-[rgba(59,158,255,0.08)] px-5 py-2 text-center">
            <p className="hud-label">XP gained</p>
            <p className="mt-0.5 font-mono text-xl font-semibold text-glow">
              +{formatNumber(reward.xp)}
            </p>
          </div>
          {reward.level ? (
            <div className="border border-[rgba(84,221,255,0.18)] bg-[rgba(4,12,23,0.6)] px-5 py-2 text-center">
              <p className="hud-label">Level</p>
              <p className="mt-0.5 font-display text-xl font-semibold text-ice">
                {reward.level}
              </p>
            </div>
          ) : null}
        </div>

        {reward.achievements && reward.achievements.length > 0 ? (
          <div className="mx-auto mt-5 max-w-md space-y-2 text-left">
            <p className="hud-label text-center">Achievements unlocked</p>
            {reward.achievements.map((achievement) => (
              <div
                key={achievement.title}
                className="flex items-center gap-3 border border-[rgba(84,221,255,0.16)] bg-[rgba(59,158,255,0.06)] px-3 py-2"
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
                  +{achievement.xpReward}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="system-button mt-7 min-w-40"
        >
          Continue
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="absolute top-4 right-4 text-mist transition-colors hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
