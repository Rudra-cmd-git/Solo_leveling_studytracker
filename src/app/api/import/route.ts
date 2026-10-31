import { revalidatePath } from "next/cache";
import { backupSchema } from "@/lib/backup";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return Response.json({ ok: false, error: message }, { status });
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

  try {
    sqlite.transaction(() => {
      sqlite.exec(`
        DELETE FROM player_achievements;
        DELETE FROM quest_claims;
        DELETE FROM sessions;
        DELETE FROM subjects;
        DELETE FROM quests;
        DELETE FROM achievements;
        DELETE FROM players;
        DELETE FROM settings;
      `);

      const insertPlayer = sqlite.prepare(
        "INSERT INTO players (id, name, total_xp, created_at) VALUES (?, ?, ?, ?)",
      );
      insertPlayer.run(
        data.player.id,
        data.player.name,
        data.player.totalXp,
        data.player.createdAt,
      );

      const insertSettings = sqlite.prepare(
        `INSERT INTO settings
         (id, daily_goal_minutes, default_timer_minutes, timezone, sound_enabled, onboarded)
         VALUES (?, ?, ?, ?, ?, ?)`,
      );
      insertSettings.run(
        data.settings.id,
        data.settings.dailyGoalMinutes,
        data.settings.defaultTimerMinutes,
        data.settings.timezone,
        data.settings.soundEnabled ? 1 : 0,
        data.settings.onboarded ? 1 : 0,
      );

      const insertSubject = sqlite.prepare(
        "INSERT INTO subjects (id, name, color, created_at) VALUES (?, ?, ?, ?)",
      );
      for (const subject of data.subjects) {
        insertSubject.run(
          subject.id,
          subject.name,
          subject.color,
          subject.createdAt,
        );
      }

      const insertSession = sqlite.prepare(
        `INSERT INTO sessions
         (id, subject_id, topic, notes, duration_minutes, focus_rating, xp_earned, studied_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const session of data.sessions) {
        insertSession.run(
          session.id,
          session.subjectId,
          session.topic,
          session.notes,
          session.durationMinutes,
          session.focusRating,
          session.xpEarned,
          session.studiedAt,
          session.createdAt,
        );
      }

      const insertQuest = sqlite.prepare(
        `INSERT INTO quests
         (id, code, title, description, metric, period, target, xp_reward, active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const quest of data.quests) {
        insertQuest.run(
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
        );
      }

      const insertClaim = sqlite.prepare(
        "INSERT INTO quest_claims (id, quest_id, period_key, claimed_at) VALUES (?, ?, ?, ?)",
      );
      for (const claim of data.questClaims) {
        insertClaim.run(
          claim.id,
          claim.questId,
          claim.periodKey,
          claim.claimedAt,
        );
      }

      const insertAchievement = sqlite.prepare(
        `INSERT INTO achievements
         (id, code, title, description, icon, condition, threshold, xp_reward, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const achievement of data.achievements) {
        insertAchievement.run(
          achievement.id,
          achievement.code,
          achievement.title,
          achievement.description,
          achievement.icon,
          achievement.condition,
          achievement.threshold,
          achievement.xpReward,
          achievement.sortOrder,
        );
      }

      const insertPlayerAchievement = sqlite.prepare(
        "INSERT INTO player_achievements (id, achievement_id, unlocked_at) VALUES (?, ?, ?)",
      );
      for (const entry of data.playerAchievements) {
        insertPlayerAchievement.run(
          entry.id,
          entry.achievementId,
          entry.unlockedAt,
        );
      }

      const sessionXp =
        (
          sqlite
            .prepare("SELECT COALESCE(SUM(xp_earned), 0) AS value FROM sessions")
            .get() as { value: number }
        ).value ?? 0;
      const claimXp =
        (
          sqlite
            .prepare(
              `SELECT COALESCE(SUM(q.xp_reward), 0) AS value
               FROM quest_claims c JOIN quests q ON q.id = c.quest_id`,
            )
            .get() as { value: number }
        ).value ?? 0;
      const achievementXp =
        (
          sqlite
            .prepare(
              `SELECT COALESCE(SUM(a.xp_reward), 0) AS value
               FROM player_achievements p
               JOIN achievements a ON a.id = p.achievement_id`,
            )
            .get() as { value: number }
        ).value ?? 0;

      sqlite
        .prepare("UPDATE players SET total_xp = ? WHERE id = ?")
        .run(sessionXp + claimXp + achievementXp, data.player.id);
    })();
  } catch {
    return jsonError(
      "The backup could not be restored. Your existing data was kept.",
      400,
    );
  }

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
