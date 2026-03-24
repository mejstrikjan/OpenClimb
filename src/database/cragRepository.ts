import { getDatabase } from './database';
import { Crag } from '../types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getAllCrags(): Promise<Crag[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM crags ORDER BY name ASC');
  return rows.map(mapRow);
}

export async function getCragsByArea(areaId: string): Promise<Crag[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM crags WHERE area_id = ? ORDER BY name ASC',
    [areaId]
  );
  return rows.map(mapRow);
}

export async function getCragById(id: string): Promise<Crag | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM crags WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function insertCrag(crag: { name: string; area_id?: string | null; latitude?: number | null; longitude?: number | null }): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO crags (id, name, area_id, latitude, longitude, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, 0)',
    [id, crag.name, crag.area_id ?? null, crag.latitude ?? null, crag.longitude ?? null, now]
  );
  return id;
}

export async function deleteCrag(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM crags WHERE id = ?', [id]);
}

function mapRow(row: any): Crag {
  return {
    id: row.id,
    name: row.name,
    area_id: row.area_id,
    latitude: row.latitude,
    longitude: row.longitude,
    created_at: row.created_at,
    synced: row.synced === 1,
  };
}
