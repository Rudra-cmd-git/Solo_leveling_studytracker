import { describe, expect, it } from "vitest";
import {
  addDays,
  dateKeyInTimeZone,
  elapsedClock,
  formatDateKey,
  heatmapDays,
  isValidDateKey,
  isValidTimeZone,
  lastNDays,
  longDate,
  monthDay,
  todayKey,
  weekDates,
  weekKeyFor,
  weekRangeLabel,
  weekdayShort,
} from "../src/lib/dates";

describe("isValidDateKey", () => {
  it("accepts real calendar dates", () => {
    expect(isValidDateKey("2026-10-31")).toBe(true);
    expect(isValidDateKey("2024-02-29")).toBe(true);
  });

  it("rejects impossible or malformed dates", () => {
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("2025-02-29")).toBe(false);
    expect(isValidDateKey("2026-13-01")).toBe(false);
    expect(isValidDateKey("31-10-2026")).toBe(false);
    expect(isValidDateKey("2026-1-1")).toBe(false);
  });
});

describe("isValidTimeZone", () => {
  it("recognizes IANA timezones", () => {
    expect(isValidTimeZone("Asia/Kolkata")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
  });

  it("rejects unknown timezones", () => {
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
  });
});

describe("timezone-aware date keys", () => {
  it("uses the local date in the requested timezone", () => {
    const instant = new Date("2026-01-01T18:30:00Z");
    expect(dateKeyInTimeZone(instant, "UTC")).toBe("2026-01-01");
    expect(dateKeyInTimeZone(instant, "Asia/Kolkata")).toBe("2026-01-02");
    expect(dateKeyInTimeZone(instant, "America/Los_Angeles")).toBe(
      "2026-01-01",
    );
  });

  it("falls back safely for an invalid timezone", () => {
    const instant = new Date("2026-01-01T12:00:00Z");
    expect(dateKeyInTimeZone(instant, "Invalid/Zone")).toBe("2026-01-01");
  });

  it("todayKey returns a valid date key", () => {
    expect(isValidDateKey(todayKey("Asia/Kolkata"))).toBe(true);
  });
});

describe("addDays", () => {
  it("crosses month boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
  });

  it("crosses leap-day and year boundaries", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("week helpers", () => {
  it("uses Monday as the start of the week", () => {
    expect(weekKeyFor("2026-10-31")).toBe("2026-10-26");
    expect(weekKeyFor("2026-10-26")).toBe("2026-10-26");
    expect(weekKeyFor("2026-11-01")).toBe("2026-10-26");
  });

  it("returns seven dates from the week key", () => {
    const dates = weekDates("2026-10-26");
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe("2026-10-26");
    expect(dates[6]).toBe("2026-11-01");
  });

  it("formats a human-readable week range", () => {
    expect(weekRangeLabel("2026-10-26")).toBe("Oct 26 — Nov 1");
  });
});

describe("ranges", () => {
  it("returns the last N days ending today", () => {
    const days = lastNDays("2026-10-31", 7);
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-10-25");
    expect(days[6]).toBe("2026-10-31");
  });

  it("builds a 12-week heatmap starting on Monday", () => {
    const days = heatmapDays("2026-10-31");
    expect(days).toHaveLength(84);
    expect(weekdayShort(days[0])).toBe("Mon");
    expect(weekdayShort(days[83])).toBe("Sun");
    expect(days[83]).toBe("2026-11-01");
  });
});

describe("formatting", () => {
  it("formats dates in UTC by default", () => {
    expect(monthDay("2026-01-01")).toBe("Jan 1");
    expect(weekdayShort("2026-10-31")).toBe("Sat");
    expect(longDate("2026-10-31")).toBe("Saturday, October 31, 2026");
    expect(formatDateKey("2026-10-31", { month: "2-digit" })).toBe("10");
  });

  it("formats elapsed clock time", () => {
    expect(elapsedClock(0)).toBe("00:00");
    expect(elapsedClock(59)).toBe("00:59");
    expect(elapsedClock(65)).toBe("01:05");
    expect(elapsedClock(3661)).toBe("01:01:01");
    expect(elapsedClock(-5)).toBe("00:00");
  });
});
