'use client';

import { useState, useTransition } from "react";
import { Bell, BellOff, Save } from "lucide-react";
import { updateNotificationSettings } from "@/app/actions";
import { requestNotificationPermission } from "@/lib/notifications";

interface NotificationSettingsProps {
  enabled: boolean;
  reminderTime: string;
}

export function NotificationSettings({
  enabled: initialEnabled,
  reminderTime: initialReminderTime,
}: NotificationSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [reminderTime, setReminderTime] = useState(initialReminderTime);
  const [notifPending, startNotifTransition] = useTransition();
  const [notifToast, setNotifToast] = useState<{
    title: string;
    message: string;
    tone: string;
  } | null>(null);

  async function handleNotificationSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (notifPending) return;

    startNotifTransition(async () => {
      const result = await updateNotificationSettings({
        notificationsEnabled: enabled,
        reminderTime,
      });

      if (!result.ok) {
        setNotifToast({
          title: "Notification settings failed",
          message: result.error ?? "Could not save.",
          tone: "danger",
        });
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

      setNotifToast({
        title: "Notifications updated",
        message: "The System will alert you when your streak needs attention.",
        tone: "success",
      });
    });
  }

  const isSuccess = notifToast?.tone === "success";
  const toastClassName = isSuccess
    ? "border-[rgb(var(--mint-rgb)/0.4)] bg-[rgb(var(--mint-rgb)/0.08)] text-mint"
    : "border-[rgb(var(--danger-rgb)/0.4)] bg-[rgb(var(--danger-rgb)/0.08)] text-danger";

  return (
    <form onSubmit={handleNotificationSettings} className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          id="notificationsEnabled"
          name="notificationsEnabled"
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="system-input w-4 h-4"
        />
        <label htmlFor="notificationsEnabled" className="flex items-center gap-1.5 cursor-pointer select-none">
          <div className="flex items-center gap-2">
            {enabled ? (
              <Bell className="h-4 w-4 text-mint" />
            ) : (
              <BellOff className="h-4 w-4 text-muted" />
            )}
            <span className="font-semibold text-ice">Enable system alerts</span>
          </div>
        </label>
      </div>

      {enabled ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="reminderTime" className="hud-label">
                Reminder time
              </label>
              <input
                id="reminderTime"
                type="time"
                name="reminderTime"
                value={reminderTime}
                onChange={(event) => setReminderTime(event.target.value)}
                className="system-input"
              />
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
          className={`p-3 rounded border text-[0.62rem] font-semibold uppercase ${toastClassName}`}
        >
          {notifToast.title}: {notifToast.message}
        </div>
      )}

      <button
        type="submit"
        disabled={notifPending}
        className="system-button system-button--small"
      >
        <Save className="h-3.5 w-3.5" />
        {notifPending ? "Saving..." : "Save alerts"}
      </button>
    </form>
  );
}
