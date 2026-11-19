import { useEffect, useState } from 'react';
import {
  BellOff,
  BellRing,
  Flag,
  Hourglass,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Timer as StopwatchIcon,
  X,
} from 'lucide-react';
import type { AppSettings, DailyPrayerSchedule, NextPrayerState } from '../types/prayer';
import type { StopwatchState, TimerState } from './TimerStopwatchPanels';
import { formatCountdown, formatPrayerMinutes } from '../utils/prayerMath';
import {
  formatStopwatchDuration,
  formatTimerDurationHms,
  type ActivePreAlertAlarm,
} from '../utils/systemServices';
import { T, getPrayerName } from '../utils/i18n';

interface PersistentNotificationBarProps {
  settings: AppSettings;
  todaySchedule: DailyPrayerSchedule;
  nextPrayerState: NextPrayerState;
  timer: TimerState;
  stopwatch: StopwatchState;
  activePreAlerts: ActivePreAlertAlarm[];
  onOpenSettings: () => void;
  onDisablePersistentPrayer: () => void;
  onTimerToggle: () => void;
  onTimerAddMinute: () => void;
  onTimerReset: () => void;
  onOpenTimerTab: () => void;
  onStopwatchToggle: () => void;
  onStopwatchLap: () => void;
  onStopwatchReset: () => void;
  onOpenStopwatchTab: () => void;
  onSkipPersonalAlarmOnce: (alarmId: string) => void;
  onDismissPreAlertPreview: (alarmId: string) => void;
  onOpenPersonalAlarmsTab: () => void;
}

export function PersistentNotificationBar({
  settings,
  todaySchedule,
  nextPrayerState,
  timer,
  stopwatch,
  activePreAlerts,
  onOpenSettings,
  onDisablePersistentPrayer,
  onTimerToggle,
  onTimerAddMinute,
  onTimerReset,
  onOpenTimerTab,
  onStopwatchToggle,
  onStopwatchLap,
  onStopwatchReset,
  onOpenStopwatchTab,
  onSkipPersonalAlarmOnce,
  onDismissPreAlertPreview,
  onOpenPersonalAlarmsTab,
}: PersistentNotificationBarProps) {
  const { language, timeFormat, city, system } = settings;
  const t = T[language];

  const [tickNow, setTickNow] = useState<number>(() => Date.now());

  const showTimerNotif =
    system.timerStopwatchNotifEnabled &&
    (timer.running || (timer.remainingSeconds > 0 && timer.remainingSeconds < timer.durationSeconds));

  const showStopwatchNotif =
    system.timerStopwatchNotifEnabled && (stopwatch.running || stopwatch.accumulatedMs > 0);

  const showPrayerNotif = system.persistentNotificationEnabled;
  const showPreAlerts = activePreAlerts.length > 0;

  // High-frequency tick ONLY when timer or stopwatch is actively running
  useEffect(() => {
    if (!timer.running && !stopwatch.running) return;
    const ms = stopwatch.running ? 80 : 250;
    const id = window.setInterval(() => setTickNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [timer.running, stopwatch.running]);

  if (!showPrayerNotif && !showTimerNotif && !showStopwatchNotif && !showPreAlerts) {
    return null;
  }

  const nextName = getPrayerName(nextPrayerState.nextPrayer.key, language);
  const nextTime = formatPrayerMinutes(
    nextPrayerState.nextPrayer.minutesFromMidnight,
    timeFormat,
    language
  );
  const countdown = formatCountdown(nextPrayerState.remainingSeconds);
  const cityLabel = language === 'ar' ? city.nameAr : city.nameEn;
  const hijriLabel = language === 'ar' ? todaySchedule.hijriDateAr : todaySchedule.hijriDateEn;
  const fardPrayers = todaySchedule.prayers.filter((p) => p.isFard);

  const timerRemainingDisplay =
    timer.running && timer.endTimestampMs !== null
      ? Math.max(0, Math.ceil((timer.endTimestampMs - tickNow) / 1000))
      : timer.remainingSeconds;

  const stopwatchElapsedMs =
    stopwatch.running && stopwatch.startedAtMs !== null
      ? stopwatch.accumulatedMs + Math.max(0, tickNow - stopwatch.startedAtMs)
      : stopwatch.accumulatedMs;

  return (
    <div className="divide-y divide-[#E3E7E2] dark:divide-[#1E2A24]">
      {/* 1. Persistent Prayer Notification Bar */}
      {showPrayerNotif && (
        <div
          role="status"
          aria-live="off"
          data-testid="persistent-notification-bar"
          className="border-b border-[#0F5132]/15 bg-[#0F5132]/[0.06] text-[#121816] dark:border-[#6EE7B7]/15 dark:bg-[#0F241B] dark:text-[#ECF1EE]"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F5132] dark:text-[#6EE7B7]">
                <BellRing className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{nextName}</span>
                <span dir="ltr" className="font-mono tabular-nums">
                  {nextTime}
                </span>
              </span>

              <span className="inline-flex items-center gap-1 text-[#35443C] dark:text-[#C5D1CA]">
                <span>{t.persistentBarRemaining}</span>
                <span dir="ltr" className="font-mono font-semibold tabular-nums">
                  {countdown}
                </span>
              </span>

              {system.persistentShowHijri && (
                <span className="hidden text-[#5A6960] md:inline dark:text-[#8E9F95]">
                  · {cityLabel} · {hijriLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {system.persistentShowAllPrayers && (
                <div className="hidden lg:flex items-center gap-2.5 text-[11px] text-[#47564E] dark:text-[#98A89F]">
                  {fardPrayers.map((p) => {
                    const isNext =
                      !nextPrayerState.isNextDayFajr && p.key === nextPrayerState.nextPrayer.key;
                    return (
                      <span
                        key={p.key}
                        className={isNext ? 'font-bold text-[#0F5132] dark:text-[#6EE7B7]' : ''}
                      >
                        {getPrayerName(p.key, language)}{' '}
                        <span dir="ltr" className="font-mono tabular-nums">
                          {formatPrayerMinutes(p.minutesFromMidnight, timeFormat, language)}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={onOpenSettings}
                aria-label={t.tabs.settings}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#47564E] hover:bg-black/5 dark:text-[#9AA9A1] dark:hover:bg-white/10"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onDisablePersistentPrayer}
                aria-label={t.persistentBarHide}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#47564E] hover:bg-black/5 dark:text-[#9AA9A1] dark:hover:bg-white/10"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Upcoming Personal Alarm Pre-Alert Notifications with "Skip Once" */}
      {activePreAlerts.map((item) => {
        const triggerFormatted = formatPrayerMinutes(
          item.triggerMinutesFromMidnight,
          timeFormat,
          language
        );
        const minsLeft = Math.max(1, Math.ceil(item.remainingSeconds / 60));

        return (
          <div
            key={item.alarm.id}
            role="status"
            data-testid="notif-bar-prealarm"
            className="border-b border-[#D9B872]/35 bg-[#FDF8EC] text-[#5C4415] dark:border-[#D9B872]/30 dark:bg-[#1E1A10] dark:text-[#F3DFB0]"
          >
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={onOpenPersonalAlarmsTab}
                className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold hover:underline"
              >
                <BellRing className="h-3.5 w-3.5 shrink-0 text-[#B47B17] dark:text-[#E9B115]" aria-hidden="true" />
                <span>{t.preAlertNotifLabel}:</span>
                <span className="font-bold">{item.alarm.title}</span>
                <span className="font-normal opacity-90">
                  ({t.preAlertNotifRingsIn(minsLeft, triggerFormatted)})
                </span>
                {item.isPreview && (
                  <span className="rounded bg-[#B47B17]/15 px-1.5 py-0.5 text-[10px] font-semibold">
                    {t.preAlertPreviewTag}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid="prealarm-skip-once-btn"
                  onClick={() => onSkipPersonalAlarmOnce(item.alarm.id)}
                  className="inline-flex min-h-[30px] items-center gap-1.5 rounded-lg bg-[#0F5132] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#0B3D25] dark:bg-[#196B45]"
                >
                  <BellOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{t.preAlertSkipOnceBtn}</span>
                </button>
                {item.isPreview && (
                  <button
                    type="button"
                    onClick={() => onDismissPreAlertPreview(item.alarm.id)}
                    aria-label={t.closeAlert}
                    className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* 3. Live Countdown Timer Notification Bar */}
      {showTimerNotif && (
        <div
          role="status"
          aria-live="off"
          data-testid="notif-bar-timer"
          className="border-b border-[#E3E7E2] bg-[#F8F9F7] text-[#121816] dark:border-[#1E2A24] dark:bg-[#121916] dark:text-[#ECF1EE]"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={onOpenTimerTab}
              className="flex items-center gap-2.5 text-xs hover:underline"
            >
              <Hourglass
                className="h-3.5 w-3.5 shrink-0 text-[#0F5132] dark:text-[#6EE7B7]"
                aria-hidden="true"
              />
              <span className="font-semibold text-[#0F5132] dark:text-[#6EE7B7]">
                {timer.label.trim() ? `${t.alarmsTabTimer}: ${timer.label.trim()}` : t.alarmsTabTimer}
              </span>
              <span
                dir="ltr"
                data-testid="notif-bar-timer-value"
                className="font-mono text-sm font-bold tabular-nums"
              >
                {formatTimerDurationHms(timerRemainingDisplay)}
              </span>
              <span className="rounded bg-[#0F5132]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#0F5132] dark:bg-[#6EE7B7]/15 dark:text-[#6EE7B7]">
                {timer.running ? t.notifRunningBadge : t.notifPausedBadge}
              </span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                data-testid="notif-bar-timer-toggle"
                onClick={onTimerToggle}
                className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-[#0F5132] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0B3D25] dark:bg-[#196B45]"
              >
                {timer.running ? (
                  <Pause className="h-3 w-3 shrink-0" aria-hidden="true" />
                ) : (
                  <Play className="h-3 w-3 shrink-0" aria-hidden="true" />
                )}
                <span>{timer.running ? t.timerPause : t.timerResume}</span>
              </button>
              <button
                type="button"
                dir="ltr"
                data-testid="notif-bar-timer-plus1m"
                onClick={onTimerAddMinute}
                className="inline-flex min-h-[30px] items-center rounded-lg border border-[#DCE1DB] bg-white px-2 py-1 text-xs font-medium text-[#35443C] hover:bg-[#EEF1ED] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#C5D1CA]"
              >
                +1m
              </button>
              <button
                type="button"
                data-testid="notif-bar-timer-reset"
                onClick={onTimerReset}
                aria-label={t.timerReset}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#DCE1DB] bg-white text-[#5A6960] hover:bg-[#EEF1ED] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#9AA9A1]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Live Stopwatch Notification Bar */}
      {showStopwatchNotif && (
        <div
          role="status"
          aria-live="off"
          data-testid="notif-bar-stopwatch"
          className="border-b border-[#E3E7E2] bg-[#F8F9F7] text-[#121816] dark:border-[#1E2A24] dark:bg-[#121916] dark:text-[#ECF1EE]"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={onOpenStopwatchTab}
              className="flex items-center gap-2.5 text-xs hover:underline"
            >
              <StopwatchIcon
                className="h-3.5 w-3.5 shrink-0 text-[#0F5132] dark:text-[#6EE7B7]"
                aria-hidden="true"
              />
              <span className="font-semibold text-[#0F5132] dark:text-[#6EE7B7]">
                {t.alarmsTabStopwatch}
              </span>
              <span
                dir="ltr"
                data-testid="notif-bar-stopwatch-value"
                className="font-mono text-sm font-bold tabular-nums"
              >
                {formatStopwatchDuration(stopwatchElapsedMs)}
              </span>
              {stopwatch.laps.length > 0 && (
                <span
                  data-testid="notif-bar-stopwatch-laps"
                  className="rounded bg-[#0F5132]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#0F5132] dark:bg-[#6EE7B7]/15 dark:text-[#6EE7B7]"
                >
                  {t.notifLapsCount(stopwatch.laps.length)}
                </span>
              )}
              <span className="rounded bg-[#0F5132]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#0F5132] dark:bg-[#6EE7B7]/15 dark:text-[#6EE7B7]">
                {stopwatch.running ? t.notifRunningBadge : t.notifPausedBadge}
              </span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                data-testid="notif-bar-stopwatch-toggle"
                onClick={onStopwatchToggle}
                className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-[#0F5132] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0B3D25] dark:bg-[#196B45]"
              >
                {stopwatch.running ? (
                  <Pause className="h-3 w-3 shrink-0" aria-hidden="true" />
                ) : (
                  <Play className="h-3 w-3 shrink-0" aria-hidden="true" />
                )}
                <span>{stopwatch.running ? t.timerPause : t.timerResume}</span>
              </button>
              {stopwatch.running && (
                <button
                  type="button"
                  data-testid="notif-bar-stopwatch-lap"
                  onClick={onStopwatchLap}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-[#DCE1DB] bg-white px-2.5 py-1 text-xs font-medium text-[#35443C] hover:bg-[#EEF1ED] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#C5D1CA]"
                >
                  <Flag className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>{t.stopwatchLap}</span>
                </button>
              )}
              <button
                type="button"
                data-testid="notif-bar-stopwatch-reset"
                onClick={onStopwatchReset}
                aria-label={t.timerReset}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#DCE1DB] bg-white text-[#5A6960] hover:bg-[#EEF1ED] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#9AA9A1]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
