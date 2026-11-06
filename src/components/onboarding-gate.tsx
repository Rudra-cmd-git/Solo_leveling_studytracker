"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { completeOnboarding } from "@/app/actions";
import { SystemSigil } from "./system-sigil";

const TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];

export function OnboardingGate({
  initialTimeZone,
}: {
  initialTimeZone: string;
}) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(60);
  const [timeZone, setTimeZone] = useState(initialTimeZone);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await completeOnboarding({
        name,
        dailyGoalMinutes: goal,
        timezone: timeZone,
      });

      if (!result.ok) {
        setError(result.error ?? "System initialization failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <motion.div
      className="overlay-backdrop z-[95]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="level-overlay max-w-xl text-left"
        initial={{ opacity: 0, scale: 0.82, filter: "blur(18px) brightness(2.4)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        style={{ animation: "none" }}
      >
        <motion.div
          className="level-rays"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ animation: "none" }}
        />
        <div className="flex items-center gap-4">
          <SystemSigil className="h-16 w-16 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="hud-label hud-label--bright">System notice</span>
              <span className="korean-accent">시스템</span>
            </div>
            <h1 className="title-display mt-1 text-2xl text-white sm:text-3xl">
              Player Awakening
            </h1>
          </div>
        </div>

        <div className="divider-glow my-5" />

        <div className="space-y-2 border-l border-[var(--accent-a028)] pl-4">
          <p className="font-mono text-xs leading-relaxed text-mist">
            <span className="text-glow">[SYSTEM]</span> You have been selected
            as a Player.
          </p>
          <p className="font-mono text-xs leading-relaxed text-mist">
            <span className="text-glow">[SYSTEM]</span> Your daily preparation
            begins now. Complete quests to gain XP and awaken your abilities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="hunter-name" className="hud-label mb-1.5 block">
              Hunter name
            </label>
            <input
              id="hunter-name"
              className="system-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              autoFocus
              maxLength={30}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="daily-goal" className="hud-label mb-1.5 block">
                Daily study goal
              </label>
              <div className="relative">
                <input
                  id="daily-goal"
                  type="number"
                  min={10}
                  max={720}
                  step={5}
                  className="system-input pr-12 font-mono"
                  value={goal}
                  onChange={(event) => setGoal(Number(event.target.value))}
                  required
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.6rem] tracking-widest text-muted uppercase">
                  min
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="timezone" className="hud-label mb-1.5 block">
                Timezone
              </label>
              <select
                id="timezone"
                className="system-select"
                value={timeZone}
                onChange={(event) => setTimeZone(event.target.value)}
              >
                {!TIMEZONES.includes(timeZone) ? (
                  <option value={timeZone}>{timeZone}</option>
                ) : null}
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-2 border border-[rgb(var(--danger-rgb)/0.3)] bg-[rgb(var(--danger-rgb)/0.06)] px-3 py-2 text-sm text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            className="system-button w-full"
            disabled={isPending}
          >
            <Sparkles className="h-4 w-4" />
            {isPending ? "Initializing..." : "Accept the System"}
          </button>

          <p className="text-center text-[0.62rem] tracking-[0.16em] text-muted uppercase">
            Your legend begins with a single session
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}
