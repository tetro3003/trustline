import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

/** Opens (and if needed creates) the SQLite file: TRUSTLINE_DB_PATH, else ./data/trustline.db. */
export function openDatabase(path = process.env.TRUSTLINE_DB_PATH || join(process.cwd(), "data", "trustline.db")): Database.Database {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}
