export type RouteType = 'boulder' | 'sport' | 'trad' | 'indoor';

export type GradeSystem = 'UIAA' | 'French' | 'V-scale' | 'Česká';

export const DEFAULT_GRADE_SYSTEM_BY_TYPE: Record<RouteType, GradeSystem> = {
  sport: 'French',
  trad: 'French',
  boulder: 'V-scale',
  indoor: 'Česká',
};

export type RockType = '' | 'sandstone' | 'limestone' | 'granite' | 'gneiss' | 'basalt' | 'conglomerate' | 'other';

export const ROCK_TYPE_OPTIONS: Array<{ value: RockType; label: string }> = [
  { value: '', label: 'Bez určení' },
  { value: 'sandstone', label: 'Pískovec' },
  { value: 'limestone', label: 'Vápenec' },
  { value: 'granite', label: 'Žula' },
  { value: 'gneiss', label: 'Rula' },
  { value: 'basalt', label: 'Čedič' },
  { value: 'conglomerate', label: 'Slepenec' },
  { value: 'other', label: 'Jiná skála' },
];

export const INDOOR_COLOR_OPTIONS = [
  'Červená',
  'Modrá',
  'Zelená',
  'Žlutá',
  'Oranžová',
  'Fialová',
  'Černá',
  'Bílá',
  'Růžová',
  'Šedá',
] as const;

export type IndoorColor = '' | (typeof INDOOR_COLOR_OPTIONS)[number];

export type AscentStyle = 'flash' | 'redpoint' | 'onsight' | 'project';
export type AscentCategory = '' | 'training' | 'trip' | 'milestone' | 'competition';

export interface Area {
  id: string;
  name: string;
  preview_uri: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  synced: boolean;
}

export interface Crag {
  id: string;
  name: string;
  area_id: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  synced: boolean;
}

export interface Sector {
  id: string;
  name: string;
  crag_id: string | null;
  area_id: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  synced: boolean;
}

export interface ClimbingRoute {
  id: string;
  name: string;
  grade: string;
  grade_system: GradeSystem;
  grade_index: number;
  type: RouteType;
  description: string;
  rating: number; // 1-5
  latitude: number | null;
  longitude: number | null;
  area_id: string | null;
  crag_id: string | null;
  sector_id: string | null;
  photo_uri: string | null;
  rock_type: RockType;
  indoor_color: IndoorColor;
  route_date: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export interface Ascent {
  id: string;
  route_id: string;
  session_id: string | null;
  date: string;
  style: AscentStyle;
  category: AscentCategory;
  success: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export interface ClimbingSession {
  id: string;
  name: string;
  notes: string;
  date: string;
  started_at: string;
  ended_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export const ASCENT_CATEGORIES: Array<{ value: AscentCategory; label: string }> = [
  { value: '', label: 'Bez kategorie' },
  { value: 'training', label: 'Trénink' },
  { value: 'trip', label: 'Výjezd' },
  { value: 'milestone', label: 'Milník' },
  { value: 'competition', label: 'Závody' },
];

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export const UIAA_GRADES = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VII+',
  'VIII-', 'VIII', 'VIII+', 'IX-', 'IX', 'IX+',
  'X-', 'X', 'X+', 'XI-', 'XI', 'XI+', 'XII-', 'XII',
];

export const FRENCH_GRADES = [
  '1', '2', '3', '4a', '4b', '4c',
  '5a', '5b', '5c', '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b', '8b+', '8c', '8c+',
  '9a', '9a+', '9b', '9b+', '9c',
];

export const V_SCALE_GRADES = [
  'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8',
  'V9', 'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17',
];

export const CZECH_GRADES = [
  '3', '4', '4+',
  '5-', '5', '5+',
  '6-', '6', '6+',
  '7-', '7', '7+',
  '8-', '8', '8+',
  '9-', '9', '9+',
  '10-', '10', '10+',
  '11-', '11', '11+',
  '12-', '12', '12+',
];

export function getGradesForSystem(system: GradeSystem): string[] {
  switch (system) {
    case 'UIAA': return UIAA_GRADES;
    case 'French': return FRENCH_GRADES;
    case 'V-scale': return V_SCALE_GRADES;
    case 'Česká': return CZECH_GRADES;
  }
}

export function getGradeIndex(grade: string, system: GradeSystem): number {
  const grades = getGradesForSystem(system);
  const idx = grades.indexOf(grade);
  return idx >= 0 ? idx : -1;
}

export interface FilterState {
  types: RouteType[];
  gradeMin: string;
  gradeMax: string;
  gradeSystem: GradeSystem;
  minRating: number;
}

export type SortField = 'name' | 'grade' | 'rating' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}
