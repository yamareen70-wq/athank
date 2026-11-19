import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ShieldAlert, X } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CityPickerModal } from './components/CityPickerModal';
import { AdhanAlertBanner, type ActiveAdhanAlert } from './components/AdhanAlertBanner';
import {
  AlarmChallengeModal,
  WakeUpCheckModal,
  type ActiveChallengeSession,
} from './components/AlarmChallengeModal';
import { PersistentNotificationBar } from './components/PersistentNotificationBar';
import { HomeWidgetCard } from './components/HomeWidgetCard';
import { WearOsWatchView } from './components/WearOsWatchView';
import { OfflineIndicator } from './components/PWAInstallButton';
import { PrayerTimesView } from './components/PrayerTimesView';
import { QiblaCompassView } from './components/QiblaCompassView';
import { HijriCalendarView } from './components/HijriCalendarView';
import { AlarmsView, type AlarmsSubTab } from './components/AlarmsView';
import { SettingsView, type SettingsCategory } from './components/SettingsView';
import type { StopwatchState, TimerState } from './components/TimerStopwatchPanels';
import {
  applySaiThemeToDocument,
  DEFAULT_DARK_SAI_THEME_ID,
  DEFAULT_LIGHT_SAI_THEME_ID,
  getSaiThemeById,
  type SaiThemeId,
} from './data/saiThemes';
import type {
  AdhanToneId,
  AppSettings,
  AppTab,
  AsrSchool,
  CalculationMethodId,
  CityLocation,
  CustomPrayerAlarm,
  DstMode,
  FirstDayOfWeek,
  Language,
  PrayerAlertConfig,
  PrayerKey,
  ScheduledTaskAlarm,
  SystemPreferences,
  ThemeMode,
  TimeFormat,
  WearOsPreferences,
  WidgetPreferences,
} from './types/prayer';
import {
  addCalendarDays,
  buildDailyPrayerSchedule,
  computeCustomAlarmTriggerTime,
  formatPrayerMinutes,
  getNextPrayerState,
  getZonedDateParts,
  ORDERED_PRAYER_KEYS,
  parseScheduledTaskDateTime,
  ZERO_MANUAL_ADJUSTMENTS,
} from './utils/prayerMath';
import {
  adhanAudio,
  deleteCustomAudioFile,
  saveCustomAudioFile,
  sendBrowserNotification,
} from './utils/adhanAudio';
import { loadSettings, resetSettings, saveSettings, STORAGE_KEY } from './utils/storage';
import {
  closePersistentSystemNotification,
  closePreAlarmSystemNotification,
  closeStopwatchSystemNotification,
  closeTimerSystemNotification,
  getActivePreAlertPersonalAlarms,
  isPersonalAlarmSkippedForDate,
  syncPersistentSystemNotification,
  syncPreAlarmSystemNotification,
  syncStopwatchSystemNotification,
  syncTimerSystemNotification,
  wakeLockController,
} from './utils/systemServices';
import { T, getPrayerName } from './utils/i18n';

function readInitialRoute(): {
  tab: AppTab;
  standaloneWidget: boolean;
  standaloneWearOs: boolean;
} {
  if (typeof window === 'undefined') {
    return { tab: 'prayers', standaloneWidget: false, standaloneWearOs: false };
  }
  const params = new URLSearchParams(window.location.search);
  const standaloneWidget = params.get('widget') === '1';
  const standaloneWearOs = params.get('wear') === '1';
  const rawTab = params.get('tab');
  const validTabs: AppTab[] = ['prayers', 'qibla', 'calendar', 'alarms', 'settings'];
  const tab = validTabs.includes(rawTab as AppTab) ? (rawTab as AppTab) : 'prayers';
  return { tab, standaloneWidget, standaloneWearOs };
}

export default function App() {
  const initialRoute = useMemo(() => readInitialRoute(), []);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [activeTab, setActiveTab] = useState<AppTab>(initialRoute.tab);
  const [alarmsSubTab, setAlarmsSubTab] = useState<AlarmsSubTab>('prayers');
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>('calc');
  const [previewPreAlarmIds, setPreviewPreAlarmIds] = useState<string[]>([]);
  const [isStandaloneWidget, setIsStandaloneWidget] = useState<boolean>(
    initialRoute.standaloneWidget
  );
  const [isStandaloneWearOs, setIsStandaloneWearOs] = useState<boolean>(
    initialRoute.standaloneWearOs
  );
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [activeAlert, setActiveAlert] = useState<ActiveAdhanAlert | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallengeSession | null>(null);
  const [pendingWakeUpCheck, setPendingWakeUpCheck] = useState<{
    alarm: CustomPrayerAlarm;
    triggerAtMs: number;
  } | null>(null);
  const [activeWakeUpCheck, setActiveWakeUpCheck] = useState<{
    alarm: CustomPrayerAlarm;
    expiresAtMs: number;
  } | null>(null);
  const [timerState, setTimerState] = useState<TimerState>({
    durationSeconds: 300,
    remainingSeconds: 300,
    running: false,
    endTimestampMs: null,
    label: '',
    tone: 'gentle',
  });
  const [stopwatchState, setStopwatchState] = useState<StopwatchState>({
    accumulatedMs: 0,
    startedAtMs: null,
    running: false,
    laps: [],
  });
  const [isPlayingAdhan, setIsPlayingAdhan] = useState<boolean>(false);
  const [playingToneId, setPlayingToneId] = useState<AdhanToneId | null>(null);
  const firedAlertsRef = useRef<Set<string>>(new Set());
  const notifiedPreAlertsRef = useRef<Set<string>>(new Set());

  const t = T[settings.language];

  // Register PWA Service Worker once for offline support & OS notification bar integration
  useEffect(() => {
    try {
      registerSW({ immediate: true });
    } catch {
      // Safe fallback when SW registration is unavailable in restricted previews
    }
  }, []);

  // Sync authentic Aefyr/SAI theme CSS variables, .dark class, native color-scheme, theme-color meta tag & RTL/LTR
  useEffect(() => {
    const activeSaiTheme = getSaiThemeById(settings.saiThemeId);
    applySaiThemeToDocument(activeSaiTheme);
    const root = document.documentElement;
    root.lang = settings.language;
    root.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.title =
      settings.language === 'ar'
        ? 'مواقيت — أوقات الصلاة وتنبيهات الأذان واتجاه القبلة'
        : 'Mawaqit — Prayer Times, Adhan Alerts & Qibla Compass';
  }, [settings.saiThemeId, settings.theme, settings.language]);

  // Persist every preference change automatically
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Keep multiple open tabs (e.g., Main App + Standalone Widget) synced live via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSettings(loadSettings());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Manage Screen Wake Lock lifecycle to prevent system sleep while enabled
  useEffect(() => {
    let active = true;
    const syncWakeLock = async () => {
      if (settings.system.keepAwakeEnabled && document.visibilityState === 'visible') {
        await wakeLockController.acquire();
      } else {
        await wakeLockController.release();
      }
    };
    syncWakeLock();

    const onVisibility = () => {
      if (active) syncWakeLock();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisibility);
      wakeLockController.release();
    };
  }, [settings.system.keepAwakeEnabled]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      window.clearInterval(interval);
      adhanAudio.stop();
    };
  }, []);

  const todayParts = useMemo(
    () => getZonedDateParts(now, settings.city.timeZone),
    [now, settings.city.timeZone]
  );

  const todaySchedule = useMemo(
    () =>
      buildDailyPrayerSchedule({
        city: settings.city,
        year: todayParts.year,
        month: todayParts.month,
        day: todayParts.day,
        method: settings.method,
        asrSchool: settings.asrSchool,
        dstMode: settings.dstMode,
        manualAdjustments: settings.manualAdjustments,
        hijriAdjustment: settings.hijriAdjustment,
      }),
    [
      settings.city,
      todayParts.year,
      todayParts.month,
      todayParts.day,
      settings.method,
      settings.asrSchool,
      settings.dstMode,
      settings.manualAdjustments,
      settings.hijriAdjustment,
    ]
  );

  const tomorrowSchedule = useMemo(() => {
    const tomorrowParts = addCalendarDays(todayParts.year, todayParts.month, todayParts.day, 1);
    return buildDailyPrayerSchedule({
      city: settings.city,
      year: tomorrowParts.year,
      month: tomorrowParts.month,
      day: tomorrowParts.day,
      method: settings.method,
      asrSchool: settings.asrSchool,
      dstMode: settings.dstMode,
      manualAdjustments: settings.manualAdjustments,
      hijriAdjustment: settings.hijriAdjustment,
    });
  }, [
    settings.city,
    todayParts.year,
    todayParts.month,
    todayParts.day,
    settings.method,
    settings.asrSchool,
    settings.dstMode,
    settings.manualAdjustments,
    settings.hijriAdjustment,
  ]);

  const viewedSchedule = useMemo(() => {
    if (dayOffset === 0) return todaySchedule;
    const targetParts = addCalendarDays(
      todayParts.year,
      todayParts.month,
      todayParts.day,
      dayOffset
    );
    return buildDailyPrayerSchedule({
      city: settings.city,
      year: targetParts.year,
      month: targetParts.month,
      day: targetParts.day,
      method: settings.method,
      asrSchool: settings.asrSchool,
      dstMode: settings.dstMode,
      manualAdjustments: settings.manualAdjustments,
      hijriAdjustment: settings.hijriAdjustment,
    });
  }, [
    dayOffset,
    todaySchedule,
    settings.city,
    todayParts.year,
    todayParts.month,
    todayParts.day,
    settings.method,
    settings.asrSchool,
    settings.dstMode,
    settings.manualAdjustments,
    settings.hijriAdjustment,
  ]);

  const viewedNextSchedule = useMemo(() => {
    if (dayOffset === 0) return tomorrowSchedule;
    const nextParts = addCalendarDays(
      todayParts.year,
      todayParts.month,
      todayParts.day,
      dayOffset + 1
    );
    return buildDailyPrayerSchedule({
      city: settings.city,
      year: nextParts.year,
      month: nextParts.month,
      day: nextParts.day,
      method: settings.method,
      asrSchool: settings.asrSchool,
      dstMode: settings.dstMode,
      manualAdjustments: settings.manualAdjustments,
      hijriAdjustment: settings.hijriAdjustment,
    });
  }, [
    dayOffset,
    tomorrowSchedule,
    settings.city,
    todayParts.year,
    todayParts.month,
    todayParts.day,
    settings.method,
    settings.asrSchool,
    settings.dstMode,
    settings.manualAdjustments,
    settings.hijriAdjustment,
  ]);

  const nextPrayerState = useMemo(
    () => getNextPrayerState(now, todaySchedule, tomorrowSchedule),
    [now, todaySchedule, tomorrowSchedule]
  );

  // Sync Persistent OS Notification Bar every minute & on preference changes
  const minuteBucket = Math.floor(now.getTime() / 60_000);
  const refreshPersistentNotification = useCallback(() => {
    const cityLabel = settings.language === 'ar' ? settings.city.nameAr : settings.city.nameEn;
    syncPersistentSystemNotification({
      enabled: settings.system.persistentNotificationEnabled,
      cityLabel,
      todaySchedule,
      nextPrayerState,
      timeFormat: settings.timeFormat,
      language: settings.language,
      system: settings.system,
    });
  }, [
    settings.language,
    settings.city.nameAr,
    settings.city.nameEn,
    settings.system,
    settings.timeFormat,
    todaySchedule,
    nextPrayerState,
  ]);

  useEffect(() => {
    if (!settings.system.persistentNotificationEnabled) {
      closePersistentSystemNotification();
      return;
    }
    refreshPersistentNotification();
  }, [
    minuteBucket,
    settings.system.persistentNotificationEnabled,
    settings.system.persistentShowAllPrayers,
    settings.system.persistentShowHijri,
    settings.city.id,
    settings.method,
    settings.asrSchool,
    settings.dstMode,
    settings.manualAdjustments,
    settings.language,
    settings.timeFormat,
    refreshPersistentNotification,
  ]);

  // Compute live Personal Alarm Pre-Alerts (and any manually previewed pre-alerts)
  const activePreAlerts = useMemo(
    () =>
      getActivePreAlertPersonalAlarms({
        alarms: settings.customAlarms,
        todaySchedule,
        nowMs: now.getTime(),
        previewIds: previewPreAlarmIds,
      }),
    [settings.customAlarms, todaySchedule, now, previewPreAlarmIds]
  );

  // Sync OS/Browser Notification for Live Countdown Timer
  const fiveSecBucket = Math.floor(now.getTime() / 5_000);
  useEffect(() => {
    const isTimerActive =
      settings.system.timerStopwatchNotifEnabled &&
      (timerState.running ||
        (timerState.remainingSeconds > 0 && timerState.remainingSeconds < timerState.durationSeconds));

    if (!isTimerActive) {
      void closeTimerSystemNotification();
      return;
    }

    const rem =
      timerState.running && timerState.endTimestampMs !== null
        ? Math.max(0, Math.ceil((timerState.endTimestampMs - Date.now()) / 1000))
        : timerState.remainingSeconds;

    void syncTimerSystemNotification({
      active: true,
      label: timerState.label,
      remainingSeconds: rem,
      running: timerState.running,
      language: settings.language,
    });
  }, [
    fiveSecBucket,
    settings.system.timerStopwatchNotifEnabled,
    settings.language,
    timerState.running,
    timerState.remainingSeconds,
    timerState.durationSeconds,
    timerState.endTimestampMs,
    timerState.label,
  ]);

  // Sync OS/Browser Notification for Live Stopwatch
  useEffect(() => {
    const isSwActive =
      settings.system.timerStopwatchNotifEnabled &&
      (stopwatchState.running || stopwatchState.accumulatedMs > 0);

    if (!isSwActive) {
      void closeStopwatchSystemNotification();
      return;
    }

    const elapsedMs =
      stopwatchState.running && stopwatchState.startedAtMs !== null
        ? stopwatchState.accumulatedMs + Math.max(0, Date.now() - stopwatchState.startedAtMs)
        : stopwatchState.accumulatedMs;

    void syncStopwatchSystemNotification({
      active: true,
      elapsedMs,
      running: stopwatchState.running,
      lapsCount: stopwatchState.laps.length,
      language: settings.language,
    });
  }, [
    fiveSecBucket,
    settings.system.timerStopwatchNotifEnabled,
    settings.language,
    stopwatchState.running,
    stopwatchState.accumulatedMs,
    stopwatchState.startedAtMs,
    stopwatchState.laps.length,
  ]);

  // Push OS/Browser Notification once when a Personal Alarm enters its Pre-Alert Window
  useEffect(() => {
    for (const item of activePreAlerts) {
      const key = `${todaySchedule.dateKey}-${item.alarm.id}-${item.isPreview ? 'preview' : 'live'}`;
      if (!notifiedPreAlertsRef.current.has(key)) {
        notifiedPreAlertsRef.current.add(key);
        const formatted = formatPrayerMinutes(
          item.triggerMinutesFromMidnight,
          settings.timeFormat,
          settings.language
        );
        void syncPreAlarmSystemNotification({
          alarm: item.alarm,
          triggerTimeFormatted: formatted,
          remainingSeconds: item.remainingSeconds,
          language: settings.language,
        });
      }
    }
  }, [activePreAlerts, todaySchedule.dateKey, settings.timeFormat, settings.language]);

  const stopAudio = useCallback(() => {
    adhanAudio.stop();
    setIsPlayingAdhan(false);
    setPlayingToneId(null);
  }, []);

  const triggerAdhanAlert = useCallback(
    (params: {
      id: string;
      prayerName: string;
      timeFormatted: string;
      message: string;
      isSimulation?: boolean;
      toneOverride?: AdhanToneId;
    }) => {
      setActiveAlert({
        id: params.id,
        prayerName: params.prayerName,
        timeFormatted: params.timeFormatted,
        message: params.message,
        isSimulation: params.isSimulation,
      });

      const shouldPlayAudio =
        !settings.alerts.muted || params.isSimulation || settings.system.dndBypassEnabled;
      if (shouldPlayAudio && (!settings.alerts.muted || params.isSimulation)) {
        const chosenTone = params.toneOverride ?? settings.alerts.defaultTone;
        const started = adhanAudio.play(chosenTone, settings.alerts.volume, () => {
          setIsPlayingAdhan(false);
          setPlayingToneId(null);
        });
        setIsPlayingAdhan(started);
        setPlayingToneId(started ? chosenTone : null);
      }

      if (!params.isSimulation) {
        sendBrowserNotification(params.prayerName, `${params.message} (${params.timeFormatted})`);
      }
    },
    [
      settings.alerts.muted,
      settings.alerts.defaultTone,
      settings.alerts.volume,
      settings.system.dndBypassEnabled,
    ]
  );

  // Trigger a personal alarm with optional Heavy Sleeper Challenge + Wake-Up Verification
  const triggerPersonalAlarm = useCallback(
    (alarm: CustomPrayerAlarm, timeFormatted: string, id: string, isSimulation?: boolean) => {
      const hasChallenge = alarm.challenge && alarm.challenge.type !== 'none';
      if (hasChallenge) {
        setActiveChallenge({
          id,
          alarm,
          timeFormatted,
          isSimulation,
        });
        if (!settings.alerts.muted || isSimulation) {
          const started = adhanAudio.play(alarm.tone, settings.alerts.volume, () => {
            setIsPlayingAdhan(false);
            setPlayingToneId(null);
          });
          setIsPlayingAdhan(started);
          setPlayingToneId(started ? alarm.tone : null);
        }
        if (!isSimulation) {
          sendBrowserNotification(alarm.title, `${T[settings.language].challengeModalTitle} (${timeFormatted})`);
        }
      } else {
        triggerAdhanAlert({
          id,
          prayerName: alarm.title,
          timeFormatted,
          message: T[settings.language].personalAlertMsg(alarm.title),
          isSimulation,
          toneOverride: alarm.tone,
        });
        if (alarm.wakeUpCheckEnabled) {
          const delayMin = Math.max(1, Math.min(30, alarm.wakeUpCheckDelayMinutes ?? 5));
          setPendingWakeUpCheck({
            alarm,
            triggerAtMs: Date.now() + delayMin * 60_000,
          });
        }
      }
    },
    [settings.alerts.muted, settings.alerts.volume, settings.language, triggerAdhanAlert]
  );

  // Keep alarm sound playing periodically while a Heavy Sleeper Challenge modal is unsolved
  useEffect(() => {
    if (!activeChallenge) return;
    const tone = activeChallenge.alarm.tone;
    const interval = window.setInterval(() => {
      if (!settings.alerts.muted || activeChallenge.isSimulation) {
        adhanAudio.play(tone, settings.alerts.volume);
      }
    }, 6500);
    return () => window.clearInterval(interval);
  }, [activeChallenge, settings.alerts.muted, settings.alerts.volume]);

  // Countdown Timer background watcher (persists across tab switches)
  useEffect(() => {
    if (!timerState.running || timerState.endTimestampMs === null) return;
    const checkTimer = () => {
      const rem = Math.max(0, Math.ceil((timerState.endTimestampMs! - Date.now()) / 1000));
      if (rem <= 0) {
        setTimerState((prev) => ({
          ...prev,
          remainingSeconds: 0,
          running: false,
          endTimestampMs: null,
        }));
        const loc = T[settings.language];
        triggerAdhanAlert({
          id: `timer-done-${Date.now()}`,
          prayerName: timerState.label.trim() || loc.timerTitle,
          timeFormatted: '00:00:00',
          message: loc.timerFinishedMsg(timerState.label.trim()),
          toneOverride: timerState.tone,
        });
      }
    };
    checkTimer();
    const id = window.setInterval(checkTimer, 300);
    return () => window.clearInterval(id);
  }, [
    timerState.running,
    timerState.endTimestampMs,
    timerState.label,
    timerState.tone,
    settings.language,
    triggerAdhanAlert,
  ]);

  // Pending & Active Wake-Up Verification Check watcher
  useEffect(() => {
    const nowMs = now.getTime();
    if (pendingWakeUpCheck && nowMs >= pendingWakeUpCheck.triggerAtMs) {
      const alarm = pendingWakeUpCheck.alarm;
      setPendingWakeUpCheck(null);
      setActiveWakeUpCheck({
        alarm,
        expiresAtMs: nowMs + 60_000,
      });
      if (!settings.alerts.muted) {
        adhanAudio.play('gentle', settings.alerts.volume);
      }
    }
    if (activeWakeUpCheck && nowMs >= activeWakeUpCheck.expiresAtMs) {
      const alarm = activeWakeUpCheck.alarm;
      setActiveWakeUpCheck(null);
      const trigger = computeCustomAlarmTriggerTime(alarm, todaySchedule);
      const formatted = formatPrayerMinutes(
        trigger.minutesFromMidnight,
        settings.timeFormat,
        settings.language
      );
      triggerPersonalAlarm(alarm, formatted, `wakeup-rering-${alarm.id}-${nowMs}`, false);
    }
  }, [
    now,
    pendingWakeUpCheck,
    activeWakeUpCheck,
    settings.alerts.muted,
    settings.alerts.volume,
    settings.timeFormat,
    settings.language,
    todaySchedule,
    triggerPersonalAlarm,
  ]);

  // Automatic real-time watcher for Before / At / After prayer alerts AND Personal Prayer-Linked Alarms
  useEffect(() => {
    const nowMs = now.getTime();
    const loc = T[settings.language];

    for (const prayer of todaySchedule.prayers) {
      const cfg = settings.alerts.byPrayer[prayer.key];
      if (!cfg.enabled) continue;
      const pName = getPrayerName(prayer.key, settings.language);
      const formatted = formatPrayerMinutes(
        prayer.minutesFromMidnight,
        settings.timeFormat,
        settings.language
      );

      // 1. Before prayer
      if (cfg.beforeMinutes > 0) {
        const triggerMs = prayer.date.getTime() - cfg.beforeMinutes * 60_000;
        const alertKey = `${todaySchedule.dateKey}-${prayer.key}-${prayer.minutesFromMidnight}-before-${cfg.beforeMinutes}`;
        if (
          nowMs >= triggerMs &&
          nowMs - triggerMs < 30_000 &&
          !firedAlertsRef.current.has(alertKey)
        ) {
          firedAlertsRef.current.add(alertKey);
          triggerAdhanAlert({
            id: alertKey,
            prayerName: pName,
            timeFormatted: formatted,
            message: loc.prayerAlertBefore(pName, cfg.beforeMinutes),
            toneOverride: cfg.tone,
          });
        }
      }

      // 2. At prayer time
      if (cfg.atTime) {
        const triggerMs = prayer.date.getTime();
        const alertKey = `${todaySchedule.dateKey}-${prayer.key}-${prayer.minutesFromMidnight}-at`;
        if (
          nowMs >= triggerMs &&
          nowMs - triggerMs < 30_000 &&
          !firedAlertsRef.current.has(alertKey)
        ) {
          firedAlertsRef.current.add(alertKey);
          triggerAdhanAlert({
            id: alertKey,
            prayerName: pName,
            timeFormatted: formatted,
            message: loc.prayerAlertNow(pName),
            toneOverride: cfg.tone,
          });
        }
      }

      // 3. After prayer
      if (cfg.afterMinutes > 0) {
        const triggerMs = prayer.date.getTime() + cfg.afterMinutes * 60_000;
        const alertKey = `${todaySchedule.dateKey}-${prayer.key}-${prayer.minutesFromMidnight}-after-${cfg.afterMinutes}`;
        if (
          nowMs >= triggerMs &&
          nowMs - triggerMs < 30_000 &&
          !firedAlertsRef.current.has(alertKey)
        ) {
          firedAlertsRef.current.add(alertKey);
          triggerAdhanAlert({
            id: alertKey,
            prayerName: pName,
            timeFormatted: formatted,
            message: loc.prayerAlertAfter(pName, cfg.afterMinutes),
            toneOverride: cfg.tone,
          });
        }
      }
    }

    // 4. Personal prayer-linked alarms (supports Skip Once today, Heavy Sleeper Challenge & Wake-Up Check)
    for (const alarm of settings.customAlarms) {
      if (!alarm.enabled) continue;
      if (isPersonalAlarmSkippedForDate(alarm, todaySchedule.dateKey)) continue;
      const trigger = computeCustomAlarmTriggerTime(alarm, todaySchedule);
      const triggerMs = trigger.date.getTime();
      const alertKey = `${todaySchedule.dateKey}-custom-${alarm.id}-${trigger.minutesFromMidnight}`;
      if (
        nowMs >= triggerMs &&
        nowMs - triggerMs < 30_000 &&
        !firedAlertsRef.current.has(alertKey)
      ) {
        firedAlertsRef.current.add(alertKey);
        const formatted = formatPrayerMinutes(
          trigger.minutesFromMidnight,
          settings.timeFormat,
          settings.language
        );
        triggerPersonalAlarm(alarm, formatted, alertKey, false);
      }
    }

    // 5. Scheduled date & time tasks
    for (const task of settings.scheduledTasks) {
      if (!task.enabled || task.completed) continue;
      const targetDate = parseScheduledTaskDateTime(task.date, task.time);
      if (!targetDate) continue;
      const triggerMs = targetDate.getTime();
      const alertKey = `task-${task.id}-${task.date}-${task.time}`;
      if (
        nowMs >= triggerMs &&
        nowMs - triggerMs < 30_000 &&
        !firedAlertsRef.current.has(alertKey)
      ) {
        firedAlertsRef.current.add(alertKey);
        const [hh, mm] = task.time.split(':').map(Number);
        const formatted = formatPrayerMinutes(
          hh * 60 + mm,
          settings.timeFormat,
          settings.language
        );
        triggerAdhanAlert({
          id: alertKey,
          prayerName: task.title,
          timeFormatted: formatted,
          message: task.notes ? `${loc.taskAlertMsg(task.title)} — ${task.notes}` : loc.taskAlertMsg(task.title),
          toneOverride: task.tone,
        });
      }
    }
  }, [
    now,
    todaySchedule,
    settings.alerts.byPrayer,
    settings.customAlarms,
    settings.scheduledTasks,
    settings.timeFormat,
    settings.language,
    triggerAdhanAlert,
    triggerPersonalAlarm,
  ]);

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenSystemSettings = () => {
    setSettingsCategory('system');
    setActiveTab('settings');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenStandaloneWidget = () => {
    setIsStandaloneWidget(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('widget', '1');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history errors
    }
  };

  const handleExitStandaloneWidget = () => {
    setIsStandaloneWidget(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('widget');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history errors
    }
  };

  const handleOpenStandaloneWearOs = () => {
    setIsStandaloneWearOs(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('wear', '1');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history errors
    }
  };

  const handleExitStandaloneWearOs = () => {
    setIsStandaloneWearOs(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('wear');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history errors
    }
  };

  const handleSelectCity = (city: CityLocation) => {
    setSettings((prev) => {
      const sameCountry =
        Boolean(prev.city.countryCode) &&
        Boolean(city.countryCode) &&
        prev.city.countryCode === city.countryCode;
      const keepMethod = prev.methodCustomized || sameCountry;
      return {
        ...prev,
        city,
        method: keepMethod ? prev.method : city.defaultMethod,
      };
    });
    setDayOffset(0);
  };

  const handleTogglePrayerAlert = (key: PrayerKey) => {
    setSettings((prev) => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        byPrayer: {
          ...prev.alerts.byPrayer,
          [key]: {
            ...prev.alerts.byPrayer[key],
            enabled: !prev.alerts.byPrayer[key].enabled,
          },
        },
      },
    }));
  };

  const handleUpdatePrayerAlert = (key: PrayerKey, patch: Partial<PrayerAlertConfig>) => {
    setSettings((prev) => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        byPrayer: {
          ...prev.alerts.byPrayer,
          [key]: {
            ...prev.alerts.byPrayer[key],
            ...patch,
          },
        },
      },
    }));
  };

  const handleApplyAllPrayerAlerts = (config: Omit<PrayerAlertConfig, 'enabled'>) => {
    setSettings((prev) => {
      const nextByPrayer = { ...prev.alerts.byPrayer };
      for (const key of ORDERED_PRAYER_KEYS) {
        nextByPrayer[key] = {
          ...nextByPrayer[key],
          ...config,
        };
      }
      return {
        ...prev,
        alerts: {
          ...prev.alerts,
          defaultTone: config.tone,
          byPrayer: nextByPrayer,
        },
      };
    });
  };

  const handleToggleAllPrayerAlerts = (enabled: boolean) => {
    setSettings((prev) => {
      const nextByPrayer = { ...prev.alerts.byPrayer };
      for (const key of ORDERED_PRAYER_KEYS) {
        nextByPrayer[key] = {
          ...nextByPrayer[key],
          enabled,
        };
      }
      return {
        ...prev,
        alerts: {
          ...prev.alerts,
          byPrayer: nextByPrayer,
        },
      };
    });
  };

  const handleAddCustomAlarm = (alarm: Omit<CustomPrayerAlarm, 'id'>) => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setSettings((prev) => ({
      ...prev,
      customAlarms: [{ ...alarm, id }, ...prev.customAlarms],
    }));
  };

  const handleToggleCustomAlarm = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      customAlarms: prev.customAlarms.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      ),
    }));
  };

  const handleDeleteCustomAlarm = (id: string) => {
    setPreviewPreAlarmIds((prev) => prev.filter((x) => x !== id));
    void closePreAlarmSystemNotification(id);
    setSettings((prev) => ({
      ...prev,
      customAlarms: prev.customAlarms.filter((a) => a.id !== id),
    }));
  };

  const handleSkipPersonalAlarmOnce = (id: string) => {
    setPreviewPreAlarmIds((prev) => prev.filter((x) => x !== id));
    void closePreAlarmSystemNotification(id);
    setSettings((prev) => ({
      ...prev,
      customAlarms: prev.customAlarms.map((a) =>
        a.id === id ? { ...a, skippedDateKey: todaySchedule.dateKey } : a
      ),
    }));
  };

  const handleUndoSkipPersonalAlarm = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      customAlarms: prev.customAlarms.map((a) =>
        a.id === id ? { ...a, skippedDateKey: null } : a
      ),
    }));
  };

  const handlePreviewPreAlert = (id: string) => {
    setPreviewPreAlarmIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleDismissPreAlertPreview = (id: string) => {
    setPreviewPreAlarmIds((prev) => prev.filter((x) => x !== id));
    void closePreAlarmSystemNotification(id);
  };

  const handleTimerToggleFromNotif = () => {
    setTimerState((prev) => {
      if (prev.running) {
        const rem =
          prev.endTimestampMs !== null
            ? Math.max(0, Math.ceil((prev.endTimestampMs - Date.now()) / 1000))
            : prev.remainingSeconds;
        return { ...prev, running: false, remainingSeconds: rem, endTimestampMs: null };
      }
      const nextRem = prev.remainingSeconds > 0 ? prev.remainingSeconds : prev.durationSeconds;
      if (nextRem <= 0) return prev;
      return {
        ...prev,
        running: true,
        remainingSeconds: nextRem,
        endTimestampMs: Date.now() + nextRem * 1000,
      };
    });
  };

  const handleTimerAddMinuteFromNotif = () => {
    setTimerState((prev) => {
      if (prev.running && prev.endTimestampMs !== null) {
        return {
          ...prev,
          durationSeconds: prev.durationSeconds + 60,
          endTimestampMs: prev.endTimestampMs + 60_000,
        };
      }
      return {
        ...prev,
        durationSeconds: prev.durationSeconds + 60,
        remainingSeconds: prev.remainingSeconds + 60,
      };
    });
  };

  const handleTimerResetFromNotif = () => {
    void closeTimerSystemNotification();
    setTimerState((prev) => ({
      ...prev,
      running: false,
      remainingSeconds: prev.durationSeconds,
      endTimestampMs: null,
    }));
  };

  const handleStopwatchToggleFromNotif = () => {
    setStopwatchState((prev) => {
      if (prev.running) {
        const elapsed =
          prev.accumulatedMs +
          (prev.startedAtMs !== null ? Math.max(0, Date.now() - prev.startedAtMs) : 0);
        return { ...prev, running: false, accumulatedMs: elapsed, startedAtMs: null };
      }
      return { ...prev, running: true, startedAtMs: Date.now() };
    });
  };

  const handleStopwatchLapFromNotif = () => {
    setStopwatchState((prev) => {
      if (!prev.running || prev.startedAtMs === null) return prev;
      const totalMs = prev.accumulatedMs + Math.max(0, Date.now() - prev.startedAtMs);
      const prevTotal = prev.laps.length > 0 ? prev.laps[0].totalMs : 0;
      const splitMs = Math.max(0, totalMs - prevTotal);
      return {
        ...prev,
        laps: [{ lapNumber: prev.laps.length + 1, splitMs, totalMs }, ...prev.laps],
      };
    });
  };

  const handleStopwatchResetFromNotif = () => {
    void closeStopwatchSystemNotification();
    setStopwatchState({ accumulatedMs: 0, startedAtMs: null, running: false, laps: [] });
  };

  const handleOpenAlarmsSubTab = (sub: AlarmsSubTab) => {
    setAlarmsSubTab(sub);
    setActiveTab('alarms');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleAddScheduledTask = (task: Omit<ScheduledTaskAlarm, 'id'>) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setSettings((prev) => ({
      ...prev,
      scheduledTasks: [{ ...task, id }, ...prev.scheduledTasks],
    }));
  };

  const handleToggleScheduledTask = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      scheduledTasks: prev.scheduledTasks.map((task) =>
        task.id === id ? { ...task, enabled: !task.enabled } : task
      ),
    }));
  };

  const handleToggleCompleteScheduledTask = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      scheduledTasks: prev.scheduledTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const handleDeleteScheduledTask = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      scheduledTasks: prev.scheduledTasks.filter((task) => task.id !== id),
    }));
  };

  const handleUploadCustomAudio = async (file: File): Promise<boolean> => {
    const ok = await saveCustomAudioFile(file);
    if (!ok) return false;
    setSettings((prev) => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        customAudioName: file.name,
        defaultTone: 'custom',
      },
    }));
    return true;
  };

  const handleRemoveCustomAudio = async (): Promise<void> => {
    stopAudio();
    await deleteCustomAudioFile();
    setSettings((prev) => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        customAudioName: null,
        defaultTone: prev.alerts.defaultTone === 'custom' ? 'makkah_adhan' : prev.alerts.defaultTone,
      },
    }));
  };

  const handleToggleMuteAll = () => {
    setSettings((prev) => {
      const nextMuted = !prev.alerts.muted;
      if (nextMuted) {
        adhanAudio.stop();
        setIsPlayingAdhan(false);
      }
      return {
        ...prev,
        alerts: { ...prev.alerts, muted: nextMuted },
      };
    });
  };

  const handlePreviewAdhanFromHero = () => {
    if (isPlayingAdhan) {
      stopAudio();
      return;
    }
    const nextP = nextPrayerState.nextPrayer;
    const pName = getPrayerName(nextP.key, settings.language);
    const formatted = formatPrayerMinutes(
      nextP.minutesFromMidnight,
      settings.timeFormat,
      settings.language
    );
    triggerAdhanAlert({
      id: `preview-${Date.now()}`,
      prayerName: pName,
      timeFormatted: formatted,
      message: t.prayerAlertNow(pName),
      isSimulation: true,
      toneOverride: settings.alerts.byPrayer[nextP.key].tone,
    });
  };

  const handleTestPrayerAlert = (key: PrayerKey, stage: 'before' | 'at' | 'after') => {
    const entry = todaySchedule.prayers.find((p) => p.key === key) ?? todaySchedule.prayers[0];
    const cfg = settings.alerts.byPrayer[key];
    const pName = getPrayerName(key, settings.language);
    const formatted = formatPrayerMinutes(
      entry.minutesFromMidnight,
      settings.timeFormat,
      settings.language
    );
    const msg =
      stage === 'before'
        ? t.prayerAlertBefore(pName, cfg.beforeMinutes || 10)
        : stage === 'after'
          ? t.prayerAlertAfter(pName, cfg.afterMinutes || 10)
          : t.prayerAlertNow(pName);

    triggerAdhanAlert({
      id: `test-${key}-${stage}-${Date.now()}`,
      prayerName: pName,
      timeFormatted: formatted,
      message: msg,
      isSimulation: true,
      toneOverride: cfg.tone,
    });
  };

  const handleTestCustomAlarm = (alarm: CustomPrayerAlarm) => {
    const trigger = computeCustomAlarmTriggerTime(alarm, todaySchedule);
    const formatted = formatPrayerMinutes(
      trigger.minutesFromMidnight,
      settings.timeFormat,
      settings.language
    );
    triggerPersonalAlarm(alarm, formatted, `test-custom-${alarm.id}-${Date.now()}`, true);
  };

  const handleChallengeSolved = (session: ActiveChallengeSession) => {
    stopAudio();
    setActiveChallenge(null);
    if (session.alarm.wakeUpCheckEnabled) {
      const delayMin = Math.max(1, Math.min(30, session.alarm.wakeUpCheckDelayMinutes ?? 5));
      setPendingWakeUpCheck({
        alarm: session.alarm,
        triggerAtMs: Date.now() + delayMin * 60_000,
      });
    }
  };

  const handleTestScheduledTask = (task: ScheduledTaskAlarm) => {
    const [hh, mm] = task.time.split(':').map(Number);
    const mins = (Number.isNaN(hh) ? 0 : hh) * 60 + (Number.isNaN(mm) ? 0 : mm);
    const formatted = formatPrayerMinutes(mins, settings.timeFormat, settings.language);
    triggerAdhanAlert({
      id: `test-task-${task.id}-${Date.now()}`,
      prayerName: task.title,
      timeFormatted: `${task.date} · ${formatted}`,
      message: task.notes ? `${t.taskAlertMsg(task.title)} — ${task.notes}` : t.taskAlertMsg(task.title),
      isSimulation: true,
      toneOverride: task.tone,
    });
  };

  const handlePreviewTone = (tone: AdhanToneId) => {
    if (isPlayingAdhan && playingToneId === tone) {
      stopAudio();
      return;
    }
    setSettings((prev) => ({
      ...prev,
      alerts: { ...prev.alerts, defaultTone: tone },
    }));
    const started = adhanAudio.play(tone, settings.alerts.volume, () => {
      setIsPlayingAdhan(false);
      setPlayingToneId(null);
    });
    setIsPlayingAdhan(started);
    setPlayingToneId(started ? tone : null);
  };

  // Standalone Home Screen Widget Mode (/?widget=1)
  if (isStandaloneWidget) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F7F5] p-4 text-[#121816] dark:bg-[#0B100E] dark:text-[#ECF1EE]">
        <div className="w-full max-w-xl space-y-4">
          <HomeWidgetCard
            settings={settings}
            todaySchedule={todaySchedule}
            nextPrayerState={nextPrayerState}
          />
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleExitStandaloneWidget}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#DCE1DB] bg-white px-4 py-2 text-xs font-semibold text-[#0F5132] hover:bg-[#F3F5F2] dark:border-[#24322B] dark:bg-[#121916] dark:text-[#6EE7B7]"
            >
              <span>{t.widgetBackToApp}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standalone Wear OS Watch Mode (/?wear=1)
  if (isStandaloneWearOs) {
    return (
      <div
        data-testid="standalone-wearos-screen"
        className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#050807] p-4 text-white"
      >
        <WearOsWatchView
          now={now}
          settings={settings}
          todaySchedule={todaySchedule}
          nextPrayerState={nextPrayerState}
          onToggleMuteAll={handleToggleMuteAll}
          onToggleAmbient={() =>
            setSettings((prev) => ({
              ...prev,
              wearOs: { ...prev.wearOs, ambientOled: !prev.wearOs.ambientOled },
            }))
          }
          size="standalone"
        />
        <button
          type="button"
          data-testid="exit-standalone-wearos-btn"
          onClick={handleExitStandaloneWearOs}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-[#6EE7B7] hover:bg-white/15"
        >
          <span>{t.wearOsBackToPhone}</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="sai-app-shell min-h-screen flex flex-col bg-[#F6F7F5] text-[#121816] dark:bg-[#0B100E] dark:text-[#ECF1EE] transition-colors duration-200">
      <Header
        language={settings.language}
        onSelectTab={handleSelectTab}
        city={settings.city}
        onOpenCityPicker={() => setIsCityPickerOpen(true)}
      />

      <PersistentNotificationBar
        settings={settings}
        todaySchedule={todaySchedule}
        nextPrayerState={nextPrayerState}
        timer={timerState}
        stopwatch={stopwatchState}
        activePreAlerts={activePreAlerts}
        onOpenSettings={handleOpenSystemSettings}
        onDisablePersistentPrayer={() =>
          setSettings((prev) => ({
            ...prev,
            system: { ...prev.system, persistentNotificationEnabled: false },
          }))
        }
        onTimerToggle={handleTimerToggleFromNotif}
        onTimerAddMinute={handleTimerAddMinuteFromNotif}
        onTimerReset={handleTimerResetFromNotif}
        onOpenTimerTab={() => handleOpenAlarmsSubTab('timer')}
        onStopwatchToggle={handleStopwatchToggleFromNotif}
        onStopwatchLap={handleStopwatchLapFromNotif}
        onStopwatchReset={handleStopwatchResetFromNotif}
        onOpenStopwatchTab={() => handleOpenAlarmsSubTab('stopwatch')}
        onSkipPersonalAlarmOnce={handleSkipPersonalAlarmOnce}
        onDismissPreAlertPreview={handleDismissPreAlertPreview}
        onOpenPersonalAlarmsTab={() => handleOpenAlarmsSubTab('personal')}
      />

      <AdhanAlertBanner
        alert={activeAlert}
        language={settings.language}
        isPlayingAudio={isPlayingAdhan}
        onStopAudio={stopAudio}
        onDismiss={() => {
          stopAudio();
          setActiveAlert(null);
        }}
      />

      {/* Pending Wake-Up Verification Countdown Bar */}
      {pendingWakeUpCheck && !activeWakeUpCheck && (
        <div
          role="status"
          data-testid="wakeup-pending-banner"
          className="border-b border-[#D9B872]/35 bg-[#FDF9EE] px-4 py-2.5 text-xs text-[#6B5121] dark:border-[#D9B872]/25 dark:bg-[#1C1910] dark:text-[#E5C98B]"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {t.wakeUpPendingBanner(
                  pendingWakeUpCheck.alarm.title,
                  Math.max(0, Math.ceil((pendingWakeUpCheck.triggerAtMs - now.getTime()) / 1000))
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="wakeup-verify-now-btn"
                onClick={() => {
                  const alarm = pendingWakeUpCheck.alarm;
                  setPendingWakeUpCheck(null);
                  setActiveWakeUpCheck({
                    alarm,
                    expiresAtMs: Date.now() + 60_000,
                  });
                }}
                className="rounded-lg bg-[#0F5132] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0B3D25] dark:bg-[#196B45]"
              >
                {t.wakeUpPendingTestNow}
              </button>
              <button
                type="button"
                onClick={() => setPendingWakeUpCheck(null)}
                className="rounded-lg border border-[#D9B872]/40 px-2.5 py-1 text-xs font-medium hover:bg-[#D9B872]/15"
              >
                {t.wakeUpPendingCancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <main
        className={`mx-auto w-full max-w-6xl flex-1 px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 ${
          settings.widget.floatingEnabled ? 'pb-44' : 'pb-24'
        }`}
      >
        {activeTab === 'prayers' && (
          <PrayerTimesView
            now={now}
            settings={settings}
            dayOffset={dayOffset}
            viewedSchedule={viewedSchedule}
            viewedNextSchedule={viewedNextSchedule}
            nextPrayerState={nextPrayerState}
            isPlayingAdhan={isPlayingAdhan}
            onChangeDayOffset={setDayOffset}
            onChangeTimeFormat={(timeFormat: TimeFormat) =>
              setSettings((prev) => ({ ...prev, timeFormat }))
            }
            onTogglePrayerAlert={handleTogglePrayerAlert}
            onToggleMuteAll={handleToggleMuteAll}
            onPreviewAdhan={handlePreviewAdhanFromHero}
            onOpenQibla={() => handleSelectTab('qibla')}
            onOpenAlarms={() => handleSelectTab('alarms')}
            onOpenCityPicker={() => setIsCityPickerOpen(true)}
          />
        )}

        {activeTab === 'qibla' && (
          <QiblaCompassView
            city={settings.city}
            language={settings.language}
            onOpenCityPicker={() => setIsCityPickerOpen(true)}
          />
        )}

        {activeTab === 'calendar' && (
          <HijriCalendarView
            now={now}
            settings={settings}
            onUpdateHijriAdjustment={(hijriAdjustment) =>
              setSettings((prev) => ({ ...prev, hijriAdjustment }))
            }
            onUpdateDstMode={(dstMode: DstMode) => setSettings((prev) => ({ ...prev, dstMode }))}
            onUpdateFirstDayOfWeek={(firstDayOfWeek: FirstDayOfWeek) =>
              setSettings((prev) => ({ ...prev, firstDayOfWeek }))
            }
          />
        )}

        {activeTab === 'alarms' && (
          <AlarmsView
            settings={settings}
            todaySchedule={todaySchedule}
            initialSubTab={alarmsSubTab}
            onSubTabChange={setAlarmsSubTab}
            onUpdatePrayerAlert={handleUpdatePrayerAlert}
            onApplyAllPrayerAlerts={handleApplyAllPrayerAlerts}
            onToggleAllPrayerAlerts={handleToggleAllPrayerAlerts}
            onAddCustomAlarm={handleAddCustomAlarm}
            onToggleCustomAlarm={handleToggleCustomAlarm}
            onDeleteCustomAlarm={handleDeleteCustomAlarm}
            onUndoSkipPersonalAlarm={handleUndoSkipPersonalAlarm}
            onPreviewPreAlert={handlePreviewPreAlert}
            onAddScheduledTask={handleAddScheduledTask}
            onToggleScheduledTask={handleToggleScheduledTask}
            onToggleCompleteScheduledTask={handleToggleCompleteScheduledTask}
            onDeleteScheduledTask={handleDeleteScheduledTask}
            onTestPrayerAlert={handleTestPrayerAlert}
            onTestCustomAlarm={handleTestCustomAlarm}
            onTestScheduledTask={handleTestScheduledTask}
            timer={timerState}
            onUpdateTimer={setTimerState}
            stopwatch={stopwatchState}
            onUpdateStopwatch={setStopwatchState}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            now={now}
            settings={settings}
            todaySchedule={todaySchedule}
            nextPrayerState={nextPrayerState}
            isPlayingAdhan={isPlayingAdhan}
            playingToneId={playingToneId}
            initialCategory={settingsCategory}
            onUpdateMethod={(method: CalculationMethodId) =>
              setSettings((prev) => ({ ...prev, method, methodCustomized: true }))
            }
            onUpdateAsrSchool={(asrSchool: AsrSchool) =>
              setSettings((prev) => ({ ...prev, asrSchool }))
            }
            onUpdateManualAdjustment={(key: PrayerKey, minutes: number) =>
              setSettings((prev) => ({
                ...prev,
                manualAdjustments: { ...prev.manualAdjustments, [key]: minutes },
              }))
            }
            onResetManualAdjustments={() =>
              setSettings((prev) => ({
                ...prev,
                manualAdjustments: { ...ZERO_MANUAL_ADJUSTMENTS },
              }))
            }
            onUpdateLanguage={(language: Language) =>
              setSettings((prev) => ({ ...prev, language }))
            }
            onUpdateTimeFormat={(timeFormat: TimeFormat) =>
              setSettings((prev) => ({ ...prev, timeFormat }))
            }
            onUpdateTheme={(theme: ThemeMode) =>
              setSettings((prev) => {
                const currentIsDark = getSaiThemeById(prev.saiThemeId).isDark;
                const nextSaiThemeId =
                  theme === 'dark'
                    ? currentIsDark
                      ? prev.saiThemeId
                      : DEFAULT_DARK_SAI_THEME_ID
                    : !currentIsDark
                      ? prev.saiThemeId
                      : DEFAULT_LIGHT_SAI_THEME_ID;
                return { ...prev, theme, saiThemeId: nextSaiThemeId };
              })
            }
            onUpdateSaiTheme={(saiThemeId: SaiThemeId) =>
              setSettings((prev) => ({
                ...prev,
                saiThemeId,
                theme: getSaiThemeById(saiThemeId).isDark ? 'dark' : 'light',
              }))
            }
            onUpdateDefaultTone={(defaultTone: AdhanToneId) =>
              setSettings((prev) => ({
                ...prev,
                alerts: { ...prev.alerts, defaultTone },
              }))
            }
            onUpdateVolume={(volume: number) =>
              setSettings((prev) => ({
                ...prev,
                alerts: { ...prev.alerts, volume },
              }))
            }
            onPreviewTone={handlePreviewTone}
            onUploadCustomAudio={handleUploadCustomAudio}
            onRemoveCustomAudio={handleRemoveCustomAudio}
            onUpdateWidgetPrefs={(patch: Partial<WidgetPreferences>) =>
              setSettings((prev) => ({
                ...prev,
                widget: { ...prev.widget, ...patch },
              }))
            }
            onUpdateWearOsPrefs={(patch: Partial<WearOsPreferences>) =>
              setSettings((prev) => ({
                ...prev,
                wearOs: { ...prev.wearOs, ...patch },
              }))
            }
            onUpdateSystemPrefs={(patch: Partial<SystemPreferences>) =>
              setSettings((prev) => ({
                ...prev,
                system: { ...prev.system, ...patch },
              }))
            }
            onOpenStandaloneWidget={handleOpenStandaloneWidget}
            onOpenStandaloneWearOs={handleOpenStandaloneWearOs}
            onRestoreSettingsFromDrive={(restored) => {
              setSettings(restored);
              setDayOffset(0);
            }}
            onToggleMuteAll={handleToggleMuteAll}
            onRefreshPersistentNotif={refreshPersistentNotification}
            onResetAllPreferences={() => {
              closePersistentSystemNotification();
              void deleteCustomAudioFile();
              setSettings(resetSettings());
              setDayOffset(0);
            }}
          />
        )}
      </main>

      {/* Optional Floating Mini-Widget Pinned Above Bottom Bar */}
      {settings.widget.floatingEnabled && (
        <aside
          aria-label={t.widgetTitle}
          data-testid="floating-mini-widget"
          className={`fixed bottom-20 z-30 w-[calc(100%-2rem)] max-w-xs ${
            settings.language === 'ar' ? 'left-4' : 'right-4'
          }`}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  widget: { ...prev.widget, floatingEnabled: false },
                }))
              }
              aria-label={t.closeAlert}
              className={`absolute -top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#DCE1DB] bg-white text-[#35443C] shadow-xs hover:bg-[#F3F5F2] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE] ${
                settings.language === 'ar' ? '-left-2' : '-right-2'
              }`}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <HomeWidgetCard
              settings={settings}
              todaySchedule={todaySchedule}
              nextPrayerState={nextPrayerState}
              compactFloating
            />
          </div>
        </aside>
      )}

      <OfflineIndicator language={settings.language} />

      <MobileBottomNav
        activeTab={activeTab}
        language={settings.language}
        onSelectTab={handleSelectTab}
      />

      <CityPickerModal
        isOpen={isCityPickerOpen}
        language={settings.language}
        currentCity={settings.city}
        onSelectCity={handleSelectCity}
        onClose={() => setIsCityPickerOpen(false)}
      />

      <AlarmChallengeModal
        session={activeChallenge}
        language={settings.language}
        onSolved={handleChallengeSolved}
      />

      <WakeUpCheckModal
        alarm={activeWakeUpCheck?.alarm ?? null}
        remainingSeconds={
          activeWakeUpCheck
            ? Math.max(0, Math.ceil((activeWakeUpCheck.expiresAtMs - now.getTime()) / 1000))
            : 0
        }
        language={settings.language}
        onConfirmAwake={() => {
          stopAudio();
          setActiveWakeUpCheck(null);
        }}
      />
    </div>
  );
}
