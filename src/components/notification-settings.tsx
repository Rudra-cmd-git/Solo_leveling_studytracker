'use client';

import { useState, useTransition } from "react";
import { Bell, BellOff, Clock } from "lucide-react";
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
  const [notifPending, startNotifTransition] = useTransition(false);
  const [notifToast, setNotifToast] = useState<{
    title: string;
    message: string;
    tone: string;
  } | null>(null);

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
    ? "border-[rgba(61,214,163,0.4)] bg-[rgba(61,214,163,0.08)] text-mint"
    : "border-[rgba(255,84,104,0.4)] bg-[rgba(255,84,104,0.08)] text-[#ffb1bd]";

  return (
    <form onSubmit={handleNotificationSettings} className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          id="notificationsEnabled"
          type="checkbox"
          defaultChecked={initialEnabled}
          className="system-input w-4 h-4"
        />
        <label htmlFor="notificationsEnabled" className="flex items-center gap-1.5 cursor-pointer select-none">
          <div className="flex items-center gap-2">
            {initialEnabled ? (
              <Bell className="h-4 w-4 text-mint" />
            ) : (
              <BellOff className="h-4 w-4 text-muted" />
            )}
            <span className="font-semibold text-ice">Enable system alerts</span>
          </div>
        </label>
      </div>

      {initialEnabled ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="hud-label">Reminder time</p>
              <input
                type="time"
                name="reminderTime"
                defaultValue={initialReminderTime}
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
          className={`p-3 rounded border text-[0.62rem] font-semibold uppercase ${toastClassName}`}
        >
          {notifToast.title}: {notifToast.message}
        </div>
      )}
    </form>
  );
}

