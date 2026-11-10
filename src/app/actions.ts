"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
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
  streakFreezes,
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
  freezeCandidate,
  isAchievementEarned,
  isWeekendDate,
  progressFromXp,
  sessionReward,
  sessionXp,
  type AchievementContext,
} from "@/lib/game";
import { getPlayerId, requirePlayerId } from "@/lib/auth";
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
  xpBonusesEnabled: z.boolean().optional(),
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

async function getPlayerTimezone(playerId: number): Promise<string> {
  const [row] = await db
    .select({ timezone: settings.timezone })
    .from(settings)
    .where(eq(settings.userId, playerId));
  return row?.timezone ?? "Asia/Kolkata";
}

async function getPlayerTotalXp(playerId: number): Promise<number> {
  const [row] = await db
    .select({ totalXp: players.totalXp })
    .from(players)
    .where(eq(players.id, playerId));
  return row?.totalXp ?? 0;
}

async function getXpBonusesEnabled(playerId: number): Promise<boolean> {
  const [row] = await db
    .select({ xpBonusesEnabled: settings.xpBonusesEnabled })
    .from(settings)
    .where(eq(settings.userId, playerId));
  return row?.xpBonusesEnabled ?? false;
}

async function getFrozenDates(playerId: number): Promise<string[]> {
  const rows = await db
    .select({ dateKey: streakFreezes.dateKey })
    .from(streakFreezes)
    .where(eq(streakFreezes.userId, playerId));
  return rows.map((row) => row.dateKey);
}

async function computeSessionXp(
  playerId: number,
  studiedAt: string,
  durationMinutes: number,
  focusRating: number,
  excludeSessionId?: number,
): Promise<number> {
  if (!(await getXpBonusesEnabled(playerId))) {
    return sessionXp(durationMinutes, focusRating);
  }

  const rows = await db
    .select({ id: sessions.id, studiedAt: sessions.studiedAt })
    .from(sessions)
    .where(eq(sessions.userId, playerId));
  const otherDates = rows
    .filter((row) => row.id !== excludeSessionId)
    .map((row) => row.studiedAt);
  const frozenDates = await getFrozenDates(playerId);
  const timezone = await getPlayerTimezone(playerId);
  const currentStreak = calculateStreaks(
    [...otherDates, studiedAt],
    todayKey(timezone),
    frozenDates,
  ).current;

  return sessionReward(durationMinutes, focusRating, {
    currentStreak,
    isFirstOfDay: !otherDates.includes(studiedAt),
    isWeekend: isWeekendDate(studiedAt),
  }).total;
}

async function recalculateTotalXp(playerId: number): Promise<number> {
  const [sessionRow] = await db
    .select({
      value: sql<number>`coalesce(sum(${sessions.xpEarned}), 0)`,
    })
    .from(sessions)
    .where(eq(sessions.userId, playerId));

  const [claimRow] = await db
    .select({
      value: sql<number>`coalesce(sum(${quests.xpReward}), 0)`,
    })
    .from(questClaims)
    .innerJoin(quests, eq(questClaims.questId, quests.id))
    .where(eq(questClaims.userId, playerId));

  const [achievementRow] = await db
    .select({
      value: sql<number>`coalesce(sum(${achievements.xpReward}), 0)`,
    })
    .from(playerAchievements)
    .innerJoin(
      achievements,
      eq(playerAchievements.achievementId, achievements.id),
    )
    .where(eq(playerAchievements.userId, playerId));

  const total =
    Number(sessionRow?.value ?? 0) +
    Number(claimRow?.value ?? 0) +
    Number(achievementRow?.value ?? 0);

  await db
    .update(players)
    .set({ totalXp: total })
    .where(eq(players.id, playerId));

  return total;
}

async function getAchievementContext(playerId: number): Promise<AchievementContext> {
  const sessionRows = await db
    .select({
      durationMinutes: sessions.durationMinutes,
      studiedAt: sessions.studiedAt,
      subjectId: sessions.subjectId,
    })
    .from(sessions)
    .where(eq(sessions.userId, playerId));

  const [claimRow] = await db
    .select({ value: sql<number>`count(*)` })
    .from(questClaims)
    .where(eq(questClaims.userId, playerId));

  const totalMinutes = sessionRows.reduce(
    (sum, session) => sum + session.durationMinutes,
    0,
  );
  const timezone = await getPlayerTimezone(playerId);
  const frozenDates = await getFrozenDates(playerId);
  const streak = calculateStreaks(
    sessionRows.map((session) => session.studiedAt),
    todayKey(timezone),
    frozenDates,
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
    level: progressFromXp(await getPlayerTotalXp(playerId)).level,
  };
}

async function syncAchievements(playerId: number): Promise<AchievementAward[]> {
  const awarded: AchievementAward[] = [];

  for (let pass = 0; pass < 5; pass += 1) {
    const unlockedIds = new Set(
      (
        await db
          .select({ id: playerAchievements.achievementId })
          .from(playerAchievements)
          .where(eq(playerAchievements.userId, playerId))
      ).map((row) => row.id),
    );
    const context = await getAchievementContext(playerId);
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
          userId: playerId,
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

    await recalculateTotalXp(playerId);
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

  const playerId = await requirePlayerId();

  const [subject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, parsed.data.subjectId), eq(subjects.userId, playerId)));

  if (!subject) return { ok: false, error: "That subject no longer exists." };

  const today = todayKey(await getPlayerTimezone(playerId));
  if (parsed.data.studiedAt > today) {
    return { ok: false, error: "Study date cannot be in the future." };
  }

  const xp = await computeSessionXp(
    playerId,
    parsed.data.studiedAt,
    parsed.data.durationMinutes,
    parsed.data.focusRating,
  );
  const totalXpBefore = await getPlayerTotalXp(playerId);

  await db.insert(sessions).values({
    userId: playerId,
    subjectId: parsed.data.subjectId,
    topic: parsed.data.topic,
    notes: parsed.data.notes,
    durationMinutes: parsed.data.durationMinutes,
    focusRating: parsed.data.focusRating,
    xpEarned: xp,
    studiedAt: parsed.data.studiedAt,
    createdAt: new Date().toISOString(),
  });

  await recalculateTotalXp(playerId);
  const achievementAwards = await syncAchievements(playerId);
  const totalXpAfter = await getPlayerTotalXp(playerId);
  const result = nextLevelResult(totalXpBefore, totalXpAfter, achievementAwards);

  revalidateAll();

  return {
    ok: true,
    xpEarned: xp,
    ...result,
  };
}

export async function updateSession(
  id: number,
  input: SessionInput,
): Promise<SessionResult> {
  const sessionId = Number(id);
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return { ok: false, error: "Invalid session." };
  }

  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  await ensureDatabase();

  const playerId = await requirePlayerId();

  const [existing] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, playerId)));

  if (!existing) return { ok: false, error: "That session no longer exists." };

  const [subject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, parsed.data.subjectId), eq(subjects.userId, playerId)));

  if (!subject) return { ok: false, error: "That subject no longer exists." };

  const today = todayKey(await getPlayerTimezone(playerId));
  if (parsed.data.studiedAt > today) {
    return { ok: false, error: "Study date cannot be in the future." };
  }

  const xp = await computeSessionXp(
    playerId,
    parsed.data.studiedAt,
    parsed.data.durationMinutes,
    parsed.data.focusRating,
    sessionId,
  );
  const totalXpBefore = await getPlayerTotalXp(playerId);

  await db
    .update(sessions)
    .set({
      subjectId: parsed.data.subjectId,
      topic: parsed.data.topic,
      notes: parsed.data.notes,
      durationMinutes: parsed.data.durationMinutes,
      focusRating: parsed.data.focusRating,
      xpEarned: xp,
      studiedAt: parsed.data.studiedAt,
    })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, playerId)));

  await recalculateTotalXp(playerId);
  const achievementAwards = await syncAchievements(playerId);
  const totalXpAfter = await getPlayerTotalXp(playerId);
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

  const playerId = await requirePlayerId();

  await db
    .delete(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, playerId)));

  await recalculateTotalXp(playerId);
  await syncAchievements(playerId);
  revalidateAll();
  return { ok: true };
}

async function relevantQuestSessions(
  playerId: number,
  period: string,
  timezone: string,
  subjectId: number | null,
) {
  const today = todayKey(timezone);
  const week = weekKeyFor(today);
  const weekEnd = addDays(week, 6);
  const sessionRows = await db
    .select({
      subjectId: sessions.subjectId,
      durationMinutes: sessions.durationMinutes,
      notes: sessions.notes,
      studiedAt: sessions.studiedAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, playerId));

  return sessionRows.filter((session) => {
    if (subjectId !== null && session.subjectId !== subjectId) return false;
    return period === "daily"
      ? session.studiedAt === today
      : session.studiedAt >= week && session.studiedAt <= weekEnd;
  });
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

  const playerId = await requirePlayerId();

  const [quest] = await db
    .select()
    .from(quests)
    .where(eq(quests.id, id));

  if (!quest || !quest.active) {
    return { ok: false, error: "This quest is no longer available." };
  }

  const timezone = await getPlayerTimezone(playerId);
  const today = todayKey(timezone);
  const week = weekKeyFor(today);
  const periodKey = quest.period === "daily" ? today : week;
  const [existingClaim] = await db
    .select({ id: questClaims.id })
    .from(questClaims)
    .where(
      sql`${questClaims.questId} = ${quest.id} AND ${questClaims.periodKey} = ${periodKey} AND ${questClaims.userId} = ${playerId}`,
    );

  if (existingClaim) {
    return { ok: false, error: "This quest reward has already been claimed." };
  }

  const relevant = await relevantQuestSessions(
    playerId,
    quest.period,
    timezone,
    quest.subjectId ?? null,
  );
  const progress = computeQuestProgress(quest.metric, relevant);
  if (progress < quest.target) {
    return { ok: false, error: "Quest requirements are not complete yet." };
  }

  const totalXpBefore = await getPlayerTotalXp(playerId);
  await db.insert(questClaims).values({
    userId: playerId,
    questId: quest.id,
    periodKey,
    claimedAt: new Date().toISOString(),
  });

  await recalculateTotalXp(playerId);
  const achievementAwards = await syncAchievements(playerId);
  const totalXpAfter = await getPlayerTotalXp(playerId);
  const result = nextLevelResult(totalXpBefore, totalXpAfter, achievementAwards);

  revalidateAll();

  return {
    ok: true,
    xpReward: quest.xpReward,
    ...result,
  };
}

export async function activateStreakFreeze(): Promise<ActionResult> {
  await ensureDatabase();

  const playerId = await requirePlayerId();
  const timezone = await getPlayerTimezone(playerId);
  const today = todayKey(timezone);
  const freezeRows = await db
    .select()
    .from(streakFreezes)
    .where(eq(streakFreezes.userId, playerId));
  const frozenDates = freezeRows.map((row) => row.dateKey);
  const sessionRows = await db
    .select({ studiedAt: sessions.studiedAt })
    .from(sessions)
    .where(eq(sessions.userId, playerId));
  const candidate = freezeCandidate(
    sessionRows.map((row) => row.studiedAt),
    today,
    frozenDates,
  );

  if (!candidate) {
    return {
      ok: false,
      error: "Your streak is not at risk, or one freeze cannot restore it.",
    };
  }

  const candidateWeek = weekKeyFor(candidate);
  if (frozenDates.some((dateKey) => weekKeyFor(dateKey) === candidateWeek)) {
    return {
      ok: false,
      error: "A streak freeze was already used this week.",
    };
  }

  try {
    await db.insert(streakFreezes).values({
      userId: playerId,
      dateKey: candidate,
      createdAt: new Date().toISOString(),
    });
  } catch {
    return { ok: false, error: "Could not activate the streak freeze." };
  }

  revalidateAll();
  return { ok: true };
}

export async function updateSettings(
  input: SettingsInput,
): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  await ensureDatabase();

  const playerId = await requirePlayerId();

  await db
    .update(players)
    .set({ name: parsed.data.name })
    .where(eq(players.id, playerId));

  await db
    .update(settings)
    .set({
      dailyGoalMinutes: parsed.data.dailyGoalMinutes,
      defaultTimerMinutes: parsed.data.defaultTimerMinutes,
      timezone: parsed.data.timezone,
      soundEnabled: parsed.data.soundEnabled,
      xpBonusesEnabled: parsed.data.xpBonusesEnabled ?? false,
    })
    .where(eq(settings.userId, playerId));

  revalidateAll();
  return { ok: true };
}

export async function setSoundEnabled(
  enabled: boolean,
): Promise<ActionResult> {
  if (typeof enabled !== "boolean") {
    return { ok: false, error: "Invalid audio state." };
  }

  await ensureDatabase();

  const playerId = await requirePlayerId();

  await db
    .update(settings)
    .set({ soundEnabled: enabled })
    .where(eq(settings.userId, playerId));

  revalidateAll();
  return { ok: true };
}

export async function completeOnboarding(
  input: OnboardingInput,
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  await ensureDatabase();

  const playerId = await requirePlayerId();

  await db
    .update(players)
    .set({ name: parsed.data.name })
    .where(eq(players.id, playerId));

  await db
    .update(settings)
    .set({
      dailyGoalMinutes: parsed.data.dailyGoalMinutes,
      timezone: parsed.data.timezone,
      onboarded: true,
    })
    .where(eq(settings.userId, playerId));

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

  const playerId = await requirePlayerId();

  try {
    await db.insert(subjects).values({
      userId: playerId,
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

  const playerId = await requirePlayerId();

  const [usageRow] = await db
    .select({ value: sql<number>`count(*)` })
    .from(sessions)
    .where(and(eq(sessions.subjectId, subjectId), eq(sessions.userId, playerId)));

  if (Number(usageRow?.value ?? 0) > 0) {
    return {
      ok: false,
      error: "This subject has study sessions and cannot be deleted.",
    };
  }

  await db
    .delete(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.userId, playerId)));

  revalidateAll();
  return { ok: true };
}

export async function resetProgress(): Promise<ActionResult> {
  await ensureDatabase();

  const playerId = await requirePlayerId();

  await db.delete(sessions).where(eq(sessions.userId, playerId));
  await db.delete(questClaims).where(eq(questClaims.userId, playerId));
  await db.delete(playerAchievements).where(eq(playerAchievements.userId, playerId));
  await db.delete(streakFreezes).where(eq(streakFreezes.userId, playerId));
  await db.update(players).set({ totalXp: 0 }).where(eq(players.id, playerId));

  revalidateAll();
  return { ok: true };
}

export async function updateNotificationSettings(
  input: {
    notificationsEnabled?: boolean;
    reminderTime?: string;
  },
): Promise<ActionResult> {
  await ensureDatabase();

  const playerId = await requirePlayerId();

  const updates: Record<string, unknown> = {};
  if (input.notificationsEnabled !== undefined) {
    updates.notificationsEnabled = input.notificationsEnabled;
  }
  if (input.reminderTime !== undefined) {
    updates.reminderTime = input.reminderTime;
  }

  if (Object.keys(updates).length === 0) {
    return { ok: false, error: "No settings to update." };
  }

  await db
    .update(settings)
    .set(updates)
    .where(eq(settings.userId, playerId));

  revalidateAll();
  return { ok: true };
}