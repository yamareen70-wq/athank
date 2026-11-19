import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Minus,
  Moon,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react';
import type { AppSettings, DstMode, FirstDayOfWeek } from '../types/prayer';
import { T, getPrayerName } from '../utils/i18n';
import {
  buildHijriMonthGrid,
  getHijriMonthName,
  getLeadingEmptyCells,
  getNextRamadanYear,
  getOrderedWeekdayIndices,
  getUpcomingIslamicOccasions,
  GREGORIAN_MONTHS_AR_SHORT,
  GREGORIAN_MONTHS_EN_SHORT,
  gregorianToHijri,
  isRamadanLastTenOddNight,
  shiftHijriMonth,
  type HijriCalendarDayCell,
} from '../utils/hijriCalendar';
import {
  buildDailyPrayerSchedule,
  formatPrayerMinutes,
  getZonedDateParts,
} from '../utils/prayerMath';

interface HijriCalendarViewProps {
  now: Date;
  settings: AppSettings;
  onUpdateHijriAdjustment: (days: number) => void;
  onUpdateDstMode: (mode: DstMode) => void;
  onUpdateFirstDayOfWeek: (day: FirstDayOfWeek) => void;
}

export function HijriCalendarView({
  now,
  settings,
  onUpdateHijriAdjustment,
  onUpdateDstMode,
  onUpdateFirstDayOfWeek,
}: HijriCalendarViewProps) {
  const {
    language,
    city,
    method,
    asrSchool,
    dstMode,
    manualAdjustments,
    hijriAdjustment,
    firstDayOfWeek,
    timeFormat,
  } = settings;
  const t = T[language];

  const todayGreg = useMemo(() => getZonedDateParts(now, city.timeZone), [now, city.timeZone]);
  const todayHijri = useMemo(
    () => gregorianToHijri(todayGreg.year, todayGreg.month, todayGreg.day, hijriAdjustment),
    [todayGreg.year, todayGreg.month, todayGreg.day, hijriAdjustment]
  );

  const [viewedMonth, setViewedMonth] = useState<{ year: number; month: number }>(() => ({
    year: todayHijri.year,
    month: todayHijri.month,
  }));

  const [selectedDayNum, setSelectedDayNum] = useState<number>(todayHijri.day);

  const monthCells = useMemo(
    () =>
      buildHijriMonthGrid({
        hijriYear: viewedMonth.year,
        hijriMonth: viewedMonth.month,
        hijriAdjustment,
        todayGregorian: todayGreg,
      }),
    [viewedMonth.year, viewedMonth.month, hijriAdjustment, todayGreg]
  );

  const upcomingEvents = useMemo(
    () => getUpcomingIslamicOccasions(todayGreg, hijriAdjustment, 6),
    [todayGreg, hijriAdjustment]
  );

  const orderedWeekdayIndices = useMemo(
    () => getOrderedWeekdayIndices(firstDayOfWeek),
    [firstDayOfWeek]
  );

  const leadingEmptyCount = useMemo(
    () => getLeadingEmptyCells(monthCells[0]?.weekday ?? 0, firstDayOfWeek),
    [monthCells, firstDayOfWeek]
  );

  const selectedCell: HijriCalendarDayCell =
    monthCells.find((c) => c.hijri.day === selectedDayNum) ?? monthCells[0];

  const selectedSchedule = useMemo(
    () =>
      buildDailyPrayerSchedule({
        city,
        year: selectedCell.gregorian.year,
        month: selectedCell.gregorian.month,
        day: selectedCell.gregorian.day,
        method,
        asrSchool,
        dstMode,
        manualAdjustments,
        hijriAdjustment,
      }),
    [
      city,
      selectedCell.gregorian.year,
      selectedCell.gregorian.month,
      selectedCell.gregorian.day,
      method,
      asrSchool,
      dstMode,
      manualAdjustments,
      hijriAdjustment,
    ]
  );

  const monthOccasions = useMemo(
    () => monthCells.filter((c) => c.occasion !== null),
    [monthCells]
  );

  const isRamadanMonth = viewedMonth.month === 9;
  const selectedIsOddRamadanNight = isRamadanLastTenOddNight(
    selectedCell.hijri.month,
    selectedCell.hijri.day
  );

  const monthTitle = `${getHijriMonthName(viewedMonth.month, language)} ${viewedMonth.year} ${
    language === 'ar' ? 'هـ' : 'AH'
  }`;

  const firstGreg = monthCells[0]?.gregorian;
  const lastGreg = monthCells[monthCells.length - 1]?.gregorian;
  const gregMonths = language === 'ar' ? GREGORIAN_MONTHS_AR_SHORT : GREGORIAN_MONTHS_EN_SHORT;
  const gregSpan =
    firstGreg && lastGreg
      ? firstGreg.month === lastGreg.month
        ? `${gregMonths[firstGreg.month - 1]} ${firstGreg.year}`
        : `${gregMonths[firstGreg.month - 1]} – ${gregMonths[lastGreg.month - 1]} ${lastGreg.year}`
      : '';

  const isViewingCurrentMonth =
    viewedMonth.year === todayHijri.year && viewedMonth.month === todayHijri.month;

  const handleShiftMonth = (delta: number) => {
    const next = shiftHijriMonth(viewedMonth.year, viewedMonth.month, delta);
    setViewedMonth(next);
    setSelectedDayNum(1);
  };

  const handleJumpToday = () => {
    setViewedMonth({ year: todayHijri.year, month: todayHijri.month });
    setSelectedDayNum(todayHijri.day);
  };

  const handleJumpToRamadan = () => {
    const targetYear = getNextRamadanYear(todayHijri);
    setViewedMonth({ year: targetYear, month: 9 });
    setSelectedDayNum(todayHijri.month === 9 && todayHijri.year === targetYear ? todayHijri.day : 1);
  };

  const handleJumpToDate = (year: number, month: number, day: number) => {
    setViewedMonth({ year, month });
    setSelectedDayNum(day);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#121816] dark:text-[#ECF1EE]">
          {t.calendarTitle}
        </h1>
        <p className="mt-1 text-sm text-[#5A6960] dark:text-[#8E9F95]">{t.calendarSubtitle}</p>
      </div>

      {/* Calendar Controls Bar: Hijri Adjustment + Daylight Saving Time (DST) + First Day of Week */}
      <section
        aria-label={t.calendarTitle}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E3E7E2] bg-white p-4 sm:p-5 lg:grid-cols-3 dark:border-[#1E2A24] dark:bg-[#121916]"
      >
        {/* 1. Hijri Day Adjustment (-2..+2) */}
        <div
          data-testid="calendar-hijri-adjustment"
          className="flex flex-col justify-between gap-2 rounded-xl border border-[#EAECE8] bg-[#F8F9F7] px-3.5 py-3 dark:border-[#223029] dark:bg-[#0E1512]"
        >
          <span className="text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]">
            {t.hijriAdjustLabel}
          </span>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={hijriAdjustment <= -2}
              onClick={() => onUpdateHijriAdjustment(Math.max(-2, hijriAdjustment - 1))}
              aria-label={language === 'ar' ? 'إنقاص يوم هجري' : 'Decrease Hijri day by 1'}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE1DB] bg-white text-[#35443C] hover:bg-[#F3F5F2] disabled:opacity-40 dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="text-center text-xs font-semibold tabular-nums text-[#0F5132] dark:text-[#6EE7B7]">
              {t.hijriDaysUnit(hijriAdjustment)}
            </span>
            <button
              type="button"
              disabled={hijriAdjustment >= 2}
              onClick={() => onUpdateHijriAdjustment(Math.min(2, hijriAdjustment + 1))}
              aria-label={language === 'ar' ? 'زيادة يوم هجري' : 'Increase Hijri day by 1'}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE1DB] bg-white text-[#35443C] hover:bg-[#F3F5F2] disabled:opacity-40 dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 2. Daylight Saving Time (DST) — Moved here from Settings */}
        <div
          data-testid="calendar-dst-control"
          className="flex flex-col justify-between gap-2 rounded-xl border border-[#EAECE8] bg-[#F8F9F7] px-3.5 py-3 dark:border-[#223029] dark:bg-[#0E1512]"
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]">
            <Clock className="h-3.5 w-3.5 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
            <span>{t.dstLabel}</span>
          </span>
          <div role="group" aria-label={t.dstLabel} className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'auto', label: language === 'ar' ? 'تلقائي' : 'Auto' },
                { id: 'plus1', label: '+1h' },
                { id: 'minus1', label: '-1h' },
              ] as { id: DstMode; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-testid={`calendar-dst-${opt.id}`}
                onClick={() => onUpdateDstMode(opt.id)}
                aria-pressed={dstMode === opt.id}
                className={`min-h-[36px] rounded-lg border px-2 text-xs font-semibold transition-colors ${
                  dstMode === opt.id
                    ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                    : 'border-[#DCE1DB] bg-white text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#B4C2BA] dark:hover:bg-[#1B2520]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. First Day of the Week Selector */}
        <div
          data-testid="calendar-first-day-control"
          className="flex flex-col justify-between gap-2 rounded-xl border border-[#EAECE8] bg-[#F8F9F7] px-3.5 py-3 dark:border-[#223029] dark:bg-[#0E1512]"
        >
          <label
            htmlFor="calendar-first-day-select"
            className="text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
          >
            {t.firstDayOfWeekLabel}
          </label>
          <select
            id="calendar-first-day-select"
            data-testid="first-day-of-week-select"
            value={firstDayOfWeek}
            onChange={(e) => onUpdateFirstDayOfWeek(Number(e.target.value) as FirstDayOfWeek)}
            className="h-9 w-full rounded-lg border border-[#DCE1DB] bg-white px-2.5 text-xs sm:text-sm font-medium text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
          >
            {([6, 0, 1, 2, 3, 4, 5] as FirstDayOfWeek[]).map((dayIdx) => (
              <option key={dayIdx} value={dayIdx}>
                {t.weekdaysShort[dayIdx]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Monthly Hijri Grid */}
        <section
          aria-label={t.calendarTitle}
          data-ramadan-month={isRamadanMonth ? 'true' : 'false'}
          className={`rounded-2xl border bg-white p-5 sm:p-6 lg:col-span-7 transition-colors dark:bg-[#121916] ${
            isRamadanMonth
              ? 'border-[#9A7B3E]/70 ring-1 ring-[#9A7B3E]/25 dark:border-[#D9B872]/60 dark:ring-[#D9B872]/20'
              : 'border-[#E3E7E2] dark:border-[#1E2A24]'
          }`}
        >
          {/* Month Header Controls */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                {isRamadanMonth && (
                  <Moon
                    className="h-5 w-5 shrink-0 text-[#9A7B3E] dark:text-[#D9B872]"
                    aria-hidden="true"
                  />
                )}
                <h2
                  className={`font-display text-2xl font-bold ${
                    isRamadanMonth
                      ? 'text-[#7A5D24] dark:text-[#E5C98B]'
                      : 'text-[#121816] dark:text-[#ECF1EE]'
                  }`}
                >
                  {monthTitle}
                </h2>
              </div>
              <p className="text-xs text-[#64746B] dark:text-[#8E9F95]">{gregSpan}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isRamadanMonth && (
                <button
                  type="button"
                  data-testid="jump-to-ramadan-btn"
                  onClick={handleJumpToRamadan}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#9A7B3E]/40 bg-[#9A7B3E]/10 px-3 text-xs font-semibold text-[#7A5D24] transition-colors hover:bg-[#9A7B3E]/18 whitespace-nowrap dark:border-[#D9B872]/40 dark:bg-[#D9B872]/12 dark:text-[#E5C98B]"
                >
                  <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{t.jumpToRamadan}</span>
                </button>
              )}
              {!isViewingCurrentMonth && (
                <button
                  type="button"
                  onClick={handleJumpToday}
                  className="min-h-[38px] rounded-xl border border-[#0F5132]/30 bg-[#0F5132]/8 px-3 text-xs font-semibold text-[#0F5132] transition-colors hover:bg-[#0F5132]/15 whitespace-nowrap dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]"
                >
                  {t.jumpToday}
                </button>
              )}
              <div className="inline-flex items-center rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] p-1 dark:border-[#24322B] dark:bg-[#0D1310]">
                <button
                  type="button"
                  onClick={() => handleShiftMonth(-1)}
                  aria-label={t.prevMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#47564E] hover:bg-white dark:text-[#98A89F] dark:hover:bg-[#1B2520]"
                >
                  {language === 'ar' ? (
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftMonth(1)}
                  aria-label={t.nextMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#47564E] hover:bg-white dark:text-[#98A89F] dark:hover:bg-[#1B2520]"
                >
                  {language === 'ar' ? (
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Distinguished Ramadan Banner when viewing Month 9 */}
          {isRamadanMonth && (
            <div
              data-testid="ramadan-highlight-banner"
              className="mb-4 flex items-start gap-3 rounded-xl border border-[#9A7B3E]/35 bg-gradient-to-l from-[#9A7B3E]/14 via-[#0F5132]/8 to-[#9A7B3E]/10 px-4 py-3 dark:border-[#D9B872]/35 dark:from-[#D9B872]/15 dark:via-[#196B45]/15 dark:to-[#D9B872]/10"
            >
              <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7B3E] dark:text-[#E5C98B]"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#7A5D24] dark:text-[#E5C98B]">
                  {t.ramadanBannerTitle}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#526058] dark:text-[#B5C4BC]">
                  {t.ramadanBannerDesc}
                </p>
              </div>
            </div>
          )}

          {/* Weekday Headers Ordered by User's First Day of Week */}
          <div
            data-testid="calendar-weekday-headers"
            className="mb-2 grid grid-cols-7 gap-1 text-center"
          >
            {orderedWeekdayIndices.map((dayIdx) => (
              <div
                key={dayIdx}
                className="py-1.5 text-[11px] sm:text-xs font-semibold text-[#64746B] dark:text-[#8E9F95]"
              >
                {t.weekdaysShort[dayIdx]}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div data-testid="hijri-calendar-grid" className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: leadingEmptyCount }).map((_, idx) => (
              <div key={`empty-${idx}`} aria-hidden="true" className="min-h-[58px] sm:min-h-[64px]" />
            ))}

            {monthCells.map((cell) => {
              const isSelected = cell.hijri.day === selectedCell.hijri.day;
              const hasOccasion = cell.occasion !== null;
              const isOddLastTen = isRamadanLastTenOddNight(cell.hijri.month, cell.hijri.day);
              const gregLabel = `${cell.gregorian.day} ${gregMonths[cell.gregorian.month - 1]}`;
              return (
                <button
                  key={cell.hijri.day}
                  type="button"
                  onClick={() => setSelectedDayNum(cell.hijri.day)}
                  aria-pressed={isSelected}
                  aria-label={`${cell.hijri.day} ${getHijriMonthName(cell.hijri.month, language)} (${gregLabel})`}
                  className={`relative flex min-h-[58px] sm:min-h-[64px] flex-col items-center justify-center rounded-xl border px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
                    isSelected
                      ? isRamadanMonth
                        ? 'border-[#8A6B30] bg-[#8A6B30] text-white dark:border-[#B68F40] dark:bg-[#9A7B3E]'
                        : 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                      : cell.isToday
                        ? 'border-[#0F5132]/50 bg-[#0F5132]/8 text-[#0F5132] dark:border-[#6EE7B7]/50 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]'
                        : isOddLastTen
                          ? 'border-[#9A7B3E]/40 bg-[#9A7B3E]/10 text-[#6F521B] hover:bg-[#9A7B3E]/18 dark:border-[#D9B872]/35 dark:bg-[#D9B872]/12 dark:text-[#F0D9A3]'
                          : isRamadanMonth
                            ? 'border-[#9A7B3E]/15 bg-[#FCFBF7] text-[#121816] hover:border-[#9A7B3E]/40 hover:bg-[#F7F3E7] dark:border-[#D9B872]/15 dark:bg-[#141A15] dark:text-[#ECF1EE] dark:hover:border-[#D9B872]/35'
                            : 'border-transparent bg-[#F8F9F7] text-[#121816] hover:border-[#DCE1DB] hover:bg-[#EFF2EE] dark:bg-[#0E1512] dark:text-[#ECF1EE] dark:hover:border-[#24322B] dark:hover:bg-[#17211C]'
                  }`}
                >
                  {isOddLastTen && (
                    <Star
                      aria-hidden="true"
                      className={`absolute top-1.5 ${
                        language === 'ar' ? 'left-1.5' : 'right-1.5'
                      } h-2.5 w-2.5 ${
                        isSelected
                          ? 'fill-[#FDE68A] text-[#FDE68A]'
                          : 'fill-[#9A7B3E] text-[#9A7B3E] dark:fill-[#E5C98B] dark:text-[#E5C98B]'
                      }`}
                    />
                  )}
                  <span className="font-mono text-sm sm:text-base font-bold tabular-nums leading-none">
                    {cell.hijri.day}
                  </span>
                  <span
                    className={`mt-1 text-[10px] leading-none truncate max-w-full ${
                      isSelected
                        ? 'text-white/85'
                        : 'text-[#6B7A71] dark:text-[#829389]'
                    }`}
                  >
                    {cell.gregorian.day}/{cell.gregorian.month}
                  </span>
                  {hasOccasion && (
                    <span
                      aria-hidden="true"
                      className={`mt-1 h-1 w-4 rounded-full ${
                        isSelected ? 'bg-[#FDE68A]' : 'bg-[#9A7B3E] dark:bg-[#D9B872]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Side Column: Selected Day Prayer Timetable & Month Occasions */}
        <aside className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-[#E3E7E2] bg-white p-6 dark:border-[#1E2A24] dark:bg-[#121916]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#121816] dark:text-[#ECF1EE]">
                  {t.selectedDayPrayers}
                </h2>
                <p className="mt-1 text-xs text-[#5A6960] dark:text-[#8E9F95]">
                  {language === 'ar' ? selectedSchedule.hijriDateAr : selectedSchedule.hijriDateEn}
                </p>
                <p className="text-xs text-[#78877E] dark:text-[#7D8F85]">
                  {language === 'ar'
                    ? selectedSchedule.gregorianDateAr
                    : selectedSchedule.gregorianDateEn}
                </p>
              </div>
              <CalendarDays
                className="h-5 w-5 shrink-0 text-[#0F5132] dark:text-[#6EE7B7]"
                aria-hidden="true"
              />
            </div>

            {selectedCell.occasion && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#9A7B3E]/30 bg-[#9A7B3E]/10 px-3.5 py-2.5 text-xs font-semibold text-[#7A5D24] dark:border-[#D9B872]/30 dark:bg-[#D9B872]/10 dark:text-[#E5C98B]">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {language === 'ar'
                    ? selectedCell.occasion.nameAr
                    : selectedCell.occasion.nameEn}
                </span>
              </div>
            )}

            {selectedIsOddRamadanNight && !selectedCell.occasion && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#9A7B3E]/30 bg-[#9A7B3E]/10 px-3.5 py-2.5 text-xs font-semibold text-[#7A5D24] dark:border-[#D9B872]/30 dark:bg-[#D9B872]/10 dark:text-[#E5C98B]">
                <Star className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.ramadanOddNightBadge}</span>
              </div>
            )}

            <dl className="mt-4 divide-y divide-[#EFF2EE] dark:divide-[#1C2621]">
              {selectedSchedule.prayers.map((prayer) => (
                <div key={prayer.key} className="flex items-center justify-between py-2.5">
                  <dt className="text-sm font-medium text-[#35443C] dark:text-[#C5D1CA]">
                    {getPrayerName(prayer.key, language)}
                  </dt>
                  <dd
                    dir="ltr"
                    className="font-mono text-sm font-semibold tabular-nums text-[#121816] dark:text-[#ECF1EE]"
                  >
                    {formatPrayerMinutes(prayer.minutesFromMidnight, timeFormat, language)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-[#E3E7E2] bg-white p-6 dark:border-[#1E2A24] dark:bg-[#121916]">
            <h2 className="text-base font-bold text-[#121816] dark:text-[#ECF1EE]">
              {t.islamicOccasions}
            </h2>
            {monthOccasions.length === 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-[#64746B] dark:text-[#8E9F95]">
                {t.noOccasionsThisMonth}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[#EFF2EE] dark:divide-[#1C2621]">
                {monthOccasions.map((item) => (
                  <li key={item.hijri.day}>
                    <button
                      type="button"
                      onClick={() => setSelectedDayNum(item.hijri.day)}
                      className="flex w-full items-center justify-between py-3 text-sm hover:text-[#0F5132] dark:hover:text-[#6EE7B7]"
                    >
                      <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                        {language === 'ar' ? item.occasion!.nameAr : item.occasion!.nameEn}
                      </span>
                      <span className="text-xs tabular-nums text-[#64746B] dark:text-[#8E9F95]">
                        {item.hijri.day} {getHijriMonthName(item.hijri.month, language)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Section: Upcoming Islamic Religious Events */}
      <section
        aria-labelledby="upcoming-events-heading"
        data-testid="upcoming-religious-events"
        className="rounded-2xl border border-[#E3E7E2] bg-white p-5 sm:p-6 dark:border-[#1E2A24] dark:bg-[#121916]"
      >
        <div className="mb-4">
          <h2
            id="upcoming-events-heading"
            className="flex items-center gap-2 text-lg font-bold text-[#121816] dark:text-[#ECF1EE]"
          >
            <Sparkles className="h-5 w-5 text-[#9A7B3E] dark:text-[#D9B872]" aria-hidden="true" />
            <span>{t.upcomingEventsTitle}</span>
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
            {t.upcomingEventsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((ev) => {
            const isRamadanEv = ev.hijri.month === 9;
            const gregText = `${ev.gregorian.day} ${gregMonths[ev.gregorian.month - 1]} ${ev.gregorian.year}`;
            const hijriText = `${ev.hijri.day} ${getHijriMonthName(ev.hijri.month, language)} ${ev.hijri.year} ${
              language === 'ar' ? 'هـ' : 'AH'
            }`;
            return (
              <button
                key={`${ev.hijri.year}-${ev.hijri.month}-${ev.hijri.day}`}
                type="button"
                onClick={() => handleJumpToDate(ev.hijri.year, ev.hijri.month, ev.hijri.day)}
                className={`flex flex-col justify-between gap-3 rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
                  language === 'ar' ? 'text-right' : 'text-left'
                } ${
                  isRamadanEv
                    ? 'border-[#9A7B3E]/40 bg-[#9A7B3E]/[0.06] hover:bg-[#9A7B3E]/[0.12] dark:border-[#D9B872]/35 dark:bg-[#D9B872]/[0.08] dark:hover:bg-[#D9B872]/[0.14]'
                    : 'border-[#E8ECE7] bg-[#F8F9F7] hover:border-[#0F5132]/35 hover:bg-[#EFF4F1] dark:border-[#223029] dark:bg-[#0E1512] dark:hover:border-[#6EE7B7]/35 dark:hover:bg-[#16201B]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-sm font-bold leading-snug ${
                      isRamadanEv
                        ? 'text-[#7A5D24] dark:text-[#E5C98B]'
                        : 'text-[#121816] dark:text-[#ECF1EE]'
                    }`}
                  >
                    {language === 'ar' ? ev.occasion.nameAr : ev.occasion.nameEn}
                  </span>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-semibold tabular-nums whitespace-nowrap ${
                      ev.daysUntil === 0
                        ? 'bg-[#0F5132] text-white dark:bg-[#196B45]'
                        : isRamadanEv
                          ? 'bg-[#9A7B3E]/18 text-[#7A5D24] dark:bg-[#D9B872]/20 dark:text-[#E5C98B]'
                          : 'bg-[#0F5132]/10 text-[#0F5132] dark:bg-[#6EE7B7]/14 dark:text-[#6EE7B7]'
                    }`}
                  >
                    {t.daysRemaining(ev.daysUntil)}
                  </span>
                </div>

                <div className="space-y-0.5 text-xs text-[#5A6960] dark:text-[#8E9F95]">
                  <p className="font-medium text-[#35443C] dark:text-[#C5D1CA]">{hijriText}</p>
                  <p className="tabular-nums">{gregText}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
