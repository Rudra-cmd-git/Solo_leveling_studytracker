import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { db, ensureDatabase } from "./db";
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
} from "./db/schema";
import {
  addDays,
  heatmapDays,
  lastNDays,
  monthDay,
  todayKey,
  weekDates,
  weekKeyFor,
  weekdayShort,
} from "./dates";
import {
  achievementValue,
  calculateStats,
  calculateStreaks,
  freezeCandidate,
  progressFromXp,
  streakAtRisk,
  type AchievementContext,
} from "./game";
import { getPlayerId, requirePlayerId } from "./auth";
import type {
  AchievementView,
  AppData,
  HeatmapDay,
  PlayerData,
  QuestMetric,
  QuestPeriod,
  QuestView,
  SessionData,
  SettingsData,
  ShellData,
  SubjectActivity,
  SubjectData,
} from "./types";

async function getPlayerRow(playerId: number): Promise<PlayerData> {
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, playerId));
  if (!player) {
    throw new Error("Player record is missing.");
  }
  return player;
}

async function getSettingsRow(playerId: number): Promise<SettingsData> {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, playerId));
  if (!row) {
    throw new Error("Settings record is missing.");
  }
  return {
    dailyGoalMinutes: row.dailyGoalMinutes,
    defaultTimerMinutes: row.defaultTimerMinutes,
    timezone: row.timezone,
    soundEnabled: row.soundEnabled,
    xpBonusesEnabled: row.xpBonusesEnabled,
    notificationsEnabled: row.notificationsEnabled,
    reminderTime: row.reminderTime,
    onboarded: row.onboarded,
  };
}

async function getSubjectRows(playerId: number): Promise<SubjectData[]> {
  return db
    .select({
      id: subjects.id,
      name: subjects.name,
      color: subjects.color,
    })
    .from(subjects)
    .where(eq(subjects.userId, playerId));
}

async function getSessionRows(
  playerId: number,
  subjectRows: SubjectData[],
): Promise<SessionData[]> {
  const subjectMap = new Map(subjectRows.map((subject) => [subject.id, subject]));
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, playerId))
    .orderBy(desc(sessions.studiedAt), desc(sessions.id));
  return rows.map((session) => {
    const subject = subjectMap.get(session.subjectId);
    return {
      id: session.id,
      subjectId: session.subjectId,
      subjectName: subject?.name ?? "Unknown",
      subjectColor: subject?.color ?? "#43a9ff",
      topic: session.topic,
      notes: session.notes,
      durationMinutes: session.durationMinutes,
      focusRating: session.focusRating,
      xpEarned: session.xpEarned,
      studiedAt: session.studiedAt,
      createdAt: session.createdAt,
    };
  });
}

function questProgressValue(
  metric: QuestMetric,
  relevantSessions: SessionData[],
): number {
  switch (metric) {
    case "minutes":
      return relevantSessions.reduce(
        (sum, session) => sum + session.durationMinutes,
        0,
      );
    case "sessions":
      return relevantSessions.length;
    case "reflections":
      return relevantSessions.filter(
        (session) => session.notes.trim().length >= 10,
      ).length;
    case "days":
      return new Set(relevantSessions.map((session) => session.studiedAt)).size;
    default:
      return 0;
  }
}

async function buildQuestViews(
  playerId: number,
  sessionRows: SessionData[],
  subjectRows: SubjectData[],
  timezone: string,
): Promise<{
  dailyQuests: QuestView[];
  weeklyQuests: QuestView[];
  today: string;
  week: string;
}> {
  const today = todayKey(timezone);
  const week = weekKeyFor(today);
  const weekEnd = addDays(week, 6);
  const subjectMap = new Map(subjectRows.map((subject) => [subject.id, subject]));
  const claimRows = await db
    .select()
    .from(questClaims)
    .where(eq(questClaims.userId, playerId));
  const claimSet = new Set(
    claimRows.map((claim) => `${claim.questId}:${claim.periodKey}`),
  );

  const questRows = await db
    .select()
    .from(quests)
    .where(eq(quests.active, true));

  const views = questRows.map((quest) => {
    const period = quest.period as QuestPeriod;
    const periodKey = period === "daily" ? today : week;
    const subject = quest.subjectId
      ? subjectMap.get(quest.subjectId)
      : undefined;
    const relevant = sessionRows.filter((session) => {
      if (subject && session.subjectId !== subject.id) return false;
      return period === "daily"
        ? session.studiedAt === today
        : session.studiedAt >= week && session.studiedAt <= weekEnd;
    });

    const progress = questProgressValue(quest.metric as QuestMetric, relevant);
    const claimed = claimSet.has(`${quest.id}:${periodKey}`);

    return {
      id: quest.id,
      code: quest.code,
      title: quest.title,
      description: quest.description,
      metric: quest.metric as QuestMetric,
      period,
      target: quest.target,
      xpReward: quest.xpReward,
      subjectId: quest.subjectId ?? null,
      subjectName: subject?.name ?? null,
      subjectColor: subject?.color ?? null,
      progress,
      periodKey,
      claimed,
      complete: progress >= quest.target,
      percent: Math.min(100, (progress / quest.target) * 100),
    } satisfies QuestView;
  });

  return {
    dailyQuests: views.filter((quest) => quest.period === "daily"),
    weeklyQuests: views.filter((quest) => quest.period === "weekly"),
    today,
    week,
  };
}

async function buildAchievementViews(
  playerId: number,
  context: AchievementContext,
  unlocked: Map<number, string>,
): Promise<AchievementView[]> {
  const rows = await db
    .select()
    .from(achievements)
    .orderBy(achievements.sortOrder);
  return rows.map((achievement) => {
    const current = achievementValue(achievement.condition, context);
    return {
      id: achievement.id,
      code: achievement.code,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      xpReward: achievement.xpReward,
      condition: achievement.condition,
      threshold: achievement.threshold,
      current,
      earned: unlocked.has(achievement.id),
      earnedAt: unlocked.get(achievement.id) ?? null,
      percent: Math.min(100, (current / achievement.threshold) * 100),
    } satisfies AchievementView;
  });
}

function buildDayChart(
  sessionRows: SessionData[],
  endDate: string,
  count: number,
): AppData["charts"]["lastSevenDays"] {
  const dates = lastNDays(endDate, count);
  const totals = new Map<string, { minutes: number; xp: number }>();

  for (const session of sessionRows) {
    const current = totals.get(session.studiedAt) ?? { minutes: 0, xp: 0 };
    current.minutes += session.durationMinutes;
    current.xp += session.xpEarned;
    totals.set(session.studiedAt, current);
  }

  const raw = dates.map((date) => ({
    date,
    label: count <= 7 ? weekdayShort(date) : monthDay(date),
    minutes: totals.get(date)?.minutes ?? 0,
    xp: totals.get(date)?.xp ?? 0,
    level: 0,
  }));

  const max = Math.max(60, ...raw.map((day) => day.minutes));
  return raw.map((day) => ({
    ...day,
    level: Math.max(0, Math.round((day.minutes / max) * 100)),
  }));
}

function buildHeatmap(sessionRows: SessionData[], today: string): HeatmapDay[] {
  const totals = new Map<string, number>();
  for (const session of sessionRows) {
    totals.set(
      session.studiedAt,
      (totals.get(session.studiedAt) ?? 0) + session.durationMinutes,
    );
  }

  return heatmapDays(today, 12).map((date) => {
    const minutes = totals.get(date) ?? 0;
    let level = 0;
    if (minutes > 0) level = 1;
    if (minutes >= 30) level = 2;
    if (minutes >= 60) level = 3;
    if (minutes >= 120) level = 4;

    return { date, minutes, level };
  });
}

function buildSubjectActivity(
  subjectRows: SubjectData[],
  sessionRows: SessionData[],
): SubjectActivity[] {
  const totals = new Map<number, number>();
  for (const session of sessionRows) {
    totals.set(
      session.subjectId,
      (totals.get(session.subjectId) ?? 0) + session.durationMinutes,
    );
  }

  const totalMinutes = Math.max(
    1,
    [...totals.values()].reduce((sum, minutes) => sum + minutes, 0),
  );

  return subjectRows
    .map((subject) => {
      const minutes = totals.get(subject.id) ?? 0;
      return {
        ...subject,
        minutes,
        percent: (minutes / totalMinutes) * 100,
      };
    })
    .filter((subject) => subject.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
}

// Create a cache key that includes the player ID
function getPlayerCacheKey(): string {
  // This will be different per request since getPlayerId() is async
  // We use a simple approach: don't cache at the React level, let the database handle it
  return "player-data";
}

export const getAppData = cache(async (): Promise<AppData> => {
  await ensureDatabase();
  const playerId = await requirePlayerId();
  const player = await getPlayerRow(playerId);
  const appSettings = await getSettingsRow(playerId);
  const subjectRows = await getSubjectRows(playerId);
  const sessionRows = await getSessionRows(playerId, subjectRows);
  const { dailyQuests, weeklyQuests, today, week } = await buildQuestViews(
    playerId,
    sessionRows,
    subjectRows,
    appSettings.timezone,
  );

  const freezeRows = await db
    .select()
    .from(streakFreezes)
    .where(eq(streakFreezes.userId, playerId));
  const frozenDates = freezeRows.map((freeze) => freeze.dateKey);
  const sessionDates = sessionRows.map((session) => session.studiedAt);
  const streak = calculateStreaks(sessionDates, today, frozenDates);
  const freezesUsedThisWeek = frozenDates.filter(
    (dateKey) => weekKeyFor(dateKey) === week,
  ).length;
  const candidate = freezeCandidate(sessionDates, today, frozenDates);
  const streakInfo = {
    ...streak,
    freezesUsedThisWeek,
    freezeAvailable: freezesUsedThisWeek === 0 && candidate !== null,
    atRisk: streakAtRisk(sessionDates, today, frozenDates),
    frozenDates,
  };
  const totalMinutes = sessionRows.reduce(
    (sum, session) => sum + session.durationMinutes,
    0,
  );
  const focusWeighted = sessionRows.reduce(
    (sum, session) => sum + (session.durationMinutes * session.focusRating) / 2,
    0,
  );
  const reflectionCount = sessionRows.filter(
    (session) => session.notes.trim().length >= 10,
  ).length;
  const totalSessions = sessionRows.length;
  const longestSession = sessionRows.reduce(
    (max, session) => Math.max(max, session.durationMinutes),
    0,
  );
  const distinctSubjects = new Set(
    sessionRows.map((session) => session.subjectId),
  ).size;
  const progress = progressFromXp(player.totalXp);
  const claimRows = await db
    .select()
    .from(questClaims)
    .where(eq(questClaims.userId, playerId));
  const questsClaimed = claimRows.length;
  const weekEnd = addDays(week, 6);

  const stats = calculateStats({
    totalMinutes,
    focusWeighted,
    questsClaimed,
    bestStreak: streak.best,
    currentStreak: streak.current,
    sessionCount: totalSessions,
    reflectionCount,
    subjectCount: distinctSubjects,
  });

  const achievementContext: AchievementContext = {
    totalSessions,
    totalMinutes,
    bestStreak: streak.best,
    longestSession,
    questsClaimed,
    distinctSubjects,
    level: progress.level,
  };

  const unlockedRows = await db
    .select({
      achievementId: playerAchievements.achievementId,
      unlockedAt: playerAchievements.unlockedAt,
    })
    .from(playerAchievements)
    .where(eq(playerAchievements.userId, playerId));
  const unlocked = new Map(
    unlockedRows.map((row) => [row.achievementId, row.unlockedAt]),
  );

  const todayMinutes = sessionRows
    .filter((session) => session.studiedAt === today)
    .reduce((sum, session) => sum + session.durationMinutes, 0);
  const weekMinutes = sessionRows
    .filter(
      (session) =>
        session.studiedAt >= week && session.studiedAt <= weekEnd,
    )
    .reduce((sum, session) => sum + session.durationMinutes, 0);

  return {
    player,
    settings: appSettings,
    progress,
    subjects: subjectRows,
    sessions: sessionRows,
    recentSessions: sessionRows.slice(0, 6),
    dailyQuests,
    weeklyQuests,
    achievements: await buildAchievementViews(
      playerId,
      achievementContext,
      unlocked,
    ),
    stats,
    streak: streakInfo,
    totals: {
      minutes: totalMinutes,
      sessions: totalSessions,
      todayMinutes,
      weekMinutes,
      questsClaimed,
    },
    charts: {
      lastSevenDays: buildDayChart(sessionRows, today, 7),
      lastFourteenDays: buildDayChart(sessionRows, today, 14),
      subjects: buildSubjectActivity(subjectRows, sessionRows),
      heatmap: buildHeatmap(sessionRows, today),
    },
    todayKey: today,
    weekKey: week,
  };
});

export const getShellData = cache(async (): Promise<ShellData | null> => {
  await ensureDatabase();
  const playerId = await getPlayerId();
  if (!playerId) return null;
  const player = await getPlayerRow(playerId);
  const appSettings = await getSettingsRow(playerId);
  return {
    name: player.name,
    progress: progressFromXp(player.totalXp),
    onboarded: appSettings.onboarded,
    soundEnabled: appSettings.soundEnabled,
  };
});

export async function getSettingsData(): Promise<SettingsData> {
  await ensureDatabase();
  const playerId = await requirePlayerId();
  return getSettingsRow(playerId);
}

export async function getSubjects(): Promise<SubjectData[]> {
  await ensureDatabase();
  const playerId = await requirePlayerId();
  return getSubjectRows(playerId);
}

export function getWeekDates(weekKey: string): string[] {
  return weekDates(weekKey);
}

// Re-export getPlayerId for pages that need to check auth status
export { getPlayerId } from "./auth";