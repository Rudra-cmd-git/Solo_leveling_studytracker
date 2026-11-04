import { db, ensureDatabase } from "@/lib/db";
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
} from "@/lib/db/schema";
import { todayKey } from "@/lib/dates";
import { getSettingsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDatabase();

  const appSettings = await getSettingsData();
  const backup = {
    exportedAt: new Date().toISOString(),
    app: "Solo Leveling Study Tracker",
    version: 1,
    player: (await db.select().from(players))[0],
    settings: (await db.select().from(settings))[0],
    subjects: await db.select().from(subjects),
    sessions: await db.select().from(sessions),
    quests: await db.select().from(quests),
    questClaims: await db.select().from(questClaims),
    achievements: await db.select().from(achievements),
    playerAchievements: await db.select().from(playerAchievements),
    streakFreezes: await db.select().from(streakFreezes),
  };

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="system-backup-${todayKey(appSettings.timezone)}.json"`,
    },
  });
}
