import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CITY } from '../data/cities';
import type { CustomPrayerAlarm } from '../types/prayer';
import { buildDailyPrayerSchedule, computeCustomAlarmTriggerTime, ZERO_MANUAL_ADJUSTMENTS } from './prayerMath';
import {
  buildPreAlarmNotificationContent,
  buildStopwatchNotificationContent,
  buildTimerNotificationContent,
  formatStopwatchDuration,
  formatTimerDurationHms,
  getActivePreAlertPersonalAlarms,
  isPersonalAlarmSkippedForDate,
} from './systemServices';

const SAMPLE_SCHEDULE = buildDailyPrayerSchedule({
  city: DEFAULT_CITY,
  year: 2026,
  month: 5,
  day: 15,
  method: 'umm_al_qura',
  asrSchool: 'standard',
  dstMode: 'auto',
  manualAdjustments: ZERO_MANUAL_ADJUSTMENTS,
  hijriAdjustment: 0,
});

const BASE_ALARM: CustomPrayerAlarm = {
  id: 'alarm-1',
  title: 'قيام الليل',
  prayerKey: 'fajr',
  relation: 'before',
  offsetMinutes: 30,
  enabled: true,
  tone: 'gentle',
  preAlertMinutes: 15,
  skippedDateKey: null,
};

describe('Personal Alarm Pre-Alert & Skip-Once logic', () => {
  it('activates inside the user-defined pre-alert window and not outside it', () => {
    const trigger = computeCustomAlarmTriggerTime(BASE_ALARM, SAMPLE_SCHEDULE);
    const triggerMs = trigger.date.getTime();

    // 20 min before trigger (outside 15m window)
    const tooEarly = getActivePreAlertPersonalAlarms({
      alarms: [BASE_ALARM],
      todaySchedule: SAMPLE_SCHEDULE,
      nowMs: triggerMs - 20 * 60_000,
    });
    assert.equal(tooEarly.length, 0);

    // 10 min before trigger (inside 15m window)
    const inside = getActivePreAlertPersonalAlarms({
      alarms: [BASE_ALARM],
      todaySchedule: SAMPLE_SCHEDULE,
      nowMs: triggerMs - 10 * 60_000,
    });
    assert.equal(inside.length, 1);
    assert.equal(inside[0].alarm.id, 'alarm-1');
    assert.equal(inside[0].remainingSeconds, 600);
    assert.equal(inside[0].isPreview, false);

    // After trigger time
    const after = getActivePreAlertPersonalAlarms({
      alarms: [BASE_ALARM],
      todaySchedule: SAMPLE_SCHEDULE,
      nowMs: triggerMs + 1000,
    });
    assert.equal(after.length, 0);
  });

  it('skips only the specified calendar date and still triggers on the next day', () => {
    const skippedToday: CustomPrayerAlarm = {
      ...BASE_ALARM,
      skippedDateKey: SAMPLE_SCHEDULE.dateKey,
    };

    assert.equal(isPersonalAlarmSkippedForDate(skippedToday, SAMPLE_SCHEDULE.dateKey), true);
    assert.equal(isPersonalAlarmSkippedForDate(skippedToday, '2026-05-16'), false);

    const trigger = computeCustomAlarmTriggerTime(skippedToday, SAMPLE_SCHEDULE);
    const insideToday = getActivePreAlertPersonalAlarms({
      alarms: [skippedToday],
      todaySchedule: SAMPLE_SCHEDULE,
      nowMs: trigger.date.getTime() - 5 * 60_000,
    });
    assert.equal(insideToday.length, 0);

    const tomorrowSchedule = buildDailyPrayerSchedule({
      city: DEFAULT_CITY,
      year: 2026,
      month: 5,
      day: 16,
      method: 'umm_al_qura',
      asrSchool: 'standard',
      dstMode: 'auto',
      manualAdjustments: ZERO_MANUAL_ADJUSTMENTS,
      hijriAdjustment: 0,
    });
    const tomorrowTrigger = computeCustomAlarmTriggerTime(skippedToday, tomorrowSchedule);
    const insideTomorrow = getActivePreAlertPersonalAlarms({
      alarms: [skippedToday],
      todaySchedule: tomorrowSchedule,
      nowMs: tomorrowTrigger.date.getTime() - 5 * 60_000,
    });
    assert.equal(insideTomorrow.length, 1);
  });

  it('supports previewing a pre-alert notification outside the live window', () => {
    const trigger = computeCustomAlarmTriggerTime(BASE_ALARM, SAMPLE_SCHEDULE);
    const previewed = getActivePreAlertPersonalAlarms({
      alarms: [BASE_ALARM],
      todaySchedule: SAMPLE_SCHEDULE,
      nowMs: trigger.date.getTime() - 120 * 60_000,
      previewIds: ['alarm-1'],
    });
    assert.equal(previewed.length, 1);
    assert.equal(previewed[0].isPreview, true);
  });
});

describe('Timer, Stopwatch & Pre-Alarm notification formatters', () => {
  it('formats timer HMS and stopwatch durations accurately', () => {
    assert.equal(formatTimerDurationHms(3665), '01:01:05');
    assert.equal(formatTimerDurationHms(0), '00:00:00');
    assert.equal(formatStopwatchDuration(65_430), '01:05.43');
    assert.equal(formatStopwatchDuration(3_661_050), '01:01:01.05');
  });

  it('builds localized Timer, Stopwatch & Pre-Alarm notification payloads', () => {
    const timerAr = buildTimerNotificationContent({
      label: 'الإقامة',
      remainingSeconds: 600,
      running: true,
      language: 'ar',
    });
    assert.match(timerAr.title, /الإقامة/);
    assert.match(timerAr.title, /00:10:00/);

    const swEn = buildStopwatchNotificationContent({
      elapsedMs: 12_500,
      running: true,
      lapsCount: 2,
      language: 'en',
    });
    assert.match(swEn.title, /00:12\.50/);
    assert.match(swEn.body, /2 laps/);

    const preAr = buildPreAlarmNotificationContent({
      alarm: BASE_ALARM,
      triggerTimeFormatted: '03:45 ص',
      remainingSeconds: 900,
      language: 'ar',
    });
    assert.match(preAr.title, /قيام الليل/);
    assert.match(preAr.body, /15/);
  });
});
