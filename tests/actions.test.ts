import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const databasePath = path.join(
  os.tmpdir(),
  `solo-actions-${process.pid}-${Date.now()}.db`,
);
process.env.DATABASE_PATH = databasePath;

type Actions = typeof import("../src/app/actions");
type DatabaseModule = typeof import("../src/lib/db");

let actions: Actions;
let dbModule: DatabaseModule;
let today: string;
let firstSessionId: number;

beforeAll(async () => {
  actions = await import("../src/app/actions");
  dbModule = await import("../src/lib/db");
  const { todayKey } = await import("../src/lib/dates");
  today = todayKey("Asia/Kolkata");
});

afterAll(() => {
  dbModule?.sqlite.close();
  for (const suffix of ["", "-shm", "-wal"]) {
    fs.rmSync(`${databasePath}${suffix}`, { force: true });
  }
});

describe("server actions", () => {
  it("completes onboarding and persists settings", async () => {
    const result = await actions.completeOnboarding({
      name: "Rudra",
      dailyGoalMinutes: 90,
      timezone: "Asia/Kolkata",
    });

    expect(result).toEqual({ ok: true });
    const player = dbModule.sqlite
      .prepare("SELECT name FROM players WHERE id = 1")
      .get() as { name: string };
    const settings = dbModule.sqlite
      .prepare("SELECT daily_goal_minutes, onboarded FROM settings WHERE id = 1")
      .get() as { daily_goal_minutes: number; onboarded: number };

    expect(player.name).toBe("Rudra");
    expect(settings.daily_goal_minutes).toBe(90);
    expect(settings.onboarded).toBe(1);
  });

  it("validates onboarding input", async () => {
    const shortName = await actions.completeOnboarding({
      name: "R",
      dailyGoalMinutes: 60,
      timezone: "UTC",
    });
    const badZone = await actions.completeOnboarding({
      name: "Rudra",
      dailyGoalMinutes: 60,
      timezone: "Invalid/Zone",
    });

    expect(shortName.ok).toBe(false);
    expect(badZone.ok).toBe(false);
  });

  it("adds, deduplicates, and deletes unused subjects", async () => {
    const added = await actions.addSubject("History", "#ff5b72");
    expect(added).toEqual({ ok: true });

    const duplicate = await actions.addSubject("Mathematics", "#43a9ff");
    expect(duplicate.ok).toBe(false);

    const invalidColor = await actions.addSubject("Geography", "red");
    expect(invalidColor.ok).toBe(false);

    const history = dbModule.sqlite
      .prepare("SELECT id FROM subjects WHERE name = 'History'")
      .get() as { id: number };
    const deleted = await actions.deleteSubject(history.id);
    expect(deleted).toEqual({ ok: true });

    const remaining = dbModule.sqlite
      .prepare("SELECT COUNT(*) AS count FROM subjects WHERE name = 'History'")
      .get() as { count: number };
    expect(remaining.count).toBe(0);
  });

  it("saves a session, awards XP, and unlocks an achievement", async () => {
    const result = await actions.saveSession({
      subjectId: 1,
      topic: "Limits and continuity",
      notes: "Worked through the epsilon-delta definition carefully.",
      durationMinutes: 25,
      focusRating: 3,
      studiedAt: today,
    });

    expect(result.ok).toBe(true);
    expect(result.xpEarned).toBe(65);
    expect(result.totalXp).toBe(115);
    expect(result.leveledUp).toBe(true);
    expect(result.level).toBe(2);
    expect(result.achievements?.map((award) => award.title)).toContain(
      "First Awakening",
    );

    firstSessionId = Number(
      (
        dbModule.sqlite
          .prepare("SELECT id FROM sessions LIMIT 1")
          .get() as { id: number }
      ).id,
    );
  });

  it("rejects invalid and future sessions", async () => {
    const future = await actions.saveSession({
      subjectId: 1,
      topic: "Future topic",
      notes: "",
      durationMinutes: 30,
      focusRating: 3,
      studiedAt: "2999-01-01",
    });
    const missingSubject = await actions.saveSession({
      subjectId: 999,
      topic: "Nowhere",
      notes: "",
      durationMinutes: 30,
      focusRating: 3,
      studiedAt: today,
    });
    const badFocus = await actions.saveSession({
      subjectId: 1,
      topic: "Bad focus",
      notes: "",
      durationMinutes: 30,
      focusRating: 0,
      studiedAt: today,
    });

    expect(future.ok).toBe(false);
    expect(missingSubject.ok).toBe(false);
    expect(badFocus.ok).toBe(false);
  });

  it("saves a second session and unlocks the one-hour achievement", async () => {
    const result = await actions.saveSession({
      subjectId: 2,
      topic: "Cell respiration",
      notes: "Mapped glycolysis, the Krebs cycle, and oxidative phosphorylation.",
      durationMinutes: 60,
      focusRating: 5,
      studiedAt: today,
    });

    expect(result.ok).toBe(true);
    expect(result.xpEarned).toBe(166);
    expect(result.totalXp).toBe(356);
    expect(result.level).toBe(3);
    expect(result.achievements?.map((award) => award.title)).toContain(
      "One Hour Hunter",
    );
  });

  it("claims completed quests once and rejects incomplete quests", async () => {
    const minutesQuest = dbModule.sqlite
      .prepare("SELECT id FROM quests WHERE code = 'daily_minutes_60'")
      .get() as { id: number };
    const sessionsQuest = dbModule.sqlite
      .prepare("SELECT id FROM quests WHERE code = 'daily_sessions_2'")
      .get() as { id: number };
    const reflectionQuest = dbModule.sqlite
      .prepare("SELECT id FROM quests WHERE code = 'daily_reflection_1'")
      .get() as { id: number };
    const weeklyQuest = dbModule.sqlite
      .prepare("SELECT id FROM quests WHERE code = 'weekly_days_5'")
      .get() as { id: number };

    const minutes = await actions.claimQuest(minutesQuest.id);
    expect(minutes.ok).toBe(true);
    expect(minutes.totalXp).toBe(416);

    const duplicate = await actions.claimQuest(minutesQuest.id);
    expect(duplicate.ok).toBe(false);

    const sessions = await actions.claimQuest(sessionsQuest.id);
    expect(sessions.ok).toBe(true);
    expect(sessions.totalXp).toBe(456);

    const reflection = await actions.claimQuest(reflectionQuest.id);
    expect(reflection.ok).toBe(true);
    expect(reflection.totalXp).toBe(486);

    const incomplete = await actions.claimQuest(weeklyQuest.id);
    expect(incomplete.ok).toBe(false);
  });

  it("keeps subjects that have sessions from being deleted", async () => {
    const result = await actions.deleteSubject(1);
    expect(result.ok).toBe(false);

    const subject = dbModule.sqlite
      .prepare("SELECT id FROM subjects WHERE id = 1")
      .get() as { id: number };
    expect(subject.id).toBe(1);
  });

  it("updates settings and validates timezone", async () => {
    const invalid = await actions.updateSettings({
      name: "Rudra",
      dailyGoalMinutes: 120,
      defaultTimerMinutes: 50,
      timezone: "Invalid/Zone",
      soundEnabled: true,
    });
    expect(invalid.ok).toBe(false);

    const result = await actions.updateSettings({
      name: "Rudra Makwana",
      dailyGoalMinutes: 120,
      defaultTimerMinutes: 50,
      timezone: "Asia/Kolkata",
      soundEnabled: true,
    });
    expect(result).toEqual({ ok: true });

    const settings = dbModule.sqlite
      .prepare(
        "SELECT daily_goal_minutes, default_timer_minutes, sound_enabled FROM settings WHERE id = 1",
      )
      .get() as {
      daily_goal_minutes: number;
      default_timer_minutes: number;
      sound_enabled: number;
    };
    expect(settings.daily_goal_minutes).toBe(120);
    expect(settings.default_timer_minutes).toBe(50);
    expect(settings.sound_enabled).toBe(1);
  });

  it("deletes a session and recalculates XP", async () => {
    const result = await actions.deleteSession(firstSessionId);
    expect(result).toEqual({ ok: true });

    const player = dbModule.sqlite
      .prepare("SELECT total_xp FROM players WHERE id = 1")
      .get() as { total_xp: number };
    const sessions = dbModule.sqlite
      .prepare("SELECT COUNT(*) AS count FROM sessions")
      .get() as { count: number };

    expect(player.total_xp).toBe(421);
    expect(sessions.count).toBe(1);
  });

  it("resets progress while keeping subjects and settings", async () => {
    const result = await actions.resetProgress();
    expect(result).toEqual({ ok: true });

    const player = dbModule.sqlite
      .prepare("SELECT name, total_xp FROM players WHERE id = 1")
      .get() as { name: string; total_xp: number };
    const sessions = dbModule.sqlite
      .prepare("SELECT COUNT(*) AS count FROM sessions")
      .get() as { count: number };
    const claims = dbModule.sqlite
      .prepare("SELECT COUNT(*) AS count FROM quest_claims")
      .get() as { count: number };
    const achievements = dbModule.sqlite
      .prepare("SELECT COUNT(*) AS count FROM player_achievements")
      .get() as { count: number };
    const subjects = dbModule.sqlite
      .prepare("SELECT COUNT(*) AS count FROM subjects")
      .get() as { count: number };

    expect(player.name).toBe("Rudra Makwana");
    expect(player.total_xp).toBe(0);
    expect(sessions.count).toBe(0);
    expect(claims.count).toBe(0);
    expect(achievements.count).toBe(0);
    expect(subjects.count).toBe(4);
  });
});
