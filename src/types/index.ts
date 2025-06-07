export type BirthData = {
  id?: string;
  name: string;
  birthdate: string; // 'YYYY-MM-DD'
  birthtime: string; // 'HH:MM:SS'
  location: string;
  house_system: string;
};

export type Reflection = {
  id?: string;
  user_id: string;
  life_area: string;
  score: number;
  insight: string;
};
