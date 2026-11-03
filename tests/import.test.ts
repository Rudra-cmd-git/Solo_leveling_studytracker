import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

type Pglite = import("@electric-sql/pglite").PGlite;
type ImportRoute = typeof import("../src/app/api/import/route");

let pglite: Pglite;
let route: ImportRoute;

async function query<T>(statement: string): Promise<T[]> {
  const result = await pglite.query<T>(statement);
  return result.rows;
}

const backup = {
  exportedAt: "2026-01-01T00:00:00.000Z",
  app: "Solo Leveling Study Tracker" as const,
  version: 1 as const,
  player: {
    id: 1,
    name: "Imported Hunter",
    totalXp: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  settings: {
    id: 1,
    dailyGoalMinutes: 45,
    defaultTimerMinutes: 25,
    timezone: "UTC",
    soundEnabled: false,
    onboarded: true,
  },
  subjects: [
    {
      id: 7,
      name: "Imported Subject",
      color: "#43a9ff",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  sessions: [
    {
      id: 5,
      subjectId: 7,
      topic: "Imported session",
      notes: "",
      durationMinutes: 50,
      focusRating: 4,
      xpEarned: 100,
      studiedAt: "2026-01-01",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  quests: [
    {
      id: 3,
      code: "imported_quest",
      title: "Imported quest",
      description: "A quest from the backup.",
      metric: "minutes",
      period: "daily",
      target: 10,
      xpReward: 20,
      active: true,
      sortOrder: 1,
    },
  ],
  questClaims: [],
  achievements: [
    {
      id: 9,
      code: "imported_achievement",
      title: "Imported achievement",
      description: "Unlocked from the backup.",
      icon: "sparkles",
      condition: "sessions",
      threshold: 1,
      xpReward: 50,
      sortOrder: 1,
    },
  ],
  playerAchievements: [],
};

function makeRequest(payload: unknown): Request {
  const form = new FormData();
  form.set(
    "file",
    new File([JSON.stringify(payload)], "backup.json", {
      type: "application/json",
    }),
  );
  return new Request("http://localhost/api/import", {
    method: "POST",
    body: form,
  });
}

beforeAll(async () => {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const schema = await import("../src/lib/db/schema");
  const { bootstrapDb } = await import("../src/lib/db/bootstrap");

  pglite = new PGlite();
  const testDb = drizzle(pglite, { schema });
  await bootstrapDb(testDb);

  vi.doMock("@/lib/db", () => ({
    db: testDb,
    ensureDbReady: async () => {},
  }));

  route = await import("../src/app/api/import/route");
});

afterAll(async () => {
  await pglite?.close();
});

describe("import route", () => {
  it("rejects an invalid backup file without touching data", async () => {
    const response = await route.POST(makeRequest({ app: "Other", version: 1 }));
    expect(response.status).toBe(400);
  });

  it("restores a valid backup and recomputes XP", async () => {
    const response = await route.POST(makeRequest(backup));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const [player] = await query<{ name: string; total_xp: number }>(
      "SELECT name, total_xp FROM players WHERE id = 1",
    );
    expect(player.name).toBe("Imported Hunter");
    expect(Number(player.total_xp)).toBe(100);

    const [sessions] = await query<{ count: number | string }>(
      "SELECT COUNT(*) AS count FROM sessions",
    );
    const [subjects] = await query<{ count: number | string }>(
      "SELECT COUNT(*) AS count FROM subjects",
    );
    expect(Number(sessions.count)).toBe(1);
    expect(Number(subjects.count)).toBe(1);
  });

  it("resets serial sequences so new rows do not collide", async () => {
    const [subject] = await query<{ id: number }>(
      "INSERT INTO subjects (name, color, created_at) VALUES ('After import', '#3dd6a3', '2026-01-02T00:00:00.000Z') RETURNING id",
    );
    expect(Number(subject.id)).toBeGreaterThan(7);
  });
});
