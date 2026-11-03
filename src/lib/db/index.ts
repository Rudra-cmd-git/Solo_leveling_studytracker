import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { bootstrapDb } from "./bootstrap";
import * as schema from "./schema";

type AppDb = NodePgDatabase<typeof schema>;

const globalForDatabase = globalThis as unknown as {
  soloLevelingDb?: AppDb;
  soloLevelingInit?: Promise<void>;
  soloLevelingPool?: Pool;
};

function getConnectionString(): string | undefined {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
}

function getInstance(): AppDb {
  if (!globalForDatabase.soloLevelingDb) {
    const connectionString = getConnectionString();

    if (!connectionString) {
      throw new Error(
        "Database is not configured. Set DATABASE_URL (or POSTGRES_URL) to a Postgres connection string.",
      );
    }

    const isLocal = /(?:localhost|127\.0\.0\.1)/.test(connectionString);
    const pool = new Pool({
      connectionString,
      max: 5,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });

    globalForDatabase.soloLevelingPool = pool;
    globalForDatabase.soloLevelingDb = drizzle(pool, { schema });
  }

  return globalForDatabase.soloLevelingDb;
}

export function ensureDbReady(): Promise<void> {
  if (!globalForDatabase.soloLevelingInit) {
    globalForDatabase.soloLevelingInit = bootstrapDb(getInstance()).catch(
      (error) => {
        globalForDatabase.soloLevelingInit = undefined;
        throw error;
      },
    );
  }

  return globalForDatabase.soloLevelingInit;
}

export const db = new Proxy({} as AppDb, {
  get(_target, property) {
    const instance = getInstance();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
