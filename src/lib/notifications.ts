'use client';

/**
 * Browser notification helpers for the Solo Leveling Study Tracker.
 *
 * This module wraps the Notifications API so the System can nudge the Hunter
 * when their streak is at risk or when a daily reminder is due. All functions
 * are safe to call in environments where the Notification API is unavailable
 * (SSR, older browsers, private modes) — they degrade gracefully.
 */

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // "HH:MM" in the user's configured timezone
}

/** Whether the browser supports the Notifications API. */
export function notificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Current permission state. */
export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationSupported()) return "unsupported";
  return Notification.permission;
}

/** Request notification permission from the user. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Show a streak-at-risk notification if permissions allow. */
export function showStreakAtRiskNotification(streak: number): void {
  if (!notificationSupported()) return;
  if (Notification.permission !== "granted") return;
  new Notification("Streak at risk", {
    body: streak + "-day study streak is about to break. Log a session to keep it alive, Hunter.",
    icon: "/icon.svg",
    tag: "streak-at-risk",
    renotify: false,
  });
}

/** Show a daily reminder notification if permissions allow. */
export function showDailyReminderNotification(): void {
  if (!notificationSupported()) return;
  if (Notification.permission !== "granted") return;
  new Notification("Daily study reminder", {
    body: "Time to enter the focus gate. A focused session is the only way to gain XP.",
    icon: "/icon.svg",
    tag: "daily-reminder",
    renotify: false,
  });
}

/** Parse "HH:MM" into { hour, minute }. */
export function parseReminderTime(time: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** Check whether the current local time matches the reminder time. */
export function isReminderTime(reminderTime: string): boolean {
  const parsed = parseReminderTime(reminderTime);
  if (!parsed) return false;
  const now = new Date();
  return now.getHours() === parsed.hour && now.getMinutes() === parsed.minute;
}

