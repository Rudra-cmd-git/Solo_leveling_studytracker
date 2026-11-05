"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flame, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { activateStreakFreeze } from "@/app/actions";
import type { StreakInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SystemPanel } from "./system-panel";
import { SystemToast, type ToastState } from "./system-toast";

export function StreakFreeze({ streak }: { streak: StreakInfo }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const available = streak.freezeAvailable && streak.freezesUsedThisWeek === 0;
  const usedThisWeek = streak.freezesUsedThisWeek > 0;

  function activate() {
    if (isPending || !available) return;

    startTransition(async () => {
      const result = await activateStreakFreeze();

      if (!result.ok) {
        setToast({
          title: "System warning",
          message: result.error ?? "Could not activate the freeze.",
          tone: "danger",
        });
        return;
      }

      router.refresh();
      setToast({
        title: "Streak protected",
        message: "A frozen day has been added to your chain.",
        tone: "success",
      });
    });
  }

  return (
    <>
      <SystemPanel label="Streak protection" className="boot-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="title-display text-xl text-ice">
              {streak.current} day chain
            </p>
            <p className="mt-1 text-[0.62rem] tracking-[0.14em] text-muted uppercase">
              Best: {streak.best} days ·{" "}
              {usedThisWeek ? "Freeze used this week" : "Freeze available"}
            </p>
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center border transition-all duration-300",
              available
                ? "border-[rgba(84,221,255,0.4)] bg-[rgba(59,158,255,0.1)] text-glow animate-shield-charge"
                : usedThisWeek
                  ? "border-[rgba(255,191,90,0.35)] bg-[rgba(255,191,90,0.08)] text-gold"
                  : "border-[rgba(84,221,255,0.12)] bg-[rgba(3,10,20,0.4)] text-muted",
            )}
          >
            {available ? (
              <ShieldCheck className="h-5 w-5" />
            ) : usedThisWeek ? (
              <Shield className="h-5 w-5" />
            ) : (
              <ShieldOff className="h-5 w-5" />
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border border-[rgba(84,221,255,0.12)] bg-[rgba(3,10,20,0.4)] px-3 py-2.5">
          <Flame className={cn("h-3.5 w-3.5 text-gold", streak.current > 0 && "animate-flame-flicker")} />
          <p className="text-[0.66rem] leading-relaxed text-muted">
            {streak.atRisk
              ? available
                ? "Your chain is at risk. Spend this week's freeze to bridge yesterday's gap."
                : "Your chain is at risk, but no freeze can repair a gap this large."
              : "Your chain is safe. A freeze can be saved for a future missed day."}
          </p>
        </div>

        <button
          type="button"
          onClick={activate}
          disabled={!available || isPending}
          className={cn(
            "system-button system-button--small mt-3 w-full",
            !available && "system-button--ghost",
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {isPending
            ? "Activating..."
            : usedThisWeek
              ? "Freeze already used"
              : available
                ? "Activate streak freeze"
                : "No freeze needed"}
        </button>

        {streak.frozenDates.length > 0 ? (
          <p className="mt-3 border-t border-[rgba(84,221,255,0.08)] pt-2 font-mono text-[0.55rem] text-muted">
            Frozen days: {streak.frozenDates.slice(-4).join(", ")}
          </p>
        ) : null}
      </SystemPanel>

      <SystemToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
