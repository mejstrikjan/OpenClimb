function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
import { getDatabase } from './database';
import { Sector } from '../types';

export async function getAllSectors(): Promise<Sector[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM sectors ORDER BY name ASC');
  return rows.map(mapRow);
}

export async function getSectorById(id: string): Promise<Sector | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM sectors WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function insertSector(sector: Omit<Sector, 'id' | 'created_at' | 'synced'>): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO sectors (id, name, area, latitude, longitude, created_at, synced) VALUES (?, ?, ?, ?, ?, ?, 0)',
    [id, sector.name, sector.area, sector.latitude, sector.longitude, now]
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
    area: row.area,
    latitude: row.latitude,
    longitude: row.longitude,
    created_at: row.created_at,
    synced: row.synced === 1,
  };
}
