export type Rank = "E" | "D" | "C" | "B" | "A" | "S";

export type QuestPeriod = "daily" | "weekly";

export type QuestMetric =
  | "minutes"
  | "sessions"
  | "reflections"
  | "days";

export type StatKey = "INT" | "FOC" | "DIS" | "VIT" | "PER";

export interface RankInfo {
  rank: Rank;
  title: string;
  minLevel: number;
  color: string;
  aura: string;
}

export interface ProgressInfo {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNext: number;
  percent: number;
  rank: RankInfo;
}

export interface StatView {
  key: StatKey;
  label: string;
  korean: string;
  xp: number;
  level: number;
  percent: number;
  xpIntoLevel: number;
  xpForNext: number;
}

export interface SubjectData {
  id: number;
  name: string;
  color: string;
}

export interface SessionData {
  id: number;
  subjectId: number;
  subjectName: string;
  subjectColor: string;
  topic: string;
  notes: string;
  durationMinutes: number;
  focusRating: number;
  xpEarned: number;
  studiedAt: string;
  createdAt: string;
}

export interface QuestView {
  id: number;
  code: string;
  title: string;
  description: string;
  metric: QuestMetric;
  period: QuestPeriod;
  target: number;
  xpReward: number;
  progress: number;
  periodKey: string;
  claimed: boolean;
  complete: boolean;
  percent: number;
}

export interface AchievementView {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  condition: string;
  threshold: number;
  current: number;
  earned: boolean;
  earnedAt: string | null;
  percent: number;
}

export interface AchievementAward {
  title: string;
  description: string;
  xpReward: number;
}

export interface DayActivity {
  date: string;
  label: string;
  minutes: number;
  xp: number;
  level: number;
}

export interface SubjectActivity {
  id: number;
  name: string;
  color: string;
  minutes: number;
  percent: number;
}

export interface HeatmapDay {
  date: string;
  minutes: number;
  level: number;
}

export interface PlayerData {
  id: number;
  name: string;
  totalXp: number;
  createdAt: string;
}

export interface SettingsData {
  dailyGoalMinutes: number;
  defaultTimerMinutes: number;
  timezone: string;
  soundEnabled: boolean;
  onboarded: boolean;
}

export interface AppData {
  player: PlayerData;
  settings: SettingsData;
  progress: ProgressInfo;
  subjects: SubjectData[];
  sessions: SessionData[];
  recentSessions: SessionData[];
  dailyQuests: QuestView[];
  weeklyQuests: QuestView[];
  achievements: AchievementView[];
  stats: StatView[];
  streak: { current: number; best: number };
  totals: {
    minutes: number;
    sessions: number;
    todayMinutes: number;
    weekMinutes: number;
    questsClaimed: number;
  };
  charts: {
    lastSevenDays: DayActivity[];
    lastFourteenDays: DayActivity[];
    subjects: SubjectActivity[];
    heatmap: HeatmapDay[];
  };
  todayKey: string;
  weekKey: string;
}

export interface ShellData {
  name: string;
  progress: ProgressInfo;
  onboarded: boolean;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface SessionResult extends ActionResult {
  xpEarned?: number;
  totalXp?: number;
  levelBefore?: number;
  level?: number;
  rankBefore?: Rank;
  rank?: Rank;
  leveledUp?: boolean;
  rankedUp?: boolean;
  achievements?: AchievementAward[];
}

export interface QuestResult extends ActionResult {
  xpReward?: number;
  totalXp?: number;
  levelBefore?: number;
  level?: number;
  rankBefore?: Rank;
  rank?: Rank;
  leveledUp?: boolean;
  rankedUp?: boolean;
  achievements?: AchievementAward[];
}

export interface SessionInput {
  subjectId: number;
  topic: string;
  notes: string;
  durationMinutes: number;
  focusRating: number;
  studiedAt: string;
}

export interface SettingsInput {
  name: string;
  dailyGoalMinutes: number;
  defaultTimerMinutes: number;
  timezone: string;
  soundEnabled: boolean;
}

export interface OnboardingInput {
  name: string;
  dailyGoalMinutes: number;
  timezone: string;
}
