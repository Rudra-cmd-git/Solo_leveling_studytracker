import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

const DEFAULT_SUBJECTS = [
  { name: "Mathematics", color: "#43a9ff" },
  { name: "Science", color: "#3dd6a3" },
  { name: "English", color: "#8c7dff" },
  { name: "Coding", color: "#ffb84d" },
];

interface DefaultQuest {
  code: string;
  title: string;
  description: string;
  metric: string;
  period: string;
  target: number;
  xpReward: number;
  sortOrder: number;
  subjectName?: string;
}

const DEFAULT_QUESTS: DefaultQuest[] = [
  {
    code: "daily_minutes_60",
    title: "Preparation",
    description: "Study for at least 60 minutes.",
    metric: "minutes",
    period: "daily",
    target: 60,
    xpReward: 60,
    sortOrder: 1,
  },
  {
    code: "daily_sessions_2",
    title: "Double Dungeon",
    description: "Complete 2 focus sessions.",
    metric: "sessions",
    period: "daily",
    target: 2,
    xpReward: 40,
    sortOrder: 2,
  },
  {
    code: "daily_reflection_1",
    title: "Record the Hunt",
    description: "Log a session with reflection notes.",
    metric: "reflections",
    period: "daily",
    target: 1,
    xpReward: 30,
    sortOrder: 3,
  },
  {
    code: "weekly_days_5",
    title: "Five Gates",
    description: "Study on 5 different days this week.",
    metric: "days",
    period: "weekly",
    target: 5,
    xpReward: 150,
    sortOrder: 1,
  },
  {
    code: "weekly_minutes_300",
    title: "Deep Training",
    description: "Study for at least 300 minutes this week.",
    metric: "minutes",
    period: "weekly",
    target: 300,
    xpReward: 200,
    sortOrder: 2,
  },
  {
    code: "daily_math_minutes_30",
    title: "Mathematical Discipline",
    description: "Study Mathematics for at least 30 minutes today.",
    metric: "minutes",
    period: "daily",
    target: 30,
    xpReward: 40,
    sortOrder: 4,
    subjectName: "Mathematics",
  },
  {
    code: "weekly_science_sessions_3",
    title: "Scientific Inquiry",
    description: "Complete 3 Science sessions this week.",
    metric: "sessions",
    period: "weekly",
    target: 3,
    xpReward: 120,
    sortOrder: 3,
    subjectName: "Science",
  },
];

const DEFAULT_ACHIEVEMENTS = [
  {
    code: "first_awakening",
    title: "First Awakening",
    description: "Complete your first focus session.",
    icon: "sparkles",
    condition: "sessions",
    threshold: 1,
    xpReward: 50,
    sortOrder: 1,
  },
  {
    code: "first_hour",
    title: "One Hour Hunter",
    description: "Record 60 total minutes of study.",
    icon: "clock",
    condition: "total_minutes",
    threshold: 60,
    xpReward: 75,
    sortOrder: 2,
  },
  {
    code: "ten_hours",
    title: "Ten Hour Trial",
    description: "Record 10 total hours of study.",
    icon: "timer",
    condition: "total_minutes",
    threshold: 600,
    xpReward: 150,
    sortOrder: 3,
  },
  {
    code: "fifty_hours",
    title: "Fifty Hour Ascension",
    description: "Record 50 total hours of study.",
    icon: "layers",
    condition: "total_minutes",
    threshold: 3000,
    xpReward: 500,
    sortOrder: 4,
  },
  {
    code: "streak_3",
    title: "Three Day Chain",
    description: "Maintain a 3-day study streak.",
    icon: "flame",
    condition: "best_streak",
    threshold: 3,
    xpReward: 100,
    sortOrder: 5,
  },
  {
    code: "streak_7",
    title: "Seven Day Chain",
    description: "Maintain a 7-day study streak.",
    icon: "flame",
    condition: "best_streak",
    threshold: 7,
    xpReward: 200,
    sortOrder: 6,
  },
  {
    code: "streak_30",
    title: "Thirty Day Chain",
    description: "Maintain a 30-day study streak.",
    icon: "crown",
    condition: "best_streak",
    threshold: 30,
    xpReward: 750,
    sortOrder: 7,
  },
  {
    code: "deep_work",
    title: "Deep Work",
    description: "Complete a single session of 90 minutes or more.",
    icon: "target",
    condition: "longest_session",
    threshold: 90,
    xpReward: 100,
    sortOrder: 8,
  },
  {
    code: "path_explorer",
    title: "Path Explorer",
    description: "Study 3 different subjects.",
    icon: "compass",
    condition: "subjects_used",
    threshold: 3,
    xpReward: 100,
    sortOrder: 9,
  },
  {
    code: "quest_master",
    title: "Quest Master",
    description: "Claim 10 quest rewards.",
    icon: "trophy",
    condition: "quests_claimed",
    threshold: 10,
    xpReward: 150,
    sortOrder: 10,
  },
  {
    code: "rank_d",
    title: "D-Rank Awakening",
    description: "Reach level 10.",
    icon: "medal",
    condition: "level",
    threshold: 10,
    xpReward: 100,
    sortOrder: 11,
  },
  {
    code: "rank_b",
    title: "B-Rank Ascension",
    description: "Reach level 30.",
    icon: "swords",
    condition: "level",
    threshold: 30,
    xpReward: 300,
    sortOrder: 12,
  },
  {
    code: "rank_s",
    title: "S-Rank Sovereign",
    description: "Reach level 50.",
    icon: "crown",
    condition: "level",
    threshold: 50,
    xpReward: 1000,
    sortOrder: 13,
  },
];

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    supabase_user_id TEXT UNIQUE,
    email TEXT,
    avatar_url TEXT,
    name TEXT NOT NULL DEFAULT 'Hunter',
    total_xp INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES players(id),
    daily_goal_minutes INTEGER NOT NULL DEFAULT 60,
    default_timer_minutes INTEGER NOT NULL DEFAULT 25,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    sound_enabled INTEGER NOT NULL DEFAULT 1,
    xp_bonuses_enabled INTEGER NOT NULL DEFAULT 0,
    notifications_enabled INTEGER NOT NULL DEFAULT 0,
    reminder_time TEXT NOT NULL DEFAULT '18:00',
    onboarded INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS settings_user_idx ON settings (user_id)`,
  `CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES players(id),
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#43a9ff',
    created_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS subjects_user_name_idx ON subjects (user_id, name)`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES players(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    topic TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    duration_minutes INTEGER NOT NULL,
    focus_rating INTEGER NOT NULL DEFAULT 3,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    studied_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_user_studied_idx ON sessions (user_id, studied_at)`,
  `CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metric TEXT NOT NULL,
    period TEXT NOT NULL,
    target INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL,
    subject_id INTEGER REFERENCES subjects(id),
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS quests_code_idx ON quests (code)",
  `CREATE TABLE IF NOT EXISTS quest_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES players(id),
    quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    period_key TEXT NOT NULL,
    claimed_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS quest_claims_user_quest_period_idx
    ON quest_claims (user_id, quest_id, period_key)`,
  `CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'sparkles',
    condition TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS achievements_code_idx ON achievements (code)",
  `CREATE TABLE IF NOT EXISTS player_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES players(id),
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS player_achievements_user_achievement_idx
    ON player_achievements (user_id, achievement_id)`,
  `CREATE TABLE IF NOT EXISTS streak_freezes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES players(id),
    date_key TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS streak_freezes_user_date_idx ON streak_freezes (user_id, date_key)`,
];

const MIGRATION_STATEMENTS = [
  // Existing migrations
  "ALTER TABLE settings ADD COLUMN xp_bonuses_enabled INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE settings ADD COLUMN notifications_enabled INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE settings ADD COLUMN reminder_time TEXT NOT NULL DEFAULT '18:00'",
  "ALTER TABLE quests ADD COLUMN subject_id INTEGER REFERENCES subjects(id)",
  // New multi-user migrations
  "ALTER TABLE players ADD COLUMN supabase_user_id TEXT UNIQUE",
  "ALTER TABLE players ADD COLUMN email TEXT",
  "ALTER TABLE players ADD COLUMN avatar_url TEXT",
  "ALTER TABLE settings ADD COLUMN user_id INTEGER REFERENCES players(id)",
  "ALTER TABLE subjects ADD COLUMN user_id INTEGER REFERENCES players(id)",
  "ALTER TABLE sessions ADD COLUMN user_id INTEGER REFERENCES players(id)",
  "ALTER TABLE quest_claims ADD COLUMN user_id INTEGER REFERENCES players(id)",
  "ALTER TABLE player_achievements ADD COLUMN user_id INTEGER REFERENCES players(id)",
  "ALTER TABLE streak_freezes ADD COLUMN user_id INTEGER REFERENCES players(id)",
];

async function runMigrations(client: Client): Promise<void> {
  for (const statement of MIGRATION_STATEMENTS) {
    try {
      await client.execute(statement);
    } catch {
      // Column already exists (fresh database or previous migration).
    }
  }
}

function resolveDatabaseUrl(): string {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }

  const databasePath =
    process.env.DATABASE_PATH ??
    path.join(process.cwd(), "data", "study-tracker.db");

  if (databasePath === ":memory:") {
    return ":memory:";
  }

  return `file:${databasePath}`;
}

function ensureLocalDirectory(url: string): void {
  if (!url.startsWith("file:")) return;

  const filePath = url.slice("file:".length);
  if (!filePath || filePath === ":memory:") return;

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } catch {
    // Read-only filesystem (e.g. Vercel) — proceed and let the client fail
    // at query time if a real connection cannot be made.
  }
}

function createDatabaseClient(): Client {
  const url = resolveDatabaseUrl();
  ensureLocalDirectory(url);

  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

async function initializeSchema(client: Client): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }

  await runMigrations(client);

  const now = new Date().toISOString();

  // Only seed global templates (quests and achievements)
  // Users, settings, subjects are created per-user on signup via ensurePlayer()
  const seedStatements = [
    ...DEFAULT_QUESTS.map((quest) => ({
      sql: `INSERT OR IGNORE INTO quests
        (code, title, description, metric, period, target, xp_reward, active, sort_order, subject_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ${
          quest.subjectName ? "(SELECT id FROM subjects WHERE name = ?)" : "NULL"
        })`,
      args: [
        quest.code,
        quest.title,
        quest.description,
        quest.metric,
        quest.period,
        quest.target,
        quest.xpReward,
        quest.sortOrder,
        ...(quest.subjectName ? [quest.subjectName] : []),
      ],
    })),
    ...DEFAULT_ACHIEVEMENTS.map((achievement) => ({
      sql: `INSERT OR IGNORE INTO achievements
        (code, title, description, icon, condition, threshold, xp_reward, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        achievement.code,
        achievement.title,
        achievement.description,
        achievement.icon,
        achievement.condition,
        achievement.threshold,
        achievement.xpReward,
        achievement.sortOrder,
      ],
    })),
  ];

  await client.batch(seedStatements, "write");
}

interface DatabaseState {
  client: Client;
  db: LibSQLDatabase<typeof schema>;
  ready: Promise<void>;
}

const globalForDatabase = globalThis as unknown as {
  soloLevelingDatabase?: DatabaseState;
};

function getDatabaseState(): DatabaseState {
  if (!globalForDatabase.soloLevelingDatabase) {
    const client = createDatabaseClient();
    globalForDatabase.soloLevelingDatabase = {
      client,
      db: drizzle(client, { schema }),
      ready: initializeSchema(client),
    };
    globalForDatabase.soloLevelingDatabase.ready.catch(() => {
      globalForDatabase.soloLevelingDatabase = undefined;
    });
  }

  return globalForDatabase.soloLevelingDatabase;
}

const state = getDatabaseState();

export const client = state.client;
export const db = state.db;

export function ensureDatabase(): Promise<void> {
  return getDatabaseState().ready;
}
