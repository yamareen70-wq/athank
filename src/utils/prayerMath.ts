import type {
  AsrSchool,
  CalculationMethodId,
  CityLocation,
  CustomPrayerAlarm,
  DailyPrayerSchedule,
  DstMode,
  Language,
  NextPrayerState,
  NightTimes,
  PrayerKey,
  PrayerTimeEntry,
  TimeFormat,
} from '../types/prayer';
import { PRAYER_LABELS } from './i18n';
import { formatHijriDateFromGregorian } from './hijriCalendar';

export interface CalculationMethodConfig {
  id: CalculationMethodId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  fajrAngle: number;
  maghribAngle?: number;
  ishaAngle?: number;
  ishaMinutesAfterMaghrib?: number;
  dhuhrOffsetMinutes?: number;
  maghribOffsetMinutes?: number;
}

export const CALCULATION_METHODS: Record<CalculationMethodId, CalculationMethodConfig> = {
  umm_al_qura: {
    id: 'umm_al_qura',
    nameAr: 'تقويم أم القرى (مكة المكرمة)',
    nameEn: 'Umm al-Qura University, Makkah',
    descriptionAr: 'الفجر 18.5° · العشاء بعد المغرب بـ 90 دقيقة',
    descriptionEn: 'Fajr 18.5° · Isha 90 min after Maghrib',
    fajrAngle: 18.5,
    ishaMinutesAfterMaghrib: 90,
  },
  jordan: {
    id: 'jordan',
    nameAr: 'وزارة الأوقاف والشؤون والمقدسات الإسلامية (الأردن)',
    nameEn: 'Ministry of Awqaf & Islamic Affairs (Jordan)',
    descriptionAr: 'الفجر 18° · العشاء 18° · احتياط الظهر والمغرب +5 دقائق',
    descriptionEn: 'Fajr 18° · Isha 18° · Dhuhr & Maghrib +5 min precaution',
    fajrAngle: 18,
    ishaAngle: 18,
    dhuhrOffsetMinutes: 5,
    maghribOffsetMinutes: 5,
  },
  mwl: {
    id: 'mwl',
    nameAr: 'رابطة العالم الإسلامي (MWL)',
    nameEn: 'Muslim World League (MWL)',
    descriptionAr: 'الفجر 18° · العشاء 17°',
    descriptionEn: 'Fajr 18° · Isha 17°',
    fajrAngle: 18,
    ishaAngle: 17,
  },
  egyptian: {
    id: 'egyptian',
    nameAr: 'الهيئة المصرية العامة للمساحة',
    nameEn: 'Egyptian General Authority of Survey',
    descriptionAr: 'الفجر 19.5° · العشاء 17.5°',
    descriptionEn: 'Fajr 19.5° · Isha 17.5°',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
  },
  karachi: {
    id: 'karachi',
    nameAr: 'جامعة العلوم الإسلامية بكراتشي',
    nameEn: 'University of Islamic Sciences, Karachi',
    descriptionAr: 'الفجر 18° · العشاء 18°',
    descriptionEn: 'Fajr 18° · Isha 18°',
    fajrAngle: 18,
    ishaAngle: 18,
  },
  isna: {
    id: 'isna',
    nameAr: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)',
    nameEn: 'Islamic Society of North America (ISNA)',
    descriptionAr: 'الفجر 15° · العشاء 15°',
    descriptionEn: 'Fajr 15° · Isha 15°',
    fajrAngle: 15,
    ishaAngle: 15,
  },
  dubai: {
    id: 'dubai',
    nameAr: 'دائرة الشؤون الإسلامية بدبي',
    nameEn: 'Dubai (IACAD)',
    descriptionAr: 'الفجر 18.2° · العشاء 18.2°',
    descriptionEn: 'Fajr 18.2° · Isha 18.2°',
    fajrAngle: 18.2,
    ishaAngle: 18.2,
  },
  kuwait: {
    id: 'kuwait',
    nameAr: 'وزارة الأوقاف الكويتية',
    nameEn: 'Kuwait',
    descriptionAr: 'الفجر 18° · العشاء 17.5°',
    descriptionEn: 'Fajr 18° · Isha 17.5°',
    fajrAngle: 18,
    ishaAngle: 17.5,
  },
  qatar: {
    id: 'qatar',
    nameAr: 'تقويم قطر',
    nameEn: 'Qatar',
    descriptionAr: 'الفجر 18° · العشاء بعد المغرب بـ 90 دقيقة',
    descriptionEn: 'Fajr 18° · Isha 90 min after Maghrib',
    fajrAngle: 18,
    ishaMinutesAfterMaghrib: 90,
  },
  gulf: {
    id: 'gulf',
    nameAr: 'منطقة الخليج العربي',
    nameEn: 'Gulf Region',
    descriptionAr: 'الفجر 19.5° · العشاء بعد المغرب بـ 90 دقيقة',
    descriptionEn: 'Fajr 19.5° · Isha 90 min after Maghrib',
    fajrAngle: 19.5,
    ishaMinutesAfterMaghrib: 90,
  },
  turkey: {
    id: 'turkey',
    nameAr: 'رئاسة الشؤون الدينية التركية (ديانت)',
    nameEn: 'Diyanet İşleri Başkanlığı, Turkey',
    descriptionAr: 'الفجر 18° · العشاء 17°',
    descriptionEn: 'Fajr 18° · Isha 17°',
    fajrAngle: 18,
    ishaAngle: 17,
  },
  singapore: {
    id: 'singapore',
    nameAr: 'المجلس الإسلامي في سنغافورة (MUIS)',
    nameEn: 'Majlis Ugama Islam Singapura (MUIS)',
    descriptionAr: 'الفجر 20° · العشاء 18°',
    descriptionEn: 'Fajr 20° · Isha 18°',
    fajrAngle: 20,
    ishaAngle: 18,
  },
  uoif: {
    id: 'uoif',
    nameAr: 'اتحاد المنظمات الإسلامية بفرنسا (UOIF)',
    nameEn: 'Union of Islamic Organizations of France (UOIF)',
    descriptionAr: 'الفجر 12° · العشاء 12°',
    descriptionEn: 'Fajr 12° · Isha 12°',
    fajrAngle: 12,
    ishaAngle: 12,
  },
  tehran: {
    id: 'tehran',
    nameAr: 'معهد الجيوفيزياء بجامعة طهران',
    nameEn: 'Institute of Geophysics, University of Tehran',
    descriptionAr: 'الفجر 17.7° · المغرب 4.5° · العشاء 14°',
    descriptionEn: 'Fajr 17.7° · Maghrib 4.5° · Isha 14°',
    fajrAngle: 17.7,
    maghribAngle: 4.5,
    ishaAngle: 14,
  },
  russia: {
    id: 'russia',
    nameAr: 'الإدارة الدينية لمسلمي روسيا',
    nameEn: 'Spiritual Administration of Muslims of Russia',
    descriptionAr: 'الفجر 16° · العشاء 15°',
    descriptionEn: 'Fajr 16° · Isha 15°',
    fajrAngle: 16,
    ishaAngle: 15,
  },
  moonsighting: {
    id: 'moonsighting',
    nameAr: 'لجنة تحري الهلال العالمية',
    nameEn: 'Moonsighting Committee Worldwide',
    descriptionAr: 'الفجر 18° · العشاء 18°',
    descriptionEn: 'Fajr 18° · Isha 18°',
    fajrAngle: 18,
    ishaAngle: 18,
  },
};

export const ZERO_MANUAL_ADJUSTMENTS: Record<PrayerKey, number> = {
  fajr: 0,
  sunrise: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
};

export const ORDERED_PRAYER_KEYS: PrayerKey[] = [
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function dsin(d: number): number {
  return Math.sin(d * DEG_TO_RAD);
}
function dcos(d: number): number {
  return Math.cos(d * DEG_TO_RAD);
}
function dtan(d: number): number {
  return Math.tan(d * DEG_TO_RAD);
}
function darcsin(x: number): number {
  return Math.asin(Math.max(-1, Math.min(1, x))) * RAD_TO_DEG;
}
function darccos(x: number): number {
  return Math.acos(Math.max(-1, Math.min(1, x))) * RAD_TO_DEG;
}
function darctan2(y: number, x: number): number {
  return Math.atan2(y, x) * RAD_TO_DEG;
}
function darccot(x: number): number {
  return Math.atan(1 / x) * RAD_TO_DEG;
}
function fixAngle(a: number): number {
  const m = a % 360;
  return m < 0 ? m + 360 : m;
}
function fixHour(h: number): number {
  const m = h % 24;
  return m < 0 ? m + 24 : m;
}

export function gregorianToJulianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

function sunPosition(jd: number): { declination: number; equationOfTime: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g));

  const e = 23.439 - 0.00000036 * D;
  const RA = darctan2(dcos(e) * dsin(L), dcos(L)) / 15;
  const declination = darcsin(dsin(e) * dsin(L));
  const equationOfTime = q / 15 - fixHour(RA);

  return { declination, equationOfTime };
}

export function getTimeZoneOffsetHours(
  year: number,
  month: number,
  day: number,
  timeZone: string
): number {
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(utcNoon);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const tzAsUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second')
  );
  return (tzAsUtc - utcNoon.getTime()) / 3_600_000;
}

export function getDstDeltaMinutes(dstMode: DstMode): number {
  if (dstMode === 'plus1') return 60;
  if (dstMode === 'minus1') return -60;
  return 0;
}

export function getZonedDateParts(
  date: Date,
  timeZone: string
): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
  };
}

export function addCalendarDays(
  year: number,
  month: number,
  day: number,
  offsetDays: number
): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day + offsetDays, 12, 0, 0));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function sunAngleTime(
  jd: number,
  latitude: number,
  angle: number,
  direction: 'ccw' | 'cw',
  midDay: number
): number | null {
  const { declination } = sunPosition(jd);
  const numerator = -dsin(angle) - dsin(declination) * dsin(latitude);
  const denominator = dcos(declination) * dcos(latitude);
  const cosVal = numerator / denominator;
  if (cosVal < -1 || cosVal > 1) {
    return null;
  }
  const t = darccos(cosVal) / 15;
  return midDay + (direction === 'ccw' ? -t : t);
}

function asrTime(jd: number, latitude: number, factor: 1 | 2, midDay: number): number {
  const { declination } = sunPosition(jd);
  const angle = -darccot(factor + dtan(Math.abs(latitude - declination)));
  const res = sunAngleTime(jd, latitude, angle, 'cw', midDay);
  return res ?? midDay + 3.5;
}

export interface RawPrayerHours {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export function computeRawPrayerHours(params: {
  year: number;
  month: number;
  day: number;
  latitude: number;
  longitude: number;
  utcOffsetHours: number;
  method: CalculationMethodId;
  asrSchool: AsrSchool;
}): RawPrayerHours {
  const { year, month, day, latitude, longitude, utcOffsetHours, method, asrSchool } = params;
  const config = CALCULATION_METHODS[method] ?? CALCULATION_METHODS.umm_al_qura;
  const baseJd = gregorianToJulianDay(year, month, day) - longitude / (15 * 24);

  const tFajr = 5 / 24;
  const tSunrise = 6 / 24;
  const tDhuhr = 12 / 24;
  const tAsr = 13 / 24;
  const tMaghrib = 18 / 24;
  const tIsha = 18 / 24;

  const midDayAt = (frac: number) => {
    const { equationOfTime } = sunPosition(baseJd + frac);
    return fixHour(12 - equationOfTime);
  };

  const dhuhrSolar = midDayAt(tDhuhr);
  const sunriseSolar =
    sunAngleTime(baseJd + tSunrise, latitude, 0.833, 'ccw', midDayAt(tSunrise)) ?? dhuhrSolar - 6;
  const sunsetSolar =
    sunAngleTime(baseJd + tMaghrib, latitude, 0.833, 'cw', midDayAt(tMaghrib)) ?? dhuhrSolar + 6;
  const maghribSolar = config.maghribAngle
    ? (sunAngleTime(baseJd + tMaghrib, latitude, config.maghribAngle, 'cw', midDayAt(tMaghrib)) ??
      sunsetSolar)
    : sunsetSolar;

  const nightDuration = fixHour(sunriseSolar + 24 - sunsetSolar);

  const fajrSolar =
    sunAngleTime(baseJd + tFajr, latitude, config.fajrAngle, 'ccw', midDayAt(tFajr)) ??
    sunriseSolar - nightDuration / 7;

  const asrFactor: 1 | 2 = asrSchool === 'hanafi' ? 2 : 1;
  const asrSolar = asrTime(baseJd + tAsr, latitude, asrFactor, midDayAt(tAsr));

  let ishaSolar: number;
  if (typeof config.ishaMinutesAfterMaghrib === 'number') {
    ishaSolar = maghribSolar + config.ishaMinutesAfterMaghrib / 60;
  } else {
    const angle = config.ishaAngle ?? 17;
    ishaSolar =
      sunAngleTime(baseJd + tIsha, latitude, angle, 'cw', midDayAt(tIsha)) ??
      maghribSolar + nightDuration / 7;
  }

  const tzAdjust = utcOffsetHours - longitude / 15;
  const dhuhrPrecautionHours = (config.dhuhrOffsetMinutes ?? 1) / 60;
  const maghribPrecautionHours = (config.maghribOffsetMinutes ?? 0) / 60;

  return {
    fajr: fixHour(fajrSolar + tzAdjust),
    sunrise: fixHour(sunriseSolar + tzAdjust),
    dhuhr: fixHour(dhuhrSolar + tzAdjust + dhuhrPrecautionHours),
    asr: fixHour(asrSolar + tzAdjust),
    maghrib: fixHour(maghribSolar + tzAdjust + maghribPrecautionHours),
    isha: fixHour(ishaSolar + tzAdjust),
  };
}

export function formatGregorianDate(date: Date, timeZone: string, lang: Language): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function buildDailyPrayerSchedule(params: {
  city: CityLocation;
  year: number;
  month: number;
  day: number;
  method: CalculationMethodId;
  asrSchool: AsrSchool;
  dstMode?: DstMode;
  manualAdjustments?: Partial<Record<PrayerKey, number>>;
  hijriAdjustment?: number;
}): DailyPrayerSchedule {
  const {
    city,
    year,
    month,
    day,
    method,
    asrSchool,
    dstMode = 'auto',
    manualAdjustments = {},
    hijriAdjustment = 0,
  } = params;

  const utcOffsetHours = getTimeZoneOffsetHours(year, month, day, city.timeZone);
  const dstDeltaMinutes = getDstDeltaMinutes(dstMode);

  const raw = computeRawPrayerHours({
    year,
    month,
    day,
    latitude: city.latitude,
    longitude: city.longitude,
    utcOffsetHours,
    method,
    asrSchool,
  });

  const localMidnightUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0) - utcOffsetHours * 3_600_000;

  const prayers: PrayerTimeEntry[] = ORDERED_PRAYER_KEYS.map((key) => {
    const manualMin = manualAdjustments[key] ?? 0;
    const rawMins = Math.round(raw[key] * 60);
    const adjustedMins = ((rawMins + dstDeltaMinutes + manualMin) % 1440 + 1440) % 1440;
    const epochMs = localMidnightUtcMs + (rawMins + dstDeltaMinutes + manualMin) * 60_000;

    return {
      key,
      nameAr: PRAYER_LABELS[key].ar,
      nameEn: PRAYER_LABELS[key].en,
      minutesFromMidnight: adjustedMins,
      date: new Date(epochMs),
      isFard: key !== 'sunrise',
    };
  });

  const noonLocalDate = new Date(localMidnightUtcMs + 12 * 3_600_000);
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    dateKey,
    prayers,
    hijriDateAr: formatHijriDateFromGregorian(year, month, day, hijriAdjustment, 'ar'),
    hijriDateEn: formatHijriDateFromGregorian(year, month, day, hijriAdjustment, 'en'),
    gregorianDateAr: formatGregorianDate(noonLocalDate, city.timeZone, 'ar'),
    gregorianDateEn: formatGregorianDate(noonLocalDate, city.timeZone, 'en'),
  };
}

export function getNextPrayerState(
  now: Date,
  todaySchedule: DailyPrayerSchedule,
  tomorrowSchedule: DailyPrayerSchedule
): NextPrayerState {
  const nowMs = now.getTime();
  const prayers = todaySchedule.prayers;

  for (let i = 0; i < prayers.length; i++) {
    const prayer = prayers[i];
    if (prayer.date.getTime() > nowMs) {
      const prevPrayer = i > 0 ? prayers[i - 1] : null;
      const startMs = prevPrayer
        ? prevPrayer.date.getTime()
        : prayer.date.getTime() - 6 * 3_600_000;
      const totalSpan = Math.max(1, prayer.date.getTime() - startMs);
      const elapsed = Math.max(0, nowMs - startMs);
      const progressPercent = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));
      const remainingSeconds = Math.max(0, Math.floor((prayer.date.getTime() - nowMs) / 1000));

      return {
        currentPrayer: prevPrayer,
        nextPrayer: prayer,
        isNextDayFajr: false,
        remainingSeconds,
        progressPercent,
      };
    }
  }

  const todayIsha = prayers[prayers.length - 1];
  const tomorrowFajr = tomorrowSchedule.prayers[0];
  const totalSpan = Math.max(1, tomorrowFajr.date.getTime() - todayIsha.date.getTime());
  const elapsed = Math.max(0, nowMs - todayIsha.date.getTime());
  const progressPercent = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));
  const remainingSeconds = Math.max(0, Math.floor((tomorrowFajr.date.getTime() - nowMs) / 1000));

  return {
    currentPrayer: todayIsha,
    nextPrayer: tomorrowFajr,
    isNextDayFajr: true,
    remainingSeconds,
    progressPercent,
  };
}

/**
 * Computes the trigger time (minutesFromMidnight & exact Date) for a personal prayer-linked alarm.
 */
export function computeCustomAlarmTriggerTime(
  alarm: CustomPrayerAlarm,
  schedule: DailyPrayerSchedule
): { minutesFromMidnight: number; date: Date } {
  const anchor = schedule.prayers.find((p) => p.key === alarm.prayerKey) ?? schedule.prayers[0];
  const signedOffset =
    alarm.relation === 'before'
      ? -alarm.offsetMinutes
      : alarm.relation === 'after'
        ? alarm.offsetMinutes
        : 0;
  const minutesFromMidnight = ((anchor.minutesFromMidnight + signedOffset) % 1440 + 1440) % 1440;
  const date = new Date(anchor.date.getTime() + signedOffset * 60_000);
  return { minutesFromMidnight, date };
}

/**
 * Computes Islamic Midnight (midpoint between Maghrib and next day's Fajr)
 * and the start of the Last Third of the Night (Maghrib + 2/3 of night duration).
 */
export function computeNightTimes(
  todaySchedule: DailyPrayerSchedule,
  nextDaySchedule: DailyPrayerSchedule
): NightTimes {
  const maghrib = todaySchedule.prayers.find((p) => p.key === 'maghrib') ?? todaySchedule.prayers[4];
  const nextFajr = nextDaySchedule.prayers.find((p) => p.key === 'fajr') ?? nextDaySchedule.prayers[0];

  let nightMs = nextFajr.date.getTime() - maghrib.date.getTime();
  if (nightMs <= 0) {
    nightMs += 24 * 3_600_000;
  }

  const nightDurationMinutes = Math.round(nightMs / 60_000);
  const midnightOffsetMins = Math.round(nightDurationMinutes / 2);
  const lastThirdOffsetMins = Math.round((nightDurationMinutes * 2) / 3);

  const midnightMinutes = ((maghrib.minutesFromMidnight + midnightOffsetMins) % 1440 + 1440) % 1440;
  const lastThirdMinutes = ((maghrib.minutesFromMidnight + lastThirdOffsetMins) % 1440 + 1440) % 1440;

  return {
    midnightMinutes,
    lastThirdMinutes,
    midnightDate: new Date(maghrib.date.getTime() + midnightOffsetMins * 60_000),
    lastThirdDate: new Date(maghrib.date.getTime() + lastThirdOffsetMins * 60_000),
    nightDurationMinutes,
  };
}

/**
 * Parses a YYYY-MM-DD date and HH:MM time into a local Date timestamp.
 */
export function parseScheduledTaskDateTime(dateStr: string, timeStr: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeStr.trim());
  if (!dateMatch || !timeMatch) return null;
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  const d = new Date(year, month - 1, day, hour, minute, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatPrayerMinutes(
  minutesFromMidnight: number,
  format: TimeFormat,
  lang: Language = 'ar'
): string {
  const total = ((minutesFromMidnight % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const mins = total % 60;
  const mm = String(mins).padStart(2, '0');

  if (format === '24h') {
    return `${String(h24).padStart(2, '0')}:${mm}`;
  }

  const isPm = h24 >= 12;
  const period = lang === 'ar' ? (isPm ? 'م' : 'ص') : isPm ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${mm} ${period}`;
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`;
}

export function formatCityCurrentClock(
  date: Date,
  timeZone: string,
  format: TimeFormat,
  lang: Language = 'ar',
  dstMode: DstMode = 'auto',
  showSeconds = true
): string {
  const shifted = new Date(date.getTime() + getDstDeltaMinutes(dstMode) * 60_000);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' } : {}),
    hourCycle: format === '24h' ? 'h23' : 'h12',
  });
  const parts = formatter.formatToParts(shifted);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  const second = parts.find((p) => p.type === 'second')?.value ?? '00';
  const timeCore = showSeconds ? `${hour}:${minute}:${second}` : `${hour}:${minute}`;
  if (format === '24h') {
    return timeCore;
  }
  const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value?.toLowerCase();
  const isPm = dayPeriod === 'pm';
  const suffix = lang === 'ar' ? (isPm ? 'م' : 'ص') : isPm ? 'PM' : 'AM';
  return `${timeCore} ${suffix}`;
}
