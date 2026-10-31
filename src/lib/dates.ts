const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && toDateKeyUtc(date) === value;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return toDateKeyUtc(date);
  }
}

export function todayKey(timeZone: string): string {
  return dateKeyInTimeZone(new Date(), timeZone);
}

export function toDateKeyUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00Z`);
}

export function addDays(dateKey: string, amount: number): string {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateKeyUtc(date);
}

export function weekKeyFor(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + offset);
  return toDateKeyUtc(date);
}

export function weekDates(weekKey: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekKey, index));
}

export function lastNDays(dateKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    addDays(dateKey, index - (count - 1)),
  );
}

export function heatmapDays(dateKey: string, weeks = 12): string[] {
  const start = addDays(weekKeyFor(dateKey), -(weeks - 1) * 7);
  return Array.from({ length: weeks * 7 }, (_, index) => addDays(start, index));
}

export function formatDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  },
  timeZone = "UTC",
): string {
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone,
  }).format(parseDateKey(dateKey));
}

export function weekdayShort(dateKey: string): string {
  return formatDateKey(dateKey, { weekday: "short" });
}

export function monthDay(dateKey: string): string {
  return formatDateKey(dateKey, { month: "short", day: "numeric" });
}

export function longDate(dateKey: string): string {
  return formatDateKey(dateKey, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function weekRangeLabel(weekKey: string): string {
  return `${monthDay(weekKey)} — ${monthDay(addDays(weekKey, 6))}`;
}

export function elapsedClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
