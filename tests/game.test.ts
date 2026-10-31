import { describe, expect, it } from "vitest";
import {
  achievementValue,
  calculateStats,
  calculateStreaks,
  formatMinutes,
  isAchievementEarned,
  progressFromXp,
  rankForLevel,
  sessionXp,
  xpForNextLevel,
  type AchievementContext,
  type StatContext,
} from "../src/lib/game";

describe("xpForNextLevel", () => {
  it("uses the escalating level curve", () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(xpForNextLevel(2)).toBe(150);
    expect(xpForNextLevel(10)).toBe(550);
  });

  it("never returns a non-positive requirement", () => {
    expect(xpForNextLevel(0)).toBe(100);
    expect(xpForNextLevel(-4)).toBe(100);
  });
});

describe("rankForLevel", () => {
  it.each([
    [1, "E"],
    [9, "E"],
    [10, "D"],
    [19, "D"],
    [20, "C"],
    [30, "B"],
    [40, "A"],
    [49, "A"],
    [50, "S"],
    [99, "S"],
  ])("maps level %i to rank %s", (level, rank) => {
    expect(rankForLevel(level).rank).toBe(rank);
  });
});

describe("progressFromXp", () => {
  it("starts at level 1 with an empty bar", () => {
    const progress = progressFromXp(0);
    expect(progress.level).toBe(1);
    expect(progress.xpIntoLevel).toBe(0);
    expect(progress.xpForNext).toBe(100);
    expect(progress.percent).toBe(0);
    expect(progress.rank.rank).toBe("E");
  });

  it("keeps partial XP inside the current level", () => {
    const progress = progressFromXp(99);
    expect(progress.level).toBe(1);
    expect(progress.xpIntoLevel).toBe(99);
    expect(progress.percent).toBeCloseTo(99);
  });

  it("levels up exactly at the threshold", () => {
    const progress = progressFromXp(100);
    expect(progress.level).toBe(2);
    expect(progress.xpIntoLevel).toBe(0);
    expect(progress.xpForNext).toBe(150);
    expect(progress.totalXp).toBe(100);
  });

  it("carries over excess XP across levels", () => {
    const progress = progressFromXp(260);
    expect(progress.level).toBe(3);
    expect(progress.xpIntoLevel).toBe(10);
    expect(progress.xpForNext).toBe(200);
  });

  it("reaches D-Rank at level 10", () => {
    const progress = progressFromXp(2700);
    expect(progress.level).toBe(10);
    expect(progress.rank.rank).toBe("D");
  });

  it("clamps negative XP", () => {
    expect(progressFromXp(-50).totalXp).toBe(0);
    expect(progressFromXp(-50).level).toBe(1);
  });
});

describe("sessionXp", () => {
  it("rewards duration and focus", () => {
    expect(sessionXp(25, 3)).toBe(65);
    expect(sessionXp(60, 5)).toBe(166);
  });

  it("gives a higher reward for higher focus", () => {
    expect(sessionXp(50, 5)).toBeGreaterThan(sessionXp(50, 1));
  });

  it("clamps invalid duration and focus values", () => {
    expect(sessionXp(0, 0)).toBe(sessionXp(1, 1));
    expect(sessionXp(9999, 99)).toBe(sessionXp(600, 5));
  });
});

describe("calculateStreaks", () => {
  it("returns zero with no sessions", () => {
    expect(calculateStreaks([], "2026-10-31")).toEqual({
      current: 0,
      best: 0,
    });
  });

  it("counts consecutive days including today", () => {
    expect(
      calculateStreaks(
        ["2026-10-29", "2026-10-30", "2026-10-31"],
        "2026-10-31",
      ),
    ).toEqual({ current: 3, best: 3 });
  });

  it("keeps the chain alive when the latest session was yesterday", () => {
    expect(
      calculateStreaks(["2026-10-28", "2026-10-29", "2026-10-30"], "2026-10-31"),
    ).toEqual({ current: 3, best: 3 });
  });

  it("breaks the current streak when the latest session is older", () => {
    expect(
      calculateStreaks(["2026-10-01", "2026-10-02", "2026-10-03"], "2026-10-31"),
    ).toEqual({ current: 0, best: 3 });
  });

  it("tracks the best historic run across gaps", () => {
    expect(
      calculateStreaks(
        [
          "2026-10-01",
          "2026-10-02",
          "2026-10-03",
          "2026-10-04",
          "2026-10-10",
          "2026-10-11",
        ],
        "2026-10-31",
      ),
    ).toEqual({ current: 0, best: 4 });
  });

  it("ignores duplicates and unsorted input", () => {
    expect(
      calculateStreaks(
        ["2026-10-31", "2026-10-29", "2026-10-30", "2026-10-30"],
        "2026-10-31",
      ),
    ).toEqual({ current: 3, best: 3 });
  });

  it("handles runs across month and year boundaries", () => {
    expect(
      calculateStreaks(["2026-12-31", "2027-01-01"], "2027-01-01"),
    ).toEqual({ current: 2, best: 2 });
  });
});

describe("calculateStats", () => {
  const context: StatContext = {
    totalMinutes: 250,
    focusWeighted: 180,
    questsClaimed: 3,
    bestStreak: 5,
    currentStreak: 2,
    sessionCount: 4,
    reflectionCount: 2,
    subjectCount: 3,
  };

  it("returns all five attributes in order", () => {
    const stats = calculateStats(context);
    expect(stats.map((stat) => stat.key)).toEqual([
      "INT",
      "FOC",
      "DIS",
      "VIT",
      "PER",
    ]);
  });

  it("weights each attribute from its own inputs", () => {
    const stats = calculateStats(context);
    const byKey = Object.fromEntries(stats.map((stat) => [stat.key, stat]));

    expect(byKey.INT.xp).toBe(250);
    expect(byKey.FOC.xp).toBe(180);
    expect(byKey.DIS.xp).toBe(230);
    expect(byKey.VIT.xp).toBe(130);
    expect(byKey.PER.xp).toBe(125);
  });

  it("keeps attribute levels at least 1", () => {
    const stats = calculateStats({
      totalMinutes: 0,
      focusWeighted: 0,
      questsClaimed: 0,
      bestStreak: 0,
      currentStreak: 0,
      sessionCount: 0,
      reflectionCount: 0,
      subjectCount: 0,
    });

    expect(stats.every((stat) => stat.level === 1)).toBe(true);
    expect(stats.every((stat) => stat.percent === 0)).toBe(true);
  });
});

describe("achievements", () => {
  const context: AchievementContext = {
    totalSessions: 8,
    totalMinutes: 720,
    bestStreak: 6,
    longestSession: 120,
    questsClaimed: 4,
    distinctSubjects: 3,
    level: 12,
  };

  it("reads the right metric from the context", () => {
    expect(achievementValue("sessions", context)).toBe(8);
    expect(achievementValue("total_minutes", context)).toBe(720);
    expect(achievementValue("subjects_used", context)).toBe(3);
    expect(achievementValue("level", context)).toBe(12);
    expect(achievementValue("unknown", context)).toBe(0);
  });

  it("earns achievements at or above the threshold", () => {
    expect(isAchievementEarned("sessions", 8, context)).toBe(true);
    expect(isAchievementEarned("sessions", 9, context)).toBe(false);
    expect(isAchievementEarned("best_streak", 3, context)).toBe(true);
  });
});

describe("formatMinutes", () => {
  it("formats minutes and hours compactly", () => {
    expect(formatMinutes(0)).toBe("0m");
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(135)).toBe("2h 15m");
  });

  it("rounds and clamps negative values", () => {
    expect(formatMinutes(59.6)).toBe("1h");
    expect(formatMinutes(-10)).toBe("0m");
  });
});
