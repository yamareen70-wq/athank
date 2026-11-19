import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CITIES,
  filterCities,
  getCountries,
  getRegionsForCountry,
} from '../data/cities.ts';
import { DEFAULT_SETTINGS, sanitizeSettings } from './storage.ts';
import { buildDailyPrayerSchedule, getNextPrayerState } from './prayerMath.ts';
import { buildPersistentNotificationContent } from './systemServices.ts';

test('getCountries and getRegionsForCountry expose structured countries and regions', () => {
  const countries = getCountries();
  assert.ok(countries.length >= 20, `Expected at least 20 countries, got ${countries.length}`);

  const saRegions = getRegionsForCountry('SA');
  assert.ok(saRegions.length >= 10, `Expected at least 10 Saudi regions, got ${saRegions.length}`);

  const easternCities = filterCities({ countryCode: 'SA', regionEn: 'Eastern Province' });
  assert.ok(easternCities.some((c) => c.id === 'dammam'));
  assert.ok(easternCities.some((c) => c.id === 'khobar'));

  const upperEgypt = filterCities({ countryCode: 'EG', regionEn: 'Upper Egypt' });
  assert.ok(upperEgypt.some((c) => c.id === 'aswan'));
  assert.ok(upperEgypt.some((c) => c.id === 'luxor'));

  // Search by Arabic region name finds its cities
  const searchAsir = filterCities({ query: 'عسير' });
  assert.ok(searchAsir.some((c) => c.id === 'abha'));
});

test('sanitizeSettings preserves all user preferences and enriches legacy cities', () => {
  const sanitized = sanitizeSettings({
    city: {
      id: 'jeddah',
      nameAr: 'جدة',
      nameEn: 'Jeddah',
      countryAr: 'المملكة العربية السعودية',
      latitude: 21.4858,
      longitude: 39.1925,
      timeZone: 'Asia/Riyadh',
      defaultMethod: 'umm_al_qura',
    },
    language: 'en',
    method: 'mwl',
    methodCustomized: true,
    asrSchool: 'hanafi',
    dstMode: 'plus1',
    hijriAdjustment: 99, // should clamp to +2
    manualAdjustments: {
      fajr: -45, // should clamp to -30
      sunrise: 0,
      dhuhr: 5,
      asr: 0,
      maghrib: 0,
      isha: 10,
    },
    timeFormat: '24h',
    theme: 'dark',
    widget: {
      style: 'transparent',
      theme: 'emerald',
      showHijri: false,
      showCountdown: true,
      showAllPrayers: false,
      floatingEnabled: true,
    },
    system: {
      persistentNotificationEnabled: true,
      persistentShowAllPrayers: false,
      persistentShowHijri: true,
      timerStopwatchNotifEnabled: true,
      dndBypassEnabled: true,
      keepAwakeEnabled: true,
      batteryUnrestrictedAck: true,
    },
  });

  // Legacy Jeddah enriched with region & countryCode
  assert.equal(sanitized.city.countryCode, 'SA');
  assert.equal(sanitized.city.regionEn, 'Makkah Region');
  assert.equal(sanitized.language, 'en');
  assert.equal(sanitized.method, 'mwl');
  assert.equal(sanitized.methodCustomized, true);
  assert.equal(sanitized.asrSchool, 'hanafi');
  assert.equal(sanitized.dstMode, 'plus1');
  assert.equal(sanitized.hijriAdjustment, 2);
  assert.equal(sanitized.manualAdjustments.fajr, -30);
  assert.equal(sanitized.manualAdjustments.dhuhr, 5);
  assert.equal(sanitized.theme, 'dark');
  assert.equal(sanitized.widget.style, 'transparent');
  assert.equal(sanitized.widget.theme, 'emerald');
  assert.equal(sanitized.widget.floatingEnabled, true);
  assert.equal(sanitized.system.persistentNotificationEnabled, true);
  assert.equal(sanitized.system.keepAwakeEnabled, true);
  assert.equal(sanitized.system.batteryUnrestrictedAck, true);
});

test('sanitizeSettings gracefully falls back on malformed or empty data', () => {
  const fromNull = sanitizeSettings(null);
  assert.equal(fromNull.city.id, DEFAULT_SETTINGS.city.id);
  assert.equal(fromNull.widget.style, 'schedule');
  assert.equal(fromNull.system.persistentNotificationEnabled, false);
});

test('buildPersistentNotificationContent formats bilingual title and prayer summary', () => {
  const city = CITIES[0];
  const today = buildDailyPrayerSchedule({
    city,
    year: 2026,
    month: 6,
    day: 15,
    method: 'umm_al_qura',
    asrSchool: 'standard',
  });
  const tomorrow = buildDailyPrayerSchedule({
    city,
    year: 2026,
    month: 6,
    day: 16,
    method: 'umm_al_qura',
    asrSchool: 'standard',
  });
  const sampleNow = new Date(today.prayers[0].date.getTime() + 60 * 60_000);
  const nextState = getNextPrayerState(sampleNow, today, tomorrow);

  const arNotif = buildPersistentNotificationContent({
    cityLabel: city.nameAr,
    todaySchedule: today,
    nextPrayerState: nextState,
    timeFormat: '12h',
    language: 'ar',
    system: { ...DEFAULT_SETTINGS.system, persistentNotificationEnabled: true },
  });
  assert.ok(arNotif.title.includes('متبقي'));
  assert.ok(arNotif.body.includes(city.nameAr));
  assert.ok(arNotif.body.includes('الفجر'));

  const enNotif = buildPersistentNotificationContent({
    cityLabel: city.nameEn,
    todaySchedule: today,
    nextPrayerState: nextState,
    timeFormat: '24h',
    language: 'en',
    system: {
      ...DEFAULT_SETTINGS.system,
      persistentNotificationEnabled: true,
      persistentShowAllPrayers: false,
    },
  });
  assert.ok(enNotif.title.includes('in '));
  assert.ok(enNotif.body.includes('Riyadh'));
  assert.ok(!enNotif.body.includes('|'));
});

test('sanitizeSettings preserves custom minutes up to 180, new Adhan tones, custom phone audio name, and scheduledTasks', () => {
  const sanitized = sanitizeSettings({
    method: 'jordan',
    alerts: {
      byPrayer: {
        fajr: { enabled: true, atTime: true, beforeMinutes: 45, afterMinutes: 120, tone: 'aqsa_adhan' },
        sunrise: { enabled: false, atTime: false, beforeMinutes: 0, afterMinutes: 0, tone: 'fajr_dawn' },
        dhuhr: { enabled: true, atTime: true, beforeMinutes: 25, afterMinutes: 10, tone: 'custom' },
        asr: { enabled: true, atTime: true, beforeMinutes: 999, afterMinutes: 0, tone: 'madinah_adhan' },
        maghrib: { enabled: true, atTime: true, beforeMinutes: 7, afterMinutes: 3, tone: 'egypt_adhan' },
        isha: { enabled: true, atTime: true, beforeMinutes: 0, afterMinutes: 0, tone: 'takbir' },
      },
      defaultTone: 'custom',
      volume: 0.9,
      muted: false,
      customAudioName: 'my-adhan.mp3',
    },
    scheduledTasks: [
      {
        id: 't1',
        title: 'قراءة سورة الكهف',
        date: '2026-11-20',
        time: '10:00',
        notes: 'قبل صلاة الجمعة',
        enabled: true,
        completed: false,
        tone: 'fajr_dawn',
      },
    ],
  });

  assert.equal(sanitized.method, 'jordan');
  assert.equal(sanitized.alerts.defaultTone, 'custom');
  assert.equal(sanitized.alerts.customAudioName, 'my-adhan.mp3');
  assert.equal(sanitized.alerts.byPrayer.fajr.beforeMinutes, 45);
  assert.equal(sanitized.alerts.byPrayer.fajr.afterMinutes, 120);
  assert.equal(sanitized.alerts.byPrayer.fajr.tone, 'aqsa_adhan');
  assert.equal(sanitized.alerts.byPrayer.asr.beforeMinutes, 180);
  assert.equal(sanitized.alerts.byPrayer.dhuhr.tone, 'custom');
  assert.equal(sanitized.scheduledTasks.length, 1);
  assert.equal(sanitized.scheduledTasks[0].title, 'قراءة سورة الكهف');
  assert.equal(sanitized.scheduledTasks[0].tone, 'fajr_dawn');
});

test('sanitizeSettings preserves firstDayOfWeek, Wear OS preferences, and heavy-sleeper alarm challenges', () => {
  const sanitized = sanitizeSettings({
    firstDayOfWeek: 1,
    wearOs: {
      enabled: true,
      tileStyle: 'minimal_oled',
      ambientOled: true,
      vibrateOnAdhan: false,
      showQiblaComplication: true,
      showSeconds: false,
    },
    customAlarms: [
      {
        id: 'c1',
        title: 'استيقاظ الفجر',
        prayerKey: 'fajr',
        relation: 'before',
        offsetMinutes: 20,
        enabled: true,
        tone: 'makkah_adhan',
        challenge: {
          type: 'math',
          difficulty: 'medium',
          count: 3,
        },
        wakeUpCheckEnabled: true,
        wakeUpCheckDelayMinutes: 5,
      },
    ],
  });

  assert.equal(sanitized.firstDayOfWeek, 1);
  assert.equal(sanitized.wearOs.tileStyle, 'minimal_oled');
  assert.equal(sanitized.wearOs.ambientOled, true);
  assert.equal(sanitized.wearOs.vibrateOnAdhan, false);
  assert.equal(sanitized.wearOs.showSeconds, false);
  assert.equal(sanitized.customAlarms.length, 1);
  assert.equal(sanitized.customAlarms[0].challenge?.type, 'math');
  assert.equal(sanitized.customAlarms[0].challenge?.difficulty, 'medium');
  assert.equal(sanitized.customAlarms[0].challenge?.count, 3);
  assert.equal(sanitized.customAlarms[0].wakeUpCheckEnabled, true);
  assert.equal(sanitized.customAlarms[0].wakeUpCheckDelayMinutes, 5);
});

test('sanitizeSettings preserves SAI theme, preAlertMinutes, skippedDateKey & timerStopwatchNotifEnabled', () => {
  const sanitized = sanitizeSettings({
    saiThemeId: 'gold',
    system: {
      ...DEFAULT_SETTINGS.system,
      timerStopwatchNotifEnabled: false,
    },
    customAlarms: [
      {
        id: 'pre-1',
        title: 'سحور',
        prayerKey: 'fajr',
        relation: 'before',
        offsetMinutes: 45,
        enabled: true,
        tone: 'gentle',
        preAlertMinutes: 25,
        skippedDateKey: '2026-05-15',
      },
      {
        id: 'pre-2',
        title: 'clamp-test',
        prayerKey: 'dhuhr',
        relation: 'at',
        offsetMinutes: 0,
        enabled: true,
        tone: 'gentle',
        preAlertMinutes: 999,
        skippedDateKey: 'not-a-date',
      },
    ],
  });

  assert.equal(sanitized.saiThemeId, 'gold');
  assert.equal(sanitized.theme, 'dark');
  assert.equal(sanitized.system.timerStopwatchNotifEnabled, false);
  assert.equal(sanitized.customAlarms[0].preAlertMinutes, 25);
  assert.equal(sanitized.customAlarms[0].skippedDateKey, '2026-05-15');
  assert.equal(sanitized.customAlarms[1].preAlertMinutes, 120);
  assert.equal(sanitized.customAlarms[1].skippedDateKey, null);
});

