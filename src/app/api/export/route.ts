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

export function GET() {
  const appSettings = getSettingsData();
  const backup = {
    exportedAt: new Date().toISOString(),
    app: "Solo Leveling Study Tracker",
    version: 1,
    player: db.select().from(players).get(),
    settings: db.select().from(settings).get(),
    subjects: db.select().from(subjects).all(),
    sessions: db.select().from(sessions).all(),
    quests: db.select().from(quests).all(),
    questClaims: db.select().from(questClaims).all(),
    achievements: db.select().from(achievements).all(),
    playerAchievements: db.select().from(playerAchievements).all(),
  };

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="system-backup-${todayKey(appSettings.timezone)}.json"`,
    },
  });
}
