"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Check, Lock, Sparkles } from "lucide-react";
import { claimQuest } from "@/app/actions";
import { RANKS } from "@/lib/game";
import { fireQuestConfetti } from "@/lib/confetti";
import type { QuestView } from "@/lib/types";
import { cn, formatNumber, progressUnit } from "@/lib/utils";
import { AnimatedBar } from "./motion/animated-bar";
import { RewardOverlay, type RewardState } from "./reward-overlay";
import { useSfx } from "./sound-provider";
import { SystemToast, type ToastState } from "./system-toast";

export function QuestCard({ quest }: { quest: QuestView }) {
  const [isPending, startTransition] = useTransition();
  const [reward, setReward] = useState<RewardState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const { play } = useSfx();
  const router = useRouter();

  function claim() {
    if (quest.claimed || !quest.complete || isPending) return;

    startTransition(async () => {
      const result = await claimQuest(quest.id);

      if (!result.ok) {
        play("ui.error");
        setToast({
          title: "System warning",
          message: result.error ?? "Could not claim this quest.",
          tone: "danger",
        });
        return;
      }

      router.refresh();
      play("quest.complete");

      if (
        result.leveledUp ||
        result.rankedUp ||
        (result.achievements && result.achievements.length > 0)
      ) {
        setReward({
          xp: result.xpReward ?? quest.xpReward,
          level: result.level,
          rank: result.rank ? RANKS[result.rank] : undefined,
          leveledUp: result.leveledUp,
          rankedUp: result.rankedUp,
          achievements: result.achievements,
        });
      } else {
        void fireQuestConfetti();
        setToast({
          title: "Quest complete",
          message: `${quest.title} cleared. +${formatNumber(result.xpReward ?? quest.xpReward)} XP`,
          tone: "success",
        });
      }
    });
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -3 }}
        className={cn(
          "system-panel system-panel--quiet p-4",
          quest.complete && "quest-complete",
        )}
      >
        <span className="panel-corner panel-corner--tl" />
        <span className="panel-corner panel-corner--br" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="hud-label">{quest.period} quest</p>
              {quest.subjectName ? (
                <span
                  className="border px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-[0.08em] uppercase"
                  style={{
                    color: quest.subjectColor ?? "var(--accent)",
                    borderColor: quest.subjectColor
                      ? `${quest.subjectColor}55`
                      : "var(--accent-a045)",
                    backgroundColor: quest.subjectColor
                      ? `${quest.subjectColor}12`
                      : "var(--accent-a01)",
                  }}
                >
                  {quest.subjectName}
                </span>
              ) : null}
              {quest.claimed ? (
                <motion.span
                  className="quest-stamp px-1.5 py-0.5"
                  initial={{ opacity: 0, scale: 2.4, rotate: -14 }}
                  animate={{ opacity: 1, scale: 1, rotate: -2 }}
                  transition={{ type: "spring", stiffness: 240, damping: 14 }}
                >
                  Cleared
                </motion.span>
              ) : null}
            </div>
            <h3 className="mt-1.5 font-display text-base font-semibold tracking-[0.06em] text-ice">
              {quest.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {quest.description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 border border-[rgb(var(--gold-rgb)/0.2)] bg-[rgb(var(--gold-rgb)/0.05)] px-2 py-1 font-mono text-[0.62rem] text-gold">
            <Sparkles className="h-3 w-3" />
            {quest.xpReward}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[0.62rem] tracking-[0.06em] text-muted uppercase">
            <span>
              {progressUnit(quest.metric, Math.min(quest.progress, quest.target))}{" "}
              / {progressUnit(quest.metric, quest.target)}
            </span>
            <span className={quest.complete ? "text-mint" : "text-mist"}>
              {Math.round(quest.percent)}%
            </span>
          </div>
          <div className="stat-track">
            <AnimatedBar
              className={cn(
                "stat-fill",
                quest.complete &&
                  "bg-gradient-to-r from-[rgb(var(--mint-rgb)/0.55)] to-[var(--mint)]",
              )}
              percent={quest.percent}
            />
          </div>
        </div>

        <motion.button
          type="button"
          data-sfx-silent
          onClick={claim}
          disabled={!quest.complete || quest.claimed || isPending}
          whileTap={quest.complete && !quest.claimed ? { scale: 0.97 } : undefined}
          animate={
            quest.complete && !quest.claimed && !isPending
              ? {
                  boxShadow: [
                    "0 0 0 rgb(var(--mint-rgb)/0)",
                    "0 0 22px rgb(var(--mint-rgb)/0.45)",
                    "0 0 0 rgb(var(--mint-rgb)/0)",
                  ],
                }
              : undefined
          }
          transition={
            quest.complete && !quest.claimed
              ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
          className={cn(
            "system-button system-button--small mt-4 w-full",
            quest.claimed && "system-button--ghost",
          )}
        >
          {quest.claimed ? (
            <>
              <Check className="h-3.5 w-3.5" /> Reward claimed
            </>
          ) : quest.complete ? (
            isPending ? (
              "Claiming..."
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Claim reward
              </>
            )
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" /> Incomplete
            </>
          )}
        </motion.button>
      </motion.div>

      <RewardOverlay reward={reward} onClose={() => setReward(null)} />
      <SystemToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
