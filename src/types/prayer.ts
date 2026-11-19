export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type CalculationMethodId =
  | 'umm_al_qura'
  | 'jordan'
  | 'mwl'
  | 'egyptian'
  | 'karachi'
  | 'isna'
  | 'dubai'
  | 'kuwait'
  | 'qatar'
  | 'gulf'
  | 'turkey'
  | 'singapore'
  | 'uoif'
  | 'tehran'
  | 'russia'
  | 'moonsighting';

export type AsrSchool = 'standard' | 'hanafi';

export type DstMode = 'auto' | 'plus1' | 'minus1';

/** 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
export type FirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type AdhanToneId =
  | 'makkah_adhan'
  | 'madinah_adhan'
  | 'aqsa_adhan'
  | 'egypt_adhan'
  | 'hijazi'
  | 'minaret'
  | 'takbir'
  | 'fajr_dawn'
  | 'gentle'
  | 'custom';

export type TimeFormat = '12h' | '24h';

export type ThemeMode = 'light' | 'dark';

export type Language = 'ar' | 'en';

export type AppTab = 'prayers' | 'qibla' | 'calendar' | 'alarms' | 'settings';

export type AlarmRelation = 'before' | 'at' | 'after';

export type AlarmChallengeType = 'none' | 'math' | 'typing' | 'memory' | 'tap_burst';

export type AlarmChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface AlarmChallengeConfig {
  type: AlarmChallengeType;
  difficulty: AlarmChallengeDifficulty;
  /** Number of problems/rounds (1..5) */
  count: number;
}

export interface CityLocation {
  id: string;
  nameAr: string;
  nameEn: string;
  countryCode?: string;
  countryAr: string;
  countryEn?: string;
  regionAr?: string;
  regionEn?: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  defaultMethod: CalculationMethodId;
  isCustom?: boolean;
}

export interface PrayerTimeEntry {
  key: PrayerKey;
  nameAr: string;
  nameEn: string;
  /** Minutes since local midnight (0..1440) after DST & manual offsets */
  minutesFromMidnight: number;
  /** Exact Date object representing this prayer time in UTC epoch */
  date: Date;
  isFard: boolean;
}

export interface DailyPrayerSchedule {
  dateKey: string;
  prayers: PrayerTimeEntry[];
  hijriDateAr: string;
  hijriDateEn: string;
  gregorianDateAr: string;
  gregorianDateEn: string;
}

export interface NightTimes {
  midnightMinutes: number;
  lastThirdMinutes: number;
  midnightDate: Date;
  lastThirdDate: Date;
  nightDurationMinutes: number;
}

export interface NextPrayerState {
  currentPrayer: PrayerTimeEntry | null;
  nextPrayer: PrayerTimeEntry;
  isNextDayFajr: boolean;
  remainingSeconds: number;
  progressPercent: number;
}

export interface PrayerAlertConfig {
  enabled: boolean;
  atTime: boolean;
  beforeMinutes: number;
  afterMinutes: number;
  tone: AdhanToneId;
}

export interface CustomPrayerAlarm {
  id: string;
  title: string;
  prayerKey: PrayerKey;
  relation: AlarmRelation;
  offsetMinutes: number;
  enabled: boolean;
  tone: AdhanToneId;
  challenge?: AlarmChallengeConfig;
  wakeUpCheckEnabled?: boolean;
  /** Minutes after dismissing alarm to verify the user is still awake (1..30) */
  wakeUpCheckDelayMinutes?: number;
  /** Minutes before alarm trigger to show a pre-alert notification with "Skip Once" (0..120) */
  preAlertMinutes?: number;
  /** ISO YYYY-MM-DD date key for a single skipped occurrence (automatically expires next day) */
  skippedDateKey?: string | null;
}

export interface ScheduledTaskAlarm {
  id: string;
  title: string;
  /** ISO calendar date YYYY-MM-DD */
  date: string;
  /** 24-hour time HH:MM */
  time: string;
  notes?: string;
  enabled: boolean;
  completed: boolean;
  tone: AdhanToneId;
}

export interface AlertPreferences {
  byPrayer: Record<PrayerKey, PrayerAlertConfig>;
  defaultTone: AdhanToneId;
  volume: number;
  muted: boolean;
  customAudioName: string | null;
}

export type WidgetStyle = 'compact' | 'schedule' | 'transparent';
export type WidgetTheme = 'auto' | 'light' | 'dark' | 'emerald';

export interface WidgetPreferences {
  style: WidgetStyle;
  theme: WidgetTheme;
  showHijri: boolean;
  showCountdown: boolean;
  showAllPrayers: boolean;
  floatingEnabled: boolean;
}

export type WearOsTileStyle = 'circular_ring' | 'minimal_oled' | 'full_list';

export interface WearOsPreferences {
  enabled: boolean;
  tileStyle: WearOsTileStyle;
  ambientOled: boolean;
  vibrateOnAdhan: boolean;
  showQiblaComplication: boolean;
  showSeconds: boolean;
}

export interface SystemPreferences {
  persistentNotificationEnabled: boolean;
  persistentShowAllPrayers: boolean;
  persistentShowHijri: boolean;
  timerStopwatchNotifEnabled: boolean;
  dndBypassEnabled: boolean;
  keepAwakeEnabled: boolean;
  batteryUnrestrictedAck: boolean;
}

export interface AppSettings {
  city: CityLocation;
  language: Language;
  method: CalculationMethodId;
  methodCustomized: boolean;
  asrSchool: AsrSchool;
  dstMode: DstMode;
  hijriAdjustment: number;
  firstDayOfWeek: FirstDayOfWeek;
  manualAdjustments: Record<PrayerKey, number>;
  timeFormat: TimeFormat;
  theme: ThemeMode;
  saiThemeId: import('../data/saiThemes').SaiThemeId;
  alerts: AlertPreferences;
  customAlarms: CustomPrayerAlarm[];
  scheduledTasks: ScheduledTaskAlarm[];
  widget: WidgetPreferences;
  wearOs: WearOsPreferences;
  system: SystemPreferences;
}
