"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Volume2, VolumeX } from "lucide-react";
import { updateSettings } from "@/app/actions";
import type { SettingsData } from "@/lib/types";
import { cn } from "@/lib/utils";
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
  const [toast, setToast] = useState<ToastState | null>(null);
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
      });

      if (!result.ok) {
        setToast({
          title: "System warning",
          message: result.error ?? "Could not update settings.",
          tone: "danger",
        });
        return;
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

          <button
            type="button"
            onClick={() => setSoundEnabled((value) => !value)}
            className={cn(
              "flex w-full items-center justify-between border px-3 py-2.5 text-left transition-colors",
              soundEnabled
                ? "border-[rgba(84,221,255,0.36)] bg-[rgba(59,158,255,0.09)]"
                : "border-[rgba(84,221,255,0.12)] bg-[rgba(3,10,20,0.4)]",
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
                  System chime
                </span>
                <span className="mt-0.5 block text-[0.62rem] text-muted">
                  Play a tone when the focus timer ends
                </span>
              </span>
            </span>
            <span
              className={cn(
                "relative h-5 w-9 border transition-colors",
                soundEnabled
                  ? "border-[rgba(84,221,255,0.5)] bg-[rgba(59,158,255,0.28)]"
                  : "border-[rgba(84,221,255,0.18)] bg-[rgba(2,8,16,0.8)]",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-3.5 w-3.5 transition-all",
                  soundEnabled
                    ? "left-[18px] bg-glow shadow-[0_0_6px_#54ddff]"
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
