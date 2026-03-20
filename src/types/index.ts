export type RouteType = 'boulder' | 'sport' | 'trad' | 'indoor';

export type GradeSystem = 'UIAA' | 'French' | 'V-scale';

export interface ClimbingRoute {
  id: string;
  name: string;
  grade: string;
  grade_system: GradeSystem;
  type: RouteType;
  description: string;
  rating: number; // 1-5
  latitude: number | null;
  longitude: number | null;
  sector_id: string | null;
  photo_uri: string | null;
  created_at: string;
  updated_at: string;
  synced: boolean;
}

export interface Sector {
  id: string;
  name: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  synced: boolean;
}

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

export function getGradesForSystem(system: GradeSystem): string[] {
  switch (system) {
    case 'UIAA': return UIAA_GRADES;
    case 'French': return FRENCH_GRADES;
    case 'V-scale': return V_SCALE_GRADES;
  }
}
