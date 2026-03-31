import { getDatabase } from './database';
import { ClimbingSession, AscentStyle, GradeSystem, getGradesForSystem } from '../types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export interface SessionSummary extends ClimbingSession {
  ascentCount: number;
}

export interface SessionAnalytics {
  session: SessionSummary;
  successfulAscents: number;
  uniqueRoutes: number;
  averageGradeLabel: string | null;
  averageGradeSystem: GradeSystem | null;
  styleCounts: Record<AscentStyle, number>;
}

export async function getActiveSession(): Promise<ClimbingSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM sessions WHERE active = 1 ORDER BY started_at DESC LIMIT 1');
  return row ? mapRow(row) : null;
}

export async function startSession(config?: { name?: string; notes?: string }): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  const date = now.slice(0, 10);
  const label = config?.name?.trim() || `Session ${new Date(`${date}T12:00:00`).toLocaleDateString('cs-CZ')}`;
  const notes = config?.notes?.trim() ?? '';

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE sessions
       SET active = 0, ended_at = COALESCE(ended_at, ?), updated_at = ?, synced = 0
       WHERE active = 1`,
      [now, now]
    );

    await db.runAsync(
      `INSERT INTO sessions (id, name, notes, date, started_at, ended_at, active, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, NULL, 1, ?, ?, 0)`,
      [id, label, notes, date, now, now, now]
    );
  });

  return id;
}

export async function endActiveSession(): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE sessions
     SET active = 0, ended_at = ?, updated_at = ?, synced = 0
     WHERE active = 1`,
    [now, now]
  );
}

export async function getActiveSessionSummary(): Promise<SessionSummary | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    `SELECT s.*, COUNT(a.id) as ascent_count
     FROM sessions s
     LEFT JOIN ascents a ON a.session_id = s.id
     WHERE s.active = 1
     GROUP BY s.id
     ORDER BY s.started_at DESC
     LIMIT 1`
  );
  return row ? mapSummaryRow(row) : null;
}

export async function getLatestSessionSummary(): Promise<SessionSummary | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    `SELECT s.*, COUNT(a.id) as ascent_count
     FROM sessions s
     LEFT JOIN ascents a ON a.session_id = s.id
     GROUP BY s.id
     ORDER BY s.started_at DESC
     LIMIT 1`
  );
  return row ? mapSummaryRow(row) : null;
}

export async function getSessionCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM sessions');
  return row?.count ?? 0;
}

export async function getRecentSessions(limit = 5): Promise<ClimbingSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map(mapRow);
}

export async function getSessionAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
  const db = await getDatabase();
  const summary = await db.getFirstAsync<any>(
    `SELECT s.*, COUNT(a.id) as ascent_count
     FROM sessions s
     LEFT JOIN ascents a ON a.session_id = s.id
     WHERE s.id = ?
     GROUP BY s.id`,
    [sessionId]
  );

  if (!summary) {
    return null;
  }

  const rows = await db.getAllAsync<any>(
    `SELECT a.route_id, a.style, a.success, r.grade_system, r.grade_index
     FROM ascents a
     LEFT JOIN routes r ON r.id = a.route_id
     WHERE a.session_id = ?`,
    [sessionId]
  );

  const styleCounts: Record<AscentStyle, number> = {
    onsight: 0,
    flash: 0,
    redpoint: 0,
    project: 0,
  };
  const uniqueRoutes = new Set<string>();
  let successfulAscents = 0;
  const gradesBySystem = new Map<GradeSystem, number[]>();

  rows.forEach((row) => {
    if (row.route_id) {
      uniqueRoutes.add(row.route_id);
    }
    if (row.style in styleCounts) {
      styleCounts[row.style as AscentStyle] += 1;
    }
    if (row.success === 1) {
      successfulAscents += 1;
    }
    if (
      typeof row.grade_system === 'string' &&
      typeof row.grade_index === 'number' &&
      row.grade_index >= 0
    ) {
      const system = row.grade_system as GradeSystem;
      gradesBySystem.set(system, [...(gradesBySystem.get(system) ?? []), row.grade_index]);
    }
  });

  let averageGradeSystem: GradeSystem | null = null;
  let averageGradeLabel: string | null = null;
  let bestCount = -1;

  gradesBySystem.forEach((values, system) => {
    if (values.length <= bestCount) {
      return;
    }
    bestCount = values.length;
    averageGradeSystem = system;
    const averageIndex = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    averageGradeLabel = getGradesForSystem(system)[averageIndex] ?? null;
  });

  return {
    session: mapSummaryRow(summary),
    successfulAscents,
    uniqueRoutes: uniqueRoutes.size,
    averageGradeLabel,
    averageGradeSystem,
    styleCounts,
  };
}

function mapRow(row: any): ClimbingSession {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes ?? '',
    date: row.date,
    started_at: row.started_at,
    ended_at: row.ended_at ?? null,
    active: row.active === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
    synced: row.synced === 1,
  };
}

function mapSummaryRow(row: any): SessionSummary {
  return {
    ...mapRow(row),
    ascentCount: row.ascent_count ?? 0,
  };
}
