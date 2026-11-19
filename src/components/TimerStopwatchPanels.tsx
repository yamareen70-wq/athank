import { useEffect, useState } from 'react';
import {
  Flag,
  Hourglass,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer as StopwatchIcon,
} from 'lucide-react';
import type { AdhanToneId, Language } from '../types/prayer';
import { ADHAN_TONES } from '../utils/adhanAudio';
import { formatStopwatchMs, formatTimerHMS } from '../utils/alarmChallenges';
import { T } from '../utils/i18n';

export interface TimerState {
  durationSeconds: number;
  remainingSeconds: number;
  running: boolean;
  endTimestampMs: number | null;
  label: string;
  tone: AdhanToneId;
}

export interface StopwatchLap {
  lapNumber: number;
  splitMs: number;
  totalMs: number;
}

export interface StopwatchState {
  accumulatedMs: number;
  startedAtMs: number | null;
  running: boolean;
  laps: StopwatchLap[];
}

const TIMER_PRESETS_MIN = [1, 3, 5, 10, 15, 30];

interface TimerPanelProps {
  language: Language;
  customAudioName: string | null;
  timer: TimerState;
  onUpdateTimer: (updater: (prev: TimerState) => TimerState) => void;
}

export function TimerPanel({
  language,
  customAudioName,
  timer,
  onUpdateTimer,
}: TimerPanelProps) {
  const t = T[language];
  const [draftHours, setDraftHours] = useState(0);
  const [draftMinutes, setDraftMinutes] = useState(5);
  const [draftSeconds, setDraftSeconds] = useState(0);
  const [, setTimerTick] = useState(0);

  useEffect(() => {
    if (!timer.running) return;
    const id = window.setInterval(() => {
      setTimerTick((n) => (n + 1) % 10000);
    }, 200);
    return () => window.clearInterval(id);
  }, [timer.running]);

  const isIdle = !timer.running && timer.remainingSeconds === timer.durationSeconds;
  const displayRemaining = timer.running && timer.endTimestampMs
    ? Math.max(0, Math.ceil((timer.endTimestampMs - Date.now()) / 1000))
    : timer.remainingSeconds;

  const progress =
    timer.durationSeconds > 0
      ? Math.max(0, Math.min(100, (displayRemaining / timer.durationSeconds) * 100))
      : 0;

  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  const applyDraftDuration = (h: number, m: number, s: number) => {
    const safeH = Math.max(0, Math.min(23, Math.round(h)));
    const safeM = Math.max(0, Math.min(59, Math.round(m)));
    const safeS = Math.max(0, Math.min(59, Math.round(s)));
    setDraftHours(safeH);
    setDraftMinutes(safeM);
    setDraftSeconds(safeS);
    const total = safeH * 3600 + safeM * 60 + safeS;
    onUpdateTimer((prev) => ({
      ...prev,
      durationSeconds: total,
      remainingSeconds: total,
      running: false,
      endTimestampMs: null,
    }));
  };

  const handleStartOrResume = () => {
    const secs = timer.remainingSeconds > 0 ? timer.remainingSeconds : draftHours * 3600 + draftMinutes * 60 + draftSeconds;
    if (secs <= 0) return;
    onUpdateTimer((prev) => ({
      ...prev,
      durationSeconds: prev.durationSeconds > 0 ? prev.durationSeconds : secs,
      remainingSeconds: secs,
      running: true,
      endTimestampMs: Date.now() + secs * 1000,
    }));
  };

  const handlePause = () => {
    const rem = timer.endTimestampMs
      ? Math.max(0, Math.ceil((timer.endTimestampMs - Date.now()) / 1000))
      : timer.remainingSeconds;
    onUpdateTimer((prev) => ({
      ...prev,
      remainingSeconds: rem,
      running: false,
      endTimestampMs: null,
    }));
  };

  const handleReset = () => {
    const base = draftHours * 3600 + draftMinutes * 60 + draftSeconds;
    onUpdateTimer((prev) => ({
      ...prev,
      durationSeconds: base,
      remainingSeconds: base,
      running: false,
      endTimestampMs: null,
    }));
  };

  const handleAddOneMinute = () => {
    onUpdateTimer((prev) => {
      const currentRem =
        prev.running && prev.endTimestampMs
          ? Math.max(0, Math.ceil((prev.endTimestampMs - Date.now()) / 1000))
          : prev.remainingSeconds;
      const nextRem = currentRem + 60;
      return {
        ...prev,
        durationSeconds: Math.max(prev.durationSeconds, nextRem),
        remainingSeconds: nextRem,
        endTimestampMs: prev.running ? Date.now() + nextRem * 1000 : null,
      };
    });
  };

  const adhans = ADHAN_TONES.filter((item) => item.category === 'adhan');
  const tones = ADHAN_TONES.filter((item) => item.category === 'tone');

  return (
    <section
      data-testid="timer-panel"
      className="rounded-2xl border border-[#E3E7E2] bg-white p-5 sm:p-8 space-y-6 dark:border-[#1E2A24] dark:bg-[#121916]"
    >
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#121816] dark:text-[#ECF1EE]">
          <Hourglass className="h-5 w-5 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
          <span>{t.timerTitle}</span>
        </h2>
        <p className="mt-0.5 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
          {t.timerSubtitle}
        </p>
      </div>

      {/* Circular Countdown Display */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative flex h-52 w-52 items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full -rotate-90"
          >
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-[#EAECE8] dark:text-[#1D2A24]"
            />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="text-[#0F5132] transition-[stroke-dashoffset] duration-300 dark:text-[#6EE7B7]"
            />
          </svg>
          <div className="relative z-10 text-center">
            <p
              dir="ltr"
              data-testid="timer-display"
              className="font-mono text-3xl sm:text-4xl font-bold tracking-tight tabular-nums text-[#121816] dark:text-[#ECF1EE]"
            >
              {formatTimerHMS(displayRemaining)}
            </p>
            {timer.label.trim() && (
              <p className="mt-1 max-w-[140px] truncate text-xs font-medium text-[#5A6960] dark:text-[#8E9F95]">
                {timer.label}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {TIMER_PRESETS_MIN.map((mins) => (
          <button
            key={mins}
            type="button"
            disabled={timer.running}
            onClick={() => applyDraftDuration(0, mins, 0)}
            className={`min-h-[36px] rounded-xl border px-3 text-xs font-semibold tabular-nums transition-colors disabled:opacity-45 ${
              draftHours === 0 && draftMinutes === mins && draftSeconds === 0 && isIdle
                ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]'
            }`}
          >
            {mins} {t.minutesUnitShort}
          </button>
        ))}
      </div>

      {/* Custom H / M / S Inputs */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        <div>
          <label
            htmlFor="timer-hours"
            className="mb-1 block text-center text-xs font-semibold text-[#5A6960] dark:text-[#8E9F95]"
          >
            {t.timerHours}
          </label>
          <input
            id="timer-hours"
            type="number"
            min={0}
            max={23}
            disabled={timer.running}
            value={draftHours}
            onChange={(e) => applyDraftDuration(Number(e.target.value) || 0, draftMinutes, draftSeconds)}
            className="h-11 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] text-center font-mono text-base font-bold tabular-nums text-[#121816] disabled:opacity-50 dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
          />
        </div>
        <div>
          <label
            htmlFor="timer-minutes"
            className="mb-1 block text-center text-xs font-semibold text-[#5A6960] dark:text-[#8E9F95]"
          >
            {t.timerMinutes}
          </label>
          <input
            id="timer-minutes"
            type="number"
            min={0}
            max={59}
            disabled={timer.running}
            value={draftMinutes}
            onChange={(e) => applyDraftDuration(draftHours, Number(e.target.value) || 0, draftSeconds)}
            className="h-11 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] text-center font-mono text-base font-bold tabular-nums text-[#121816] disabled:opacity-50 dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
          />
        </div>
        <div>
          <label
            htmlFor="timer-seconds"
            className="mb-1 block text-center text-xs font-semibold text-[#5A6960] dark:text-[#8E9F95]"
          >
            {t.timerSeconds}
          </label>
          <input
            id="timer-seconds"
            type="number"
            min={0}
            max={59}
            disabled={timer.running}
            value={draftSeconds}
            onChange={(e) => applyDraftDuration(draftHours, draftMinutes, Number(e.target.value) || 0)}
            className="h-11 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] text-center font-mono text-base font-bold tabular-nums text-[#121816] disabled:opacity-50 dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
          />
        </div>
      </div>

      {/* Label & Tone */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          value={timer.label}
          onChange={(e) => onUpdateTimer((prev) => ({ ...prev, label: e.target.value }))}
          placeholder={t.timerLabelPlaceholder}
          aria-label={t.timerLabelPlaceholder}
          className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] px-3.5 text-sm text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
        />
        <select
          aria-label={t.toneLabel}
          value={timer.tone}
          onChange={(e) =>
            onUpdateTimer((prev) => ({ ...prev, tone: e.target.value as AdhanToneId }))
          }
          className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] px-3 text-sm text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
        >
          <optgroup label={t.toneGroupAlerts}>
            {tones.map((tone) => (
              <option key={tone.id} value={tone.id}>
                {language === 'ar' ? tone.nameAr : tone.nameEn}
              </option>
            ))}
          </optgroup>
          <optgroup label={t.toneGroupAdhan}>
            {adhans.map((tone) => (
              <option key={tone.id} value={tone.id}>
                {language === 'ar' ? tone.nameAr : tone.nameEn}
              </option>
            ))}
          </optgroup>
          <optgroup label={t.toneGroupPhone}>
            <option value="custom">{t.customPhoneToneLabel(customAudioName)}</option>
          </optgroup>
        </select>
      </div>

      {/* Main Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {timer.running ? (
          <button
            type="button"
            data-testid="timer-pause-btn"
            onClick={handlePause}
            className="inline-flex min-h-[46px] min-w-[130px] items-center justify-center gap-2 rounded-xl bg-[#9A7B3E] px-6 text-sm font-semibold text-white hover:bg-[#82652F]"
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
            <span>{t.timerPause}</span>
          </button>
        ) : (
          <button
            type="button"
            data-testid="timer-start-btn"
            disabled={displayRemaining <= 0 && draftHours === 0 && draftMinutes === 0 && draftSeconds === 0}
            onClick={handleStartOrResume}
            className="inline-flex min-h-[46px] min-w-[130px] items-center justify-center gap-2 rounded-xl bg-[#0F5132] px-6 text-sm font-semibold text-white hover:bg-[#0B3D25] disabled:opacity-45 dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            <span>{isIdle ? t.timerStart : t.timerResume}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleAddOneMinute}
          className="inline-flex min-h-[46px] items-center gap-1.5 rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] px-4 text-sm font-medium text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{t.timerAddMinute}</span>
        </button>

        <button
          type="button"
          data-testid="timer-reset-btn"
          onClick={handleReset}
          className="inline-flex min-h-[46px] items-center gap-1.5 rounded-xl border border-[#DCE1DB] px-4 text-sm font-medium text-[#526058] hover:bg-[#F3F5F2] dark:border-[#24322B] dark:text-[#98A89F] dark:hover:bg-[#1B2520]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>{t.timerReset}</span>
        </button>
      </div>
    </section>
  );
}

interface StopwatchPanelProps {
  language: Language;
  stopwatch: StopwatchState;
  onUpdateStopwatch: (updater: (prev: StopwatchState) => StopwatchState) => void;
}

export function StopwatchPanel({
  language,
  stopwatch,
  onUpdateStopwatch,
}: StopwatchPanelProps) {
  const t = T[language];
  const [, setTick] = useState(0);

  // Smooth centisecond refresh while running
  useEffect(() => {
    if (!stopwatch.running) return;
    const id = window.setInterval(() => {
      setTick((n) => (n + 1) % 10000);
    }, 33);
    return () => window.clearInterval(id);
  }, [stopwatch.running]);

  const currentElapsedMs =
    stopwatch.running && stopwatch.startedAtMs !== null
      ? stopwatch.accumulatedMs + (Date.now() - stopwatch.startedAtMs)
      : stopwatch.accumulatedMs;

  const handleToggleStart = () => {
    if (stopwatch.running) {
      const total =
        stopwatch.startedAtMs !== null
          ? stopwatch.accumulatedMs + (Date.now() - stopwatch.startedAtMs)
          : stopwatch.accumulatedMs;
      onUpdateStopwatch((prev) => ({
        ...prev,
        accumulatedMs: total,
        startedAtMs: null,
        running: false,
      }));
    } else {
      onUpdateStopwatch((prev) => ({
        ...prev,
        startedAtMs: Date.now(),
        running: true,
      }));
    }
  };

  const handleLap = () => {
    if (!stopwatch.running) return;
    const total = currentElapsedMs;
    const prevTotal = stopwatch.laps.length > 0 ? stopwatch.laps[0].totalMs : 0;
    const splitMs = Math.max(0, total - prevTotal);
    const lapNumber = stopwatch.laps.length + 1;
    onUpdateStopwatch((prev) => ({
      ...prev,
      laps: [{ lapNumber, splitMs, totalMs: total }, ...prev.laps],
    }));
  };

  const handleReset = () => {
    onUpdateStopwatch(() => ({
      accumulatedMs: 0,
      startedAtMs: null,
      running: false,
      laps: [],
    }));
  };

  let fastestLapNum: number | null = null;
  let slowestLapNum: number | null = null;
  if (stopwatch.laps.length >= 2) {
    let minSplit = Infinity;
    let maxSplit = -1;
    for (const lap of stopwatch.laps) {
      if (lap.splitMs < minSplit) {
        minSplit = lap.splitMs;
        fastestLapNum = lap.lapNumber;
      }
      if (lap.splitMs > maxSplit) {
        maxSplit = lap.splitMs;
        slowestLapNum = lap.lapNumber;
      }
    }
  }

  return (
    <section
      data-testid="stopwatch-panel"
      className="rounded-2xl border border-[#E3E7E2] bg-white p-5 sm:p-8 space-y-6 dark:border-[#1E2A24] dark:bg-[#121916]"
    >
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#121816] dark:text-[#ECF1EE]">
          <StopwatchIcon
            className="h-5 w-5 text-[#0F5132] dark:text-[#6EE7B7]"
            aria-hidden="true"
          />
          <span>{t.stopwatchTitle}</span>
        </h2>
        <p className="mt-0.5 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
          {t.stopwatchSubtitle}
        </p>
      </div>

      {/* Main High-Precision Display */}
      <div className="rounded-2xl border border-[#E8ECE7] bg-[#F8FAF8] py-8 text-center dark:border-[#223029] dark:bg-[#0D1310]">
        <p
          dir="ltr"
          data-testid="stopwatch-display"
          className="font-mono text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-[#121816] dark:text-[#ECF1EE]"
        >
          {formatStopwatchMs(currentElapsedMs)}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          data-testid="stopwatch-toggle-btn"
          onClick={handleToggleStart}
          className={`inline-flex min-h-[46px] min-w-[130px] items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition-colors ${
            stopwatch.running
              ? 'bg-[#9A7B3E] hover:bg-[#82652F]'
              : 'bg-[#0F5132] hover:bg-[#0B3D25] dark:bg-[#196B45] dark:hover:bg-[#1E7E52]'
          }`}
        >
          {stopwatch.running ? (
            <>
              <Pause className="h-4 w-4" aria-hidden="true" />
              <span>{t.timerPause}</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>{currentElapsedMs > 0 ? t.timerResume : t.timerStart}</span>
            </>
          )}
        </button>

        <button
          type="button"
          data-testid="stopwatch-lap-btn"
          disabled={!stopwatch.running}
          onClick={handleLap}
          className="inline-flex min-h-[46px] items-center gap-1.5 rounded-xl border border-[#0F5132]/30 bg-[#0F5132]/8 px-5 text-sm font-semibold text-[#0F5132] hover:bg-[#0F5132]/15 disabled:opacity-45 dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]"
        >
          <Flag className="h-4 w-4" aria-hidden="true" />
          <span>{t.stopwatchLap}</span>
        </button>

        <button
          type="button"
          data-testid="stopwatch-reset-btn"
          disabled={currentElapsedMs === 0 && stopwatch.laps.length === 0}
          onClick={handleReset}
          className="inline-flex min-h-[46px] items-center gap-1.5 rounded-xl border border-[#DCE1DB] px-4 text-sm font-medium text-[#526058] hover:bg-[#F3F5F2] disabled:opacity-45 dark:border-[#24322B] dark:text-[#98A89F] dark:hover:bg-[#1B2520]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>{t.timerReset}</span>
        </button>
      </div>

      {/* Laps List */}
      {stopwatch.laps.length === 0 ? (
        <p className="text-center text-xs text-[#64746B] dark:text-[#8E9F95]">
          {t.stopwatchNoLaps}
        </p>
      ) : (
        <div
          data-testid="stopwatch-laps-list"
          className="overflow-hidden rounded-xl border border-[#E8ECE7] dark:border-[#223029]"
        >
          <div className="grid grid-cols-3 bg-[#F8F9F7] px-4 py-2.5 text-xs font-semibold text-[#5A6960] dark:bg-[#0E1512] dark:text-[#8E9F95]">
            <span>{t.stopwatchLapNumber}</span>
            <span className="text-center">{t.stopwatchLapSplit}</span>
            <span className={language === 'ar' ? 'text-left' : 'text-right'}>
              {t.stopwatchLapTotal}
            </span>
          </div>
          <div className="max-h-60 divide-y divide-[#EFF2EE] overflow-y-auto dark:divide-[#1C2621]">
            {stopwatch.laps.map((lap) => {
              const isFastest = lap.lapNumber === fastestLapNum;
              const isSlowest = lap.lapNumber === slowestLapNum;
              return (
                <div
                  key={lap.lapNumber}
                  data-testid="stopwatch-lap-row"
                  className="grid grid-cols-3 items-center px-4 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold tabular-nums text-[#121816] dark:text-[#ECF1EE]">
                      #{lap.lapNumber}
                    </span>
                    {isFastest && (
                      <span className="rounded bg-[#0F5132]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[#0F5132] dark:bg-[#6EE7B7]/15 dark:text-[#6EE7B7]">
                        {t.stopwatchFastest}
                      </span>
                    )}
                    {isSlowest && (
                      <span className="rounded bg-[#B91C1C]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[#B91C1C] dark:bg-[#FCA5A5]/15 dark:text-[#FCA5A5]">
                        {t.stopwatchSlowest}
                      </span>
                    )}
                  </div>
                  <span
                    dir="ltr"
                    className="text-center font-mono text-xs sm:text-sm font-semibold tabular-nums text-[#0F5132] dark:text-[#6EE7B7]"
                  >
                    +{formatStopwatchMs(lap.splitMs)}
                  </span>
                  <span
                    dir="ltr"
                    className={`font-mono text-xs sm:text-sm tabular-nums text-[#5A6960] dark:text-[#9AA9A1] ${
                      language === 'ar' ? 'text-left' : 'text-right'
                    }`}
                  >
                    {formatStopwatchMs(lap.totalMs)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
