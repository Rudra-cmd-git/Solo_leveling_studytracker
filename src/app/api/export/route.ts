import { db } from "@/lib/db";
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
import { todayKey } from "@/lib/dates";
import { getSettingsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const appSettings = await getSettingsData();
  const [player] = await db.select().from(players).execute();
  const [appSettingsRow] = await db.select().from(settings).execute();

  const backup = {
    exportedAt: new Date().toISOString(),
    app: "Solo Leveling Study Tracker",
    version: 1,
    player,
    settings: appSettingsRow,
    subjects: await db.select().from(subjects).execute(),
    sessions: await db.select().from(sessions).execute(),
    quests: await db.select().from(quests).execute(),
    questClaims: await db.select().from(questClaims).execute(),
    achievements: await db.select().from(achievements).execute(),
    playerAchievements: await db.select().from(playerAchievements).execute(),
  };

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="system-backup-${todayKey(appSettings.timezone)}.json"`,
    },
  });
}
