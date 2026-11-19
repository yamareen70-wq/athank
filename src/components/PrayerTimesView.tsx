import { useState } from 'react';
import {
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Compass,
  Moon,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  AppSettings,
  DailyPrayerSchedule,
  NextPrayerState,
  PrayerKey,
  TimeFormat,
} from '../types/prayer';
import {
  CALCULATION_METHODS,
  computeNightTimes,
  formatCityCurrentClock,
  formatCountdown,
  formatPrayerMinutes,
} from '../utils/prayerMath';
import {
  calculateDistanceToKaabaKm,
  calculateQiblaBearing,
  getCardinalDirection,
} from '../utils/qiblaMath';
import { T, getPrayerName } from '../utils/i18n';

const HERO_IMAGE_SRC = '/src/assets/images/mosque_courtyard_hero_1795120912259.jpg';

function FormattedTime({ value, className = '' }: { value: string; className?: string }) {
  const [clock, period] = value.split(' ');
  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <span dir="ltr" className="font-mono tabular-nums">
        {clock}
      </span>
      {period && <span className="font-sans text-[0.78em] font-medium opacity-85">{period}</span>}
    </span>
  );
}

interface PrayerTimesViewProps {
  now: Date;
  settings: AppSettings;
  dayOffset: number;
  viewedSchedule: DailyPrayerSchedule;
  viewedNextSchedule: DailyPrayerSchedule;
  nextPrayerState: NextPrayerState;
  isPlayingAdhan: boolean;
  onChangeDayOffset: (offset: number) => void;
  onChangeTimeFormat: (format: TimeFormat) => void;
  onTogglePrayerAlert: (key: PrayerKey) => void;
  onToggleMuteAll: () => void;
  onPreviewAdhan: () => void;
  onOpenQibla: () => void;
  onOpenAlarms: () => void;
  onOpenCityPicker: () => void;
}

export function PrayerTimesView({
  now,
  settings,
  dayOffset,
  viewedSchedule,
  viewedNextSchedule,
  nextPrayerState,
  isPlayingAdhan,
  onChangeDayOffset,
  onChangeTimeFormat,
  onTogglePrayerAlert,
  onToggleMuteAll,
  onPreviewAdhan,
  onOpenQibla,
  onOpenAlarms,
  onOpenCityPicker,
}: PrayerTimesViewProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const { city, language, method, timeFormat, dstMode, alerts, customAlarms, manualAdjustments } =
    settings;
  const t = T[language];

  const cityName = language === 'ar' ? city.nameAr : city.nameEn;
  const qiblaBearing = calculateQiblaBearing(city.latitude, city.longitude);
  const distanceKm = Math.round(calculateDistanceToKaabaKm(city.latitude, city.longitude));
  const cardinalLabel = getCardinalDirection(qiblaBearing, language);
  const enabledAlertsCount = Object.values(alerts.byPrayer).filter((c) => c.enabled).length;
  const activePersonalCount = customAlarms.filter((a) => a.enabled).length;
  const localClock = formatCityCurrentClock(now, city.timeZone, timeFormat, language, dstMode);
  const methodInfo = CALCULATION_METHODS[method];
  const nightTimes = computeNightTimes(viewedSchedule, viewedNextSchedule);
  const midnightFormatted = formatPrayerMinutes(nightTimes.midnightMinutes, timeFormat, language);
  const lastThirdFormatted = formatPrayerMinutes(nightTimes.lastThirdMinutes, timeFormat, language);

  const isToday = dayOffset === 0;
  const isTomorrow = dayOffset === 1;
  const isYesterday = dayOffset === -1;

  const viewedHijri = language === 'ar' ? viewedSchedule.hijriDateAr : viewedSchedule.hijriDateEn;
  const viewedGreg =
    language === 'ar' ? viewedSchedule.gregorianDateAr : viewedSchedule.gregorianDateEn;

  const dayRelationLabel = isToday
    ? t.today
    : isTomorrow
      ? t.tomorrow
      : isYesterday
        ? t.yesterday
        : viewedGreg;

  const nextPrayerName = getPrayerName(nextPrayerState.nextPrayer.key, language);
  const currentPrayerName = nextPrayerState.currentPrayer
    ? getPrayerName(nextPrayerState.currentPrayer.key, language)
    : null;

  return (
    <div className="space-y-8">
      {/* Top 2-column balanced Hero & Companion Summary */}
      <section
        aria-label={t.nextPrayer}
        className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch"
      >
        {/* Focal Anchor: Next Prayer Hero Card */}
        <div className="sai-hero-card relative overflow-hidden rounded-2xl bg-[#0D261C] text-white lg:col-span-7 flex flex-col justify-between min-h-[295px] sm:min-h-[325px]">
          {!heroImgFailed && (
            <img
              src={HERO_IMAGE_SRC}
              alt={
                language === 'ar'
                  ? 'فناء مسجد معماري حديث بإضاءة دافئة هادئة'
                  : 'Serene modern mosque courtyard in warm sunlight'
              }
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="absolute inset-0 h-full w-full object-cover object-center opacity-40 mix-blend-luminosity"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20"
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
            {/* Unboxed Quiet Metadata Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-white/85">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenCityPicker}
                  className="font-medium text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
                >
                  {cityName}
                </button>
                <span aria-hidden="true" className="text-white/50">
                  ·
                </span>
                <span>{viewedHijri}</span>
                <span aria-hidden="true" className="text-white/50 hidden sm:inline">
                  ·
                </span>
                <span className="hidden sm:inline text-white/75">{viewedGreg}</span>
              </div>
              <span
                data-testid="live-city-clock"
                className="inline-flex items-center rounded-lg bg-white/12 px-2.5 py-1 text-xs sm:text-sm font-semibold text-white backdrop-blur-xs"
              >
                <FormattedTime value={localClock} />
              </span>
            </div>

            {/* Central Next Prayer Countdown */}
            <div className="my-6 sm:my-7">
              <p className="text-sm font-medium text-[#D9B872]">
                {nextPrayerState.isNextDayFajr ? t.nextDayFajr : t.nextPrayer}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-4">
                <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {nextPrayerName}
                </h1>
                <div dir="ltr">
                  <p
                    data-testid="next-prayer-countdown"
                    className="font-mono text-3xl font-semibold tracking-tight tabular-nums text-white sm:text-4xl"
                  >
                    {formatCountdown(nextPrayerState.remainingSeconds)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm text-white/80">
                {t.adhanAt}{' '}
                <FormattedTime
                  value={formatPrayerMinutes(
                    nextPrayerState.nextPrayer.minutesFromMidnight,
                    timeFormat,
                    language
                  )}
                  className="font-medium text-white"
                />
                {dstMode !== 'auto' && (
                  <span className="text-xs text-[#D9B872]">
                    {' '}
                    · {dstMode === 'plus1' ? t.dstBadge.plus1 : t.dstBadge.minus1}
                  </span>
                )}
              </p>
            </div>

            {/* Progress Track & Primary Action */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-white/75">
                  <span>
                    {currentPrayerName ? t.sincePrayer(currentPrayerName) : t.startOfDay}
                  </span>
                  <span className="font-mono tabular-nums">
                    {Math.round(nextPrayerState.progressPercent)}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={t.nextPrayer}
                  aria-valuenow={Math.round(nextPrayerState.progressPercent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1.5 w-full overflow-hidden rounded-full bg-white/20"
                >
                  <div
                    className="h-full rounded-full bg-[#D9B872] transition-[width] duration-300"
                    style={{ width: `${Math.round(nextPrayerState.progressPercent)}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-xs text-white/70 truncate max-w-[270px]">
                  {language === 'ar' ? methodInfo.nameAr : methodInfo.nameEn}
                </span>
                <button
                  type="button"
                  onClick={onPreviewAdhan}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#0F5132] transition-colors duration-150 hover:bg-[#ECF3EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap shrink-0"
                >
                  {isPlayingAdhan ? (
                    <VolumeX className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <Volume2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{isPlayingAdhan ? t.stopAdhan : t.previewAdhan}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Companion Panel: Quick Qibla & Adhan Status */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E3E7E2] bg-white p-6 lg:col-span-5 dark:border-[#1E2A24] dark:bg-[#121916]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-[#5A6960] dark:text-[#8E9F95]">
                {t.qiblaFrom(cityName)}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-semibold tabular-nums text-[#121816] dark:text-[#ECF1EE]">
                  {Math.round(qiblaBearing)}°
                </span>
                <span className="text-sm font-medium text-[#0F5132] dark:text-[#6EE7B7]">
                  {cardinalLabel}
                </span>
              </div>
              <p className="text-xs text-[#64746B] dark:text-[#8E9F95]">
                {t.distanceToKaaba}{' '}
                <span className="font-mono tabular-nums font-medium text-[#121816] dark:text-[#D5DFD9]">
                  {distanceKm.toLocaleString('en-US')} {t.km}
                </span>
              </p>
            </div>

            <div
              aria-hidden="true"
              className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#DCE1DB] bg-[#F8F9F7] dark:border-[#24322B] dark:bg-[#0D1310]"
            >
              <span className="absolute top-1.5 text-[10px] font-semibold text-[#64746B] dark:text-[#8E9F95]">
                {language === 'ar' ? 'ش' : 'N'}
              </span>
              <svg
                viewBox="0 0 80 80"
                className="h-16 w-16 transition-transform duration-300"
                style={{ transform: `rotate(${qiblaBearing}deg)` }}
              >
                <line
                  x1="40"
                  y1="14"
                  x2="40"
                  y2="66"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-[#CBD3CC] dark:text-[#2D3D35]"
                />
                <polygon points="40,10 34,26 46,26" className="fill-[#0F5132] dark:fill-[#6EE7B7]" />
                <circle cx="40" cy="40" r="3.5" className="fill-[#9A7B3E]" />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onOpenQibla}
              className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] px-4 py-2 text-sm font-medium text-[#121816] transition-colors duration-150 hover:border-[#0F5132]/40 hover:bg-[#EFF4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] dark:border-[#24322B] dark:bg-[#17211C] dark:text-[#ECF1EE] dark:hover:border-[#6EE7B7]/40 dark:hover:bg-[#1D2A24]"
            >
              <Compass className="h-4 w-4 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
              <span>{t.openQibla}</span>
            </button>
          </div>

          <hr className="my-5 border-[#EAECE8] dark:border-[#1E2A24]" />

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                {t.adhanAlertsTitle}
              </p>
              <p className="text-xs text-[#5A6960] dark:text-[#8E9F95]">
                {alerts.muted
                  ? t.alertsMutedDesc
                  : t.alertsActiveDesc(enabledAlertsCount, activePersonalCount)}
              </p>
              <button
                type="button"
                onClick={onOpenAlarms}
                className="text-xs font-semibold text-[#0F5132] underline-offset-4 hover:underline dark:text-[#6EE7B7]"
              >
                {t.manageAlarms}
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleMuteAll}
              aria-pressed={alerts.muted}
              aria-label={alerts.muted ? t.active : t.muted}
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] whitespace-nowrap shrink-0 ${
                alerts.muted
                  ? 'border-[#B91C1C]/30 bg-[#FEF2F2] text-[#991B1B] dark:border-[#FCA5A5]/30 dark:bg-[#3B1818] dark:text-[#FCA5A5]'
                  : 'border-[#0F5132]/25 bg-[#0F5132]/8 text-[#0F5132] hover:bg-[#0F5132]/14 dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/10 dark:text-[#6EE7B7]'
              }`}
            >
              {alerts.muted ? (
                <>
                  <VolumeX className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t.muted}</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t.active}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Daily Prayer Schedule Table */}
      <section aria-labelledby="schedule-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              id="schedule-heading"
              className="text-xl font-bold text-[#121816] dark:text-[#ECF1EE]"
            >
              {t.dailySchedule}
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
              {dayRelationLabel} · {viewedHijri}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-xl border border-[#DCE1DB] bg-white p-1 dark:border-[#24322B] dark:bg-[#121916]">
              <button
                type="button"
                onClick={() => onChangeDayOffset(dayOffset - 1)}
                aria-label={t.prevDay}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#47564E] transition-colors hover:bg-[#F3F5F2] hover:text-[#121816] dark:text-[#98A89F] dark:hover:bg-[#1B2520] dark:hover:text-[#ECF1EE]"
              >
                {language === 'ar' ? (
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onChangeDayOffset(0)}
                disabled={isToday}
                className="min-h-[36px] rounded-lg px-3 text-xs font-medium text-[#121816] transition-colors hover:bg-[#F3F5F2] disabled:text-[#0F5132] disabled:font-semibold disabled:hover:bg-transparent whitespace-nowrap dark:text-[#ECF1EE] dark:hover:bg-[#1B2520] dark:disabled:text-[#6EE7B7]"
              >
                {t.today}
              </button>
              <button
                type="button"
                onClick={() => onChangeDayOffset(dayOffset + 1)}
                aria-label={t.nextDay}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#47564E] transition-colors hover:bg-[#F3F5F2] hover:text-[#121816] dark:text-[#98A89F] dark:hover:bg-[#1B2520] dark:hover:text-[#ECF1EE]"
              >
                {language === 'ar' ? (
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            <div
              role="group"
              aria-label={t.timeFormatLabel}
              className="inline-flex items-center rounded-xl border border-[#DCE1DB] bg-[#EEF1ED] p-1 dark:border-[#24322B] dark:bg-[#0E1512]"
            >
              <button
                type="button"
                onClick={() => onChangeTimeFormat('12h')}
                aria-pressed={timeFormat === '12h'}
                className={`min-h-[36px] rounded-lg px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                  timeFormat === '12h'
                    ? 'bg-white text-[#121816] shadow-xs dark:bg-[#1B2621] dark:text-[#ECF1EE]'
                    : 'text-[#5A6960] hover:text-[#121816] dark:text-[#8E9F95] dark:hover:text-[#ECF1EE]'
                }`}
              >
                {t.h12}
              </button>
              <button
                type="button"
                onClick={() => onChangeTimeFormat('24h')}
                aria-pressed={timeFormat === '24h'}
                className={`min-h-[36px] rounded-lg px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                  timeFormat === '24h'
                    ? 'bg-white text-[#121816] shadow-xs dark:bg-[#1B2621] dark:text-[#ECF1EE]'
                    : 'text-[#5A6960] hover:text-[#121816] dark:text-[#8E9F95] dark:hover:text-[#ECF1EE]'
                }`}
              >
                {t.h24}
              </button>
            </div>
          </div>
        </div>

        <div
          data-testid="prayer-schedule-list"
          className="overflow-hidden rounded-2xl border border-[#E3E7E2] bg-white divide-y divide-[#EFF2EE] dark:border-[#1E2A24] dark:bg-[#121916] dark:divide-[#1C2621]"
        >
          {viewedSchedule.prayers.map((prayer) => {
            const isUpcoming =
              isToday &&
              !nextPrayerState.isNextDayFajr &&
              nextPrayerState.nextPrayer.key === prayer.key;
            const isPassed = isToday && prayer.date.getTime() <= now.getTime();
            const alertCfg = alerts.byPrayer[prayer.key];
            const formattedTime = formatPrayerMinutes(
              prayer.minutesFromMidnight,
              timeFormat,
              language
            );
            const pName = getPrayerName(prayer.key, language);
            const manualMin = manualAdjustments[prayer.key] ?? 0;

            const statusText = !isToday
              ? prayer.isFard
                ? t.statusFard
                : t.statusSunrise
              : isUpcoming
                ? t.statusUpcoming
                : isPassed
                  ? t.statusPassed
                  : t.statusLater;

            const alertHints: string[] = [];
            if (alertCfg.enabled) {
              if (alertCfg.beforeMinutes > 0) alertHints.push(t.beforeShort(alertCfg.beforeMinutes));
              if (alertCfg.afterMinutes > 0) alertHints.push(t.afterShort(alertCfg.afterMinutes));
            }

            return (
              <div
                key={prayer.key}
                data-prayer-key={prayer.key}
                data-upcoming={isUpcoming ? 'true' : 'false'}
                className={`flex min-h-[68px] items-center justify-between gap-4 px-5 py-3.5 sm:px-6 transition-colors ${
                  isUpcoming
                    ? 'bg-[#0F5132]/[0.06] dark:bg-[#6EE7B7]/[0.08]'
                    : 'hover:bg-[#FAFBF9] dark:hover:bg-[#16201B]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span
                      className={`text-base sm:text-lg font-semibold ${
                        isUpcoming
                          ? 'text-[#0F5132] dark:text-[#6EE7B7]'
                          : isPassed
                            ? 'text-[#6A7970] dark:text-[#7E8F85]'
                            : 'text-[#121816] dark:text-[#ECF1EE]'
                      }`}
                    >
                      {pName}
                    </span>
                    <span
                      className={`text-xs ${
                        isUpcoming
                          ? 'font-semibold text-[#0F5132] dark:text-[#6EE7B7]'
                          : 'text-[#6B7A71] dark:text-[#7D8F85]'
                      }`}
                    >
                      {statusText}
                    </span>
                    {manualMin !== 0 && (
                      <span
                        dir="ltr"
                        className="font-mono text-[11px] tabular-nums text-[#9A7B3E] dark:text-[#D9B872]"
                      >
                        ({manualMin > 0 ? `+${manualMin}m` : `${manualMin}m`})
                      </span>
                    )}
                  </div>
                  {alertHints.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-[#64746B] dark:text-[#8E9F95]">
                      {alertHints.join(' · ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <FormattedTime
                    value={formattedTime}
                    className={`text-base sm:text-lg font-semibold ${
                      isUpcoming
                        ? 'text-[#0F5132] dark:text-[#6EE7B7]'
                        : isPassed
                          ? 'text-[#6A7970] dark:text-[#7E8F85]'
                          : 'text-[#121816] dark:text-[#ECF1EE]'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => onTogglePrayerAlert(prayer.key)}
                    aria-pressed={alertCfg.enabled}
                    aria-label={`${alertCfg.enabled ? t.off : t.active} ${pName}`}
                    className={`inline-flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
                      alertCfg.enabled
                        ? 'border-[#0F5132]/25 bg-[#0F5132]/8 text-[#0F5132] hover:bg-[#0F5132]/15 dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]'
                        : 'border-[#DCE1DB] bg-transparent text-[#6A7970] hover:bg-[#F3F5F2] hover:text-[#121816] dark:border-[#24322B] dark:text-[#7E8F85] dark:hover:bg-[#1B2520] dark:hover:text-[#ECF1EE]'
                    }`}
                  >
                    {alertCfg.enabled ? (
                      <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <BellOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">
                      {alertCfg.enabled ? t.active : t.off}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Islamic Midnight & Last Third of the Night */}
        <div
          data-testid="night-times-section"
          className="rounded-2xl border border-[#E3E7E2] bg-white p-5 sm:p-6 dark:border-[#1E2A24] dark:bg-[#121916]"
        >
          <div className="mb-4 flex items-center gap-2">
            <Moon className="h-4 w-4 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
            <h3 className="text-sm font-bold text-[#121816] dark:text-[#ECF1EE]">
              {t.nightTimesTitle}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div
              data-testid="islamic-midnight-card"
              className="flex items-center justify-between gap-4 rounded-xl border border-[#EAECE8] bg-[#F8F9F7] px-4 py-3.5 dark:border-[#223029] dark:bg-[#0E1512]"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                  {t.islamicMidnight}
                </p>
                <p className="mt-0.5 text-xs text-[#64746B] dark:text-[#8E9F95]">
                  {t.islamicMidnightHint}
                </p>
              </div>
              <FormattedTime
                value={midnightFormatted}
                className="shrink-0 text-base sm:text-lg font-bold text-[#0F5132] dark:text-[#6EE7B7]"
              />
            </div>

            <div
              data-testid="last-third-night-card"
              className="flex items-center justify-between gap-4 rounded-xl border border-[#9A7B3E]/25 bg-[#9A7B3E]/[0.06] px-4 py-3.5 dark:border-[#D9B872]/25 dark:bg-[#D9B872]/[0.08]"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                  <Sparkles
                    className="h-3.5 w-3.5 shrink-0 text-[#9A7B3E] dark:text-[#D9B872]"
                    aria-hidden="true"
                  />
                  <span>{t.lastThirdNight}</span>
                </p>
                <p className="mt-0.5 text-xs text-[#64746B] dark:text-[#8E9F95]">
                  {t.lastThirdNightHint}
                </p>
              </div>
              <FormattedTime
                value={lastThirdFormatted}
                className="shrink-0 text-base sm:text-lg font-bold text-[#8A6B30] dark:text-[#E5C98B]"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
