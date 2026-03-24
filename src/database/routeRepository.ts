import { getDatabase } from './database';
import { ClimbingRoute, FilterState, SortState, getGradeIndex } from '../types';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function getAllRoutes(): Promise<ClimbingRoute[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM routes ORDER BY updated_at DESC');
  return rows.map(mapRow);
}

export async function getRouteById(id: string): Promise<ClimbingRoute | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM routes WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

export async function searchRoutes(query: string): Promise<ClimbingRoute[]> {
  const db = await getDatabase();
  const like = `%${query}%`;
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM routes WHERE name LIKE ? OR description LIKE ? OR grade LIKE ? ORDER BY updated_at DESC',
    [like, like, like]
  );
  return rows.map(mapRow);
}

export async function getFilteredRoutes(
  search: string,
  filter: FilterState,
  sort: SortState
): Promise<ClimbingRoute[]> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: any[] = [];

  if (search.trim()) {
    const like = `%${search.trim()}%`;
    conditions.push('(name LIKE ? OR description LIKE ? OR grade LIKE ?)');
    params.push(like, like, like);
  }

  if (filter.types.length > 0) {
    conditions.push(`type IN (${filter.types.map(() => '?').join(', ')})`);
    params.push(...filter.types);
  }

  if (filter.minRating > 0) {
    conditions.push('rating >= ?');
    params.push(filter.minRating);
  }

  if (filter.gradeMin) {
    const minIdx = getGradeIndex(filter.gradeMin, filter.gradeSystem);
    if (minIdx >= 0) {
      conditions.push('(grade_system = ? AND grade_index >= ?)');
      params.push(filter.gradeSystem, minIdx);
    }
  }

  if (filter.gradeMax) {
    const maxIdx = getGradeIndex(filter.gradeMax, filter.gradeSystem);
    if (maxIdx >= 0) {
      conditions.push('(grade_system = ? AND grade_index <= ?)');
      params.push(filter.gradeSystem, maxIdx);
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy: string;
  const dir = sort.direction === 'asc' ? 'ASC' : 'DESC';
  switch (sort.field) {
    case 'name': orderBy = `name ${dir}`; break;
    case 'grade': orderBy = `grade_index ${dir}`; break;
    case 'rating': orderBy = `rating ${dir}`; break;
    default: orderBy = `updated_at ${dir}`; break;
  }

  const rows = await db.getAllAsync<any>(
    `SELECT * FROM routes ${where} ORDER BY ${orderBy}`,
    params
  );
  return rows.map(mapRow);
}

export async function insertRoute(route: Omit<ClimbingRoute, 'id' | 'created_at' | 'updated_at' | 'synced' | 'grade_index'>): Promise<string> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  const gradeIdx = getGradeIndex(route.grade, route.grade_system);
  await db.runAsync(
    `INSERT INTO routes (id, name, grade, grade_system, grade_index, type, description, rating, latitude, longitude, area_id, crag_id, sector_id, photo_uri, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, route.name, route.grade, route.grade_system, gradeIdx, route.type, route.description, route.rating,
     route.latitude, route.longitude, route.area_id, route.crag_id, route.sector_id, route.photo_uri, now, now]
  );
  return id;
}

export async function updateRoute(id: string, route: Partial<Omit<ClimbingRoute, 'id' | 'created_at' | 'synced'>>): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const fields: string[] = ['updated_at = ?', 'synced = 0'];
  const values: any[] = [now];

  if (route.name !== undefined) { fields.push('name = ?'); values.push(route.name); }
  if (route.grade !== undefined) { fields.push('grade = ?'); values.push(route.grade); }
  if (route.grade_system !== undefined) { fields.push('grade_system = ?'); values.push(route.grade_system); }
  if (route.grade !== undefined && route.grade_system !== undefined) {
    fields.push('grade_index = ?');
    values.push(getGradeIndex(route.grade, route.grade_system));
  }
  if (route.type !== undefined) { fields.push('type = ?'); values.push(route.type); }
  if (route.description !== undefined) { fields.push('description = ?'); values.push(route.description); }
  if (route.rating !== undefined) { fields.push('rating = ?'); values.push(route.rating); }
  if (route.latitude !== undefined) { fields.push('latitude = ?'); values.push(route.latitude); }
  if (route.longitude !== undefined) { fields.push('longitude = ?'); values.push(route.longitude); }
  if (route.area_id !== undefined) { fields.push('area_id = ?'); values.push(route.area_id); }
  if (route.crag_id !== undefined) { fields.push('crag_id = ?'); values.push(route.crag_id); }
  if (route.sector_id !== undefined) { fields.push('sector_id = ?'); values.push(route.sector_id); }
  if (route.photo_uri !== undefined) { fields.push('photo_uri = ?'); values.push(route.photo_uri); }

  values.push(id);
  await db.runAsync(`UPDATE routes SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteRoute(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM routes WHERE id = ?', [id]);
}

function mapRow(row: any): ClimbingRoute {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade,
    grade_system: row.grade_system,
    grade_index: row.grade_index ?? -1,
    type: row.type,
    description: row.description,
    rating: row.rating,
    latitude: row.latitude,
    longitude: row.longitude,
    area_id: row.area_id,
    crag_id: row.crag_id,
    sector_id: row.sector_id,
    photo_uri: row.photo_uri,
    created_at: row.created_at,
    updated_at: row.updated_at,
    synced: row.synced === 1,
  };
}
