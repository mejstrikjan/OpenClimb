import { getDatabase } from './database';
import { Ascent, AscentCategory } from '../types';
import { getActiveSession } from './sessionRepository';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getAllAscents(): Promise<Ascent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM ascents ORDER BY date DESC, created_at DESC');
  return rows.map(mapRow);
}

export async function getAscentsByRoute(routeId: string): Promise<Ascent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM ascents WHERE route_id = ? ORDER BY date DESC',
    [routeId]
  );
  return rows.map(mapRow);
}

export async function getAscentById(id: string): Promise<Ascent | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM ascents WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function insertAscent(ascent: {
  route_id: string;
  date: string;
  style: string;
  category: AscentCategory;
  session_id?: string | null;
  success: boolean;
  notes: string;
}): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  const activeSession = ascent.session_id === undefined ? await getActiveSession() : null;
  const sessionId = ascent.session_id === undefined ? activeSession?.id ?? null : ascent.session_id;
  await db.runAsync(
    `INSERT INTO ascents (id, route_id, session_id, date, style, category, success, notes, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, ascent.route_id, sessionId, ascent.date, ascent.style, ascent.category, ascent.success ? 1 : 0, ascent.notes, now, now]
  );
  return id;
}

export async function updateAscent(id: string, ascent: {
  date?: string;
  style?: string;
  category?: AscentCategory;
  session_id?: string | null;
  success?: boolean;
  notes?: string;
}): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const fields: string[] = ['updated_at = ?', 'synced = 0'];
  const values: any[] = [now];

  if (ascent.date !== undefined) { fields.push('date = ?'); values.push(ascent.date); }
  if (ascent.style !== undefined) { fields.push('style = ?'); values.push(ascent.style); }
  if (ascent.category !== undefined) { fields.push('category = ?'); values.push(ascent.category); }
  if (ascent.session_id !== undefined) { fields.push('session_id = ?'); values.push(ascent.session_id); }
  if (ascent.success !== undefined) { fields.push('success = ?'); values.push(ascent.success ? 1 : 0); }
  if (ascent.notes !== undefined) { fields.push('notes = ?'); values.push(ascent.notes); }

  values.push(id);
  await db.runAsync(`UPDATE ascents SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteAscent(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM ascents WHERE id = ?', [id]);
}

export async function getAscentCountForRoute(routeId: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT COUNT(*) as count FROM ascents WHERE route_id = ?',
    [routeId]
  );
  return row?.count ?? 0;
}

function mapRow(row: any): Ascent {
  return {
    id: row.id,
    route_id: row.route_id,
    session_id: row.session_id ?? null,
    date: row.date,
    style: row.style,
    category: row.category ?? '',
    success: row.success === 1,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    synced: row.synced === 1,
  };
}
