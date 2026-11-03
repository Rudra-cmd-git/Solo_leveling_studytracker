import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { backupSchema } from "@/lib/backup";
import { db, ensureDbReady } from "@/lib/db";
import {
  achievements,
  playerAchievements,
  players,
  questClaims,
  quests,
  sessions,
  settings,
  subjects,
} from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

const SERIAL_TABLES = [
  "subjects",
  "sessions",
  "quests",
  "quest_claims",
  "achievements",
  "player_achievements",
];

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

  await ensureDbReady();

  try {
    await db.transaction(async (tx) => {
      await tx.delete(playerAchievements).execute();
      await tx.delete(questClaims).execute();
      await tx.delete(sessions).execute();
      await tx.delete(subjects).execute();
      await tx.delete(quests).execute();
      await tx.delete(achievements).execute();
      await tx.delete(players).execute();
      await tx.delete(settings).execute();

      await tx.insert(players).values({
        id: data.player.id,
        name: data.player.name,
        totalXp: data.player.totalXp,
        createdAt: data.player.createdAt,
      }).execute();

      await tx.insert(settings).values({
        id: data.settings.id,
        dailyGoalMinutes: data.settings.dailyGoalMinutes,
        defaultTimerMinutes: data.settings.defaultTimerMinutes,
        timezone: data.settings.timezone,
        soundEnabled: data.settings.soundEnabled,
        onboarded: data.settings.onboarded,
      }).execute();

      await tx.insert(subjects).values(
        data.subjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
          color: subject.color,
          createdAt: subject.createdAt,
        })),
      ).execute();

      if (data.sessions.length > 0) {
        await tx.insert(sessions).values(
          data.sessions.map((session) => ({
            id: session.id,
            subjectId: session.subjectId,
            topic: session.topic,
            notes: session.notes,
            durationMinutes: session.durationMinutes,
            focusRating: session.focusRating,
            xpEarned: session.xpEarned,
            studiedAt: session.studiedAt,
            createdAt: session.createdAt,
          })),
        ).execute();
      }

      if (data.quests.length > 0) {
        await tx.insert(quests).values(
          data.quests.map((quest) => ({
            id: quest.id,
            code: quest.code,
            title: quest.title,
            description: quest.description,
            metric: quest.metric,
            period: quest.period,
            target: quest.target,
            xpReward: quest.xpReward,
            active: quest.active,
            sortOrder: quest.sortOrder,
          })),
        ).execute();
      }

      if (data.questClaims.length > 0) {
        await tx.insert(questClaims).values(
          data.questClaims.map((claim) => ({
            id: claim.id,
            questId: claim.questId,
            periodKey: claim.periodKey,
            claimedAt: claim.claimedAt,
          })),
        ).execute();
      }

      if (data.achievements.length > 0) {
        await tx.insert(achievements).values(
          data.achievements.map((achievement) => ({
            id: achievement.id,
            code: achievement.code,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            condition: achievement.condition,
            threshold: achievement.threshold,
            xpReward: achievement.xpReward,
            sortOrder: achievement.sortOrder,
          })),
        ).execute();
      }

      if (data.playerAchievements.length > 0) {
        await tx.insert(playerAchievements).values(
          data.playerAchievements.map((entry) => ({
            id: entry.id,
            achievementId: entry.achievementId,
            unlockedAt: entry.unlockedAt,
          })),
        ).execute();
      }

      for (const table of SERIAL_TABLES) {
        await tx.execute(
          sql.raw(
            `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 1)) FROM ${table}`,
          ),
        );
      }

      const [sessionRow] = await tx
        .select({
          value: sql<number>`coalesce(sum(${sessions.xpEarned}), 0)`,
        })
        .from(sessions)
        .execute();
      const [claimRow] = await tx
        .select({
          value: sql<number>`coalesce(sum(${quests.xpReward}), 0)`,
        })
        .from(questClaims)
        .innerJoin(quests, eq(questClaims.questId, quests.id))
        .execute();
      const [achievementRow] = await tx
        .select({
          value: sql<number>`coalesce(sum(${achievements.xpReward}), 0)`,
        })
        .from(playerAchievements)
        .innerJoin(
          achievements,
          eq(playerAchievements.achievementId, achievements.id),
        )
        .execute();

      const totalXp =
        Number(sessionRow?.value ?? 0) +
        Number(claimRow?.value ?? 0) +
        Number(achievementRow?.value ?? 0);

      await tx
        .update(players)
        .set({ totalXp })
        .where(eq(players.id, data.player.id))
        .execute();
    });
  } catch {
    return jsonError(
      "The backup could not be restored. Your existing data was kept.",
      400,
    );
  }

  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
