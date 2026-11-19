import { Clock, MapPin } from 'lucide-react';
import type {
  AppSettings,
  DailyPrayerSchedule,
  NextPrayerState,
  WidgetPreferences,
} from '../types/prayer';
import { formatCountdown, formatPrayerMinutes } from '../utils/prayerMath';
import { T, getPrayerName } from '../utils/i18n';

interface HomeWidgetCardProps {
  settings: AppSettings;
  todaySchedule: DailyPrayerSchedule;
  nextPrayerState: NextPrayerState;
  widgetPrefs?: WidgetPreferences;
  compactFloating?: boolean;
}

export function HomeWidgetCard({
  settings,
  todaySchedule,
  nextPrayerState,
  widgetPrefs,
  compactFloating = false,
}: HomeWidgetCardProps) {
  const widget = widgetPrefs ?? settings.widget;
  const { language, timeFormat, city, theme } = settings;
  const t = T[language];

  const resolvedTheme =
    widget.theme === 'auto' ? (theme === 'dark' ? 'dark' : 'light') : widget.theme;

  const nextName = getPrayerName(nextPrayerState.nextPrayer.key, language);
  const nextTime = formatPrayerMinutes(
    nextPrayerState.nextPrayer.minutesFromMidnight,
    timeFormat,
    language
  );
  const countdown = formatCountdown(nextPrayerState.remainingSeconds);
  const cityLabel = language === 'ar' ? city.nameAr : city.nameEn;
  const regionLabel = language === 'ar' ? city.regionAr : city.regionEn;
  const hijriLabel = language === 'ar' ? todaySchedule.hijriDateAr : todaySchedule.hijriDateEn;

  const fardPrayers = todaySchedule.prayers.filter((p) => p.isFard);

  const surfaceClass =
    widget.style === 'transparent'
      ? 'border border-white/25 bg-[#0C261B]/65 text-white backdrop-blur-md shadow-lg'
      : resolvedTheme === 'emerald'
        ? 'border border-[#1E7349] bg-gradient-to-br from-[#0F5132] to-[#082E1C] text-white shadow-md'
        : resolvedTheme === 'dark'
          ? 'border border-[#24322B] bg-[#111916] text-[#ECF1EE] shadow-md'
          : 'border border-[#DCE1DB] bg-white text-[#121816] shadow-sm';

  const mutedText =
    widget.style === 'transparent' || resolvedTheme === 'emerald'
      ? 'text-white/75'
      : resolvedTheme === 'dark'
        ? 'text-[#8E9F95]'
        : 'text-[#5A6960]';

  const accentText =
    widget.style === 'transparent' || resolvedTheme === 'emerald'
      ? 'text-[#E7C983]'
      : resolvedTheme === 'dark'
        ? 'text-[#6EE7B7]'
        : 'text-[#0F5132]';

  const activePillBg =
    widget.style === 'transparent' || resolvedTheme === 'emerald'
      ? 'bg-white/15 text-white ring-1 ring-[#E7C983]/50'
      : resolvedTheme === 'dark'
        ? 'bg-[#196B45]/30 text-[#6EE7B7] ring-1 ring-[#6EE7B7]/35'
        : 'bg-[#0F5132]/10 text-[#0F5132] ring-1 ring-[#0F5132]/25';

  if (widget.style === 'compact' || compactFloating) {
    return (
      <div
        data-testid="home-widget-card"
        className={`rounded-2xl p-4 transition-all ${surfaceClass}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className={`flex items-center gap-1.5 text-[11px] font-medium ${mutedText}`}>
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {cityLabel}
                {regionLabel ? ` · ${regionLabel}` : ''}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold">{nextName}</span>
              <span dir="ltr" className={`font-mono text-sm font-semibold tabular-nums ${accentText}`}>
                {nextTime}
              </span>
            </div>
          </div>

          {widget.showCountdown && (
            <div className="text-end shrink-0">
              <p className={`text-[10px] font-medium ${mutedText}`}>{t.persistentBarRemaining}</p>
              <p dir="ltr" className="font-mono text-base font-bold tabular-nums">
                {countdown}
              </p>
            </div>
          )}
        </div>

        {widget.showHijri && !compactFloating && (
          <p className={`mt-2 border-t border-current/10 pt-2 text-[11px] ${mutedText}`}>
            {hijriLabel}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="home-widget-card"
      className={`rounded-2xl p-5 transition-all ${surfaceClass}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${mutedText}`}>
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {cityLabel}
              {regionLabel ? ` · ${regionLabel}` : ''}
            </span>
          </div>
          {widget.showHijri && <p className={`mt-0.5 text-[11px] ${mutedText}`}>{hijriLabel}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Clock className={`h-3.5 w-3.5 ${accentText}`} aria-hidden="true" />
          <span className={`text-xs font-semibold ${accentText}`}>{nextName}</span>
          <span dir="ltr" className="font-mono text-sm font-bold tabular-nums">
            {nextTime}
          </span>
          {widget.showCountdown && (
            <span
              dir="ltr"
              className={`rounded-lg px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ${activePillBg}`}
            >
              {countdown}
            </span>
          )}
        </div>
      </div>

      {widget.showAllPrayers && (
        <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2">
          {fardPrayers.map((prayer) => {
            const isNext =
              !nextPrayerState.isNextDayFajr && prayer.key === nextPrayerState.nextPrayer.key;
            return (
              <div
                key={prayer.key}
                className={`rounded-xl px-1.5 py-2 text-center transition-colors ${
                  isNext ? activePillBg : 'bg-current/[0.04]'
                }`}
              >
                <p className={`truncate text-[11px] font-semibold ${isNext ? '' : mutedText}`}>
                  {getPrayerName(prayer.key, language)}
                </p>
                <p dir="ltr" className="mt-0.5 font-mono text-[11px] sm:text-xs font-bold tabular-nums">
                  {formatPrayerMinutes(prayer.minutesFromMidnight, timeFormat, language)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
