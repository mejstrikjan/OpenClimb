import * as SQLite from 'expo-sqlite';

const DB_NAME = 'climbing.db';
const SCHEMA_VERSION = 8;

let db: SQLite.SQLiteDatabase | null = null;
let dbInitialization: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  if (!dbInitialization) {
    dbInitialization = initializeDatabase();
  }

  try {
    return await dbInitialization;
  } catch (error) {
    dbInitialization = null;
    db = null;
    throw error;
  }
}

async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync(DB_NAME);
  await initDatabase(database);
  db = database;
  return database;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      preview_uri TEXT,
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
      rock_type TEXT NOT NULL DEFAULT '',
      indoor_color TEXT NOT NULL DEFAULT '',
      route_date TEXT NOT NULL DEFAULT '',
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
      session_id TEXT,
      date TEXT NOT NULL,
      style TEXT NOT NULL DEFAULT 'redpoint',
      category TEXT NOT NULL DEFAULT '',
      success INTEGER NOT NULL DEFAULT 1,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await ensureSchemaVersion(database);
}

async function ensureSchemaVersion(database: SQLite.SQLiteDatabase): Promise<void> {
  const userVersionRow = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = userVersionRow?.user_version ?? 0;

  if (currentVersion < 3) {
    await ensureColumn(database, 'areas', 'preview_uri', 'TEXT');
  }

  if (currentVersion < 4) {
    await ensureColumn(database, 'ascents', 'category', "TEXT NOT NULL DEFAULT ''");
  }

  if (currentVersion < 5) {
    await ensureColumn(database, 'routes', 'route_date', "TEXT NOT NULL DEFAULT ''");
    await database.execAsync(`UPDATE routes SET route_date = substr(created_at, 1, 10) WHERE route_date = '';`);
  }

  if (currentVersion < 6) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0
      );
    `);
    await ensureColumn(database, 'ascents', 'session_id', 'TEXT');
  }

  if (currentVersion < 7) {
    await ensureColumn(database, 'sessions', 'notes', "TEXT NOT NULL DEFAULT ''");
  }

  if (currentVersion < 8) {
    await ensureColumn(database, 'routes', 'rock_type', "TEXT NOT NULL DEFAULT ''");
    await ensureColumn(database, 'routes', 'indoor_color', "TEXT NOT NULL DEFAULT ''");
  }

  await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}

async function ensureColumn(
  database: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  definition: string
): Promise<void> {
  const columns = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  const columnExists = columns.some((column) => column.name === columnName);
  if (!columnExists) {
    await database.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
  }
}
