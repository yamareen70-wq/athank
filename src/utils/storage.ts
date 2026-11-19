import { CITIES, DEFAULT_CITY } from '../data/cities';
import type {
  AdhanToneId,
  AlarmChallengeConfig,
  AlarmChallengeDifficulty,
  AlarmChallengeType,
  AppSettings,
  CalculationMethodId,
  CityLocation,
  CustomPrayerAlarm,
  DstMode,
  FirstDayOfWeek,
  PrayerAlertConfig,
  PrayerKey,
  ScheduledTaskAlarm,
  SystemPreferences,
  WearOsPreferences,
  WearOsTileStyle,
  WidgetPreferences,
  WidgetStyle,
  WidgetTheme,
} from '../types/prayer';
import {
  DEFAULT_DARK_SAI_THEME_ID,
  DEFAULT_LIGHT_SAI_THEME_ID,
  getSaiThemeById,
  isValidSaiThemeId,
} from '../data/saiThemes';
import { ALL_VALID_TONE_IDS } from './adhanAudio';
import { DEFAULT_ALARM_CHALLENGE } from './alarmChallenges';
import { CALCULATION_METHODS, ORDERED_PRAYER_KEYS, ZERO_MANUAL_ADJUSTMENTS } from './prayerMath';

export const STORAGE_KEY = 'mawaqit_app_settings_v2';

function makeDefaultPrayerAlert(
  enabled: boolean,
  tone: AdhanToneId = 'makkah_adhan'
): PrayerAlertConfig {
  return {
    enabled,
    atTime: true,
    beforeMinutes: 0,
    afterMinutes: 0,
    tone,
  };
}

export const DEFAULT_CUSTOM_ALARMS: CustomPrayerAlarm[] = [
  {
    id: 'starter-morning-adhkar',
    title: 'أذكار الصباح',
    prayerKey: 'fajr',
    relation: 'after',
    offsetMinutes: 15,
    enabled: true,
    tone: 'gentle',
    challenge: { ...DEFAULT_ALARM_CHALLENGE },
    wakeUpCheckEnabled: false,
    wakeUpCheckDelayMinutes: 5,
    preAlertMinutes: 15,
    skippedDateKey: null,
  },
  {
    id: 'starter-evening-adhkar',
    title: 'أذكار المساء',
    prayerKey: 'asr',
    relation: 'after',
    offsetMinutes: 15,
    enabled: true,
    tone: 'gentle',
    challenge: { ...DEFAULT_ALARM_CHALLENGE },
    wakeUpCheckEnabled: false,
    wakeUpCheckDelayMinutes: 5,
    preAlertMinutes: 10,
    skippedDateKey: null,
  },
];

export const DEFAULT_WIDGET_PREFS: WidgetPreferences = {
  style: 'schedule',
  theme: 'auto',
  showHijri: true,
  showCountdown: true,
  showAllPrayers: true,
  floatingEnabled: false,
};

export const DEFAULT_WEAR_OS_PREFS: WearOsPreferences = {
  enabled: true,
  tileStyle: 'circular_ring',
  ambientOled: false,
  vibrateOnAdhan: true,
  showQiblaComplication: true,
  showSeconds: true,
};

export const DEFAULT_SYSTEM_PREFS: SystemPreferences = {
  persistentNotificationEnabled: false,
  persistentShowAllPrayers: true,
  persistentShowHijri: true,
  timerStopwatchNotifEnabled: true,
  dndBypassEnabled: true,
  keepAwakeEnabled: false,
  batteryUnrestrictedAck: false,
};

export const DEFAULT_SETTINGS: AppSettings = {
  city: DEFAULT_CITY,
  language: 'ar',
  method: DEFAULT_CITY.defaultMethod,
  methodCustomized: false,
  asrSchool: 'standard',
  dstMode: 'auto',
  hijriAdjustment: 0,
  firstDayOfWeek: 6, // Saturday default for Arab/Islamic calendars
  manualAdjustments: { ...ZERO_MANUAL_ADJUSTMENTS },
  timeFormat: '12h',
  theme: 'light',
  saiThemeId: DEFAULT_LIGHT_SAI_THEME_ID,
  alerts: {
    byPrayer: {
      fajr: makeDefaultPrayerAlert(true, 'makkah_adhan'),
      sunrise: makeDefaultPrayerAlert(false, 'gentle'),
      dhuhr: makeDefaultPrayerAlert(true, 'makkah_adhan'),
      asr: makeDefaultPrayerAlert(true, 'makkah_adhan'),
      maghrib: makeDefaultPrayerAlert(true, 'makkah_adhan'),
      isha: makeDefaultPrayerAlert(true, 'makkah_adhan'),
    },
    defaultTone: 'makkah_adhan',
    volume: 0.75,
    muted: false,
    customAudioName: null,
  },
  customAlarms: DEFAULT_CUSTOM_ALARMS,
  scheduledTasks: [],
  widget: { ...DEFAULT_WIDGET_PREFS },
  wearOs: { ...DEFAULT_WEAR_OS_PREFS },
  system: { ...DEFAULT_SYSTEM_PREFS },
};

function sanitizeTone(val: unknown, fallback: AdhanToneId): AdhanToneId {
  return typeof val === 'string' && ALL_VALID_TONE_IDS.includes(val as AdhanToneId)
    ? (val as AdhanToneId)
    : fallback;
}

function sanitizeDst(val: unknown): DstMode {
  return val === 'plus1' || val === 'minus1' ? val : 'auto';
}

function sanitizeFirstDayOfWeek(val: unknown): FirstDayOfWeek {
  if (typeof val === 'number' && Number.isInteger(val) && val >= 0 && val <= 6) {
    return val as FirstDayOfWeek;
  }
  return DEFAULT_SETTINGS.firstDayOfWeek;
}

function sanitizeMethod(val: unknown, fallback: CalculationMethodId): CalculationMethodId {
  if (typeof val === 'string' && val in CALCULATION_METHODS) {
    return val as CalculationMethodId;
  }
  return fallback;
}

function sanitizeWidgetStyle(val: unknown): WidgetStyle {
  return val === 'compact' || val === 'transparent' ? val : 'schedule';
}

function sanitizeWidgetTheme(val: unknown): WidgetTheme {
  return val === 'light' || val === 'dark' || val === 'emerald' ? val : 'auto';
}

function sanitizeWearTileStyle(val: unknown): WearOsTileStyle {
  return val === 'minimal_oled' || val === 'full_list' ? val : 'circular_ring';
}

const VALID_CHALLENGE_TYPES: AlarmChallengeType[] = [
  'none',
  'math',
  'typing',
  'memory',
  'tap_burst',
];

const VALID_DIFFICULTIES: AlarmChallengeDifficulty[] = ['easy', 'medium', 'hard'];

function sanitizeChallenge(raw: unknown): AlarmChallengeConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_ALARM_CHALLENGE };
  const c = raw as Partial<AlarmChallengeConfig>;
  const type = VALID_CHALLENGE_TYPES.includes(c.type as AlarmChallengeType)
    ? (c.type as AlarmChallengeType)
    : 'none';
  const difficulty = VALID_DIFFICULTIES.includes(c.difficulty as AlarmChallengeDifficulty)
    ? (c.difficulty as AlarmChallengeDifficulty)
    : 'easy';
  const count =
    typeof c.count === 'number' && !Number.isNaN(c.count)
      ? Math.max(1, Math.min(5, Math.round(c.count)))
      : 2;
  return { type, difficulty, count };
}

function sanitizeCity(raw: unknown): CityLocation {
  if (!raw || typeof raw !== 'object') return DEFAULT_CITY;
  const candidate = raw as Partial<CityLocation>;
  if (typeof candidate.latitude !== 'number' || typeof candidate.longitude !== 'number') {
    return DEFAULT_CITY;
  }
  if (candidate.id && !candidate.isCustom) {
    const matched = CITIES.find((c) => c.id === candidate.id);
    if (matched) return matched;
  }
  return {
    id: typeof candidate.id === 'string' ? candidate.id : DEFAULT_CITY.id,
    nameAr: typeof candidate.nameAr === 'string' ? candidate.nameAr : DEFAULT_CITY.nameAr,
    nameEn: typeof candidate.nameEn === 'string' ? candidate.nameEn : DEFAULT_CITY.nameEn,
    countryCode: candidate.countryCode,
    countryAr: typeof candidate.countryAr === 'string' ? candidate.countryAr : DEFAULT_CITY.countryAr,
    countryEn: candidate.countryEn,
    regionAr: candidate.regionAr,
    regionEn: candidate.regionEn,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    timeZone: typeof candidate.timeZone === 'string' ? candidate.timeZone : DEFAULT_CITY.timeZone,
    defaultMethod: sanitizeMethod(candidate.defaultMethod, DEFAULT_CITY.defaultMethod),
    isCustom: Boolean(candidate.isCustom),
  };
}

export function sanitizeSettings(parsed: Partial<AppSettings> | null | undefined): AppSettings {
  if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;

  const city = sanitizeCity(parsed.city);
  const defaultTone = sanitizeTone(parsed.alerts?.defaultTone, DEFAULT_SETTINGS.alerts.defaultTone);

  const byPrayer = { ...DEFAULT_SETTINGS.alerts.byPrayer };
  for (const key of ORDERED_PRAYER_KEYS) {
    const saved = parsed.alerts?.byPrayer?.[key];
    if (saved && typeof saved === 'object') {
      byPrayer[key] = {
        enabled: typeof saved.enabled === 'boolean' ? saved.enabled : byPrayer[key].enabled,
        atTime: typeof saved.atTime === 'boolean' ? saved.atTime : true,
        beforeMinutes:
          typeof saved.beforeMinutes === 'number' && !Number.isNaN(saved.beforeMinutes)
            ? Math.max(0, Math.min(180, Math.round(saved.beforeMinutes)))
            : 0,
        afterMinutes:
          typeof saved.afterMinutes === 'number' && !Number.isNaN(saved.afterMinutes)
            ? Math.max(0, Math.min(180, Math.round(saved.afterMinutes)))
            : 0,
        tone: sanitizeTone(saved.tone, defaultTone),
      };
    }
  }

  const manualAdjustments = { ...ZERO_MANUAL_ADJUSTMENTS };
  for (const key of ORDERED_PRAYER_KEYS) {
    const val = parsed.manualAdjustments?.[key];
    if (typeof val === 'number' && !Number.isNaN(val)) {
      manualAdjustments[key] = Math.max(-30, Math.min(30, Math.round(val)));
    }
  }

  const customAlarms: CustomPrayerAlarm[] = Array.isArray(parsed.customAlarms)
    ? parsed.customAlarms
        .filter((a) => a && typeof a.id === 'string' && typeof a.title === 'string')
        .map((a) => ({
          id: a.id,
          title: a.title,
          prayerKey: ORDERED_PRAYER_KEYS.includes(a.prayerKey as PrayerKey)
            ? (a.prayerKey as PrayerKey)
            : 'fajr',
          relation: a.relation === 'before' || a.relation === 'after' ? a.relation : 'at',
          offsetMinutes:
            typeof a.offsetMinutes === 'number' && !Number.isNaN(a.offsetMinutes)
              ? Math.max(0, Math.min(180, Math.round(a.offsetMinutes)))
              : 0,
          enabled: Boolean(a.enabled),
          tone: sanitizeTone(a.tone, 'gentle'),
          challenge: sanitizeChallenge(a.challenge),
          wakeUpCheckEnabled: Boolean(a.wakeUpCheckEnabled),
          wakeUpCheckDelayMinutes:
            typeof a.wakeUpCheckDelayMinutes === 'number' &&
            !Number.isNaN(a.wakeUpCheckDelayMinutes)
              ? Math.max(1, Math.min(30, Math.round(a.wakeUpCheckDelayMinutes)))
              : 5,
          preAlertMinutes:
            typeof a.preAlertMinutes === 'number' && !Number.isNaN(a.preAlertMinutes)
              ? Math.max(0, Math.min(120, Math.round(a.preAlertMinutes)))
              : 0,
          skippedDateKey:
            typeof a.skippedDateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.skippedDateKey)
              ? a.skippedDateKey
              : null,
        }))
    : DEFAULT_CUSTOM_ALARMS;

  const scheduledTasks: ScheduledTaskAlarm[] = Array.isArray(parsed.scheduledTasks)
    ? parsed.scheduledTasks
        .filter(
          (task) =>
            task &&
            typeof task.id === 'string' &&
            typeof task.title === 'string' &&
            typeof task.date === 'string' &&
            typeof task.time === 'string'
        )
        .map((task) => ({
          id: task.id,
          title: task.title,
          date: task.date,
          time: task.time,
          notes: typeof task.notes === 'string' ? task.notes : undefined,
          enabled: Boolean(task.enabled),
          completed: Boolean(task.completed),
          tone: sanitizeTone(task.tone, 'gentle'),
        }))
    : [];

  const widgetRaw = parsed.widget;
  const widget: WidgetPreferences = {
    style: sanitizeWidgetStyle(widgetRaw?.style),
    theme: sanitizeWidgetTheme(widgetRaw?.theme),
    showHijri:
      typeof widgetRaw?.showHijri === 'boolean'
        ? widgetRaw.showHijri
        : DEFAULT_WIDGET_PREFS.showHijri,
    showCountdown:
      typeof widgetRaw?.showCountdown === 'boolean'
        ? widgetRaw.showCountdown
        : DEFAULT_WIDGET_PREFS.showCountdown,
    showAllPrayers:
      typeof widgetRaw?.showAllPrayers === 'boolean'
        ? widgetRaw.showAllPrayers
        : DEFAULT_WIDGET_PREFS.showAllPrayers,
    floatingEnabled:
      typeof widgetRaw?.floatingEnabled === 'boolean'
        ? widgetRaw.floatingEnabled
        : DEFAULT_WIDGET_PREFS.floatingEnabled,
  };

  const wearRaw = parsed.wearOs;
  const wearOs: WearOsPreferences = {
    enabled:
      typeof wearRaw?.enabled === 'boolean' ? wearRaw.enabled : DEFAULT_WEAR_OS_PREFS.enabled,
    tileStyle: sanitizeWearTileStyle(wearRaw?.tileStyle),
    ambientOled:
      typeof wearRaw?.ambientOled === 'boolean'
        ? wearRaw.ambientOled
        : DEFAULT_WEAR_OS_PREFS.ambientOled,
    vibrateOnAdhan:
      typeof wearRaw?.vibrateOnAdhan === 'boolean'
        ? wearRaw.vibrateOnAdhan
        : DEFAULT_WEAR_OS_PREFS.vibrateOnAdhan,
    showQiblaComplication:
      typeof wearRaw?.showQiblaComplication === 'boolean'
        ? wearRaw.showQiblaComplication
        : DEFAULT_WEAR_OS_PREFS.showQiblaComplication,
    showSeconds:
      typeof wearRaw?.showSeconds === 'boolean'
        ? wearRaw.showSeconds
        : DEFAULT_WEAR_OS_PREFS.showSeconds,
  };

  const sysRaw = parsed.system;
  const system: SystemPreferences = {
    persistentNotificationEnabled:
      typeof sysRaw?.persistentNotificationEnabled === 'boolean'
        ? sysRaw.persistentNotificationEnabled
        : DEFAULT_SYSTEM_PREFS.persistentNotificationEnabled,
    persistentShowAllPrayers:
      typeof sysRaw?.persistentShowAllPrayers === 'boolean'
        ? sysRaw.persistentShowAllPrayers
        : DEFAULT_SYSTEM_PREFS.persistentShowAllPrayers,
    persistentShowHijri:
      typeof sysRaw?.persistentShowHijri === 'boolean'
        ? sysRaw.persistentShowHijri
        : DEFAULT_SYSTEM_PREFS.persistentShowHijri,
    timerStopwatchNotifEnabled:
      typeof sysRaw?.timerStopwatchNotifEnabled === 'boolean'
        ? sysRaw.timerStopwatchNotifEnabled
        : DEFAULT_SYSTEM_PREFS.timerStopwatchNotifEnabled,
    dndBypassEnabled:
      typeof sysRaw?.dndBypassEnabled === 'boolean'
        ? sysRaw.dndBypassEnabled
        : DEFAULT_SYSTEM_PREFS.dndBypassEnabled,
    keepAwakeEnabled:
      typeof sysRaw?.keepAwakeEnabled === 'boolean'
        ? sysRaw.keepAwakeEnabled
        : DEFAULT_SYSTEM_PREFS.keepAwakeEnabled,
    batteryUnrestrictedAck:
      typeof sysRaw?.batteryUnrestrictedAck === 'boolean'
        ? sysRaw.batteryUnrestrictedAck
        : DEFAULT_SYSTEM_PREFS.batteryUnrestrictedAck,
  };

  const resolvedSaiThemeId = isValidSaiThemeId(parsed.saiThemeId)
    ? parsed.saiThemeId
    : parsed.theme === 'dark'
      ? DEFAULT_DARK_SAI_THEME_ID
      : DEFAULT_LIGHT_SAI_THEME_ID;
  const resolvedThemeMode = getSaiThemeById(resolvedSaiThemeId).isDark ? 'dark' : 'light';

  return {
    city,
    language: parsed.language === 'en' ? 'en' : 'ar',
    method: sanitizeMethod(parsed.method, city.defaultMethod),
    methodCustomized: Boolean(parsed.methodCustomized),
    asrSchool: parsed.asrSchool === 'hanafi' ? 'hanafi' : 'standard',
    dstMode: sanitizeDst(parsed.dstMode),
    hijriAdjustment:
      typeof parsed.hijriAdjustment === 'number' && !Number.isNaN(parsed.hijriAdjustment)
        ? Math.max(-2, Math.min(2, Math.round(parsed.hijriAdjustment)))
        : 0,
    firstDayOfWeek: sanitizeFirstDayOfWeek(parsed.firstDayOfWeek),
    manualAdjustments,
    timeFormat: parsed.timeFormat === '24h' ? '24h' : '12h',
    theme: resolvedThemeMode,
    saiThemeId: resolvedSaiThemeId,
    alerts: {
      byPrayer,
      defaultTone,
      volume:
        typeof parsed.alerts?.volume === 'number' && !Number.isNaN(parsed.alerts.volume)
          ? Math.max(0.1, Math.min(1, parsed.alerts.volume))
          : DEFAULT_SETTINGS.alerts.volume,
      muted: Boolean(parsed.alerts?.muted),
      customAudioName:
        typeof parsed.alerts?.customAudioName === 'string' && parsed.alerts.customAudioName.trim()
          ? parsed.alerts.customAudioName
          : null,
    },
    customAlarms,
    scheduledTasks,
    widget,
    wearOs,
    system,
  };
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return sanitizeSettings(JSON.parse(raw) as Partial<AppSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function resetSettings(): AppSettings {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
  return DEFAULT_SETTINGS;
}
