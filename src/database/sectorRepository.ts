import { getDatabase } from './database';
import { Sector } from '../types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getAllSectors(): Promise<Sector[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM sectors ORDER BY name ASC');
  return rows.map(mapRow);
}

export async function getSectorsByCrag(cragId: string): Promise<Sector[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM sectors WHERE crag_id = ? ORDER BY name ASC',
    [cragId]
  );
  return rows.map(mapRow);
}

export async function getSectorsByArea(areaId: string): Promise<Sector[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM sectors WHERE area_id = ? AND crag_id IS NULL ORDER BY name ASC',
    [areaId]
  );
  return rows.map(mapRow);
}

export async function getSectorById(id: string): Promise<Sector | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM sectors WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function insertSector(sector: { name: string; crag_id?: string | null; area_id?: string | null }): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO sectors (id, name, crag_id, area_id, latitude, longitude, created_at, synced) VALUES (?, ?, ?, ?, NULL, NULL, ?, 0)',
    [id, sector.name, sector.crag_id ?? null, sector.area_id ?? null, now]
  );
  return id;
}

export async function deleteSector(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sectors WHERE id = ?', [id]);
}

function mapRow(row: any): Sector {
  return {
    id: row.id,
    name: row.name,
    crag_id: row.crag_id,
    area_id: row.area_id,
    latitude: row.latitude,
    longitude: row.longitude,
    created_at: row.created_at,
    synced: row.synced === 1,
  };
}
