import type { Language } from '../types/prayer';

export interface HijriDate {
  year: number;
  month: number; // 1..12
  day: number; // 1..30
}

export interface GregorianDate {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
}

export interface IslamicOccasion {
  month: number;
  day: number;
  nameAr: string;
  nameEn: string;
}

export interface HijriCalendarDayCell {
  hijri: HijriDate;
  gregorian: GregorianDate;
  weekday: number; // 0 = Sun .. 6 = Sat
  isToday: boolean;
  occasion: IslamicOccasion | null;
}

export const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
] as const;

export const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
] as const;

export const GREGORIAN_MONTHS_AR_SHORT = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

export const GREGORIAN_MONTHS_EN_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ISLAMIC_OCCASIONS: IslamicOccasion[] = [
  { month: 1, day: 1, nameAr: 'رأس السنة الهجرية', nameEn: 'Islamic New Year' },
  { month: 1, day: 10, nameAr: 'يوم عاشوراء', nameEn: 'Day of Ashura' },
  { month: 3, day: 12, nameAr: 'ذكرى المولد النبوي', nameEn: 'Mawlid al-Nabi' },
  { month: 7, day: 27, nameAr: 'ليلة الإسراء والمعراج', nameEn: "Isra and Mi'raj" },
  { month: 8, day: 15, nameAr: 'ليلة النصف من شعبان', nameEn: "Mid-Sha'ban" },
  { month: 9, day: 1, nameAr: 'غرة شهر رمضان المبارك', nameEn: 'First Day of Ramadan' },
  { month: 9, day: 27, nameAr: 'ليلة ٢٧ رمضان', nameEn: '27th of Ramadan' },
  { month: 10, day: 1, nameAr: 'عيد الفطر المبارك', nameEn: 'Eid al-Fitr' },
  { month: 12, day: 9, nameAr: 'يوم عرفة', nameEn: 'Day of Arafah' },
  { month: 12, day: 10, nameAr: 'عيد الأضحى المبارك', nameEn: 'Eid al-Adha' },
];

/** Integer Julian Day Number (noon-based, standard Fliegel-Van Flandern) */
export function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function jdnToGregorian(jdn: number): GregorianDate {
  const l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l3) / 2447);
  const day = l3 - Math.floor((2447 * j) / 80);
  const l4 = Math.floor(j / 11);
  const month = j + 2 - 12 * l4;
  const year = 100 * (n - 49) + i + l4;
  return { year, month, day };
}

/** Tabular / Kuwaiti Islamic Calendar conversion via JDN */
export function hijriToJdn(year: number, month: number, day: number): number {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    1948439
  );
}

export function jdnToHijri(jdn: number): HijriDate {
  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

export function gregorianToHijri(
  year: number,
  month: number,
  day: number,
  adjustmentDays = 0
): HijriDate {
  const jdn = gregorianToJdn(year, month, day) + adjustmentDays;
  return jdnToHijri(jdn);
}

export function hijriToGregorian(
  year: number,
  month: number,
  day: number,
  adjustmentDays = 0
): GregorianDate {
  const jdn = hijriToJdn(year, month, day) - adjustmentDays;
  return jdnToGregorian(jdn);
}

export function getHijriMonthLength(year: number, month: number): number {
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return hijriToJdn(nextYear, nextMonth, 1) - hijriToJdn(year, month, 1);
}

export function getHijriMonthName(month: number, lang: Language): string {
  const idx = Math.max(0, Math.min(11, month - 1));
  return lang === 'ar' ? HIJRI_MONTHS_AR[idx] : HIJRI_MONTHS_EN[idx];
}

export function getOccasionForHijriDate(month: number, day: number): IslamicOccasion | null {
  return ISLAMIC_OCCASIONS.find((o) => o.month === month && o.day === day) ?? null;
}

export function formatHijriDateFromGregorian(
  year: number,
  month: number,
  day: number,
  adjustmentDays: number,
  lang: Language
): string {
  const h = gregorianToHijri(year, month, day, adjustmentDays);
  const jdn = gregorianToJdn(year, month, day);
  const weekday = (jdn + 1) % 7; // 0 = Sunday .. 6 = Saturday
  const monthName = getHijriMonthName(h.month, lang);

  if (lang === 'ar') {
    return `${WEEKDAYS_AR[weekday]}، ${h.day} ${monthName} ${h.year} هـ`;
  }
  return `${WEEKDAYS_EN[weekday]}, ${h.day} ${monthName} ${h.year} AH`;
}

export function buildHijriMonthGrid(params: {
  hijriYear: number;
  hijriMonth: number;
  hijriAdjustment: number;
  todayGregorian: GregorianDate;
}): HijriCalendarDayCell[] {
  const { hijriYear, hijriMonth, hijriAdjustment, todayGregorian } = params;
  const length = getHijriMonthLength(hijriYear, hijriMonth);
  const cells: HijriCalendarDayCell[] = [];

  for (let d = 1; d <= length; d++) {
    const gregJdn = hijriToJdn(hijriYear, hijriMonth, d) - hijriAdjustment;
    const gregorian = jdnToGregorian(gregJdn);
    const weekday = (gregJdn + 1) % 7;
    const isToday =
      gregorian.year === todayGregorian.year &&
      gregorian.month === todayGregorian.month &&
      gregorian.day === todayGregorian.day;

    cells.push({
      hijri: { year: hijriYear, month: hijriMonth, day: d },
      gregorian,
      weekday,
      isToday,
      occasion: getOccasionForHijriDate(hijriMonth, d),
    });
  }

  return cells;
}

export function shiftHijriMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const zeroBased = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(zeroBased / 12);
  const nextMonth = ((zeroBased % 12) + 12) % 12 + 1;
  return { year: nextYear, month: nextMonth };
}

export interface UpcomingOccasion {
  occasion: IslamicOccasion;
  hijri: HijriDate;
  gregorian: GregorianDate;
  daysUntil: number;
}

/**
 * Returns the next `limit` upcoming Islamic religious occasions chronologically starting from today.
 */
export function getUpcomingIslamicOccasions(
  todayGregorian: GregorianDate,
  hijriAdjustment = 0,
  limit = 6
): UpcomingOccasion[] {
  const todayJdn = gregorianToJdn(todayGregorian.year, todayGregorian.month, todayGregorian.day);
  const todayHijri = gregorianToHijri(
    todayGregorian.year,
    todayGregorian.month,
    todayGregorian.day,
    hijriAdjustment
  );

  const candidates: UpcomingOccasion[] = [];
  for (const yearOffset of [0, 1]) {
    const hYear = todayHijri.year + yearOffset;
    for (const occasion of ISLAMIC_OCCASIONS) {
      const occGregJdn = hijriToJdn(hYear, occasion.month, occasion.day) - hijriAdjustment;
      const daysUntil = occGregJdn - todayJdn;
      if (daysUntil >= 0) {
        candidates.push({
          occasion,
          hijri: { year: hYear, month: occasion.month, day: occasion.day },
          gregorian: jdnToGregorian(occGregJdn),
          daysUntil,
        });
      }
    }
  }

  candidates.sort((a, b) => a.daysUntil - b.daysUntil);
  return candidates.slice(0, limit);
}

/**
 * Returns the Hijri year of the current or next upcoming Ramadan (month 9).
 */
export function getNextRamadanYear(todayHijri: HijriDate): number {
  return todayHijri.month > 9 ? todayHijri.year + 1 : todayHijri.year;
}

/**
 * Checks whether a Hijri month/day falls on one of the odd nights of the last 10 days of Ramadan.
 */
export function isRamadanLastTenOddNight(month: number, day: number): boolean {
  return month === 9 && (day === 21 || day === 23 || day === 25 || day === 27 || day === 29);
}

/**
 * Returns the 7 weekday indices (0=Sun..6=Sat) rotated to start at `firstDayOfWeek`.
 */
export function getOrderedWeekdayIndices(firstDayOfWeek: number): number[] {
  const start = ((Math.round(firstDayOfWeek) % 7) + 7) % 7;
  return Array.from({ length: 7 }, (_, i) => (start + i) % 7);
}

/**
 * Calculates how many leading empty cells precede the 1st day of the month
 * for a given starting weekday (0=Sun..6=Sat) and user's chosen `firstDayOfWeek`.
 */
export function getLeadingEmptyCells(firstCellWeekday: number, firstDayOfWeek: number): number {
  const cell = ((Math.round(firstCellWeekday) % 7) + 7) % 7;
  const start = ((Math.round(firstDayOfWeek) % 7) + 7) % 7;
  return (cell - start + 7) % 7;
}
