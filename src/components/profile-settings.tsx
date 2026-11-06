"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, AudioLines, Play, Save, Volume2, VolumeX, Zap } from "lucide-react";
import { updateSettings } from "@/app/actions";
import type { SettingsData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSfx } from "./sound-provider";
import { SystemPanel } from "./system-panel";
import { SystemToast, type ToastState } from "./system-toast";

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

export function ProfileSettings({
  name,
  settings,
}: {
  name: string;
  settings: SettingsData;
}) {
  const [hunterName, setHunterName] = useState(name);
  const [goal, setGoal] = useState(settings.dailyGoalMinutes);
  const [timer, setTimer] = useState(settings.defaultTimerMinutes);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [xpBonusesEnabled, setXpBonusesEnabled] = useState(
    settings.xpBonusesEnabled,
  );
  const [toast, setToast] = useState<ToastState | null>(null);
  const { play, stopAmbience } = useSfx();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    startTransition(async () => {
      const result = await updateSettings({
        name: hunterName,
        dailyGoalMinutes: goal,
        defaultTimerMinutes: timer,
        timezone,
        soundEnabled,
        xpBonusesEnabled,
      });

      if (!result.ok) {
        play("ui.error");
        setToast({
          title: "System warning",
          message: result.error ?? "Could not update settings.",
          tone: "danger",
        });
        return;
      }

      if (soundEnabled) {
        play("ui.confirm", { force: true });
      } else {
        stopAmbience();
      }
      router.refresh();
      setToast({
        title: "Settings updated",
        message: "The System has recorded your new parameters.",
        tone: "success",
      });
    });
  }

  return (
    <>
      <SystemPanel label="Hunter profile" className="boot-in">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label htmlFor="settings-name" className="hud-label mb-1.5 block">
              Hunter name
            </label>
            <input
              id="settings-name"
              className="system-input"
              value={hunterName}
              onChange={(event) => setHunterName(event.target.value)}
              maxLength={30}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="settings-goal" className="hud-label mb-1.5 block">
                Daily goal
              </label>
              <div className="relative">
                <input
                  id="settings-goal"
                  type="number"
                  min={10}
                  max={720}
                  step={5}
                  className="system-input pr-12 font-mono"
                  value={goal}
                  onChange={(event) => setGoal(Number(event.target.value))}
                  required
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.58rem] tracking-widest text-muted uppercase">
                  min
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="settings-timer" className="hud-label mb-1.5 block">
                Default timer
              </label>
              <div className="relative">
                <input
                  id="settings-timer"
                  type="number"
                  min={5}
                  max={180}
                  step={5}
                  className="system-input pr-12 font-mono"
                  value={timer}
                  onChange={(event) => setTimer(Number(event.target.value))}
                  required
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.58rem] tracking-widest text-muted uppercase">
                  min
                </span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="settings-timezone" className="hud-label mb-1.5 block">
              Timezone
            </label>
            <select
              id="settings-timezone"
              className="system-select"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {!TIMEZONES.includes(timezone) ? (
                <option value={timezone}>{timezone}</option>
              ) : null}
              {TIMEZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[0.62rem] text-muted">
              Quests and daily goals reset at midnight in this timezone.
            </p>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) {
                  play("ui.confirm", { force: true });
                } else {
                  stopAmbience();
                }
              }}
              className={cn(
                "flex w-full items-center justify-between border px-3 py-2.5 text-left transition-colors",
                soundEnabled
                  ? "border-[var(--accent-a036)] bg-[var(--accent2-a009)]"
                  : "border-[var(--accent-a012)] bg-[var(--panel-a04)]",
              )}
              aria-pressed={soundEnabled}
            >
              <span className="flex items-center gap-2.5">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-glow" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted" />
                )}
                <span>
                  <span className="block text-xs font-semibold text-ice">
                    Dungeon audio
                  </span>
                  <span className="mt-0.5 block text-[0.62rem] text-muted">
                    Interface cues, focus timer, rewards, and ambience
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "relative h-5 w-9 border transition-colors",
                  soundEnabled
                    ? "border-[var(--accent-a05)] bg-[var(--accent2-a028)]"
                    : "border-[var(--accent-a018)] bg-[var(--void-a08)]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-3.5 w-3.5 transition-all",
                    soundEnabled
                      ? "left-[18px] bg-glow shadow-[0_0_6px_var(--accent)]"
                      : "left-0.5 bg-muted",
                  )}
                />
              </span>
            </button>

            {soundEnabled ? (
              <div className="flex flex-wrap items-center gap-1.5 px-1 py-1 text-[0.68rem] text-muted">
                <span className="text-[0.62rem] uppercase tracking-wider text-muted">Preview:</span>
                {(
                  [
                    { label: "Quest", key: "quest.complete" },
                    { label: "Level up", key: "reward.levelUp" },
                    { label: "Rank up", key: "reward.impact" },
                    { label: "Chime", key: "timer.complete" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    data-sfx-silent
                    onClick={() => play(s.key, { force: true })}
                    className="inline-flex items-center gap-1 border border-[var(--accent-a02)] bg-[var(--accent2-a008)] px-2 py-0.5 text-ice transition-colors hover:border-glow hover:text-glow"
                  >
                    <Play className="h-2.5 w-2.5 fill-current" /> {s.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Link
            href="/sound-lab"
            className="flex w-full items-center justify-between border border-[var(--accent-a012)] bg-[var(--panel-a04)] px-3 py-2.5 text-left transition-colors hover:border-[var(--accent-a032)] hover:bg-[var(--accent2-a006)]"
          >
            <span className="flex items-center gap-2.5">
              <AudioLines className="h-4 w-4 text-glow/70" />
              <span>
                <span className="block text-xs font-semibold text-ice">
                  Sound lab
                </span>
                <span className="mt-0.5 block text-[0.62rem] text-muted">
                  Audition dungeon cues and ambience beds
                </span>
              </span>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
          </Link>

          <button
            type="button"
            onClick={() => setXpBonusesEnabled((value) => !value)}
            className={cn(
              "flex w-full items-center justify-between border px-3 py-2.5 text-left transition-colors",
              xpBonusesEnabled
                ? "border-[rgb(var(--gold-rgb)/0.4)] bg-[rgb(var(--gold-rgb)/0.08)]"
                : "border-[var(--accent-a012)] bg-[var(--panel-a04)]",
            )}
            aria-pressed={xpBonusesEnabled}
          >
            <span className="flex items-center gap-2.5">
              <Zap
                className={cn(
                  "h-4 w-4",
                  xpBonusesEnabled ? "text-gold" : "text-muted",
                )}
              />
              <span>
                <span className="block text-xs font-semibold text-ice">
                  XP bonuses
                </span>
                <span className="mt-0.5 block text-[0.62rem] text-muted">
                  Streak, first-session-of-day, and weekend bonuses
                </span>
              </span>
            </span>
            <span
              className={cn(
                "relative h-5 w-9 border transition-colors",
                xpBonusesEnabled
                  ? "border-[rgb(var(--gold-rgb)/0.5)] bg-[rgb(var(--gold-rgb)/0.28)]"
                  : "border-[var(--accent-a018)] bg-[var(--void-a08)]",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-3.5 w-3.5 transition-all",
                  xpBonusesEnabled
                    ? "left-[18px] bg-gold shadow-[0_0_6px_var(--gold)]"
                    : "left-0.5 bg-muted",
                )}
              />
            </span>
          </button>

          <button
            type="submit"
            className="system-button w-full"
            disabled={isPending}
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save parameters"}
          </button>
        </form>
      </SystemPanel>

      <SystemToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
