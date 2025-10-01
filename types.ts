export interface Surah {
  id: number;
  name: string;
  revelationType: string;
  numberOfAyahs: number;
}

export interface Reciter {
  identifier: string;
  name: string;
  englishName: string;
}

export interface Ayah {
  number: number;
  audio: string;
  text: string;
  numberInSurah: number;
}

export interface ListeningStats {
  hoursThisWeek: number;
  surahsCompleted: number;
}

export interface Tafsir {
  text: string;
}

export interface PrayerSettings {
  country: string;
  region: string;
  method: number;
}

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string; // For dynamic access
}

export interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

export interface Theme {
  name: string;
  isCustom?: boolean;
  light: ThemeColors;
  dark: ThemeColors;
}

export interface QuranChallenge {
  isActive: boolean;
  isPaused: boolean;
  startDate: string; // ISO Date string
  durationDays: number;
  progress: Record<string, number>; // YYYY-MM-DD -> count
  completedAyahs: Record<string, number[]>; // surahId (as string key) -> array of ayah numbers in surah
}

export interface SearchAyah {
  surahId: number;
  ayahIdInSurah: number;
  text: string;
  surahName: string;
}

export interface AzkarSettings {
  isEnabled: boolean;
  frequency: number; // in hours
}
