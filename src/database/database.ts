import * as SQLite from 'expo-sqlite';

const DB_NAME = 'climbing.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await initDatabase(db);
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS sectors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      area TEXT NOT NULL DEFAULT '',
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade TEXT NOT NULL DEFAULT '',
      grade_system TEXT NOT NULL DEFAULT 'French',
      type TEXT NOT NULL DEFAULT 'sport',
      description TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL DEFAULT 0,
      latitude REAL,
      longitude REAL,
      sector_id TEXT,
      photo_uri TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (sector_id) REFERENCES sectors(id)
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}
