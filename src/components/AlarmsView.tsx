import { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Brain,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type {
  AdhanToneId,
  AlarmChallengeDifficulty,
  AlarmChallengeType,
  AlarmRelation,
  AppSettings,
  CustomPrayerAlarm,
  DailyPrayerSchedule,
  Language,
  PrayerAlertConfig,
  PrayerKey,
  ScheduledTaskAlarm,
} from '../types/prayer';
import { T, getPrayerName } from '../utils/i18n';
import { ADHAN_TONES } from '../utils/adhanAudio';
import {
  computeCustomAlarmTriggerTime,
  formatPrayerMinutes,
  ORDERED_PRAYER_KEYS,
  parseScheduledTaskDateTime,
} from '../utils/prayerMath';
import { isPersonalAlarmSkippedForDate } from '../utils/systemServices';
import {
  StopwatchPanel,
  TimerPanel,
  type StopwatchState,
  type TimerState,
} from './TimerStopwatchPanels';

export type AlarmsSubTab = 'prayers' | 'personal' | 'tasks' | 'timer' | 'stopwatch';

interface AlarmsViewProps {
  settings: AppSettings;
  todaySchedule: DailyPrayerSchedule;
  initialSubTab?: AlarmsSubTab;
  onSubTabChange?: (tab: AlarmsSubTab) => void;
  onUpdatePrayerAlert: (key: PrayerKey, patch: Partial<PrayerAlertConfig>) => void;
  onApplyAllPrayerAlerts: (config: Omit<PrayerAlertConfig, 'enabled'>) => void;
  onToggleAllPrayerAlerts: (enabled: boolean) => void;
  onAddCustomAlarm: (alarm: Omit<CustomPrayerAlarm, 'id'>) => void;
  onToggleCustomAlarm: (id: string) => void;
  onDeleteCustomAlarm: (id: string) => void;
  onUndoSkipPersonalAlarm: (id: string) => void;
  onPreviewPreAlert: (id: string) => void;
  onAddScheduledTask: (task: Omit<ScheduledTaskAlarm, 'id'>) => void;
  onToggleScheduledTask: (id: string) => void;
  onToggleCompleteScheduledTask: (id: string) => void;
  onDeleteScheduledTask: (id: string) => void;
  onTestPrayerAlert: (key: PrayerKey, stage: 'before' | 'at' | 'after') => void;
  onTestCustomAlarm: (alarm: CustomPrayerAlarm) => void;
  onTestScheduledTask: (task: ScheduledTaskAlarm) => void;
  timer: TimerState;
  onUpdateTimer: (updater: (prev: TimerState) => TimerState) => void;
  stopwatch: StopwatchState;
  onUpdateStopwatch: (updater: (prev: StopwatchState) => StopwatchState) => void;
}

const QUICK_MINUTE_PRESETS = [0, 5, 10, 15, 30];
const PRE_ALERT_PRESETS = [0, 5, 10, 15, 30, 60];

function getDefaultTodayDateInput(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDefaultNextHourTimeInput(): string {
  const d = new Date();
  const nextH = (d.getHours() + 1) % 24;
  return `${String(nextH).padStart(2, '0')}:00`;
}

function formatTaskTimeDisplay(time24: string, format: '12h' | '24h', lang: Language): string {
  const match = /^(\d{2}):(\d{2})$/.exec(time24);
  if (!match) return time24;
  const mins = Number(match[1]) * 60 + Number(match[2]);
  return formatPrayerMinutes(mins, format, lang);
}

function ToneSelectOptions({
  language,
  customAudioName,
}: {
  language: Language;
  customAudioName: string | null;
}) {
  const t = T[language];
  const adhans = ADHAN_TONES.filter((item) => item.category === 'adhan');
  const tones = ADHAN_TONES.filter((item) => item.category === 'tone');
  return (
    <>
      <optgroup label={t.toneGroupAdhan}>
        {adhans.map((tone) => (
          <option key={tone.id} value={tone.id}>
            {language === 'ar' ? tone.nameAr : tone.nameEn}
          </option>
        ))}
      </optgroup>
      <optgroup label={t.toneGroupAlerts}>
        {tones.map((tone) => (
          <option key={tone.id} value={tone.id}>
            {language === 'ar' ? tone.nameAr : tone.nameEn}
          </option>
        ))}
      </optgroup>
      <optgroup label={t.toneGroupPhone}>
        <option value="custom">{t.customPhoneToneLabel(customAudioName)}</option>
      </optgroup>
    </>
  );
}

function MinuteOffsetInput({
  id,
  label,
  value,
  language,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  language: Language;
  onChange: (nextMinutes: number) => void;
}) {
  const t = T[language];
  const handleNumberChange = (raw: string) => {
    if (raw === '') {
      onChange(0);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      onChange(Math.max(0, Math.min(180, Math.round(parsed))));
    }
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={180}
          value={value}
          onChange={(e) => handleNumberChange(e.target.value)}
          className={`h-10 w-full rounded-xl border border-[#DCE1DB] bg-white font-mono text-sm tabular-nums text-[#121816] focus:border-[#0F5132] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE] ${
            language === 'ar' ? 'pr-3 pl-12' : 'pl-3 pr-12'
          }`}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute text-xs font-medium text-[#64746B] dark:text-[#8E9F95] ${
            language === 'ar' ? 'left-3' : 'right-3'
          }`}
        >
          {value === 0 ? t.noneOption : t.minutesUnitShort}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {QUICK_MINUTE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums transition-colors ${
              value === preset
                ? 'bg-[#0F5132] text-white dark:bg-[#196B45]'
                : 'bg-[#EEF1ED] text-[#47564E] hover:bg-[#E1E6E0] dark:bg-[#17211C] dark:text-[#9AA9A1] dark:hover:bg-[#1F2C26]'
            }`}
          >
            {preset === 0 ? t.noneOption : `${preset}`}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AlarmsView({
  settings,
  todaySchedule,
  initialSubTab = 'prayers',
  onSubTabChange,
  onUpdatePrayerAlert,
  onApplyAllPrayerAlerts,
  onToggleAllPrayerAlerts,
  onAddCustomAlarm,
  onToggleCustomAlarm,
  onDeleteCustomAlarm,
  onUndoSkipPersonalAlarm,
  onPreviewPreAlert,
  onAddScheduledTask,
  onToggleScheduledTask,
  onToggleCompleteScheduledTask,
  onDeleteScheduledTask,
  onTestPrayerAlert,
  onTestCustomAlarm,
  onTestScheduledTask,
  timer,
  onUpdateTimer,
  stopwatch,
  onUpdateStopwatch,
}: AlarmsViewProps) {
  const { language, alerts, timeFormat, customAlarms, scheduledTasks } = settings;
  const t = T[language];

  const [subTab, setSubTabState] = useState<AlarmsSubTab>(initialSubTab);
  const [expandedPrayer, setExpandedPrayer] = useState<PrayerKey | null>('fajr');

  useEffect(() => {
    setSubTabState(initialSubTab);
  }, [initialSubTab]);

  const setSubTab = (next: AlarmsSubTab) => {
    setSubTabState(next);
    onSubTabChange?.(next);
  };

  // Bulk editor draft state
  const [bulkBefore, setBulkBefore] = useState<number>(10);
  const [bulkAtTime, setBulkAtTime] = useState<boolean>(true);
  const [bulkAfter, setBulkAfter] = useState<number>(0);
  const [bulkTone, setBulkTone] = useState<AdhanToneId>(alerts.defaultTone);
  const [bulkSavedNotice, setBulkSavedNotice] = useState<boolean>(false);

  // Personal alarm form state (with Pre-Alert + Heavy Sleeper Challenge + Wake-Up Check)
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newPrayerKey, setNewPrayerKey] = useState<PrayerKey>('fajr');
  const [newRelation, setNewRelation] = useState<AlarmRelation>('before');
  const [newOffset, setNewOffset] = useState<string>('30');
  const [newTone, setNewTone] = useState<AdhanToneId>('gentle');
  const [newPreAlertMinutes, setNewPreAlertMinutes] = useState<number>(15);
  const [newChallengeType, setNewChallengeType] = useState<AlarmChallengeType>('none');
  const [newChallengeDifficulty, setNewChallengeDifficulty] =
    useState<AlarmChallengeDifficulty>('easy');
  const [newChallengeCount, setNewChallengeCount] = useState<number>(2);
  const [newWakeUpCheckEnabled, setNewWakeUpCheckEnabled] = useState<boolean>(false);
  const [newWakeUpCheckDelay, setNewWakeUpCheckDelay] = useState<number>(5);
  const [formError, setFormError] = useState<string | null>(null);

  // Scheduled date+time task form state
  const [showTaskForm, setShowTaskForm] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDate, setTaskDate] = useState<string>(() => getDefaultTodayDateInput());
  const [taskTime, setTaskTime] = useState<string>(() => getDefaultNextHourTimeInput());
  const [taskNotes, setTaskNotes] = useState<string>('');
  const [taskTone, setTaskTone] = useState<AdhanToneId>('gentle');
  const [taskError, setTaskError] = useState<string | null>(null);

  const handleApplyBulk = () => {
    onApplyAllPrayerAlerts({
      beforeMinutes: bulkBefore,
      atTime: bulkAtTime,
      afterMinutes: bulkAfter,
      tone: bulkTone,
    });
    setBulkSavedNotice(true);
    window.setTimeout(() => setBulkSavedNotice(false), 2600);
  };

  const handleCreatePersonalAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setFormError(t.validationTitleRequired);
      return;
    }
    const parsedOffset = newRelation === 'at' ? 0 : Number(newOffset);
    if (
      newRelation !== 'at' &&
      (Number.isNaN(parsedOffset) || parsedOffset < 0 || parsedOffset > 180)
    ) {
      setFormError(t.validationOffsetInvalid);
      return;
    }

    onAddCustomAlarm({
      title: trimmed,
      prayerKey: newPrayerKey,
      relation: newRelation,
      offsetMinutes: Math.round(parsedOffset),
      enabled: true,
      tone: newTone,
      preAlertMinutes: Math.max(0, Math.min(120, Math.round(newPreAlertMinutes))),
      skippedDateKey: null,
      challenge: {
        type: newChallengeType,
        difficulty: newChallengeDifficulty,
        count: Math.max(1, Math.min(5, Math.round(newChallengeCount))),
      },
      wakeUpCheckEnabled: newWakeUpCheckEnabled,
      wakeUpCheckDelayMinutes: Math.max(1, Math.min(30, Math.round(newWakeUpCheckDelay))),
    });

    setNewTitle('');
    setNewOffset('30');
    setNewPreAlertMinutes(15);
    setNewChallengeType('none');
    setNewChallengeDifficulty('easy');
    setNewChallengeCount(2);
    setNewWakeUpCheckEnabled(false);
    setNewWakeUpCheckDelay(5);
    setShowAddForm(false);
  };

  const handleCreateScheduledTask = (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);
    const trimmed = taskTitle.trim();
    if (!trimmed) {
      setTaskError(t.validationTaskTitle);
      return;
    }
    const parsedDt = parseScheduledTaskDateTime(taskDate, taskTime);
    if (!parsedDt) {
      setTaskError(t.validationTaskDateTime);
      return;
    }

    onAddScheduledTask({
      title: trimmed,
      date: taskDate,
      time: taskTime,
      notes: taskNotes.trim() || undefined,
      enabled: true,
      completed: false,
      tone: taskTone,
    });

    setTaskTitle('');
    setTaskNotes('');
    setShowTaskForm(false);
  };

  const formatAlertSummary = (cfg: PrayerAlertConfig): string => {
    if (!cfg.enabled) return t.off;
    const parts: string[] = [];
    if (cfg.beforeMinutes > 0) parts.push(t.beforeShort(cfg.beforeMinutes));
    if (cfg.atTime) parts.push(t.atTimeShort);
    if (cfg.afterMinutes > 0) parts.push(t.afterShort(cfg.afterMinutes));
    return parts.length > 0 ? parts.join(' · ') : t.off;
  };

  const formatCustomRelation = (alarm: CustomPrayerAlarm): string => {
    const pName = getPrayerName(alarm.prayerKey, language);
    if (alarm.relation === 'at' || alarm.offsetMinutes === 0) {
      return language === 'ar' ? `عند أذان ${pName}` : `At ${pName} Adhan`;
    }
    if (alarm.relation === 'before') {
      return language === 'ar'
        ? `قبل ${pName} بـ ${alarm.offsetMinutes} دقيقة`
        : `${alarm.offsetMinutes} min before ${pName}`;
    }
    return language === 'ar'
      ? `بعد ${pName} بـ ${alarm.offsetMinutes} دقيقة`
      : `${alarm.offsetMinutes} min after ${pName}`;
  };

  const sortedTasks = [...scheduledTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
  });

  const nowMs = Date.now();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#121816] dark:text-[#ECF1EE]">
            {t.alarmsTitle}
          </h1>
          <p className="mt-1 text-sm text-[#5A6960] dark:text-[#8E9F95]">{t.alarmsSubtitle}</p>
        </div>

        {/* Top 5-Tab Segmented Control: Prayers | Personal | Tasks | Timer | Stopwatch */}
        <div
          role="tablist"
          aria-label={t.alarmsTitle}
          className="grid w-full grid-cols-3 gap-1 rounded-xl border border-[#DCE1DB] bg-[#EEF1ED] p-1 sm:inline-flex sm:w-auto sm:flex-wrap dark:border-[#24322B] dark:bg-[#0E1512]"
        >
          <button
            type="button"
            role="tab"
            data-testid="alarms-tab-prayers"
            aria-selected={subTab === 'prayers'}
            onClick={() => setSubTab('prayers')}
            className={`min-h-[40px] rounded-lg px-2.5 sm:px-3.5 text-xs sm:text-sm font-medium transition-colors text-center leading-tight whitespace-nowrap ${
              subTab === 'prayers'
                ? 'bg-white text-[#0F5132] shadow-xs dark:bg-[#1B2621] dark:text-[#6EE7B7]'
                : 'text-[#5A6960] hover:text-[#121816] dark:text-[#8E9F95] dark:hover:text-[#ECF1EE]'
            }`}
          >
            {t.alarmsTabPrayers}
          </button>
          <button
            type="button"
            role="tab"
            data-testid="alarms-tab-personal"
            aria-selected={subTab === 'personal'}
            onClick={() => setSubTab('personal')}
            className={`min-h-[40px] rounded-lg px-2.5 sm:px-3.5 text-xs sm:text-sm font-medium transition-colors text-center leading-tight whitespace-nowrap ${
              subTab === 'personal'
                ? 'bg-white text-[#0F5132] shadow-xs dark:bg-[#1B2621] dark:text-[#6EE7B7]'
                : 'text-[#5A6960] hover:text-[#121816] dark:text-[#8E9F95] dark:hover:text-[#ECF1EE]'
            }`}
          >
            {t.alarmsTabPersonal} ({customAlarms.length})
          </button>
          <button
            type="button"
            role="tab"
            data-testid="alarms-tab-tasks"
            aria-selected={subTab === 'tasks'}
            onClick={() => setSubTab('tasks')}
            className={`min-h-[40px] rounded-lg px-2.5 sm:px-3.5 text-xs sm:text-sm font-medium transition-colors text-center leading-tight whitespace-nowrap ${
              subTab === 'tasks'
                ? 'bg-white text-[#0F5132] shadow-xs dark:bg-[#1B2621] dark:text-[#6EE7B7]'
                : 'text-[#5A6960] hover:text-[#121816] dark:text-[#8E9F95] dark:hover:text-[#ECF1EE]'
            }`}
          >
            {t.alarmsTabTasks} ({scheduledTasks.length})
          </button>
          <button
            type="button"
            role="tab"
            data-testid="alarms-tab-timer"
            aria-selected={subTab === 'timer'}
            onClick={() => setSubTab('timer')}
            className={`min-h-[40px] rounded-lg px-2.5 sm:px-3.5 text-xs sm:text-sm font-medium transition-colors text-center leading-tight whitespace-nowrap ${
              subTab === 'timer'
                ? 'bg-white text-[#0F5132] shadow-xs dark:bg-[#1B2621] dark:text-[#6EE7B7]'
                : 'text-[#5A6960] hover:text-[#121816] dark:text-[#8E9F95] dark:hover:text-[#ECF1EE]'
            }`}
          >
            {t.alarmsTabTimer}
            {timer.running ? ' •' : ''}
          </button>
          <button
            type="button"
            role="tab"
            data-testid="alarms-tab-stopwatch"
            aria-selected={subTab === 'stopwatch'}
            onClick={() => setSubTab('stopwatch')}
            className={`min-h-[40px] rounded-lg px-2.5 sm:px-3.5 text-xs sm:text-sm font-medium transition-colors text-center leading-tight whitespace-nowrap ${
              subTab === 'stopwatch'
                ? 'bg-white text-[#0F5132] shadow-xs dark:bg-[#1B2621] dark:text-[#6EE7B7]'
                : 'text-[#5A6960] hover:text-[#121816] dark:text-[#8E9F95] dark:hover:text-[#ECF1EE]'
            }`}
          >
            {t.alarmsTabStopwatch}
            {stopwatch.running ? ' •' : ''}
          </button>
        </div>
      </div>

      {subTab === 'prayers' && (
        <div className="space-y-6">
          {/* Bulk Configuration Section */}
          <section
            aria-labelledby="bulk-alarms-heading"
            className="rounded-2xl border border-[#E3E7E2] bg-white p-5 sm:p-6 space-y-5 dark:border-[#1E2A24] dark:bg-[#121916]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2
                  id="bulk-alarms-heading"
                  className="text-lg font-bold text-[#121816] dark:text-[#ECF1EE]"
                >
                  {t.bulkTitle}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
                  {t.bulkSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleAllPrayerAlerts(true)}
                  className="min-h-[38px] rounded-lg border border-[#0F5132]/30 bg-[#0F5132]/8 px-3 text-xs font-semibold text-[#0F5132] hover:bg-[#0F5132]/15 whitespace-nowrap dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]"
                >
                  {t.enableAll}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleAllPrayerAlerts(false)}
                  className="min-h-[38px] rounded-lg border border-[#DCE1DB] px-3 text-xs font-medium text-[#526058] hover:bg-[#F3F5F2] whitespace-nowrap dark:border-[#24322B] dark:text-[#98A89F] dark:hover:bg-[#1B2520]"
                >
                  {t.disableAll}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MinuteOffsetInput
                id="bulk-before"
                label={t.beforePrayerLabel}
                value={bulkBefore}
                language={language}
                onChange={setBulkBefore}
              />

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]">
                  {t.atPrayerLabel}
                </p>
                <button
                  type="button"
                  onClick={() => setBulkAtTime((v) => !v)}
                  aria-pressed={bulkAtTime}
                  className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors ${
                    bulkAtTime
                      ? 'border-[#0F5132] bg-[#0F5132]/10 text-[#0F5132] dark:border-[#6EE7B7]/40 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]'
                      : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#64746B] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#8E9F95]'
                  }`}
                >
                  {bulkAtTime ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  <span>{bulkAtTime ? t.active : t.off}</span>
                </button>
              </div>

              <MinuteOffsetInput
                id="bulk-after"
                label={t.afterPrayerLabel}
                value={bulkAfter}
                language={language}
                onChange={setBulkAfter}
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="bulk-tone"
                  className="block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                >
                  {t.toneLabel}
                </label>
                <select
                  id="bulk-tone"
                  value={bulkTone}
                  onChange={(e) => setBulkTone(e.target.value as AdhanToneId)}
                  className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] px-3 text-sm text-[#121816] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
                >
                  <ToneSelectOptions
                    language={language}
                    customAudioName={alerts.customAudioName}
                  />
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs font-medium text-[#0F5132] dark:text-[#6EE7B7]">
                {bulkSavedNotice ? t.bulkAppliedToast : t.minutesInputHint}
              </span>
              <button
                type="button"
                onClick={handleApplyBulk}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0F5132] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0B3D25] whitespace-nowrap dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
              >
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.applyToAll}</span>
              </button>
            </div>
          </section>

          {/* Per-Prayer Individual Configuration */}
          <section aria-labelledby="individual-alarms-heading" className="space-y-3">
            <h2
              id="individual-alarms-heading"
              className="text-lg font-bold text-[#121816] dark:text-[#ECF1EE]"
            >
              {t.individualTitle}
            </h2>

            <div className="overflow-hidden rounded-2xl border border-[#E3E7E2] bg-white divide-y divide-[#EFF2EE] dark:border-[#1E2A24] dark:bg-[#121916] dark:divide-[#1C2621]">
              {ORDERED_PRAYER_KEYS.map((key) => {
                const cfg = alerts.byPrayer[key];
                const prayerEntry = todaySchedule.prayers.find((p) => p.key === key);
                const pName = getPrayerName(key, language);
                const isExpanded = expandedPrayer === key;

                return (
                  <div key={key} className="transition-colors">
                    <div className="flex min-h-[68px] items-center justify-between gap-3 px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedPrayer(isExpanded ? null : key)}
                        aria-expanded={isExpanded}
                        className={`flex flex-1 items-center justify-between gap-4 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-lg ${
                          language === 'ar' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div>
                          <div className="flex items-baseline gap-2.5">
                            <span className="text-base font-semibold text-[#121816] dark:text-[#ECF1EE]">
                              {pName}
                            </span>
                            {prayerEntry && (
                              <span
                                dir="ltr"
                                className="font-mono text-xs tabular-nums text-[#64746B] dark:text-[#8E9F95]"
                              >
                                {formatPrayerMinutes(
                                  prayerEntry.minutesFromMidnight,
                                  timeFormat,
                                  language
                                )}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-[#5A6960] dark:text-[#8E9F95]">
                            {formatAlertSummary(cfg)}
                          </p>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 shrink-0 text-[#64746B]" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-[#64746B]" aria-hidden="true" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onUpdatePrayerAlert(key, { enabled: !cfg.enabled })}
                        aria-pressed={cfg.enabled}
                        aria-label={`${cfg.enabled ? t.off : t.active} ${pName}`}
                        className={`inline-flex h-10 min-w-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors ${
                          cfg.enabled
                            ? 'border-[#0F5132]/25 bg-[#0F5132]/8 text-[#0F5132] dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]'
                            : 'border-[#DCE1DB] text-[#6A7970] dark:border-[#24322B] dark:text-[#7E8F85]'
                        }`}
                      >
                        {cfg.enabled ? (
                          <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
                        ) : (
                          <BellOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline">{cfg.enabled ? t.active : t.off}</span>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#EFF2EE] bg-[#FAFBF9] px-5 py-4 space-y-4 dark:border-[#1C2621] dark:bg-[#0E1512]">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <MinuteOffsetInput
                            id={`before-${key}`}
                            label={t.beforePrayerLabel}
                            value={cfg.beforeMinutes}
                            language={language}
                            onChange={(val) =>
                              onUpdatePrayerAlert(key, {
                                beforeMinutes: val,
                                enabled: true,
                              })
                            }
                          />

                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]">
                              {t.atPrayerLabel}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdatePrayerAlert(key, { atTime: !cfg.atTime, enabled: true })
                              }
                              aria-pressed={cfg.atTime}
                              className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold ${
                                cfg.atTime
                                  ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                                  : 'border-[#DCE1DB] bg-white text-[#64746B] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#8E9F95]'
                              }`}
                            >
                              {cfg.atTime ? t.active : t.off}
                            </button>
                          </div>

                          <MinuteOffsetInput
                            id={`after-${key}`}
                            label={t.afterPrayerLabel}
                            value={cfg.afterMinutes}
                            language={language}
                            onChange={(val) =>
                              onUpdatePrayerAlert(key, {
                                afterMinutes: val,
                                enabled: true,
                              })
                            }
                          />

                          <div className="space-y-1.5">
                            <label
                              htmlFor={`tone-${key}`}
                              className="block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                            >
                              {t.toneLabel}
                            </label>
                            <select
                              id={`tone-${key}`}
                              value={cfg.tone}
                              onChange={(e) =>
                                onUpdatePrayerAlert(key, { tone: e.target.value as AdhanToneId })
                              }
                              className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-white px-2.5 text-sm text-[#121816] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                            >
                              <ToneSelectOptions
                                language={language}
                                customAudioName={alerts.customAudioName}
                              />
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onTestPrayerAlert(key, 'at')}
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#DCE1DB] bg-white px-3 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#C5D1CA]"
                          >
                            <BellRing className="h-3.5 w-3.5 text-[#0F5132] dark:text-[#6EE7B7]" />
                            <span>{t.simulateAlert}</span>
                          </button>
                          {cfg.beforeMinutes > 0 && (
                            <button
                              type="button"
                              onClick={() => onTestPrayerAlert(key, 'before')}
                              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#DCE1DB] bg-white px-3 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#C5D1CA]"
                            >
                              <span>{t.beforeShort(cfg.beforeMinutes)}</span>
                            </button>
                          )}
                          {cfg.afterMinutes > 0 && (
                            <button
                              type="button"
                              onClick={() => onTestPrayerAlert(key, 'after')}
                              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#DCE1DB] bg-white px-3 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#C5D1CA]"
                            >
                              <span>{t.afterShort(cfg.afterMinutes)}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {subTab === 'personal' && (
        /* Personal Prayer-Linked Alarms Tab */
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#E3E7E2] bg-white p-5 sm:p-6 dark:border-[#1E2A24] dark:bg-[#121916]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#121816] dark:text-[#ECF1EE]">
                  {t.personalTitle}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
                  {t.personalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setShowAddForm((prev) => !prev);
                }}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0F5132] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0B3D25] whitespace-nowrap dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.addPersonalAlarm}</span>
              </button>
            </div>

            {showAddForm && (
              <form
                onSubmit={handleCreatePersonalAlarm}
                className="mt-5 space-y-4 rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] p-4 sm:p-5 dark:border-[#24322B] dark:bg-[#0D1310]"
              >
                <div>
                  <label
                    htmlFor="personal-alarm-title"
                    className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                  >
                    {t.alarmTitleLabel}
                  </label>
                  <input
                    id="personal-alarm-title"
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={t.alarmTitlePlaceholder}
                    className="h-11 w-full rounded-xl border border-[#DCE1DB] bg-white px-3.5 text-sm text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label
                      htmlFor="personal-alarm-prayer"
                      className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                    >
                      {t.linkedPrayerLabel}
                    </label>
                    <select
                      id="personal-alarm-prayer"
                      value={newPrayerKey}
                      onChange={(e) => setNewPrayerKey(e.target.value as PrayerKey)}
                      className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-white px-3 text-sm text-[#121816] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                    >
                      {ORDERED_PRAYER_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {getPrayerName(k, language)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="personal-alarm-relation"
                      className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                    >
                      {t.relationLabel}
                    </label>
                    <select
                      id="personal-alarm-relation"
                      value={newRelation}
                      onChange={(e) => setNewRelation(e.target.value as AlarmRelation)}
                      className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-white px-3 text-sm text-[#121816] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                    >
                      <option value="before">{t.relationBefore}</option>
                      <option value="at">{t.relationAt}</option>
                      <option value="after">{t.relationAfter}</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="personal-alarm-offset"
                      className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                    >
                      {t.offsetMinutesLabel}
                    </label>
                    <input
                      id="personal-alarm-offset"
                      type="number"
                      min={0}
                      max={180}
                      disabled={newRelation === 'at'}
                      value={newRelation === 'at' ? '0' : newOffset}
                      onChange={(e) => setNewOffset(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-white px-3 font-mono text-sm tabular-nums text-[#121816] disabled:opacity-50 dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="personal-alarm-tone"
                      className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                    >
                      {t.toneLabel}
                    </label>
                    <select
                      id="personal-alarm-tone"
                      value={newTone}
                      onChange={(e) => setNewTone(e.target.value as AdhanToneId)}
                      className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-white px-3 text-sm text-[#121816] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                    >
                      <ToneSelectOptions
                        language={language}
                        customAudioName={alerts.customAudioName}
                      />
                    </select>
                  </div>
                </div>

                {/* Pre-Alarm Notification (with Skip Once in Notification Bar) */}
                <div className="space-y-2.5 rounded-xl border border-[#E3E7E2] bg-white p-4 dark:border-[#24322B] dark:bg-[#121916]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="personal-alarm-prealert"
                      className="flex items-center gap-1.5 text-xs font-bold text-[#0F5132] dark:text-[#6EE7B7]"
                    >
                      <BellRing className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{t.preAlertFieldLabel}</span>
                    </label>
                    <input
                      id="personal-alarm-prealert"
                      data-testid="personal-alarm-prealert-input"
                      type="number"
                      min={0}
                      max={120}
                      value={newPreAlertMinutes}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val)) {
                          setNewPreAlertMinutes(Math.max(0, Math.min(120, Math.round(val))));
                        }
                      }}
                      className="h-9 w-20 rounded-lg border border-[#DCE1DB] bg-[#F8F9F7] px-2 text-center font-mono text-sm tabular-nums text-[#121816] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {PRE_ALERT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewPreAlertMinutes(preset)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium tabular-nums transition-colors ${
                          newPreAlertMinutes === preset
                            ? 'bg-[#0F5132] text-white dark:bg-[#196B45]'
                            : 'bg-[#EEF1ED] text-[#47564E] hover:bg-[#E1E6E0] dark:bg-[#17211C] dark:text-[#9AA9A1]'
                        }`}
                      >
                        {preset === 0 ? t.noneOption : `${preset} ${t.minutesUnitShort}`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#64746B] dark:text-[#8E9F95]">
                    {t.preAlertFieldHint}
                  </p>
                </div>

                {/* Heavy Sleeper Challenge & Wake-Up Check Section */}
                <div className="space-y-3 rounded-xl border border-[#E3E7E2] bg-white p-4 dark:border-[#24322B] dark:bg-[#121916]">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-[#0F5132] dark:text-[#6EE7B7]">
                    <Brain className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.challengeSectionTitle}</span>
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="personal-alarm-challenge-type"
                        className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                      >
                        {t.challengeTypeLabel}
                      </label>
                      <select
                        id="personal-alarm-challenge-type"
                        data-testid="personal-alarm-challenge-type"
                        value={newChallengeType}
                        onChange={(e) =>
                          setNewChallengeType(e.target.value as AlarmChallengeType)
                        }
                        className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] px-3 text-sm text-[#121816] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
                      >
                        <option value="none">{t.challengeNone}</option>
                        <option value="math">{t.challengeMath}</option>
                        <option value="typing">{t.challengeTyping}</option>
                        <option value="memory">{t.challengeMemory}</option>
                        <option value="tap_burst">{t.challengeTapBurst}</option>
                      </select>
                    </div>

                    {newChallengeType !== 'none' && (
                      <div>
                        <label
                          htmlFor="personal-alarm-challenge-difficulty"
                          className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                        >
                          {t.challengeDifficultyLabel}
                        </label>
                        <select
                          id="personal-alarm-challenge-difficulty"
                          value={newChallengeDifficulty}
                          onChange={(e) =>
                            setNewChallengeDifficulty(
                              e.target.value as AlarmChallengeDifficulty
                            )
                          }
                          className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] px-3 text-sm text-[#121816] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
                        >
                          <option value="easy">{t.difficultyEasy}</option>
                          <option value="medium">{t.difficultyMedium}</option>
                          <option value="hard">{t.difficultyHard}</option>
                        </select>
                      </div>
                    )}

                    {newChallengeType === 'math' && (
                      <div>
                        <label
                          htmlFor="personal-alarm-challenge-count"
                          className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                        >
                          {t.challengeCountLabel}
                        </label>
                        <input
                          id="personal-alarm-challenge-count"
                          type="number"
                          min={1}
                          max={5}
                          value={newChallengeCount}
                          onChange={(e) =>
                            setNewChallengeCount(
                              Math.max(1, Math.min(5, Number(e.target.value) || 1))
                            )
                          }
                          className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] px-3 font-mono text-sm tabular-nums text-[#121816] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Wake-Up Verification Toggle & Delay */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EFF2EE] pt-3 dark:border-[#1C2621]">
                    <label className="flex cursor-pointer items-start gap-2.5 flex-1 min-w-[210px]">
                      <input
                        type="checkbox"
                        data-testid="personal-alarm-wakeup-checkbox"
                        checked={newWakeUpCheckEnabled}
                        onChange={(e) => setNewWakeUpCheckEnabled(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#0F5132] dark:accent-[#6EE7B7]"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-[#121816] dark:text-[#ECF1EE]">
                          {t.wakeUpCheckLabel}
                        </span>
                        <span className="block text-[11px] text-[#64746B] dark:text-[#8E9F95]">
                          {t.wakeUpCheckHint}
                        </span>
                      </div>
                    </label>

                    {newWakeUpCheckEnabled && (
                      <div className="flex items-center gap-2 shrink-0">
                        <label
                          htmlFor="personal-alarm-wakeup-delay"
                          className="text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                        >
                          {t.wakeUpCheckDelayLabel}
                        </label>
                        <input
                          id="personal-alarm-wakeup-delay"
                          type="number"
                          min={1}
                          max={30}
                          value={newWakeUpCheckDelay}
                          onChange={(e) =>
                            setNewWakeUpCheckDelay(
                              Math.max(1, Math.min(30, Number(e.target.value) || 1))
                            )
                          }
                          className="h-9 w-16 rounded-lg border border-[#DCE1DB] bg-[#F8F9F7] px-2 text-center font-mono text-sm tabular-nums text-[#121816] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {formError && (
                  <p role="alert" className="text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                    {formError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="min-h-[40px] rounded-xl border border-[#DCE1DB] px-4 text-sm font-medium text-[#526058] hover:bg-white dark:border-[#24322B] dark:text-[#98A89F] dark:hover:bg-[#1B2520]"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] rounded-xl bg-[#0F5132] px-5 text-sm font-medium text-white hover:bg-[#0B3D25] dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
                  >
                    {t.saveAlarm}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-5 divide-y divide-[#EFF2EE] dark:divide-[#1C2621]">
              {customAlarms.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-[#35443C] dark:text-[#C5D1CA]">
                    {t.noPersonalAlarms}
                  </p>
                  <p className="mt-1 text-xs text-[#64746B] dark:text-[#8E9F95]">
                    {t.noPersonalAlarmsHint}
                  </p>
                </div>
              ) : (
                customAlarms.map((alarm) => {
                  const trigger = computeCustomAlarmTriggerTime(alarm, todaySchedule);
                  const triggerText = formatPrayerMinutes(
                    trigger.minutesFromMidnight,
                    timeFormat,
                    language
                  );
                  const isSkippedToday = isPersonalAlarmSkippedForDate(
                    alarm,
                    todaySchedule.dateKey
                  );
                  const preMin = alarm.preAlertMinutes ?? 0;

                  return (
                    <div
                      key={alarm.id}
                      data-testid="personal-alarm-row"
                      className="flex flex-wrap items-center justify-between gap-4 py-4"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`text-base font-semibold ${
                              alarm.enabled && !isSkippedToday
                                ? 'text-[#121816] dark:text-[#ECF1EE]'
                                : 'text-[#78877E] line-through dark:text-[#6E8076]'
                            }`}
                          >
                            {alarm.title}
                          </p>
                          {isSkippedToday && (
                            <span
                              data-testid="alarm-skipped-badge"
                              className="inline-flex items-center gap-1 rounded-md bg-[#9A7B3E]/18 px-2 py-0.5 text-[11px] font-semibold text-[#8A6B30] dark:bg-[#E9B115]/20 dark:text-[#F3DFB0]"
                            >
                              <BellOff className="h-3 w-3" aria-hidden="true" />
                              <span>{t.preAlertSkippedTodayBadge}</span>
                            </span>
                          )}
                          {preMin > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#0F5132]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0F5132] dark:bg-[#6EE7B7]/15 dark:text-[#6EE7B7]">
                              <BellRing className="h-3 w-3" aria-hidden="true" />
                              <span>{t.preAlertBadge(preMin)}</span>
                            </span>
                          )}
                          {alarm.challenge && alarm.challenge.type !== 'none' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#0F5132]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0F5132] dark:bg-[#6EE7B7]/15 dark:text-[#6EE7B7]">
                              <Brain className="h-3 w-3" aria-hidden="true" />
                              <span>
                                {alarm.challenge.type === 'math'
                                  ? t.challengeMath
                                  : alarm.challenge.type === 'typing'
                                    ? t.challengeTyping
                                    : alarm.challenge.type === 'memory'
                                      ? t.challengeMemory
                                      : t.challengeTapBurst}
                              </span>
                            </span>
                          )}
                          {alarm.wakeUpCheckEnabled && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#9A7B3E]/15 px-2 py-0.5 text-[11px] font-semibold text-[#8A6B30] dark:bg-[#D9B872]/15 dark:text-[#E5C98B]">
                              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                              <span>
                                {t.wakeUpCheckBadge(alarm.wakeUpCheckDelayMinutes ?? 5)}
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5A6960] dark:text-[#8E9F95]">
                          {formatCustomRelation(alarm)} · {t.triggersTodayAt}{' '}
                          <span dir="ltr" className="font-mono font-semibold tabular-nums">
                            {triggerText}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {isSkippedToday ? (
                          <button
                            type="button"
                            data-testid="alarm-undo-skip-btn"
                            onClick={() => onUndoSkipPersonalAlarm(alarm.id)}
                            className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#0F5132]/30 bg-[#0F5132]/8 px-3 text-xs font-semibold text-[#0F5132] hover:bg-[#0F5132]/15 dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]"
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{t.preAlertUndoSkipBtn}</span>
                          </button>
                        ) : (
                          alarm.enabled &&
                          preMin > 0 && (
                            <button
                              type="button"
                              data-testid="preview-prealert-btn"
                              onClick={() => onPreviewPreAlert(alarm.id)}
                              className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#DCE1DB] px-3 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] dark:border-[#24322B] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
                            >
                              <BellRing className="h-3.5 w-3.5 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                              <span>{t.preAlertPreviewBtn}</span>
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          onClick={() => onTestCustomAlarm(alarm)}
                          aria-label={`${t.testAlarm} ${alarm.title}`}
                          className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#DCE1DB] px-3 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] dark:border-[#24322B] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
                        >
                          <Play className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t.testAlarm}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleCustomAlarm(alarm.id)}
                          aria-pressed={alarm.enabled}
                          aria-label={`${alarm.enabled ? t.off : t.active} ${alarm.title}`}
                          className={`inline-flex h-10 min-w-[44px] items-center justify-center rounded-xl border px-3 text-xs font-medium ${
                            alarm.enabled
                              ? 'border-[#0F5132]/30 bg-[#0F5132]/8 text-[#0F5132] dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]'
                              : 'border-[#DCE1DB] text-[#6A7970] dark:border-[#24322B] dark:text-[#7E8F85]'
                          }`}
                        >
                          {alarm.enabled ? (
                            <Bell className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <BellOff className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteCustomAlarm(alarm.id)}
                          aria-label={`${t.deleteAlarm} ${alarm.title}`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE1DB] text-[#991B1B] hover:bg-[#FEF2F2] dark:border-[#24322B] dark:text-[#FCA5A5] dark:hover:bg-[#3B1818]"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      {subTab === 'tasks' && (
        /* Scheduled Tasks (Specific Date & Time with Alert) Tab */
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#E3E7E2] bg-white p-5 sm:p-6 dark:border-[#1E2A24] dark:bg-[#121916]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#121816] dark:text-[#ECF1EE]">
                  <CalendarClock
                    className="h-5 w-5 text-[#0F5132] dark:text-[#6EE7B7]"
                    aria-hidden="true"
                  />
                  <span>{t.tasksTitle}</span>
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
                  {t.tasksSubtitle}
                </p>
              </div>
              <button
                type="button"
                data-testid="open-add-task-btn"
                onClick={() => {
                  setTaskError(null);
                  setShowTaskForm((prev) => !prev);
                }}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0F5132] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0B3D25] whitespace-nowrap dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.addTaskBtn}</span>
              </button>
            </div>

            {showTaskForm && (
              <form
                onSubmit={handleCreateScheduledTask}
                data-testid="add-scheduled-task-form"
                className="mt-5 space-y-4 rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] p-4 sm:p-5 dark:border-[#24322B] dark:bg-[#0D1310]"
              >
                <div>
                  <label
                    htmlFor="scheduled-task-title"
                    className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                  >
                    {t.taskTitleLabel}
                  </label>
                  <input
                    id="scheduled-task-title"
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder={t.taskTitlePlaceholder}
                    className="h-11 w-full rounded-xl border border-[#DCE1DB] bg-white px-3.5 text-sm text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="scheduled-task-date"
                      className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                    >
                      {t.taskDateLabel}
                    </label>
                    <input
                      id="scheduled-task-date"
                      type="date"
                      value={taskDate}
                      onChange={(e) => setTaskDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-white px-3 font-mono text-sm text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="scheduled-task-time"
                      className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                    >
                      {t.taskTimeLabel}
                    </label>
                    <input
                      id="scheduled-task-time"
                      type="time"
                      value={taskTime}
                      onChange={(e) => setTaskTime(e.target.value)}
                      className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-white px-3 font-mono text-sm text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="scheduled-task-tone"
                      className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                    >
                      {t.toneLabel}
                    </label>
                    <select
                      id="scheduled-task-tone"
                      value={taskTone}
                      onChange={(e) => setTaskTone(e.target.value as AdhanToneId)}
                      className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-white px-3 text-sm text-[#121816] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                    >
                      <ToneSelectOptions
                        language={language}
                        customAudioName={alerts.customAudioName}
                      />
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="scheduled-task-notes"
                    className="mb-1 block text-xs font-semibold text-[#47564E] dark:text-[#9AA9A1]"
                  >
                    {t.taskNotesLabel}
                  </label>
                  <input
                    id="scheduled-task-notes"
                    type="text"
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    placeholder={t.taskNotesPlaceholder}
                    className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-white px-3.5 text-sm text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                  />
                </div>

                {taskError && (
                  <p role="alert" className="text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                    {taskError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="min-h-[40px] rounded-xl border border-[#DCE1DB] px-4 text-sm font-medium text-[#526058] hover:bg-white dark:border-[#24322B] dark:text-[#98A89F] dark:hover:bg-[#1B2520]"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    data-testid="save-scheduled-task-btn"
                    className="min-h-[40px] rounded-xl bg-[#0F5132] px-5 text-sm font-medium text-white hover:bg-[#0B3D25] dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
                  >
                    {t.saveTask}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-5 divide-y divide-[#EFF2EE] dark:divide-[#1C2621]">
              {sortedTasks.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-[#35443C] dark:text-[#C5D1CA]">
                    {t.noTasksYet}
                  </p>
                  <p className="mt-1 text-xs text-[#64746B] dark:text-[#8E9F95]">{t.noTasksHint}</p>
                </div>
              ) : (
                sortedTasks.map((task) => {
                  const targetDate = parseScheduledTaskDateTime(task.date, task.time);
                  const isPast = targetDate ? targetDate.getTime() < nowMs : false;
                  const formattedTime = formatTaskTimeDisplay(task.time, timeFormat, language);
                  return (
                    <div
                      key={task.id}
                      data-testid="scheduled-task-row"
                      className="flex flex-wrap items-center justify-between gap-4 py-4"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <button
                          type="button"
                          onClick={() => onToggleCompleteScheduledTask(task.id)}
                          aria-pressed={task.completed}
                          aria-label={`${t.markCompleted} ${task.title}`}
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#0F5132] hover:opacity-80 dark:text-[#6EE7B7]"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <Circle className="h-5 w-5 text-[#9AA9A1]" aria-hidden="true" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={`text-base font-semibold ${
                                task.completed
                                  ? 'text-[#78877E] line-through dark:text-[#6E8076]'
                                  : 'text-[#121816] dark:text-[#ECF1EE]'
                              }`}
                            >
                              {task.title}
                            </p>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                task.completed
                                  ? 'bg-[#E8ECE7] text-[#5A6960] dark:bg-[#1E2A24] dark:text-[#8E9F95]'
                                  : isPast
                                    ? 'bg-[#9A7B3E]/15 text-[#8A6B30] dark:bg-[#D9B872]/15 dark:text-[#E5C98B]'
                                    : 'bg-[#0F5132]/10 text-[#0F5132] dark:bg-[#6EE7B7]/15 dark:text-[#6EE7B7]'
                              }`}
                            >
                              {task.completed
                                ? t.taskCompletedBadge
                                : isPast
                                  ? t.taskPastBadge
                                  : t.taskUpcomingBadge}
                            </span>
                          </div>

                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5A6960] dark:text-[#8E9F95]">
                            <span dir="ltr" className="font-mono font-medium tabular-nums">
                              {task.date}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span dir="ltr" className="font-mono font-semibold tabular-nums">
                              {formattedTime}
                            </span>
                          </p>
                          {task.notes && (
                            <p className="mt-1 text-xs text-[#64746B] dark:text-[#8E9F95]">
                              {task.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onTestScheduledTask(task)}
                          aria-label={`${t.testAlarm} ${task.title}`}
                          className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#DCE1DB] px-3 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] dark:border-[#24322B] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
                        >
                          <Play className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t.testAlarm}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleScheduledTask(task.id)}
                          aria-pressed={task.enabled}
                          aria-label={`${task.enabled ? t.off : t.active} ${task.title}`}
                          className={`inline-flex h-10 min-w-[44px] items-center justify-center rounded-xl border px-3 text-xs font-medium ${
                            task.enabled
                              ? 'border-[#0F5132]/30 bg-[#0F5132]/8 text-[#0F5132] dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]'
                              : 'border-[#DCE1DB] text-[#6A7970] dark:border-[#24322B] dark:text-[#7E8F85]'
                          }`}
                        >
                          {task.enabled ? (
                            <Bell className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <BellOff className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteScheduledTask(task.id)}
                          aria-label={`${t.deleteTask} ${task.title}`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE1DB] text-[#991B1B] hover:bg-[#FEF2F2] dark:border-[#24322B] dark:text-[#FCA5A5] dark:hover:bg-[#3B1818]"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      {subTab === 'timer' && (
        <TimerPanel
          language={language}
          customAudioName={alerts.customAudioName}
          timer={timer}
          onUpdateTimer={onUpdateTimer}
        />
      )}

      {subTab === 'stopwatch' && (
        <StopwatchPanel
          language={language}
          stopwatch={stopwatch}
          onUpdateStopwatch={onUpdateStopwatch}
        />
      )}
    </div>
  );
}
