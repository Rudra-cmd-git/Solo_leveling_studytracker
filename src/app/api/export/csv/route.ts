import { db, ensureDatabase } from "@/lib/db";
import { sessions, subjects } from "@/lib/db/schema";
import { todayKey } from "@/lib/dates";
import { getSettingsData } from "@/lib/data";

export const dynamic = "force-dynamic";

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (str.indexOf(",") >= 0 || str.indexOf('"') >= 0 || str.indexOf("\n") >= 0) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export async function GET() {
  await ensureDatabase();

  const appSettings = await getSettingsData();
  const today = todayKey(appSettings.timezone);

  const sessionRows = await db
    .select({
      id: sessions.id,
      subjectId: sessions.subjectId,
      topic: sessions.topic,
      notes: sessions.notes,
      durationMinutes: sessions.durationMinutes,
      focusRating: sessions.focusRating,
      xpEarned: sessions.xpEarned,
      studiedAt: sessions.studiedAt,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .orderBy(sessions.studiedAt, sessions.id);

  const subjectRows = await db.select().from(subjects);
  const subjectMap = new Map(subjectRows.map((s) => [s.id, s.name]));

  const headers = ["id","subject","topic","notes","duration_minutes","focus_rating","xp_earned","studied_at","created_at"];

  const rows = sessionRows.map((session) => [
    escapeCsv(String(session.id)),
    escapeCsv(subjectMap.get(session.subjectId) ?? ""),
    escapeCsv(session.topic),
    escapeCsv(session.notes),
    escapeCsv(String(session.durationMinutes)),
    escapeCsv(String(session.focusRating)),
    escapeCsv(String(session.xpEarned)),
    escapeCsv(session.studiedAt),
    escapeCsv(session.createdAt),
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="study-sessions-${today}.csv"`,
    },
  });
}
