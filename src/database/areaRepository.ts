import { getDatabase } from './database';
import { Area } from '../types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getAllAreas(): Promise<Area[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM areas ORDER BY name ASC');
  return rows.map(mapRow);
}

export async function getAreaById(id: string): Promise<Area | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM areas WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function insertArea(area: { name: string; latitude?: number | null; longitude?: number | null }): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO areas (id, name, latitude, longitude, created_at, synced) VALUES (?, ?, ?, ?, ?, 0)',
    [id, area.name, area.latitude ?? null, area.longitude ?? null, now]
  );
  return id;
}

export async function deleteArea(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM areas WHERE id = ?', [id]);
}

function mapRow(row: any): Area {
  return {
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    created_at: row.created_at,
    synced: row.synced === 1,
  };
}
