import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().default("Hunter"),
  totalXp: integer("total_xp").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(60),
  defaultTimerMinutes: integer("default_timer_minutes").notNull().default(25),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  soundEnabled: boolean("sound_enabled").notNull().default(false),
  onboarded: boolean("onboarded").notNull().default(false),
});

export const subjects = pgTable(
  "subjects",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    color: text("color").notNull().default("#43a9ff"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("subjects_name_idx").on(table.name)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id),
    topic: text("topic").notNull(),
    notes: text("notes").notNull().default(""),
    durationMinutes: integer("duration_minutes").notNull(),
    focusRating: integer("focus_rating").notNull().default(3),
    xpEarned: integer("xp_earned").notNull().default(0),
    studiedAt: text("studied_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("sessions_studied_at_idx").on(table.studiedAt)],
);

export const quests = pgTable(
  "quests",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    metric: text("metric").notNull(),
    period: text("period").notNull(),
    target: integer("target").notNull(),
    xpReward: integer("xp_reward").notNull(),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [uniqueIndex("quests_code_idx").on(table.code)],
);

export const questClaims = pgTable(
  "quest_claims",
  {
    id: serial("id").primaryKey(),
    questId: integer("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    periodKey: text("period_key").notNull(),
    claimedAt: text("claimed_at").notNull(),
  },
  (table) => [
    uniqueIndex("quest_claims_unique_idx").on(
      table.questId,
      table.periodKey,
    ),
  ],
);

export const achievements = pgTable(
  "achievements",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    icon: text("icon").notNull().default("sparkles"),
    condition: text("condition").notNull(),
    threshold: integer("threshold").notNull(),
    xpReward: integer("xp_reward").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [uniqueIndex("achievements_code_idx").on(table.code)],
);

export const playerAchievements = pgTable(
  "player_achievements",
  {
    id: serial("id").primaryKey(),
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: text("unlocked_at").notNull(),
  },
  (table) => [
    uniqueIndex("player_achievements_unique_idx").on(
      table.achievementId,
    ),
  ],
);
