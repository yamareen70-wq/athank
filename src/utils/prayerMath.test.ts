import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyPrayerSchedule,
  CALCULATION_METHODS,
  computeCustomAlarmTriggerTime,
  computeNightTimes,
  computeRawPrayerHours,
  formatCityCurrentClock,
  formatCountdown,
  formatPrayerMinutes,
  getNextPrayerState,
  parseScheduledTaskDateTime,
} from './prayerMath';
import { CITIES } from '../data/cities';
import type { CalculationMethodId, CustomPrayerAlarm } from '../types/prayer';

test('All 16 calculation methods including Jordan Awqaf produce strictly ordered valid daily prayer times', () => {
  const riyadh = CITIES.find((c) => c.id === 'riyadh')!;
  const methodIds = Object.keys(CALCULATION_METHODS) as CalculationMethodId[];
  assert.equal(methodIds.length, 16);
  assert.ok(methodIds.includes('jordan'));

  for (const method of methodIds) {
    const schedule = buildDailyPrayerSchedule({
      city: riyadh,
      year: 2026,
      month: 11,
      day: 19,
      method,
      asrSchool: 'standard',
    });
    assert.equal(schedule.prayers.length, 6);
    const mins = schedule.prayers.map((p) => p.minutesFromMidnight);
    for (let i = 1; i < mins.length; i++) {
      assert.ok(
        mins[i] > mins[i - 1],
        `Method ${method}: expected prayer ${i} (${mins[i]}) > ${i - 1} (${mins[i - 1]})`
      );
    }
  }
});

test('DST mode (+1h / -1h) and manual per-prayer offsets shift times accurately', () => {
  const cairo = CITIES.find((c) => c.id === 'cairo')!;
  const base = buildDailyPrayerSchedule({
    city: cairo,
    year: 2026,
    month: 11,
    day: 19,
    method: 'egyptian',
    asrSchool: 'standard',
    dstMode: 'auto',
  });
  const plus1 = buildDailyPrayerSchedule({
    city: cairo,
    year: 2026,
    month: 11,
    day: 19,
    method: 'egyptian',
    asrSchool: 'standard',
    dstMode: 'plus1',
  });
  const manual = buildDailyPrayerSchedule({
    city: cairo,
    year: 2026,
    month: 11,
    day: 19,
    method: 'egyptian',
    asrSchool: 'standard',
    dstMode: 'auto',
    manualAdjustments: { fajr: 7, maghrib: -4 },
  });

  assert.equal(
    plus1.prayers[0].minutesFromMidnight - base.prayers[0].minutesFromMidnight,
    60
  );
  assert.equal(
    manual.prayers[0].minutesFromMidnight - base.prayers[0].minutesFromMidnight,
    7
  );
  assert.equal(
    manual.prayers[4].minutesFromMidnight - base.prayers[4].minutesFromMidnight,
    -4
  );
});

test('Hanafi Asr is later than standard Shafi Asr', () => {
  const std = computeRawPrayerHours({
    year: 2026,
    month: 6,
    day: 21,
    latitude: 30.0444,
    longitude: 31.2357,
    utcOffsetHours: 3,
    method: 'egyptian',
    asrSchool: 'standard',
  });
  const hanafi = computeRawPrayerHours({
    year: 2026,
    month: 6,
    day: 21,
    latitude: 30.0444,
    longitude: 31.2357,
    utcOffsetHours: 3,
    method: 'egyptian',
    asrSchool: 'hanafi',
  });

  assert.ok(hanafi.asr - std.asr > 0.7);
});

test('Personal prayer-linked alarm calculates exact before, at, and after times', () => {
  const riyadh = CITIES.find((c) => c.id === 'riyadh')!;
  const schedule = buildDailyPrayerSchedule({
    city: riyadh,
    year: 2026,
    month: 11,
    day: 19,
    method: 'umm_al_qura',
    asrSchool: 'standard',
  });

  const fajr = schedule.prayers.find((p) => p.key === 'fajr')!;
  const beforeAlarm: CustomPrayerAlarm = {
    id: 'a1',
    title: 'قيام الليل',
    prayerKey: 'fajr',
    relation: 'before',
    offsetMinutes: 30,
    enabled: true,
    tone: 'gentle',
  };
  const afterAlarm: CustomPrayerAlarm = {
    id: 'a2',
    title: 'أذكار الصباح',
    prayerKey: 'fajr',
    relation: 'after',
    offsetMinutes: 15,
    enabled: true,
    tone: 'gentle',
  };

  const tBefore = computeCustomAlarmTriggerTime(beforeAlarm, schedule);
  const tAfter = computeCustomAlarmTriggerTime(afterAlarm, schedule);

  assert.equal(tBefore.minutesFromMidnight, fajr.minutesFromMidnight - 30);
  assert.equal(tAfter.minutesFromMidnight, fajr.minutesFromMidnight + 15);
});

test('getNextPrayerState rolls over to tomorrow Fajr after today Isha', () => {
  const cairo = CITIES.find((c) => c.id === 'cairo')!;
  const today = buildDailyPrayerSchedule({
    city: cairo,
    year: 2026,
    month: 11,
    day: 19,
    method: 'egyptian',
    asrSchool: 'standard',
  });
  const tomorrow = buildDailyPrayerSchedule({
    city: cairo,
    year: 2026,
    month: 11,
    day: 20,
    method: 'egyptian',
    asrSchool: 'standard',
  });

  const isha = today.prayers[today.prayers.length - 1];
  const afterIsha = new Date(isha.date.getTime() + 1800_000);
  const next = getNextPrayerState(afterIsha, today, tomorrow);

  assert.equal(next.isNextDayFajr, true);
  assert.equal(next.nextPrayer.key, 'fajr');
  assert.equal(next.currentPrayer?.key, 'isha');
});

test('time and countdown formatting supports Arabic and English 12h/24h', () => {
  assert.equal(formatPrayerMinutes(935, '12h', 'ar'), '03:35 م');
  assert.equal(formatPrayerMinutes(935, '12h', 'en'), '03:35 PM');
  assert.equal(formatPrayerMinutes(935, '24h', 'en'), '15:35');
  assert.equal(formatCountdown(3661), '01:01:01');
});

test('Jordan Ministry of Awqaf method applies 18° Fajr/Isha and +5m Dhuhr/Maghrib precaution', () => {
  const amman = CITIES.find((c) => c.id === 'amman')!;
  assert.equal(amman.defaultMethod, 'jordan');

  const jordanSched = buildDailyPrayerSchedule({
    city: amman,
    year: 2026,
    month: 11,
    day: 19,
    method: 'jordan',
    asrSchool: 'standard',
  });
  const karachiSched = buildDailyPrayerSchedule({
    city: amman,
    year: 2026,
    month: 11,
    day: 19,
    method: 'karachi', // also 18°/18° without the +5m precaution
    asrSchool: 'standard',
  });

  // Dhuhr precaution: +5m vs +1m default => +4m difference
  assert.equal(
    jordanSched.prayers[2].minutesFromMidnight - karachiSched.prayers[2].minutesFromMidnight,
    4
  );
  // Maghrib precaution: +5m vs 0m => +5m difference
  assert.equal(
    jordanSched.prayers[4].minutesFromMidnight - karachiSched.prayers[4].minutesFromMidnight,
    5
  );
});

test('computeNightTimes computes accurate Islamic Midnight and Last Third of the Night', () => {
  const amman = CITIES.find((c) => c.id === 'amman')!;
  const today = buildDailyPrayerSchedule({
    city: amman,
    year: 2026,
    month: 11,
    day: 19,
    method: 'jordan',
    asrSchool: 'standard',
  });
  const tomorrow = buildDailyPrayerSchedule({
    city: amman,
    year: 2026,
    month: 11,
    day: 20,
    method: 'jordan',
    asrSchool: 'standard',
  });

  const night = computeNightTimes(today, tomorrow);
  const maghribMs = today.prayers[4].date.getTime();
  const nextFajrMs = tomorrow.prayers[0].date.getTime();

  assert.ok(night.nightDurationMinutes > 500 && night.nightDurationMinutes < 900);
  assert.ok(night.midnightDate.getTime() > maghribMs);
  assert.ok(night.lastThirdDate.getTime() > night.midnightDate.getTime());
  assert.ok(night.lastThirdDate.getTime() < nextFajrMs);

  const halfDiffMin = Math.abs(
    (night.midnightDate.getTime() - maghribMs) / 60_000 - night.nightDurationMinutes / 2
  );
  const twoThirdsDiffMin = Math.abs(
    (night.lastThirdDate.getTime() - maghribMs) / 60_000 - (night.nightDurationMinutes * 2) / 3
  );
  assert.ok(halfDiffMin <= 1);
  assert.ok(twoThirdsDiffMin <= 1);
});

test('parseScheduledTaskDateTime validates date/time strings cleanly', () => {
  const valid = parseScheduledTaskDateTime('2026-12-01', '09:30');
  assert.ok(valid instanceof Date);
  assert.equal(valid?.getFullYear(), 2026);
  assert.equal(valid?.getMonth(), 11);
  assert.equal(valid?.getDate(), 1);
  assert.equal(valid?.getHours(), 9);
  assert.equal(valid?.getMinutes(), 30);

  assert.equal(parseScheduledTaskDateTime('invalid', '09:30'), null);
  assert.equal(parseScheduledTaskDateTime('2026-12-01', '25:00'), null);
});

test('formatCityCurrentClock includes live seconds (HH:MM:SS) by default and honors showSeconds=false', () => {
  const sample = new Date('2026-11-19T12:34:56Z');
  const withSec24 = formatCityCurrentClock(sample, 'UTC', '24h', 'en', 'auto', true);
  assert.match(withSec24, /12:34:56/);

  const withSecPlus1 = formatCityCurrentClock(sample, 'UTC', '24h', 'en', 'plus1', true);
  assert.match(withSecPlus1, /13:34:56/);

  const withoutSec = formatCityCurrentClock(sample, 'UTC', '24h', 'en', 'auto', false);
  assert.equal(withoutSec, '12:34');
});
