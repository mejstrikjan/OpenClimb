import * as SQLite from 'expo-sqlite';

const DB_NAME = 'climbing.db';
const SCHEMA_VERSION = 2;

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

    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS crags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      area_id TEXT,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sectors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      crag_id TEXT,
      area_id TEXT,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (crag_id) REFERENCES crags(id) ON DELETE SET NULL,
      FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade TEXT NOT NULL DEFAULT '',
      grade_system TEXT NOT NULL DEFAULT 'French',
      grade_index INTEGER NOT NULL DEFAULT -1,
      type TEXT NOT NULL DEFAULT 'sport',
      description TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL DEFAULT 0,
      latitude REAL,
      longitude REAL,
      area_id TEXT,
      crag_id TEXT,
      sector_id TEXT,
      photo_uri TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
      FOREIGN KEY (crag_id) REFERENCES crags(id) ON DELETE SET NULL,
      FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ascents (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      date TEXT NOT NULL,
      style TEXT NOT NULL DEFAULT 'redpoint',
      success INTEGER NOT NULL DEFAULT 1,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}
