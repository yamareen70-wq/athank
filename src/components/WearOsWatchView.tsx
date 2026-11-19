import { useState } from 'react';
import {
  Bell,
  BellOff,
  Compass,
  List,
  Moon,
  Sparkles,
  Vibrate,
  Watch,
} from 'lucide-react';
import type {
  AppSettings,
  DailyPrayerSchedule,
  NextPrayerState,
} from '../types/prayer';
import {
  formatCityCurrentClock,
  formatCountdown,
  formatPrayerMinutes,
} from '../utils/prayerMath';
import { calculateQiblaBearing, getCardinalDirection } from '../utils/qiblaMath';
import { T, getPrayerName } from '../utils/i18n';

type WatchTilePage = 'main' | 'schedule' | 'qibla';

interface WearOsWatchViewProps {
  now: Date;
  settings: AppSettings;
  todaySchedule: DailyPrayerSchedule;
  nextPrayerState: NextPrayerState;
  onToggleMuteAll?: () => void;
  onToggleAmbient?: () => void;
  size?: 'preview' | 'standalone';
}

export function WearOsWatchView({
  now,
  settings,
  todaySchedule,
  nextPrayerState,
  onToggleMuteAll,
  onToggleAmbient,
  size = 'preview',
}: WearOsWatchViewProps) {
  const { language, city, timeFormat, dstMode, wearOs, alerts } = settings;
  const t = T[language];
  const [tilePage, setTilePage] = useState<WatchTilePage>(() =>
    wearOs.tileStyle === 'full_list' ? 'schedule' : 'main'
  );

  const isAmbient = wearOs.ambientOled || wearOs.tileStyle === 'minimal_oled';
  const liveClock = formatCityCurrentClock(
    now,
    city.timeZone,
    timeFormat,
    language,
    dstMode,
    wearOs.showSeconds
  );
  const nextPrayerName = getPrayerName(nextPrayerState.nextPrayer.key, language);
  const nextPrayerTime = formatPrayerMinutes(
    nextPrayerState.nextPrayer.minutesFromMidnight,
    timeFormat,
    language
  );
  const qiblaBearing = Math.round(calculateQiblaBearing(city.latitude, city.longitude));
  const cardinal = getCardinalDirection(qiblaBearing, language);

  const progress = Math.max(0, Math.min(100, Math.round(nextPrayerState.progressPercent)));
  const radius = 146;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  const diameterClass =
    size === 'standalone'
      ? 'h-[320px] w-[320px] sm:h-[360px] sm:w-[360px]'
      : 'h-[280px] w-[280px] sm:h-[304px] sm:w-[304px]';

  return (
    <div
      data-testid="wearos-watch-face"
      data-ambient={isAmbient ? 'true' : 'false'}
      className="flex flex-col items-center gap-3"
    >
      {/* Circular Wear OS Hardware Frame */}
      <div
        className={`relative flex items-center justify-center rounded-full p-2.5 shadow-2xl ring-2 ring-white/15 ${diameterClass} ${
          isAmbient
            ? 'bg-black'
            : 'bg-gradient-to-b from-[#1A2420] via-[#0B120F] to-[#050807]'
        }`}
      >
        {/* Outer Circular Progress Arc (Wear OS Complication Ring) */}
        <svg
          viewBox="0 0 320 320"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
        >
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={isAmbient ? 2.5 : 5}
            className="text-white/10"
          />
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="none"
            stroke={isAmbient ? '#6EE7B7' : '#D9B872'}
            strokeWidth={isAmbient ? 2.5 : 5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-300"
          />
        </svg>

        {/* Inner Watch Display Surface */}
        <div
          className={`relative z-10 flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-full px-6 py-5 text-center text-white ${
            isAmbient
              ? 'bg-black'
              : 'bg-gradient-to-b from-[#0E261C] via-[#091812] to-[#060E0B]'
          }`}
        >
          {/* Top Status & Clock */}
          <div className="space-y-0.5 pt-0.5">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-white/65">
              <Watch className="h-3 w-3 text-[#6EE7B7]" aria-hidden="true" />
              <span className="max-w-[110px] truncate">
                {language === 'ar' ? city.nameAr : city.nameEn}
              </span>
              {wearOs.vibrateOnAdhan && (
                <Vibrate className="h-3 w-3 text-[#D9B872]" aria-hidden="true" />
              )}
            </div>
            <p
              dir="ltr"
              data-testid="wearos-clock"
              className="font-mono text-sm sm:text-base font-semibold tracking-tight tabular-nums text-white"
            >
              {liveClock}
            </p>
          </div>

          {/* Center Watch Tile Content */}
          {tilePage === 'main' && (
            <div className="my-auto flex flex-col items-center justify-center space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#D9B872]">
                {nextPrayerState.isNextDayFajr ? t.nextDayFajr : t.nextPrayer}
              </span>
              <p className="font-display text-2xl sm:text-3xl font-bold leading-tight text-white">
                {nextPrayerName}
              </p>
              <p
                dir="ltr"
                className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-[#6EE7B7]"
              >
                {formatCountdown(nextPrayerState.remainingSeconds)}
              </p>
              <p className="text-[11px] text-white/75">
                {t.adhanAt}{' '}
                <span dir="ltr" className="font-mono font-semibold tabular-nums text-white">
                  {nextPrayerTime}
                </span>
              </p>
              {wearOs.showQiblaComplication && (
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-[#E5C98B]">
                  <Compass className="h-3 w-3" aria-hidden="true" />
                  <span dir="ltr" className="font-mono tabular-nums">
                    {qiblaBearing}°
                  </span>
                  <span>{cardinal}</span>
                </p>
              )}
            </div>
          )}

          {tilePage === 'schedule' && (
            <div className="my-auto w-full max-w-[205px] space-y-1 px-1">
              {todaySchedule.prayers.map((p) => {
                const isNext =
                  !nextPrayerState.isNextDayFajr && nextPrayerState.nextPrayer.key === p.key;
                return (
                  <div
                    key={p.key}
                    className={`flex items-center justify-between rounded-lg px-2 py-0.5 text-[11px] ${
                      isNext
                        ? 'bg-[#6EE7B7]/20 font-bold text-[#6EE7B7]'
                        : 'text-white/80'
                    }`}
                  >
                    <span>{getPrayerName(p.key, language)}</span>
                    <span dir="ltr" className="font-mono tabular-nums">
                      {formatPrayerMinutes(p.minutesFromMidnight, timeFormat, language)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {tilePage === 'qibla' && (
            <div className="my-auto flex flex-col items-center justify-center space-y-1.5">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/5">
                <span className="absolute top-1 text-[9px] font-bold text-white/60">
                  {language === 'ar' ? 'ش' : 'N'}
                </span>
                <svg
                  viewBox="0 0 80 80"
                  className="h-20 w-20"
                  style={{ transform: `rotate(${qiblaBearing}deg)` }}
                >
                  <line
                    x1="40"
                    y1="14"
                    x2="40"
                    y2="66"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="1.5"
                  />
                  <polygon points="40,10 33,27 47,27" fill="#6EE7B7" />
                  <circle cx="40" cy="40" r="3.5" fill="#D9B872" />
                </svg>
              </div>
              <p className="font-mono text-sm font-bold tabular-nums text-[#6EE7B7]">
                {qiblaBearing}° · {cardinal}
              </p>
            </div>
          )}

          {/* Bottom Interactive Watch Tile Switcher Dots & Quick Controls */}
          <div className="flex items-center justify-center gap-2 pb-0.5">
            <button
              type="button"
              onClick={() => setTilePage('main')}
              aria-label={t.nextPrayer}
              aria-pressed={tilePage === 'main'}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                tilePage === 'main'
                  ? 'bg-[#6EE7B7] text-[#06120D]'
                  : 'bg-white/10 text-white/75 hover:bg-white/20'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setTilePage('schedule')}
              aria-label={t.dailySchedule}
              aria-pressed={tilePage === 'schedule'}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                tilePage === 'schedule'
                  ? 'bg-[#6EE7B7] text-[#06120D]'
                  : 'bg-white/10 text-white/75 hover:bg-white/20'
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setTilePage('qibla')}
              aria-label={t.qiblaTitle}
              aria-pressed={tilePage === 'qibla'}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                tilePage === 'qibla'
                  ? 'bg-[#6EE7B7] text-[#06120D]'
                  : 'bg-white/10 text-white/75 hover:bg-white/20'
              }`}
            >
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            {onToggleAmbient && (
              <button
                type="button"
                onClick={onToggleAmbient}
                aria-label={t.wearOsAmbientOled}
                aria-pressed={isAmbient}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  isAmbient
                    ? 'bg-[#D9B872] text-[#06120D]'
                    : 'bg-white/10 text-white/75 hover:bg-white/20'
                }`}
              >
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}

            {onToggleMuteAll && (
              <button
                type="button"
                onClick={onToggleMuteAll}
                aria-label={alerts.muted ? t.active : t.muted}
                aria-pressed={alerts.muted}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  alerts.muted
                    ? 'bg-[#EF4444]/85 text-white'
                    : 'bg-white/10 text-white/75 hover:bg-white/20'
                }`}
              >
                {alerts.muted ? (
                  <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
