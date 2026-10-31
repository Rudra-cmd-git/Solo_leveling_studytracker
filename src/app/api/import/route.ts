import { revalidatePath } from "next/cache";
import type { InStatement, InValue } from "@libsql/client";
import { backupSchema } from "@/lib/backup";
import { client, ensureDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return Response.json({ ok: false, error: message }, { status });
}

function statement(sql: string, args: InValue[] = []): InStatement {
  return { sql, args };
}

export async function POST(request: Request) {
  let file: FormDataEntryValue | null;

  try {
    const formData = await request.formData();
    file = formData.get("file");
  } catch {
    return jsonError("Could not read the uploaded file.", 400);
  }

  if (!(file instanceof File)) {
    return jsonError("Choose a JSON backup file.", 400);
  }

  if (file.size > MAX_BYTES) {
    return jsonError("Backup files must be smaller than 5 MB.", 413);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    return jsonError("That file is not valid JSON.", 400);
  }

  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message
        ? `Invalid backup: ${parsed.error.issues[0].message}`
        : "Invalid backup file.",
      400,
    );
  }

  const data = parsed.data;
  const subjectIds = new Set(data.subjects.map((subject) => subject.id));
  if (data.sessions.some((session) => !subjectIds.has(session.subjectId))) {
    return jsonError("Invalid backup: a session references a missing subject.", 400);
  }

  const questIds = new Set(data.quests.map((quest) => quest.id));
  if (data.questClaims.some((claim) => !questIds.has(claim.questId))) {
    return jsonError("Invalid backup: a claim references a missing quest.", 400);
  }

  const achievementIds = new Set(
    data.achievements.map((achievement) => achievement.id),
  );
  if (
    data.playerAchievements.some(
      (entry) => !achievementIds.has(entry.achievementId),
    )
  ) {
    return jsonError(
      "Invalid backup: an achievement entry references a missing achievement.",
      400,
    );
  }

  const questById = new Map(data.quests.map((quest) => [quest.id, quest]));
  const achievementById = new Map(
    data.achievements.map((achievement) => [achievement.id, achievement]),
  );

  const sessionXp = data.sessions.reduce(
    (sum, session) => sum + session.xpEarned,
    0,
  );
  const claimXp = data.questClaims.reduce(
    (sum, claim) => sum + (questById.get(claim.questId)?.xpReward ?? 0),
    0,
  );
  const achievementXp = data.playerAchievements.reduce(
    (sum, entry) =>
      sum + (achievementById.get(entry.achievementId)?.xpReward ?? 0),
    0,
  );

  const statements: InStatement[] = [
    statement("DELETE FROM player_achievements"),
    statement("DELETE FROM quest_claims"),
    statement("DELETE FROM sessions"),
    statement("DELETE FROM subjects"),
    statement("DELETE FROM quests"),
    statement("DELETE FROM achievements"),
    statement("DELETE FROM players"),
    statement("DELETE FROM settings"),
    statement(
      "INSERT INTO players (id, name, total_xp, created_at) VALUES (?, ?, ?, ?)",
      [
        data.player.id,
        data.player.name,
        data.player.totalXp,
        data.player.createdAt,
      ],
    ),
    statement(
      `INSERT INTO settings
       (id, daily_goal_minutes, default_timer_minutes, timezone, sound_enabled, onboarded)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.settings.id,
        data.settings.dailyGoalMinutes,
        data.settings.defaultTimerMinutes,
        data.settings.timezone,
        data.settings.soundEnabled ? 1 : 0,
        data.settings.onboarded ? 1 : 0,
      ],
    ),
    ...data.subjects.map((subject) =>
      statement(
        "INSERT INTO subjects (id, name, color, created_at) VALUES (?, ?, ?, ?)",
        [subject.id, subject.name, subject.color, subject.createdAt],
      ),
    ),
    ...data.sessions.map((session) =>
      statement(
        `INSERT INTO sessions
         (id, subject_id, topic, notes, duration_minutes, focus_rating, xp_earned, studied_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.subjectId,
          session.topic,
          session.notes,
          session.durationMinutes,
          session.focusRating,
          session.xpEarned,
          session.studiedAt,
          session.createdAt,
        ],
      ),
    ),
    ...data.quests.map((quest) =>
      statement(
        `INSERT INTO quests
         (id, code, title, description, metric, period, target, xp_reward, active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quest.id,
          quest.code,
          quest.title,
          quest.description,
          quest.metric,
          quest.period,
          quest.target,
          quest.xpReward,
          quest.active ? 1 : 0,
          quest.sortOrder,
        ],
      ),
    ),
    ...data.questClaims.map((claim) =>
      statement(
        "INSERT INTO quest_claims (id, quest_id, period_key, claimed_at) VALUES (?, ?, ?, ?)",
        [claim.id, claim.questId, claim.periodKey, claim.claimedAt],
      ),
    ),
    ...data.achievements.map((achievement) =>
      statement(
        `INSERT INTO achievements
         (id, code, title, description, icon, condition, threshold, xp_reward, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          achievement.id,
          achievement.code,
          achievement.title,
          achievement.description,
          achievement.icon,
          achievement.condition,
          achievement.threshold,
          achievement.xpReward,
          achievement.sortOrder,
        ],
      ),
    ),
    ...data.playerAchievements.map((entry) =>
      statement(
        "INSERT INTO player_achievements (id, achievement_id, unlocked_at) VALUES (?, ?, ?)",
        [entry.id, entry.achievementId, entry.unlockedAt],
      ),
    ),
    statement("UPDATE players SET total_xp = ? WHERE id = ?", [
      sessionXp + claimXp + achievementXp,
      data.player.id,
    ]),
  ];

  try {
    await ensureDatabase();
    await client.batch(statements, "write");
  } catch {
    return jsonError(
      "The backup could not be restored. Your existing data was kept.",
      400,
    );
  }

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
