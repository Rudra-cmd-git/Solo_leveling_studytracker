import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: integer("id").primaryKey(),
  supabaseUserId: text("supabase_user_id").unique(),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  name: text("name").notNull().default("Hunter"),
  totalXp: integer("total_xp").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable(
  "settings",
  {
    id: integer("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => players.id),
    dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(60),
    defaultTimerMinutes: integer("default_timer_minutes").notNull().default(25),
    timezone: text("timezone").notNull().default("Asia/Kolkata"),
    soundEnabled: integer("sound_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    xpBonusesEnabled: integer("xp_bonuses_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    notificationsEnabled: integer("notifications_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    reminderTime: text("reminder_time").notNull().default("18:00"),
    onboarded: integer("onboarded", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => [uniqueIndex("settings_user_idx").on(table.userId)],
);

export const subjects = sqliteTable(
  "subjects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => players.id),
    name: text("name").notNull(),
    color: text("color").notNull().default("#43a9ff"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("subjects_user_name_idx").on(table.userId, table.name),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => players.id),
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
  (table) => [
    uniqueIndex("sessions_user_studied_idx").on(table.userId, table.studiedAt),
  ],
);

export const quests = sqliteTable(
  "quests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    metric: text("metric").notNull(),
    period: text("period").notNull(),
    target: integer("target").notNull(),
    xpReward: integer("xp_reward").notNull(),
    subjectId: integer("subject_id").references(() => subjects.id),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [uniqueIndex("quests_code_idx").on(table.code)],
);

export const streakFreezes = sqliteTable(
  "streak_freezes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => players.id),
    dateKey: text("date_key").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("streak_freezes_user_date_idx").on(table.userId, table.dateKey)],
);

export const questClaims = sqliteTable(
  "quest_claims",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => players.id),
    questId: integer("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    periodKey: text("period_key").notNull(),
    claimedAt: text("claimed_at").notNull(),
  },
  (table) => [
    uniqueIndex("quest_claims_user_quest_period_idx").on(
      table.userId,
      table.questId,
      table.periodKey,
    ),
  ],
);

export const achievements = sqliteTable(
  "achievements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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

export const playerAchievements = sqliteTable(
  "player_achievements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => players.id),
    achievementId: integer("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: text("unlocked_at").notNull(),
  },
  (table) => [
    uniqueIndex("player_achievements_user_achievement_idx").on(
      table.userId,
      table.achievementId,
    ),
  ],
);