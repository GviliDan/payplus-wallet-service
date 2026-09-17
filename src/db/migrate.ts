import fs from "fs";
import path from "path";
import { pool, withTransaction } from "../config/database";
import { logger } from "../utils/logger";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function isApplied(name: string): Promise<boolean> {
  const result = await pool.query("SELECT 1 FROM schema_migrations WHERE name = $1", [name]);
  return (result.rowCount ?? 0) > 0;
}

// Runs the migration file and records it as applied in a single transaction: if the schema
// changes fail, the tracking row never commits either, so a retry sees it as still pending.
async function applyMigration(name: string): Promise<void> {
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf-8");
  await withTransaction(async (client) => {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
  });
}

async function migrate(): Promise<void> {
  await ensureMigrationsTable();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (await isApplied(file)) {
      logger.info("migration already applied, skipping", { migration: file });
      continue;
    }
    await applyMigration(file);
    logger.info("migration applied", { migration: file });
  }

  await pool.end();
}

migrate().catch((err) => {
  logger.error("migration failed", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
