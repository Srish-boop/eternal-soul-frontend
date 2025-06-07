export enum HouseSystem {
  Placidus = 'P',
  Koch = 'K',
  Regiomontanus = 'R',
}

export enum LifeArea {
  Career = 'career',
  Relationships = 'relationships',
  Health = 'health',
  Spirituality = 'spirituality',
  Wealth = 'wealth',
  Personal = 'personal',
}

export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface BirthData {
  id?: string;
  user_id: string;
  name: string;
  birthdate: string; // 'YYYY-MM-DD'
  birthtime: string; // 'HH:MM:SS'
  location: Location;
  timezone: string;
  house_system: HouseSystem;
  created_at?: string;
  updated_at?: string;
}

export interface Reflection {
  id?: string;
  user_id: string;
  life_area: LifeArea;
  score: number;
  insight: string;
  created_at?: string;
  timestamp?: string;
}

export interface CacheItem<T> {
  value: T;
  expiry: number | null;
} 