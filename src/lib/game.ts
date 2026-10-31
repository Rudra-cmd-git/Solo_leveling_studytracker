import { addDays } from "./dates";
import type {
  ProgressInfo,
  Rank,
  RankInfo,
  StatKey,
  StatView,
} from "./types";

export const RANKS: Record<Rank, RankInfo> = {
  E: {
    rank: "E",
    title: "Unawakened",
    minLevel: 1,
    color: "#7f9bb5",
    aura: "rgba(127, 155, 181, 0.35)",
  },
  D: {
    rank: "D",
    title: "Awakened Hunter",
    minLevel: 10,
    color: "#3dd6a3",
    aura: "rgba(61, 214, 163, 0.35)",
  },
  C: {
    rank: "C",
    title: "Elite Hunter",
    minLevel: 20,
    color: "#43a9ff",
    aura: "rgba(67, 169, 255, 0.4)",
  },
  B: {
    rank: "B",
    title: "Veteran Hunter",
    minLevel: 30,
    color: "#8c7dff",
    aura: "rgba(140, 125, 255, 0.4)",
  },
  A: {
    rank: "A",
    title: "Apex Hunter",
    minLevel: 40,
    color: "#ffb84d",
    aura: "rgba(255, 184, 77, 0.4)",
  },
  S: {
    rank: "S",
    title: "Sovereign",
    minLevel: 50,
    color: "#ff5b72",
    aura: "rgba(255, 91, 114, 0.45)",
  },
};

export function xpForNextLevel(level: number): number {
  return 100 + (Math.max(1, level) - 1) * 50;
}

export function rankForLevel(level: number): RankInfo {
  if (level >= 50) return RANKS.S;
  if (level >= 40) return RANKS.A;
  if (level >= 30) return RANKS.B;
  if (level >= 20) return RANKS.C;
  if (level >= 10) return RANKS.D;
  return RANKS.E;
}

export function progressFromXp(totalXp: number): ProgressInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  let needed = xpForNextLevel(level);

  while (remaining >= needed && level < 999) {
    remaining -= needed;
    level += 1;
    needed = xpForNextLevel(level);
  }

  return {
    level,
    totalXp: Math.max(0, Math.floor(totalXp)),
    xpIntoLevel: remaining,
    xpForNext: needed,
    percent: needed === 0 ? 0 : (remaining / needed) * 100,
    rank: rankForLevel(level),
  };
}

export function sessionXp(durationMinutes: number, focusRating: number): number {
  const minutes = Math.min(600, Math.max(1, Math.round(durationMinutes)));
  const focus = Math.min(5, Math.max(1, Math.round(focusRating)));
  const multiplier = 0.8 + focus * 0.1;
  return Math.round(minutes * 2 * multiplier) + 10;
}

export interface StreakResult {
  current: number;
  best: number;
}

export function calculateStreaks(
  sessionDates: string[],
  today: string,
): StreakResult {
  const dates = [...new Set(sessionDates)].sort();
  if (dates.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;

  for (let index = 1; index < dates.length; index += 1) {
    if (dates[index] === addDays(dates[index - 1], 1)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  const latest = dates[dates.length - 1];
  if (latest !== today && latest !== addDays(today, -1)) {
    return { current: 0, best };
  }

  let current = 1;
  for (let index = dates.length - 1; index > 0; index -= 1) {
    if (dates[index - 1] === addDays(dates[index], -1)) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, best: Math.max(best, current) };
}

export interface StatContext {
  totalMinutes: number;
  focusWeighted: number;
  questsClaimed: number;
  bestStreak: number;
  currentStreak: number;
  sessionCount: number;
  reflectionCount: number;
  subjectCount: number;
}

interface StatDefinition {
  key: StatKey;
  label: string;
  korean: string;
  xp: number;
}

export function calculateStats(context: StatContext): StatView[] {
  const definitions: StatDefinition[] = [
    {
      key: "INT",
      label: "Intelligence",
      korean: "지능",
      xp: Math.round(context.totalMinutes),
    },
    {
      key: "FOC",
      label: "Focus",
      korean: "집중",
      xp: Math.round(context.focusWeighted),
    },
    {
      key: "DIS",
      label: "Discipline",
      korean: "규율",
      xp: context.questsClaimed * 60 + context.bestStreak * 10,
    },
    {
      key: "VIT",
      label: "Vitality",
      korean: "체력",
      xp: context.sessionCount * 20 + context.currentStreak * 25,
    },
    {
      key: "PER",
      label: "Perception",
      korean: "통찰",
      xp: context.reflectionCount * 40 + context.subjectCount * 15,
    },
  ];

  return definitions.map((definition) => statisticFromXp(definition));
}

function statisticFromXp(definition: StatDefinition): StatView {
  const xp = Math.max(0, Math.floor(definition.xp));
  const level = 1 + Math.floor(Math.sqrt(xp / 100));
  const currentFloor = 100 * (level - 1) ** 2;
  const nextFloor = 100 * level ** 2;
  const span = Math.max(1, nextFloor - currentFloor);
  const xpIntoLevel = Math.max(0, xp - currentFloor);

  return {
    key: definition.key,
    label: definition.label,
    korean: definition.korean,
    xp,
    level,
    percent: Math.min(100, (xpIntoLevel / span) * 100),
    xpIntoLevel,
    xpForNext: nextFloor - currentFloor,
  };
}

export interface AchievementContext {
  totalSessions: number;
  totalMinutes: number;
  bestStreak: number;
  longestSession: number;
  questsClaimed: number;
  distinctSubjects: number;
  level: number;
}

export function achievementValue(
  condition: string,
  context: AchievementContext,
): number {
  switch (condition) {
    case "sessions":
      return context.totalSessions;
    case "total_minutes":
      return context.totalMinutes;
    case "best_streak":
      return context.bestStreak;
    case "longest_session":
      return context.longestSession;
    case "quests_claimed":
      return context.questsClaimed;
    case "subjects_used":
      return context.distinctSubjects;
    case "level":
      return context.level;
    default:
      return 0;
  }
}

export function isAchievementEarned(
  condition: string,
  threshold: number,
  context: AchievementContext,
): boolean {
  return achievementValue(condition, context) >= threshold;
}

export function formatMinutes(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;

  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}
