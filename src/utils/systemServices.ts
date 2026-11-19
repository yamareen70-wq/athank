import { useEffect, useState } from 'react';
import type {
  CustomPrayerAlarm,
  DailyPrayerSchedule,
  Language,
  NextPrayerState,
  SystemPreferences,
  TimeFormat,
} from '../types/prayer';
import {
  computeCustomAlarmTriggerTime,
  formatCountdown,
  formatPrayerMinutes,
} from './prayerMath';
import { getPrayerName } from './i18n';

export const PERSISTENT_NOTIFICATION_TAG = 'mawaqit-persistent-prayer-bar';
export const TIMER_NOTIFICATION_TAG = 'mawaqit-timer-live';
export const STOPWATCH_NOTIFICATION_TAG = 'mawaqit-stopwatch-live';
export const PRE_ALARM_NOTIFICATION_TAG_PREFIX = 'mawaqit-prealarm-';

export interface ActivePreAlertAlarm {
  alarm: CustomPrayerAlarm;
  triggerMinutesFromMidnight: number;
  triggerDate: Date;
  remainingSeconds: number;
  isPreview?: boolean;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface SystemPermissionSnapshot {
  notification: NotificationPermission | 'unsupported';
  geolocation: PermissionState | 'unsupported';
  wakeLockSupported: boolean;
  wakeLockActive: boolean;
  storagePersisted: boolean | null;
  serviceWorkerReady: boolean;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/** Format whole seconds as HH:MM:SS for Timer notification display */
export function formatTimerDurationHms(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Format milliseconds as MM:SS.cc (or HH:MM:SS.cc if >= 1 hour) for Stopwatch notification display */
export function formatStopwatchDuration(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  const centis = Math.floor((safe % 1000) / 10);
  const base = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${base}` : base;
}

/** Check whether a personal alarm was explicitly skipped once for a specific calendar date */
export function isPersonalAlarmSkippedForDate(
  alarm: Pick<CustomPrayerAlarm, 'skippedDateKey'>,
  dateKey: string
): boolean {
  return Boolean(alarm.skippedDateKey && alarm.skippedDateKey === dateKey);
}

/**
 * Compute all personal alarms currently inside their user-configured pre-alert window
 * (e.g., 15 minutes before trigger), excluding disabled alarms and alarms skipped once today.
 */
export function getActivePreAlertPersonalAlarms(params: {
  alarms: CustomPrayerAlarm[];
  todaySchedule: DailyPrayerSchedule;
  nowMs: number;
  previewIds?: Iterable<string>;
}): ActivePreAlertAlarm[] {
  const { alarms, todaySchedule, nowMs, previewIds } = params;
  const previewSet = new Set(previewIds ?? []);
  const results: ActivePreAlertAlarm[] = [];

  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    if (isPersonalAlarmSkippedForDate(alarm, todaySchedule.dateKey)) continue;

    const preMin = Math.max(0, Math.min(120, Math.round(alarm.preAlertMinutes ?? 0)));
    const trigger = computeCustomAlarmTriggerTime(alarm, todaySchedule);
    const triggerMs = trigger.date.getTime();
    const windowStartMs = triggerMs - preMin * 60_000;

    const inLiveWindow = preMin > 0 && nowMs >= windowStartMs && nowMs < triggerMs;
    const isPreview = previewSet.has(alarm.id);

    if (inLiveWindow || isPreview) {
      const remainingSeconds = inLiveWindow
        ? Math.max(1, Math.ceil((triggerMs - nowMs) / 1000))
        : Math.max(60, (preMin || 15) * 60);

      results.push({
        alarm,
        triggerMinutesFromMidnight: trigger.minutesFromMidnight,
        triggerDate: trigger.date,
        remainingSeconds,
        isPreview: !inLiveWindow && isPreview,
      });
    }
  }

  return results.sort((a, b) => a.remainingSeconds - b.remainingSeconds);
}

export function buildTimerNotificationContent(params: {
  label: string;
  remainingSeconds: number;
  running: boolean;
  language: Language;
}): { title: string; body: string } {
  const { label, remainingSeconds, running, language } = params;
  const formatted = formatTimerDurationHms(remainingSeconds);
  const cleanLabel = label.trim();

  if (language === 'ar') {
    const title = cleanLabel
      ? `المؤقت (${cleanLabel}) · ${formatted}`
      : `المؤقت التنازلي · ${formatted}`;
    const body = running
      ? 'المؤقت قيد التشغيل في شريط الإشعارات'
      : 'المؤقت متوقف مؤقتاً — اضغط للاستئناف أو إعادة الضبط';
    return { title, body };
  }

  const title = cleanLabel ? `Timer (${cleanLabel}) · ${formatted}` : `Countdown Timer · ${formatted}`;
  const body = running
    ? 'Timer is running live in your notification bar'
    : 'Timer paused — tap to resume or reset';
  return { title, body };
}

export function buildStopwatchNotificationContent(params: {
  elapsedMs: number;
  running: boolean;
  lapsCount: number;
  language: Language;
}): { title: string; body: string } {
  const { elapsedMs, running, lapsCount, language } = params;
  const formatted = formatStopwatchDuration(elapsedMs);

  if (language === 'ar') {
    const title = `ساعة الإيقاف · ${formatted}`;
    const lapPart = lapsCount > 0 ? ` · ${lapsCount} جولات` : '';
    const body = running ? `قيد القياس الآن${lapPart}` : `متوقفة مؤقتاً${lapPart}`;
    return { title, body };
  }

  const title = `Stopwatch · ${formatted}`;
  const lapPart = lapsCount > 0 ? ` · ${lapsCount} laps` : '';
  const body = running ? `Running live${lapPart}` : `Paused${lapPart}`;
  return { title, body };
}

export function buildPreAlarmNotificationContent(params: {
  alarm: CustomPrayerAlarm;
  triggerTimeFormatted: string;
  remainingSeconds: number;
  language: Language;
}): { title: string; body: string } {
  const { alarm, triggerTimeFormatted, remainingSeconds, language } = params;
  const mins = Math.max(1, Math.ceil(remainingSeconds / 60));

  if (language === 'ar') {
    return {
      title: `منبه قادم: ${alarm.title}`,
      body: `سيعمل بعد ${mins} دقيقة عند ${triggerTimeFormatted} — يمكنك تجاهله لهذه المرة فقط من شريط الإشعارات.`,
    };
  }

  return {
    title: `Upcoming Alarm: ${alarm.title}`,
    body: `Rings in ${mins} min at ${triggerTimeFormatted} — you can skip this occurrence from the notification bar.`,
  };
}

export function buildPersistentNotificationContent(params: {
  cityLabel: string;
  todaySchedule: DailyPrayerSchedule;
  nextPrayerState: NextPrayerState;
  timeFormat: TimeFormat;
  language: Language;
  system: SystemPreferences;
}): { title: string; body: string } {
  const { cityLabel, todaySchedule, nextPrayerState, timeFormat, language, system } = params;
  const nextName = getPrayerName(nextPrayerState.nextPrayer.key, language);
  const nextTime = formatPrayerMinutes(
    nextPrayerState.nextPrayer.minutesFromMidnight,
    timeFormat,
    language
  );
  const cd = formatCountdown(nextPrayerState.remainingSeconds);
  const remainingShort = cd.slice(0, 5); // HH:MM

  const title =
    language === 'ar'
      ? `${nextName} ${nextTime} · متبقي ${remainingShort}`
      : `${nextName} ${nextTime} · in ${remainingShort}`;

  const lines: string[] = [];
  if (system.persistentShowHijri) {
    const hijri = language === 'ar' ? todaySchedule.hijriDateAr : todaySchedule.hijriDateEn;
    lines.push(`${cityLabel} · ${hijri}`);
  } else {
    lines.push(cityLabel);
  }

  if (system.persistentShowAllPrayers) {
    const fardList = todaySchedule.prayers
      .filter((p) => p.isFard)
      .map(
        (p) =>
          `${getPrayerName(p.key, language)} ${formatPrayerMinutes(p.minutesFromMidnight, timeFormat, language)}`
      )
      .join(' | ');
    lines.push(fardList);
  }

  return { title, body: lines.join('\n') };
}

async function showTaggedSystemNotification(params: {
  tag: string;
  title: string;
  body: string;
  language: Language;
  silent?: boolean;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(params.title, {
          body: params.body,
          tag: params.tag,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          silent: params.silent ?? true,
          requireInteraction: true,
          dir: params.language === 'ar' ? 'rtl' : 'ltr',
          lang: params.language,
        });
        return true;
      }
    }

    new Notification(params.title, {
      body: params.body,
      tag: params.tag,
      icon: '/pwa-192x192.png',
      silent: params.silent ?? true,
      requireInteraction: true,
      dir: params.language === 'ar' ? 'rtl' : 'ltr',
      lang: params.language,
    });
    return true;
  } catch {
    return false;
  }
}

async function closeTaggedSystemNotification(tag: string): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const notifications = await reg.getNotifications({ tag });
    for (const n of notifications) {
      n.close();
    }
  } catch {
    // Ignore notification cleanup errors
  }
}

export async function syncPersistentSystemNotification(params: {
  enabled: boolean;
  cityLabel: string;
  todaySchedule: DailyPrayerSchedule;
  nextPrayerState: NextPrayerState;
  timeFormat: TimeFormat;
  language: Language;
  system: SystemPreferences;
}): Promise<boolean> {
  if (!params.enabled) {
    await closeTaggedSystemNotification(PERSISTENT_NOTIFICATION_TAG);
    return false;
  }
  const { title, body } = buildPersistentNotificationContent(params);
  return showTaggedSystemNotification({
    tag: PERSISTENT_NOTIFICATION_TAG,
    title,
    body,
    language: params.language,
    silent: true,
  });
}

export async function closePersistentSystemNotification(): Promise<void> {
  return closeTaggedSystemNotification(PERSISTENT_NOTIFICATION_TAG);
}

export async function syncTimerSystemNotification(params: {
  active: boolean;
  label: string;
  remainingSeconds: number;
  running: boolean;
  language: Language;
}): Promise<boolean> {
  if (!params.active) {
    await closeTaggedSystemNotification(TIMER_NOTIFICATION_TAG);
    return false;
  }
  const { title, body } = buildTimerNotificationContent(params);
  return showTaggedSystemNotification({
    tag: TIMER_NOTIFICATION_TAG,
    title,
    body,
    language: params.language,
    silent: true,
  });
}

export async function closeTimerSystemNotification(): Promise<void> {
  return closeTaggedSystemNotification(TIMER_NOTIFICATION_TAG);
}

export async function syncStopwatchSystemNotification(params: {
  active: boolean;
  elapsedMs: number;
  running: boolean;
  lapsCount: number;
  language: Language;
}): Promise<boolean> {
  if (!params.active) {
    await closeTaggedSystemNotification(STOPWATCH_NOTIFICATION_TAG);
    return false;
  }
  const { title, body } = buildStopwatchNotificationContent(params);
  return showTaggedSystemNotification({
    tag: STOPWATCH_NOTIFICATION_TAG,
    title,
    body,
    language: params.language,
    silent: true,
  });
}

export async function closeStopwatchSystemNotification(): Promise<void> {
  return closeTaggedSystemNotification(STOPWATCH_NOTIFICATION_TAG);
}

export async function syncPreAlarmSystemNotification(params: {
  alarm: CustomPrayerAlarm;
  triggerTimeFormatted: string;
  remainingSeconds: number;
  language: Language;
}): Promise<boolean> {
  const { title, body } = buildPreAlarmNotificationContent(params);
  return showTaggedSystemNotification({
    tag: `${PRE_ALARM_NOTIFICATION_TAG_PREFIX}${params.alarm.id}`,
    title,
    body,
    language: params.language,
    silent: false,
  });
}

export async function closePreAlarmSystemNotification(alarmId: string): Promise<void> {
  return closeTaggedSystemNotification(`${PRE_ALARM_NOTIFICATION_TAG_PREFIX}${alarmId}`);
}

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: string, listener: () => void) => void;
}

class WakeLockController {
  private sentinel: WakeLockSentinelLike | null = null;

  get isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  get isActive(): boolean {
    return Boolean(this.sentinel && !this.sentinel.released);
  }

  async acquire(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      const nav = navigator as unknown as {
        wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
      };
      this.sentinel = await nav.wakeLock.request('screen');
      return true;
    } catch {
      this.sentinel = null;
      return false;
    }
  }

  async release(): Promise<void> {
    if (!this.sentinel) return;
    try {
      await this.sentinel.release();
    } catch {
      // Ignore release errors
    } finally {
      this.sentinel = null;
    }
  }
}

export const wakeLockController = new WakeLockController();

export async function requestPersistentStorage(): Promise<boolean | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return null;
  try {
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function inspectSystemPermissions(): Promise<SystemPermissionSnapshot> {
  const notification: NotificationPermission | 'unsupported' =
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported';

  let geolocation: PermissionState | 'unsupported' =
    typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'prompt' : 'unsupported';

  if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      geolocation = status.state;
    } catch {
      // Some browsers restrict permissions.query for geolocation
    }
  }

  let storagePersisted: boolean | null = null;
  if (typeof navigator !== 'undefined' && navigator.storage?.persisted) {
    try {
      storagePersisted = await navigator.storage.persisted();
    } catch {
      storagePersisted = null;
    }
  }

  let serviceWorkerReady = false;
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      serviceWorkerReady = Boolean(reg);
    } catch {
      serviceWorkerReady = false;
    }
  }

  return {
    notification,
    geolocation,
    wakeLockSupported: wakeLockController.isSupported,
    wakeLockActive: wakeLockController.isActive,
    storagePersisted,
    serviceWorkerReady,
  };
}
