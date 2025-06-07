export type HouseSystem = 'placidus' | 'koch' | 'campanus' | 'regiomontanus' | 'equal' | 'whole-sign';

export interface Reflection {
  id: string;
  user_id: string;
  title: string;
  content: string;
  score: number;
  created_at: string;
}

export interface BirthData {
  date: string;
  time: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  house_system: HouseSystem;
} 