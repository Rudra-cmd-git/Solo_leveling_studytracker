import { Bell, BellOff, Clock, Cpu, Database, HardDrive, Wifi } from "lucide-react";
import { useState, useTransition } from "react";
import { CountUp } from "@/components/motion/count-up";
import { DataManager } from "@/components/data-manager";
import { PageHeader } from "@/components/page-header";
import { ProfileSettings } from "@/components/profile-settings";
import { SubjectManager } from "@/components/subject-manager";
import { SystemPanel } from "@/components/system-panel";
import { updateNotificationSettings } from "@/app/actions";
import { requestNotificationPermission } from "@/lib/notifications";
import { getAppData } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

export default async function SettingsPage() {
  const data = await getAppData();
  const usage = data.sessions.reduce<Record<number, number>>((counts, session) => {
    counts[session.subjectId] = (counts[session.subjectId] ?? 0) + 1;
    return counts;
  }, {});

  const [notifPending, startNotifTransition] = useTransition(false);
  const [notifToast, setNotifToast] = useState<{ title: string; message: string; tone: string } | null>(null);

  async function handleNotificationSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const enabled = formData.get("notificationsEnabled") === "on";
    const reminderTime = String(formData.get("reminderTime") ?? "");

    startNotifTransition(async () => {
      const result = await updateNotificationSettings({
        notificationsEnabled: enabled,
        reminderTime,
      });

      if (!result.ok) {
        setNotifToast({ title: "Notification settings failed", message: result.error ?? "Could not save.", tone: "danger" });
        return;
      }

      if (enabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          setNotifToast({
            title: "Notifications enabled",
            message: "Permission was not granted. You can allow notifications in your browser settings.",
            tone: "danger",
          });
          return;
        }
      }

      setNotifToast({ title: "Notifications updated", message: "The System will alert you when your streak needs attention.", tone: "success" });
    });
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="System // Configuration"
        korean="설정"
        title="System Settings"
        description="Adjust your parameters. Changes are recorded locally and take effect immediately."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <ProfileSettings name={data.player.name} settings={data.settings} />

        <div className="space-y-5">
          <SubjectManager subjects={data.subjects} usage={usage} />
          <DataManager />
        </div>
      </div>

      <SystemPanel label="System alerts" className="boot-in boot-in-delay-2">
        <form onSubmit={handleNotificationSettings} className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              id="notificationsEnabled"
              type="checkbox"
              defaultChecked={data.settings.notificationsEnabled}
              className="system-input w-4 h-4"
            />
            <label htmlFor="notificationsEnabled" className="flex items-center gap-1.5 cursor-pointer select-none">
              <div className="flex items-center gap-2">
                {data.settings.notificationsEnabled ? (
                  <Bell className="h-4 w-4 text-mint" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted" />
                )}
                <span className="font-semibold text-ice">Enable system alerts</span>
              </div>
            </label>
          </div>

          {data.settings.notificationsEnabled ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="hud-label">Reminder time</p>
                  <input
                    type="time"
                    name="reminderTime"
                    defaultValue={data.settings.reminderTime}
                    className="system-input"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    disabled={notifPending}
                    onClick={() => {}}
                    className="system-button system-button--small"
                  >
                    <Clock className="h-3.5 w-3.5" /> Enable alerts
                  </button>
                </div>
              </div>
              <p className="text-[0.62rem] text-muted">
                The System will notify you at your reminder time if your streak is at risk or a daily nudge is due.
              </p>
            </>
          ) : (
            <p className="text-[0.62rem] text-muted">
              System alerts are off. Enable them to receive streak and reminder notifications.
            </p>
          )}

          {notifToast && (
            <div
              className={`p-3 rounded border text-[0.62rem] font-semibold uppercase ${notifToast.tone === "success" ? "border-[rgba(61,214,163,0.4)] bg-[rgba(61,214,163,0.08)] text-mint" : "border-[rgba(255,84,104,0.4)] bg-[rgba(255,84,104,0.08)] text-[#ffb1bd]"}`}
            >
              {notifToast.title}: {notifToast.message}
            </div>
          )}
        </form>
      </SystemPanel>
      <SystemPanel label="System core" className="boot-in boot-in-delay-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CoreInfo
            icon={Database}
            label="Database"
            value="libSQL"
            detail="Cloud-synced, single-user"
          />
          <CoreInfo
            icon={HardDrive}
            label="Recorded XP"
            value={formatNumber(data.progress.totalXp)}
            numericValue={data.progress.totalXp}
            detail={`Level ${data.progress.level} · ${data.progress.rank.rank}-Rank`}
          />
          <CoreInfo
            icon={Wifi}
            label="Network"
            value="Online"
            detail="Persisted in Turso"
          />
          <CoreInfo
            icon={Cpu}
            label="Schema"
            value="Version 1"
            detail="Study Tracker"
          />
        </div>
      </SystemPanel>
    </div>
  );
}

function CoreInfo({
  icon: Icon,
  label,
  value,
  numericValue,
  detail,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  numericValue?: number;
  detail: string;
}) {
  return (
    <div className="border border-[rgba(84,221,255,0.1)] bg-[rgba(3,10,20,0.38)] px-3 py-3 transition-colors duration-200 hover:border-[rgba(84,221,255,0.25)]">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-glow/60" strokeWidth={1.6} />
        <p className="hud-label">{label}</p>
      </div>
      <p className="mt-1.5 font-display text-base text-ice">
        {numericValue !== undefined ? <CountUp value={numericValue} /> : value}
      </p>
      <p className="mt-0.5 text-[0.6rem] text-muted">{detail}</p>
    </div>
  );
}
