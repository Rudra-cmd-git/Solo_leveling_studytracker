import { z } from "zod";

const idSchema = z.number().int().positive();
const timestampSchema = z.string().min(1);

const playerSchema = z.object({
  id: z.literal(1),
  name: z.string().min(1).max(30),
  totalXp: z.number().int().min(0),
  createdAt: timestampSchema,
});

const settingsSchema = z.object({
  id: z.literal(1),
  dailyGoalMinutes: z.number().int().min(10).max(720),
  defaultTimerMinutes: z.number().int().min(5).max(180),
  timezone: z.string().min(1),
  soundEnabled: z.boolean(),
  onboarded: z.boolean(),
});

const subjectSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(30),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  createdAt: timestampSchema,
});

const sessionSchema = z.object({
  id: idSchema,
  subjectId: idSchema,
  topic: z.string().min(1).max(120),
  notes: z.string().max(2000),
  durationMinutes: z.number().int().min(1).max(600),
  focusRating: z.number().int().min(1).max(5),
  xpEarned: z.number().int().min(0),
  studiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: timestampSchema,
});

const questSchema = z.object({
  id: idSchema,
  code: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  metric: z.string().min(1),
  period: z.string().min(1),
  target: z.number().int().positive(),
  xpReward: z.number().int().min(0),
  active: z.boolean(),
  sortOrder: z.number().int(),
});

const questClaimSchema = z.object({
  id: idSchema,
  questId: idSchema,
  periodKey: z.string().min(1),
  claimedAt: timestampSchema,
});

const achievementSchema = z.object({
  id: idSchema,
  code: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  condition: z.string().min(1),
  threshold: z.number().int().positive(),
  xpReward: z.number().int().min(0),
  sortOrder: z.number().int(),
});

const playerAchievementSchema = z.object({
  id: idSchema,
  achievementId: idSchema,
  unlockedAt: timestampSchema,
});

export const backupSchema = z.object({
  exportedAt: z.string().min(1),
  app: z.literal("Solo Leveling Study Tracker"),
  version: z.literal(1),
  player: playerSchema,
  settings: settingsSchema,
  subjects: z.array(subjectSchema).min(1),
  sessions: z.array(sessionSchema),
  quests: z.array(questSchema),
  questClaims: z.array(questClaimSchema),
  achievements: z.array(achievementSchema),
  playerAchievements: z.array(playerAchievementSchema),
});

export type BackupData = z.infer<typeof backupSchema>;
