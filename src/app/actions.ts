"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDatabase } from "@/lib/db";
import {
  achievements,
  playerAchievements,
  players,
  questClaims,
  quests,
  sessions,
  settings,
  subjects,
} from "@/lib/db/schema";
import {
  addDays,
  isValidDateKey,
  isValidTimeZone,
  todayKey,
  weekKeyFor,
} from "@/lib/dates";
import {
  calculateStreaks,
  isAchievementEarned,
  progressFromXp,
  sessionXp,
  type AchievementContext,
} from "@/lib/game";
import type {
  AchievementAward,
  OnboardingInput,
  QuestResult,
  SessionInput,
  SessionResult,
  SettingsInput,
  ActionResult,
} from "@/lib/types";

const sessionSchema = z.object({
  subjectId: z.coerce.number().int().positive(),
  topic: z.string().trim().min(2, "Enter a topic.").max(120),
  notes: z.string().trim().max(2000).optional().default(""),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Session must be at least 1 minute.")
    .max(600, "Sessions are limited to 10 hours."),
  focusRating: z.coerce.number().int().min(1).max(5),
  studiedAt: z.string().refine(isValidDateKey, "Choose a valid study date."),
});

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(30),
  dailyGoalMinutes: z.coerce.number().int().min(10).max(720),
  defaultTimerMinutes: z.coerce.number().int().min(5).max(180),
  timezone: z
    .string()
    .trim()
    .min(1)
    .refine(isValidTimeZone, "Choose a valid timezone."),
  soundEnabled: z.boolean(),
});

const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(30),
  dailyGoalMinutes: z.coerce.number().int().min(10).max(720),
  timezone: z
    .string()
    .trim()
    .min(1)
    .refine(isValidTimeZone, "Choose a valid timezone."),
});

const subjectSchema = z.object({
  name: z.string().trim().min(2, "Subject name is too short.").max(30),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid color."),
});

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

async function getTimeZone(): Promise<string> {
  const [row] = await db
    .select({ timezone: settings.timezone })
    .from(settings)
    .where(eq(settings.id, 1));
  return row?.timezone ?? "Asia/Kolkata";
}

async function getPlayerTotalXp(): Promise<number> {
  const [row] = await db
    .select({ totalXp: players.totalXp })
    .from(players)
    .where(eq(players.id, 1));
  return row?.totalXp ?? 0;
}

async function recalculateTotalXp(): Promise<number> {
  const [sessionRow] = await db
    .select({
      value: sql<number>`coalesce(sum(${sessions.xpEarned}), 0)`,
    })
    .from(sessions);

  const [claimRow] = await db
    .select({
      value: sql<number>`coalesce(sum(${quests.xpReward}), 0)`,
    })
    .from(questClaims)
    .innerJoin(quests, eq(questClaims.questId, quests.id));

  const [achievementRow] = await db
    .select({
      value: sql<number>`coalesce(sum(${achievements.xpReward}), 0)`,
    })
    .from(playerAchievements)
    .innerJoin(
      achievements,
      eq(playerAchievements.achievementId, achievements.id),
    );

  const total =
    Number(sessionRow?.value ?? 0) +
    Number(claimRow?.value ?? 0) +
    Number(achievementRow?.value ?? 0);

  await db
    .update(players)
    .set({ totalXp: total })
    .where(eq(players.id, 1));

  return total;
}

async function getAchievementContext(): Promise<AchievementContext> {
  const sessionRows = await db
    .select({
      durationMinutes: sessions.durationMinutes,
      studiedAt: sessions.studiedAt,
      subjectId: sessions.subjectId,
    })
    .from(sessions);
  const [claimRow] = await db
    .select({ value: sql<number>`count(*)` })
    .from(questClaims);
  const totalMinutes = sessionRows.reduce(
    (sum, session) => sum + session.durationMinutes,
    0,
  );
  const timezone = await getTimeZone();
  const streak = calculateStreaks(
    sessionRows.map((session) => session.studiedAt),
    todayKey(timezone),
  );

  return {
    totalSessions: sessionRows.length,
    totalMinutes,
    bestStreak: streak.best,
    longestSession: sessionRows.reduce(
      (max, session) => Math.max(max, session.durationMinutes),
      0,
    ),
    questsClaimed: Number(claimRow?.value ?? 0),
    distinctSubjects: new Set(
      sessionRows.map((session) => session.subjectId),
    ).size,
    level: progressFromXp(await getPlayerTotalXp()).level,
  };
}

async function syncAchievements(): Promise<AchievementAward[]> {
  const awarded: AchievementAward[] = [];

  for (let pass = 0; pass < 5; pass += 1) {
    const unlockedIds = new Set(
      (
        await db
          .select({ id: playerAchievements.achievementId })
          .from(playerAchievements)
      ).map((row) => row.id),
    );
    const context = await getAchievementContext();
    const eligible = (
      await db.select().from(achievements)
    ).filter(
      (achievement) =>
        !unlockedIds.has(achievement.id) &&
        isAchievementEarned(
          achievement.condition,
          achievement.threshold,
          context,
        ),
    );

    if (eligible.length === 0) break;

    const unlockedAt = new Date().toISOString();
    for (const achievement of eligible) {
      await db
        .insert(playerAchievements)
        .values({
          achievementId: achievement.id,
          unlockedAt,
        })
        .onConflictDoNothing();
      awarded.push({
        title: achievement.title,
        description: achievement.description,
        xpReward: achievement.xpReward,
      });
    }

    await recalculateTotalXp();
  }

  return awarded;
}

function revalidateAll(): void {
  revalidatePath("/", "layout");
}

function nextLevelResult(
  totalXpBefore: number,
  totalXpAfter: number,
  awardList: AchievementAward[],
) {
  const before = progressFromXp(totalXpBefore);
  const after = progressFromXp(totalXpAfter);

  return {
    totalXp: after.totalXp,
    levelBefore: before.level,
    level: after.level,
    rankBefore: before.rank.rank,
    rank: after.rank.rank,
    leveledUp: after.level > before.level,
    rankedUp: after.rank.rank !== before.rank.rank,
    achievements: awardList,
  };
}

export async function saveSession(input: SessionInput): Promise<SessionResult> {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  await ensureDatabase();

  const [subject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.id, parsed.data.subjectId));

  if (!subject) return { ok: false, error: "That subject no longer exists." };

  const today = todayKey(await getTimeZone());
  if (parsed.data.studiedAt > today) {
    return { ok: false, error: "Study date cannot be in the future." };
  }

  const xp = sessionXp(parsed.data.durationMinutes, parsed.data.focusRating);
  const totalXpBefore = await getPlayerTotalXp();

  await db.insert(sessions).values({
    subjectId: parsed.data.subjectId,
    topic: parsed.data.topic,
    notes: parsed.data.notes,
    durationMinutes: parsed.data.durationMinutes,
    focusRating: parsed.data.focusRating,
    xpEarned: xp,
    studiedAt: parsed.data.studiedAt,
    createdAt: new Date().toISOString(),
  });

  await recalculateTotalXp();
  const achievementAwards = await syncAchievements();
  const totalXpAfter = await getPlayerTotalXp();
  const result = nextLevelResult(totalXpBefore, totalXpAfter, achievementAwards);

  revalidateAll();

  return {
    ok: true,
    xpEarned: xp,
    ...result,
  };
}

export async function deleteSession(id: number): Promise<ActionResult> {
  const sessionId = Number(id);
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return { ok: false, error: "Invalid session." };
  }

  await ensureDatabase();

  await db.delete(sessions).where(eq(sessions.id, sessionId));
  await recalculateTotalXp();
  await syncAchievements();
  revalidateAll();
  return { ok: true };
}

async function relevantQuestSessions(period: string, timezone: string) {
  const today = todayKey(timezone);
  const week = weekKeyFor(today);
  const weekEnd = addDays(week, 6);
  const sessionRows = await db
    .select({
      durationMinutes: sessions.durationMinutes,
      notes: sessions.notes,
      studiedAt: sessions.studiedAt,
    })
    .from(sessions);

  return sessionRows.filter((session) =>
    period === "daily"
      ? session.studiedAt === today
      : session.studiedAt >= week && session.studiedAt <= weekEnd,
  );
}

function computeQuestProgress(
  metric: string,
  relevant: Array<{
    durationMinutes: number;
    notes: string;
    studiedAt: string;
  }>,
): number {
  switch (metric) {
    case "minutes":
      return relevant.reduce(
        (sum, session) => sum + session.durationMinutes,
        0,
      );
    case "sessions":
      return relevant.length;
    case "reflections":
      return relevant.filter((session) => session.notes.trim().length >= 10)
        .length;
    case "days":
      return new Set(relevant.map((session) => session.studiedAt)).size;
    default:
      return 0;
  }
}

export async function claimQuest(questId: number): Promise<QuestResult> {
  const id = Number(questId);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Invalid quest." };
  }

  await ensureDatabase();

  const [quest] = await db
    .select()
    .from(quests)
    .where(eq(quests.id, id));

  if (!quest || !quest.active) {
    return { ok: false, error: "This quest is no longer available." };
  }

  const timezone = await getTimeZone();
  const today = todayKey(timezone);
  const week = weekKeyFor(today);
  const periodKey = quest.period === "daily" ? today : week;
  const [existingClaim] = await db
    .select({ id: questClaims.id })
    .from(questClaims)
    .where(
      sql`${questClaims.questId} = ${quest.id} AND ${questClaims.periodKey} = ${periodKey}`,
    );

  if (existingClaim) {
    return { ok: false, error: "This quest reward has already been claimed." };
  }

  const relevant = await relevantQuestSessions(quest.period, timezone);
  const progress = computeQuestProgress(quest.metric, relevant);
  if (progress < quest.target) {
    return { ok: false, error: "Quest requirements are not complete yet." };
  }

  const totalXpBefore = await getPlayerTotalXp();
  await db.insert(questClaims).values({
    questId: quest.id,
    periodKey,
    claimedAt: new Date().toISOString(),
  });

  await recalculateTotalXp();
  const achievementAwards = await syncAchievements();
  const totalXpAfter = await getPlayerTotalXp();
  const result = nextLevelResult(totalXpBefore, totalXpAfter, achievementAwards);

  revalidateAll();

  return {
    ok: true,
    xpReward: quest.xpReward,
    ...result,
  };
}

export async function updateSettings(
  input: SettingsInput,
): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  await ensureDatabase();

  await db
    .update(players)
    .set({ name: parsed.data.name })
    .where(eq(players.id, 1));

  await db
    .update(settings)
    .set({
      dailyGoalMinutes: parsed.data.dailyGoalMinutes,
      defaultTimerMinutes: parsed.data.defaultTimerMinutes,
      timezone: parsed.data.timezone,
      soundEnabled: parsed.data.soundEnabled,
    })
    .where(eq(settings.id, 1));

  revalidateAll();
  return { ok: true };
}

export async function completeOnboarding(
  input: OnboardingInput,
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  await ensureDatabase();

  await db
    .update(players)
    .set({ name: parsed.data.name })
    .where(eq(players.id, 1));

  await db
    .update(settings)
    .set({
      dailyGoalMinutes: parsed.data.dailyGoalMinutes,
      timezone: parsed.data.timezone,
      onboarded: true,
    })
    .where(eq(settings.id, 1));

  revalidateAll();
  return { ok: true };
}

export async function addSubject(
  name: string,
  color: string,
): Promise<ActionResult> {
  const parsed = subjectSchema.safeParse({ name, color });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  await ensureDatabase();

  try {
    await db.insert(subjects).values({
      name: parsed.data.name,
      color: parsed.data.color,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { ok: false, error: "That subject already exists." };
    }
    return { ok: false, error: "Could not add the subject." };
  }

  revalidateAll();
  return { ok: true };
}

export async function deleteSubject(id: number): Promise<ActionResult> {
  const subjectId = Number(id);
  if (!Number.isInteger(subjectId) || subjectId <= 0) {
    return { ok: false, error: "Invalid subject." };
  }

  await ensureDatabase();

  const [usageRow] = await db
    .select({ value: sql<number>`count(*)` })
    .from(sessions)
    .where(eq(sessions.subjectId, subjectId));

  if (Number(usageRow?.value ?? 0) > 0) {
    return {
      ok: false,
      error: "This subject has study sessions and cannot be deleted.",
    };
  }

  await db.delete(subjects).where(eq(subjects.id, subjectId));
  revalidateAll();
  return { ok: true };
}

export async function resetProgress(): Promise<ActionResult> {
  await ensureDatabase();

  await db.delete(sessions);
  await db.delete(questClaims);
  await db.delete(playerAchievements);
  await db.update(players).set({ totalXp: 0 }).where(eq(players.id, 1));
  revalidateAll();
  return { ok: true };
}
