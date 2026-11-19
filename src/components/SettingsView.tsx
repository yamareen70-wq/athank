import { useEffect, useRef, useState } from 'react';
import {
  BatteryCharging,
  BellRing,
  CheckCircle2,
  ExternalLink,
  Globe,
  HardDrive,
  LayoutGrid,
  LocateFixed,
  Minus,
  Moon,
  Music2,
  Palette,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Square,
  Sun,
  Trash2,
  Upload,
  Volume2,
  Watch,
} from 'lucide-react';
import { SAI_THEMES, type SaiThemeId } from '../data/saiThemes';
import type {
  AdhanToneId,
  AppSettings,
  AsrSchool,
  CalculationMethodId,
  DailyPrayerSchedule,
  Language,
  NextPrayerState,
  PrayerKey,
  SystemPreferences,
  ThemeMode,
  TimeFormat,
  WearOsPreferences,
  WearOsTileStyle,
  WidgetPreferences,
  WidgetStyle,
  WidgetTheme,
} from '../types/prayer';
import {
  CALCULATION_METHODS,
  formatPrayerMinutes,
  ORDERED_PRAYER_KEYS,
} from '../utils/prayerMath';
import { ADHAN_TONES } from '../utils/adhanAudio';
import { T, getPrayerName } from '../utils/i18n';
import {
  inspectSystemPermissions,
  requestPersistentStorage,
  type SystemPermissionSnapshot,
} from '../utils/systemServices';
import { GoogleDriveSyncCard } from './GoogleDriveSyncCard';
import { HomeWidgetCard } from './HomeWidgetCard';
import { PWAInstallButton } from './PWAInstallButton';
import { WearOsWatchView } from './WearOsWatchView';

export type SettingsCategory = 'calc' | 'manual' | 'display' | 'system';

interface SettingsViewProps {
  now: Date;
  settings: AppSettings;
  todaySchedule: DailyPrayerSchedule;
  nextPrayerState: NextPrayerState;
  isPlayingAdhan: boolean;
  playingToneId: AdhanToneId | null;
  initialCategory?: SettingsCategory;
  onUpdateMethod: (method: CalculationMethodId) => void;
  onUpdateAsrSchool: (school: AsrSchool) => void;
  onUpdateManualAdjustment: (key: PrayerKey, minutes: number) => void;
  onResetManualAdjustments: () => void;
  onUpdateLanguage: (lang: Language) => void;
  onUpdateTimeFormat: (format: TimeFormat) => void;
  onUpdateTheme: (theme: ThemeMode) => void;
  onUpdateSaiTheme: (themeId: SaiThemeId) => void;
  onUpdateDefaultTone: (tone: AdhanToneId) => void;
  onUpdateVolume: (volume: number) => void;
  onPreviewTone: (tone: AdhanToneId) => void;
  onUploadCustomAudio: (file: File) => Promise<boolean>;
  onRemoveCustomAudio: () => Promise<void>;
  onUpdateWidgetPrefs: (patch: Partial<WidgetPreferences>) => void;
  onUpdateWearOsPrefs: (patch: Partial<WearOsPreferences>) => void;
  onUpdateSystemPrefs: (patch: Partial<SystemPreferences>) => void;
  onOpenStandaloneWidget: () => void;
  onOpenStandaloneWearOs: () => void;
  onRestoreSettingsFromDrive: (restored: AppSettings) => void;
  onToggleMuteAll: () => void;
  onRefreshPersistentNotif: () => void;
  onResetAllPreferences: () => void;
}

export function SettingsView({
  now,
  settings,
  todaySchedule,
  nextPrayerState,
  isPlayingAdhan,
  playingToneId,
  initialCategory = 'calc',
  onUpdateMethod,
  onUpdateAsrSchool,
  onUpdateManualAdjustment,
  onResetManualAdjustments,
  onUpdateLanguage,
  onUpdateTimeFormat,
  onUpdateTheme,
  onUpdateSaiTheme,
  onUpdateDefaultTone,
  onUpdateVolume,
  onPreviewTone,
  onUploadCustomAudio,
  onRemoveCustomAudio,
  onUpdateWidgetPrefs,
  onUpdateWearOsPrefs,
  onUpdateSystemPrefs,
  onOpenStandaloneWidget,
  onOpenStandaloneWearOs,
  onRestoreSettingsFromDrive,
  onToggleMuteAll,
  onRefreshPersistentNotif,
  onResetAllPreferences,
}: SettingsViewProps) {
  const { language } = settings;
  const t = T[language];
  const [category, setCategory] = useState<SettingsCategory>(initialCategory);
  const [confirmReset, setConfirmReset] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  const [perms, setPerms] = useState<SystemPermissionSnapshot>({
    notification:
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'unsupported',
    geolocation:
      typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'prompt' : 'unsupported',
    wakeLockSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    wakeLockActive: false,
    storagePersisted: null,
    serviceWorkerReady: false,
  });

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const refreshPerms = async () => {
    const snap = await inspectSystemPermissions();
    setPerms(snap);
  };

  useEffect(() => {
    refreshPerms();
  }, [category, settings.system.keepAwakeEnabled, settings.system.persistentNotificationEnabled]);

  const handleRequestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      await Notification.requestPermission();
    } catch {
      // Ignore permission prompt failures
    }
    await refreshPerms();
    if (settings.system.persistentNotificationEnabled) {
      onRefreshPersistentNotif();
    }
  };

  const handleRequestGps = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      () => {
        refreshPerms();
      },
      () => {
        refreshPerms();
      },
      { timeout: 6000 }
    );
  };

  const handleProtectStorage = async () => {
    await requestPersistentStorage();
    await refreshPerms();
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAudioUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await onUploadCustomAudio(file);
    if (!ok) {
      setAudioUploadError(t.phoneAudioError);
    }
    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = '';
    }
  };

  const hasNonZeroManual = Object.values(settings.manualAdjustments).some((v) => v !== 0);
  const currentMethod = CALCULATION_METHODS[settings.method];
  const adhanOptions = ADHAN_TONES.filter((item) => item.category === 'adhan');
  const alertToneOptions = ADHAN_TONES.filter((item) => item.category === 'tone');

  const renderPermBadge = (status: 'granted' | 'prompt' | 'default' | 'denied' | 'unsupported' | 'active') => {
    if (status === 'granted' || status === 'active') {
      return (
        <span className="rounded-md bg-[#0F5132]/12 px-2 py-0.5 text-[11px] font-semibold text-[#0F5132] dark:bg-[#6EE7B7]/15 dark:text-[#6EE7B7]">
          {status === 'active' ? t.permStatusActive : t.permStatusGranted}
        </span>
      );
    }
    if (status === 'denied') {
      return (
        <span className="rounded-md bg-[#B91C1C]/12 px-2 py-0.5 text-[11px] font-semibold text-[#B91C1C] dark:bg-[#FCA5A5]/15 dark:text-[#FCA5A5]">
          {t.permStatusDenied}
        </span>
      );
    }
    if (status === 'unsupported') {
      return (
        <span className="rounded-md bg-[#E8ECE7] px-2 py-0.5 text-[11px] font-medium text-[#5A6960] dark:bg-[#1E2A24] dark:text-[#8E9F95]">
          {t.permStatusUnsupported}
        </span>
      );
    }
    return (
      <span className="rounded-md bg-[#9A7B3E]/15 px-2 py-0.5 text-[11px] font-semibold text-[#8A6B30] dark:bg-[#D9B872]/15 dark:text-[#D9B872]">
        {t.permStatusNeeded}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#121816] dark:text-[#ECF1EE]">
          {t.settingsTitle}
        </h1>
        <p className="mt-1 text-sm text-[#5A6960] dark:text-[#8E9F95]">{t.settingsSubtitle}</p>
      </div>

      {/* Clean 4-Category Switcher */}
      <div
        role="tablist"
        aria-label={t.settingsTitle}
        className="grid grid-cols-2 gap-1.5 rounded-2xl border border-[#DCE1DB] bg-[#EEF1ED] p-1.5 sm:grid-cols-4 dark:border-[#24322B] dark:bg-[#0E1512]"
      >
        {(
          [
            { id: 'calc', label: t.settingsSectionCalc },
            { id: 'manual', label: t.settingsSectionManual },
            { id: 'display', label: t.settingsSectionDisplay },
            { id: 'system', label: t.settingsSectionSystem },
          ] as { id: SettingsCategory; label: string }[]
        ).map((item) => {
          const active = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(item.id)}
              className={`min-h-[42px] rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-white text-[#0F5132] shadow-xs dark:bg-[#1B2621] dark:text-[#6EE7B7]'
                  : 'text-[#5A6960] hover:text-[#121816] dark:text-[#8E9F95] dark:hover:text-[#ECF1EE]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Category 1: Calculation Method (All 15), Asr School, DST, Hijri Offset */}
      {category === 'calc' && (
        <section className="rounded-2xl border border-[#E3E7E2] bg-white p-6 sm:p-8 space-y-6 dark:border-[#1E2A24] dark:bg-[#121916]">
          <div className="space-y-2">
            <label
              htmlFor="calculation-method-select"
              className="block text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]"
            >
              {t.calcMethodLabel}
            </label>
            <select
              id="calculation-method-select"
              value={settings.method}
              onChange={(e) => onUpdateMethod(e.target.value as CalculationMethodId)}
              className="h-11 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] px-3.5 text-sm text-[#121816] focus:border-[#0F5132] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132]/20 dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#ECF1EE] dark:focus:border-[#6EE7B7]"
            >
              {Object.values(CALCULATION_METHODS).map((m) => (
                <option key={m.id} value={m.id}>
                  {language === 'ar' ? m.nameAr : m.nameEn}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#64746B] dark:text-[#8E9F95]">
              {language === 'ar' ? currentMethod.descriptionAr : currentMethod.descriptionEn}
            </p>
          </div>

          <hr className="border-[#EFF2EE] dark:border-[#1C2621]" />

          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
              {t.asrMethodLabel}
            </p>
            <div
              role="group"
              aria-label={t.asrMethodLabel}
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              <button
                type="button"
                onClick={() => onUpdateAsrSchool('standard')}
                aria-pressed={settings.asrSchool === 'standard'}
                className={`min-h-[44px] rounded-xl border px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  settings.asrSchool === 'standard'
                    ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                    : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA] dark:hover:bg-[#1B2520]'
                }`}
              >
                {t.asrStandard}
              </button>
              <button
                type="button"
                onClick={() => onUpdateAsrSchool('hanafi')}
                aria-pressed={settings.asrSchool === 'hanafi'}
                className={`min-h-[44px] rounded-xl border px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  settings.asrSchool === 'hanafi'
                    ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                    : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA] dark:hover:bg-[#1B2520]'
                }`}
              >
                {t.asrHanafi}
              </button>
            </div>
            <p className="text-xs text-[#64746B] dark:text-[#8E9F95]">
              {settings.asrSchool === 'hanafi' ? t.asrHanafiHint : t.asrStandardHint}
            </p>
          </div>
        </section>
      )}

      {/* Category 2: Manual Per-Prayer Minute Offsets (-30..+30 min) */}
      {category === 'manual' && (
        <section className="rounded-2xl border border-[#E3E7E2] bg-white p-6 sm:p-8 space-y-6 dark:border-[#1E2A24] dark:bg-[#121916]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#121816] dark:text-[#ECF1EE]">
                {t.manualTitle}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
                {t.manualSubtitle}
              </p>
            </div>
            <button
              type="button"
              disabled={!hasNonZeroManual}
              onClick={onResetManualAdjustments}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#DCE1DB] px-3.5 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] disabled:opacity-40 whitespace-nowrap dark:border-[#24322B] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.resetManual}</span>
            </button>
          </div>

          <div className="divide-y divide-[#EFF2EE] dark:divide-[#1C2621]">
            {ORDERED_PRAYER_KEYS.map((key) => {
              const offset = settings.manualAdjustments[key] ?? 0;
              const entry = todaySchedule.prayers.find((p) => p.key === key);
              const pName = getPrayerName(key, language);

              return (
                <div
                  key={key}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="text-base font-semibold text-[#121816] dark:text-[#ECF1EE]">
                      {pName}
                    </p>
                    {entry && (
                      <p
                        dir="ltr"
                        className="font-mono text-xs tabular-nums text-[#64746B] dark:text-[#8E9F95]"
                      >
                        {formatPrayerMinutes(entry.minutesFromMidnight, settings.timeFormat, language)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={offset <= -30}
                      onClick={() => onUpdateManualAdjustment(key, Math.max(-30, offset - 1))}
                      aria-label={`${language === 'ar' ? 'تقديم دقيقة لـ' : 'Subtract 1 min from'} ${pName}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE1DB] text-[#35443C] hover:bg-[#F3F5F2] disabled:opacity-40 dark:border-[#24322B] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <span
                      dir="ltr"
                      data-testid={`manual-offset-${key}`}
                      className={`min-w-[68px] text-center font-mono text-sm font-semibold tabular-nums ${
                        offset !== 0
                          ? 'text-[#0F5132] dark:text-[#6EE7B7]'
                          : 'text-[#64746B] dark:text-[#8E9F95]'
                      }`}
                    >
                      {offset > 0 ? `+${offset}m` : `${offset}m`}
                    </span>

                    <button
                      type="button"
                      disabled={offset >= 30}
                      onClick={() => onUpdateManualAdjustment(key, Math.min(30, offset + 1))}
                      aria-label={`${language === 'ar' ? 'تأخير دقيقة لـ' : 'Add 1 min to'} ${pName}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE1DB] text-[#35443C] hover:bg-[#F3F5F2] disabled:opacity-40 dark:border-[#24322B] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Category 3: Appearance (Dark/Light), Language (AR/EN), Format & Audio */}
      {category === 'display' && (
        <section className="rounded-2xl border border-[#E3E7E2] bg-white p-6 sm:p-8 space-y-6 dark:border-[#1E2A24] dark:bg-[#121916]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Theme */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                {t.themeLabel}
              </p>
              <div role="group" aria-label={t.themeLabel} className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateTheme('light')}
                  aria-pressed={settings.theme === 'light'}
                  className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    settings.theme === 'light'
                      ? 'border-[#0F5132] bg-[#0F5132] text-white'
                      : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA] dark:hover:bg-[#1B2520]'
                  }`}
                >
                  <Sun className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t.themeLight}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateTheme('dark')}
                  aria-pressed={settings.theme === 'dark'}
                  className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    settings.theme === 'dark'
                      ? 'border-[#196B45] bg-[#196B45] text-white'
                      : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA] dark:hover:bg-[#1B2520]'
                  }`}
                >
                  <Moon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t.themeDark}</span>
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                {t.languageLabel}
              </p>
              <div role="group" aria-label={t.languageLabel} className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateLanguage('ar')}
                  aria-pressed={settings.language === 'ar'}
                  className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    settings.language === 'ar'
                      ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                      : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA] dark:hover:bg-[#1B2520]'
                  }`}
                >
                  <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>العربية</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateLanguage('en')}
                  aria-pressed={settings.language === 'en'}
                  className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    settings.language === 'en'
                      ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                      : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA] dark:hover:bg-[#1B2520]'
                  }`}
                >
                  <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>English</span>
                </button>
              </div>
            </div>
          </div>

          <hr className="border-[#EFF2EE] dark:border-[#1C2621]" />

          {/* Authentic Aefyr/SAI 12-Theme & Color Palette Gallery */}
          <div className="space-y-4" data-testid="sai-theme-gallery">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-[#121816] dark:text-[#ECF1EE]">
                  <Palette className="h-4 w-4 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                  <span>{t.saiThemesTitle}</span>
                </h2>
                <p className="mt-0.5 text-xs text-[#5A6960] dark:text-[#8E9F95]">
                  {t.saiThemesSubtitle}
                </p>
              </div>
            </div>

            {(
              [
                { label: t.saiLightGroup, items: SAI_THEMES.filter((th) => !th.isDark) },
                { label: t.saiDarkGroup, items: SAI_THEMES.filter((th) => th.isDark) },
              ] as const
            ).map((group) => (
              <div key={group.label} className="space-y-2">
                <p className="text-xs font-semibold text-[#5A6960] dark:text-[#8E9F95]">
                  {group.label}
                </p>
                <div
                  data-testid="sai-theme-grid"
                  className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4"
                >
                  {group.items.map((th) => {
                    const isSelected = settings.saiThemeId === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        data-testid={`sai-theme-${th.id}`}
                        aria-pressed={isSelected}
                        onClick={() => onUpdateSaiTheme(th.id)}
                        className="group relative flex flex-col justify-between gap-2.5 rounded-xl border p-3 text-start transition-all focus-visible:outline-none focus-visible:ring-2"
                        style={{
                          backgroundColor: th.surface,
                          color: th.textPrimary,
                          borderColor: isSelected ? th.accent : th.border,
                          boxShadow: isSelected ? `0 0 0 2px ${th.accent}` : undefined,
                        }}
                      >
                        {/* Authentic SAI Palette Preview Strip */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="sai-swatch-fixed h-5 w-5 rounded-full border shadow-xs"
                              style={{ backgroundColor: th.bg, borderColor: th.border }}
                              title={th.bg}
                            />
                            <span
                              className="sai-swatch-fixed h-5 w-5 rounded-full border shadow-xs"
                              style={{ backgroundColor: th.accent, borderColor: th.border }}
                              title={th.accent}
                            />
                            <span
                              className="sai-swatch-fixed h-5 w-5 rounded-full border shadow-xs"
                              style={{ backgroundColor: th.textPrimary, borderColor: th.border }}
                              title={th.textPrimary}
                            />
                          </div>
                          {isSelected && (
                            <span
                              className="sai-swatch-fixed rounded px-1.5 py-0.5 text-[10px] font-bold"
                              style={{ backgroundColor: th.accent, color: th.accentFg }}
                            >
                              {t.saiActiveBadge}
                            </span>
                          )}
                        </div>

                        <div>
                          <p
                            className="text-xs font-bold leading-snug"
                            style={{ color: th.textPrimary }}
                          >
                            {language === 'ar' ? th.nameAr : th.nameEn}
                          </p>
                          <p
                            dir="ltr"
                            className="mt-0.5 font-mono text-[10px] opacity-80"
                            style={{ color: th.accentText }}
                          >
                            {th.accent} · {th.bg}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <hr className="border-[#EFF2EE] dark:border-[#1C2621]" />

          {/* Clock Format & Volume */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                {t.timeFormatLabel}
              </p>
              <div role="group" aria-label={t.timeFormatLabel} className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateTimeFormat('12h')}
                  aria-pressed={settings.timeFormat === '12h'}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    settings.timeFormat === '12h'
                      ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                      : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA] dark:hover:bg-[#1B2520]'
                  }`}
                >
                  {t.h12}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateTimeFormat('24h')}
                  aria-pressed={settings.timeFormat === '24h'}
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    settings.timeFormat === '24h'
                      ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                      : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA] dark:hover:bg-[#1B2520]'
                  }`}
                >
                  {t.h24}
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <label
                  htmlFor="adhan-volume-range"
                  className="flex items-center gap-2 font-semibold text-[#121816] dark:text-[#ECF1EE]"
                >
                  <Volume2 className="h-4 w-4 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                  <span>{t.volumeLabel}</span>
                </label>
                <span className="font-mono text-xs font-semibold tabular-nums text-[#5A6960] dark:text-[#8E9F95]">
                  {Math.round(settings.alerts.volume * 100)}%
                </span>
              </div>
              <input
                id="adhan-volume-range"
                type="range"
                min={10}
                max={100}
                value={Math.round(settings.alerts.volume * 100)}
                onChange={(e) => onUpdateVolume(Number(e.target.value) / 100)}
                className="h-2 w-full cursor-pointer accent-[#0F5132] dark:accent-[#6EE7B7]"
              />
            </div>
          </div>

          <hr className="border-[#EFF2EE] dark:border-[#1C2621]" />

          {/* Grouped Adhan Calls, Alert Tones & Custom Phone Audio Picker */}
          <div className="space-y-5">
            <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
              {t.defaultToneLabel}
            </p>

            {/* Group 1: Adhan Calls */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#5A6960] dark:text-[#8E9F95]">
                {t.toneGroupAdhan}
              </p>
              <div className="divide-y divide-[#EFF2EE] overflow-hidden rounded-xl border border-[#E3E7E2] dark:divide-[#1C2621] dark:border-[#24322B]">
                {adhanOptions.map((tone) => {
                  const isSelected = settings.alerts.defaultTone === tone.id;
                  const isPlayingThis = isPlayingAdhan && playingToneId === tone.id;
                  const label = language === 'ar' ? tone.nameAr : tone.nameEn;
                  const sub = language === 'ar' ? tone.subtitleAr : tone.subtitleEn;
                  return (
                    <div
                      key={tone.id}
                      className={`flex items-center justify-between gap-4 px-4 py-3.5 ${
                        isSelected
                          ? 'bg-[#0F5132]/[0.06] dark:bg-[#6EE7B7]/[0.08]'
                          : 'bg-white dark:bg-[#121916]'
                      }`}
                    >
                      <label className="flex flex-1 cursor-pointer items-start gap-3">
                        <input
                          type="radio"
                          name="default-adhan-tone"
                          checked={isSelected}
                          onChange={() => onUpdateDefaultTone(tone.id)}
                          className="mt-1 h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                        />
                        <div>
                          <span className="block text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                            {label}
                          </span>
                          <span className="block text-xs text-[#64746B] dark:text-[#8E9F95]">
                            {sub}
                          </span>
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => onPreviewTone(tone.id)}
                        aria-label={`${t.testAlarm} ${label}`}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#DCE1DB] px-3 py-1.5 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] whitespace-nowrap dark:border-[#24322B] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
                      >
                        {isPlayingThis ? (
                          <Square className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Play className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>{isPlayingThis ? t.stopAudio : t.testAlarm}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Group 2: Short Alert Tones */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#5A6960] dark:text-[#8E9F95]">
                {t.toneGroupAlerts}
              </p>
              <div className="divide-y divide-[#EFF2EE] overflow-hidden rounded-xl border border-[#E3E7E2] dark:divide-[#1C2621] dark:border-[#24322B]">
                {alertToneOptions.map((tone) => {
                  const isSelected = settings.alerts.defaultTone === tone.id;
                  const isPlayingThis = isPlayingAdhan && playingToneId === tone.id;
                  const label = language === 'ar' ? tone.nameAr : tone.nameEn;
                  const sub = language === 'ar' ? tone.subtitleAr : tone.subtitleEn;
                  return (
                    <div
                      key={tone.id}
                      className={`flex items-center justify-between gap-4 px-4 py-3.5 ${
                        isSelected
                          ? 'bg-[#0F5132]/[0.06] dark:bg-[#6EE7B7]/[0.08]'
                          : 'bg-white dark:bg-[#121916]'
                      }`}
                    >
                      <label className="flex flex-1 cursor-pointer items-start gap-3">
                        <input
                          type="radio"
                          name="default-adhan-tone"
                          checked={isSelected}
                          onChange={() => onUpdateDefaultTone(tone.id)}
                          className="mt-1 h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                        />
                        <div>
                          <span className="block text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                            {label}
                          </span>
                          <span className="block text-xs text-[#64746B] dark:text-[#8E9F95]">
                            {sub}
                          </span>
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => onPreviewTone(tone.id)}
                        aria-label={`${t.testAlarm} ${label}`}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#DCE1DB] px-3 py-1.5 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] whitespace-nowrap dark:border-[#24322B] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
                      >
                        {isPlayingThis ? (
                          <Square className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Play className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>{isPlayingThis ? t.stopAudio : t.testAlarm}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Group 3: Pick Custom Audio File from Phone */}
            <div
              data-testid="phone-audio-picker-card"
              className={`rounded-xl border p-4 sm:p-5 space-y-3 transition-colors ${
                settings.alerts.defaultTone === 'custom'
                  ? 'border-[#0F5132]/45 bg-[#0F5132]/[0.06] dark:border-[#6EE7B7]/40 dark:bg-[#6EE7B7]/[0.08]'
                  : 'border-[#E3E7E2] bg-[#FAFBF9] dark:border-[#24322B] dark:bg-[#0E1512]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Music2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#0F5132] dark:text-[#6EE7B7]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                      {t.phoneAudioTitle}
                    </p>
                    <p className="mt-0.5 text-xs text-[#64746B] dark:text-[#8E9F95]">
                      {t.phoneAudioSubtitle}
                    </p>
                  </div>
                </div>

                <input
                  ref={audioFileInputRef}
                  type="file"
                  accept="audio/*"
                  data-testid="phone-audio-file-input"
                  onChange={handleAudioFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => audioFileInputRef.current?.click()}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#0F5132] px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-[#0B3D25] whitespace-nowrap dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
                >
                  <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {settings.alerts.customAudioName
                      ? t.phoneAudioReplaceBtn
                      : t.phoneAudioPickBtn}
                  </span>
                </button>
              </div>

              {settings.alerts.customAudioName && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE1DB] bg-white px-3.5 py-2.5 dark:border-[#24322B] dark:bg-[#141D19]">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                    <input
                      type="radio"
                      name="default-adhan-tone"
                      checked={settings.alerts.defaultTone === 'custom'}
                      onChange={() => onUpdateDefaultTone('custom')}
                      className="h-4 w-4 shrink-0 accent-[#0F5132] dark:accent-[#6EE7B7]"
                    />
                    <span className="truncate text-xs sm:text-sm font-medium text-[#121816] dark:text-[#ECF1EE]">
                      {t.phoneAudioSelectedPrefix}{' '}
                      <span className="font-semibold text-[#0F5132] dark:text-[#6EE7B7]">
                        {settings.alerts.customAudioName}
                      </span>
                    </span>
                  </label>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onPreviewTone('custom')}
                      className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#DCE1DB] px-2.5 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] dark:border-[#24322B] dark:text-[#C5D1CA]"
                    >
                      {isPlayingAdhan && playingToneId === 'custom' ? (
                        <Square className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {isPlayingAdhan && playingToneId === 'custom' ? t.stopAudio : t.testAlarm}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRemoveCustomAudio()}
                      aria-label={t.phoneAudioRemoveBtn}
                      className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#DCE1DB] px-2.5 text-xs font-medium text-[#991B1B] hover:bg-[#FEF2F2] dark:border-[#24322B] dark:text-[#FCA5A5] dark:hover:bg-[#3B1818]"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t.phoneAudioRemoveBtn}</span>
                    </button>
                  </div>
                </div>
              )}

              {audioUploadError && (
                <p role="alert" className="text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                  {audioUploadError}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Category 4: Google Drive Sync, Wear OS Smartwatch, Home Screen Widget, Persistent Bar & Permissions */}
      {category === 'system' && (
        <div className="space-y-6">
          {/* 0. Google Drive Cloud Backup & Sync */}
          <GoogleDriveSyncCard
            settings={settings}
            language={language}
            onRestoreSettings={onRestoreSettingsFromDrive}
          />

          {/* 1. Wear OS Smartwatch Companion Studio */}
          <section
            data-testid="wearos-settings-section"
            className="rounded-2xl border border-[#E3E7E2] bg-white p-6 sm:p-8 space-y-6 dark:border-[#1E2A24] dark:bg-[#121916]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#121816] dark:text-[#ECF1EE]">
                  <Watch className="h-5 w-5 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                  <span>{t.wearOsTitle}</span>
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
                  {t.wearOsSubtitle}
                </p>
              </div>
              <button
                type="button"
                data-testid="open-standalone-wearos-btn"
                onClick={onOpenStandaloneWearOs}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0F5132] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#0B3D25] whitespace-nowrap dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.wearOsOpenStandalone}</span>
              </button>
            </div>

            {/* Interactive Circular Wear OS Watch Preview */}
            <div className="rounded-2xl border border-[#24322B] bg-gradient-to-br from-[#0A130F] via-[#0F1E18] to-[#060B09] p-6 text-center space-y-4">
              <p className="text-[11px] font-medium text-white/75">{t.wearOsPreviewCaption}</p>
              <WearOsWatchView
                now={now}
                settings={settings}
                todaySchedule={todaySchedule}
                nextPrayerState={nextPrayerState}
                onToggleMuteAll={onToggleMuteAll}
                onToggleAmbient={() =>
                  onUpdateWearOsPrefs({ ambientOled: !settings.wearOs.ambientOled })
                }
                size="preview"
              />
            </div>

            {/* Wear OS Tile Style & Preferences */}
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#121816] dark:text-[#ECF1EE]">
                  {t.wearOsTileStyleLabel}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'circular_ring', label: t.wearOsStyleRing },
                      { id: 'minimal_oled', label: t.wearOsStyleOled },
                      { id: 'full_list', label: t.wearOsStyleList },
                    ] as { id: WearOsTileStyle; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={settings.wearOs.tileStyle === opt.id}
                      onClick={() => onUpdateWearOsPrefs({ tileStyle: opt.id })}
                      className={`min-h-[40px] rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                        settings.wearOs.tileStyle === opt.id
                          ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                          : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] px-4 py-3 text-xs sm:text-sm dark:border-[#223029]">
                  <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                    {t.wearOsAmbientOled}
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.wearOs.ambientOled}
                    onChange={(e) => onUpdateWearOsPrefs({ ambientOled: e.target.checked })}
                    className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] px-4 py-3 text-xs sm:text-sm dark:border-[#223029]">
                  <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                    {t.wearOsVibrate}
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.wearOs.vibrateOnAdhan}
                    onChange={(e) => onUpdateWearOsPrefs({ vibrateOnAdhan: e.target.checked })}
                    className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] px-4 py-3 text-xs sm:text-sm dark:border-[#223029]">
                  <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                    {t.wearOsShowQibla}
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.wearOs.showQiblaComplication}
                    onChange={(e) =>
                      onUpdateWearOsPrefs({ showQiblaComplication: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] px-4 py-3 text-xs sm:text-sm dark:border-[#223029]">
                  <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                    {t.wearOsShowSeconds}
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.wearOs.showSeconds}
                    onChange={(e) => onUpdateWearOsPrefs({ showSeconds: e.target.checked })}
                    className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                  />
                </label>
              </div>

              <p className="text-[11px] leading-relaxed text-[#64746B] dark:text-[#8E9F95]">
                {t.wearOsGuide}
              </p>
            </div>
          </section>

          {/* 2. Home Screen Widget Studio */}
          <section className="rounded-2xl border border-[#E3E7E2] bg-white p-6 sm:p-8 space-y-6 dark:border-[#1E2A24] dark:bg-[#121916]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#121816] dark:text-[#ECF1EE]">
                  <LayoutGrid className="h-5 w-5 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                  <span>{t.widgetTitle}</span>
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
                  {t.widgetSubtitle}
                </p>
              </div>
              <PWAInstallButton language={language} variant="primary" />
            </div>

            {/* Live Home Screen Preview */}
            <div className="rounded-2xl border border-[#DCE1DB] bg-gradient-to-br from-[#193A2B] via-[#214B38] to-[#0E241A] p-5 sm:p-6 dark:border-[#24322B]">
              <p className="mb-3 text-[11px] font-medium text-white/75">{t.widgetPreviewCaption}</p>
              <div className={settings.widget.style === 'compact' ? 'mx-auto max-w-sm' : 'mx-auto max-w-xl'}>
                <HomeWidgetCard
                  settings={settings}
                  todaySchedule={todaySchedule}
                  nextPrayerState={nextPrayerState}
                />
              </div>
            </div>

            {/* Widget Layout & Theme Controls */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#121816] dark:text-[#ECF1EE]">
                  {t.widgetStyleLabel}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'compact', label: t.widgetStyleCompact },
                      { id: 'schedule', label: t.widgetStyleSchedule },
                      { id: 'transparent', label: t.widgetStyleTransparent },
                    ] as { id: WidgetStyle; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={settings.widget.style === opt.id}
                      onClick={() => onUpdateWidgetPrefs({ style: opt.id })}
                      className={`min-h-[40px] rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                        settings.widget.style === opt.id
                          ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                          : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#121816] dark:text-[#ECF1EE]">
                  {t.widgetThemeLabel}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'auto', label: t.widgetThemeAuto },
                      { id: 'light', label: t.widgetThemeLight },
                      { id: 'dark', label: t.widgetThemeDark },
                      { id: 'emerald', label: t.widgetThemeEmerald },
                    ] as { id: WidgetTheme; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={settings.widget.theme === opt.id}
                      onClick={() => onUpdateWidgetPrefs({ theme: opt.id })}
                      className={`min-h-[40px] rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                        settings.widget.theme === opt.id
                          ? 'border-[#0F5132] bg-[#0F5132] text-white dark:border-[#196B45] dark:bg-[#196B45]'
                          : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] hover:bg-[#EFF2EE] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Widget Display Toggles */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] px-4 py-3 text-xs sm:text-sm dark:border-[#223029]">
                <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                  {t.widgetShowHijri}
                </span>
                <input
                  type="checkbox"
                  checked={settings.widget.showHijri}
                  onChange={(e) => onUpdateWidgetPrefs({ showHijri: e.target.checked })}
                  className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] px-4 py-3 text-xs sm:text-sm dark:border-[#223029]">
                <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                  {t.widgetShowCountdown}
                </span>
                <input
                  type="checkbox"
                  checked={settings.widget.showCountdown}
                  onChange={(e) => onUpdateWidgetPrefs({ showCountdown: e.target.checked })}
                  className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] px-4 py-3 text-xs sm:text-sm dark:border-[#223029]">
                <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                  {t.widgetShowAllPrayers}
                </span>
                <input
                  type="checkbox"
                  checked={settings.widget.showAllPrayers}
                  onChange={(e) => onUpdateWidgetPrefs({ showAllPrayers: e.target.checked })}
                  className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] px-4 py-3 text-xs sm:text-sm dark:border-[#223029]">
                <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                  {t.widgetFloatingLabel}
                </span>
                <input
                  type="checkbox"
                  checked={settings.widget.floatingEnabled}
                  onChange={(e) => onUpdateWidgetPrefs({ floatingEnabled: e.target.checked })}
                  className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onOpenStandaloneWidget}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#0F5132]/30 bg-[#0F5132]/8 px-4 py-2 text-xs sm:text-sm font-semibold text-[#0F5132] hover:bg-[#0F5132]/15 whitespace-nowrap dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]"
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.widgetOpenStandalone}</span>
              </button>
            </div>
          </section>

          {/* 2. Persistent Notification Bar */}
          <section className="rounded-2xl border border-[#E3E7E2] bg-white p-6 sm:p-8 space-y-5 dark:border-[#1E2A24] dark:bg-[#121916]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#121816] dark:text-[#ECF1EE]">
                  <BellRing className="h-5 w-5 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                  <span>{t.persistentTitle}</span>
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
                  {t.persistentSubtitle}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.system.persistentNotificationEnabled}
                onClick={() =>
                  onUpdateSystemPrefs({
                    persistentNotificationEnabled: !settings.system.persistentNotificationEnabled,
                  })
                }
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  settings.system.persistentNotificationEnabled
                    ? 'bg-[#0F5132] text-white dark:bg-[#196B45]'
                    : 'border border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA]'
                }`}
              >
                <span>
                  {settings.system.persistentNotificationEnabled ? t.active : t.persistentEnableLabel}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] px-4 py-3 text-xs sm:text-sm dark:border-[#223029]">
                <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                  {t.persistentShowAllLabel}
                </span>
                <input
                  type="checkbox"
                  checked={settings.system.persistentShowAllPrayers}
                  onChange={(e) =>
                    onUpdateSystemPrefs({ persistentShowAllPrayers: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] px-4 py-3 text-xs sm:text-sm dark:border-[#223029]">
                <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                  {t.persistentShowHijriLabel}
                </span>
                <input
                  type="checkbox"
                  checked={settings.system.persistentShowHijri}
                  onChange={(e) => onUpdateSystemPrefs({ persistentShowHijri: e.target.checked })}
                  className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] px-4 py-3 text-xs sm:text-sm sm:col-span-2 dark:border-[#223029]">
                <span className="font-medium text-[#121816] dark:text-[#ECF1EE]">
                  {t.timerStopwatchNotifLabel}
                </span>
                <input
                  type="checkbox"
                  data-testid="timer-stopwatch-notif-toggle"
                  checked={settings.system.timerStopwatchNotifEnabled}
                  onChange={(e) =>
                    onUpdateSystemPrefs({ timerStopwatchNotifEnabled: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                />
              </label>
            </div>

            {settings.system.persistentNotificationEnabled && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F6F8F5] px-4 py-3 dark:bg-[#0E1512]">
                <p className="text-xs text-[#47564E] dark:text-[#9AA9A1]">
                  {perms.notification === 'granted'
                    ? t.browserNotifGranted
                    : perms.notification === 'denied'
                      ? t.browserNotifDenied
                      : t.browserNotifDefault}
                </p>
                <div className="flex items-center gap-2">
                  {perms.notification === 'default' && (
                    <button
                      type="button"
                      onClick={handleRequestNotifications}
                      className="inline-flex min-h-[36px] items-center rounded-lg bg-[#0F5132] px-3 text-xs font-semibold text-white hover:bg-[#0B3D25] dark:bg-[#196B45]"
                    >
                      {t.browserNotifEnable}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onRefreshPersistentNotif}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#DCE1DB] bg-white px-3 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#C5D1CA]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.persistentRefreshNow}</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* 3. Permissions, Do Not Disturb & Background Reliability */}
          <section className="rounded-2xl border border-[#E3E7E2] bg-white p-6 sm:p-8 space-y-5 dark:border-[#1E2A24] dark:bg-[#121916]">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-[#121816] dark:text-[#ECF1EE]">
                <ShieldCheck className="h-5 w-5 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                <span>{t.permissionsTitle}</span>
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
                {t.permissionsSubtitle}
              </p>
            </div>

            <div className="divide-y divide-[#EFF2EE] rounded-xl border border-[#E8ECE7] dark:divide-[#1C2621] dark:border-[#223029]">
              {/* Notification Permission */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <BellRing className="h-4 w-4 shrink-0 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                      {t.permNotifName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {renderPermBadge(perms.notification)}
                  {perms.notification === 'default' && (
                    <button
                      type="button"
                      onClick={handleRequestNotifications}
                      className="min-h-[34px] rounded-lg border border-[#0F5132]/30 bg-[#0F5132]/8 px-3 text-xs font-semibold text-[#0F5132] hover:bg-[#0F5132]/15 dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]"
                    >
                      {t.permRequestBtn}
                    </button>
                  )}
                </div>
              </div>

              {/* GPS Location Permission */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <LocateFixed className="h-4 w-4 shrink-0 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                  <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                    {t.permGpsName}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  {renderPermBadge(perms.geolocation)}
                  {perms.geolocation === 'prompt' && (
                    <button
                      type="button"
                      onClick={handleRequestGps}
                      className="min-h-[34px] rounded-lg border border-[#0F5132]/30 bg-[#0F5132]/8 px-3 text-xs font-semibold text-[#0F5132] hover:bg-[#0F5132]/15 dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]"
                    >
                      {t.permRequestBtn}
                    </button>
                  )}
                </div>
              </div>

              {/* Persistent Storage Protection */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-4 w-4 shrink-0 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                  <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                    {t.permStorageName}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  {renderPermBadge(
                    perms.storagePersisted === true
                      ? 'granted'
                      : perms.storagePersisted === false
                        ? 'prompt'
                        : 'unsupported'
                  )}
                  {perms.storagePersisted === false && (
                    <button
                      type="button"
                      onClick={handleProtectStorage}
                      className="min-h-[34px] rounded-lg border border-[#0F5132]/30 bg-[#0F5132]/8 px-3 text-xs font-semibold text-[#0F5132] hover:bg-[#0F5132]/15 dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]"
                    >
                      {t.permProtectStorageBtn}
                    </button>
                  )}
                </div>
              </div>

              {/* Wake Lock (Keep Active) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <BatteryCharging className="mt-0.5 h-4 w-4 shrink-0 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                      {t.permWakeLockName}
                    </p>
                    <p className="text-xs text-[#64746B] dark:text-[#8E9F95]">
                      {t.permWakeLockDesc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {settings.system.keepAwakeEnabled && perms.wakeLockActive && renderPermBadge('active')}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.system.keepAwakeEnabled}
                    onClick={() =>
                      onUpdateSystemPrefs({ keepAwakeEnabled: !settings.system.keepAwakeEnabled })
                    }
                    className={`min-h-[36px] rounded-lg px-3.5 text-xs font-semibold transition-colors ${
                      settings.system.keepAwakeEnabled
                        ? 'bg-[#0F5132] text-white dark:bg-[#196B45]'
                        : 'border border-[#DCE1DB] bg-[#F8F9F7] text-[#35443C] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#B4C2BA]'
                    }`}
                  >
                    {settings.system.keepAwakeEnabled ? t.active : t.off}
                  </button>
                </div>
              </div>
            </div>

            {/* Do Not Disturb Bypass Card */}
            <div className="rounded-xl border border-[#E8ECE7] bg-[#F8FAF8] p-4 space-y-2.5 dark:border-[#223029] dark:bg-[#0E1512]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                    {t.permDndTitle}
                  </p>
                  <p className="text-xs text-[#5A6960] dark:text-[#8E9F95]">{t.permDndDesc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.system.dndBypassEnabled}
                  onClick={() =>
                    onUpdateSystemPrefs({ dndBypassEnabled: !settings.system.dndBypassEnabled })
                  }
                  className={`min-h-[36px] rounded-lg px-3.5 text-xs font-semibold transition-colors ${
                    settings.system.dndBypassEnabled
                      ? 'bg-[#0F5132] text-white dark:bg-[#196B45]'
                      : 'border border-[#DCE1DB] bg-white text-[#35443C] dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#B4C2BA]'
                  }`}
                >
                  {settings.system.dndBypassEnabled ? t.active : t.off}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-[#64746B] dark:text-[#8E9F95]">
                {t.permDndGuide}
              </p>
            </div>

            {/* Battery Optimization / Anti-Kill Card */}
            <div className="rounded-xl border border-[#E8ECE7] bg-[#F8FAF8] p-4 space-y-2.5 dark:border-[#223029] dark:bg-[#0E1512]">
              <div>
                <p className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                  {t.permBatteryTitle}
                </p>
                <p className="text-xs text-[#5A6960] dark:text-[#8E9F95]">{t.permBatteryDesc}</p>
              </div>
              <p className="text-[11px] leading-relaxed text-[#64746B] dark:text-[#8E9F95]">
                {t.permBatteryGuide}
              </p>
              <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-xs font-medium text-[#121816] dark:text-[#ECF1EE]">
                <input
                  type="checkbox"
                  checked={settings.system.batteryUnrestrictedAck}
                  onChange={(e) =>
                    onUpdateSystemPrefs({ batteryUnrestrictedAck: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#0F5132] dark:accent-[#6EE7B7]"
                />
                <span>{t.permBatteryAckLabel}</span>
              </label>
            </div>

            {/* Preferences Persistence Confirmation & Reset */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EFF2EE] pt-4 dark:border-[#1C2621]">
              <p className="flex items-center gap-2 text-xs font-medium text-[#0F5132] dark:text-[#6EE7B7]">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.prefsSavedNotice}</span>
              </p>

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#DCE1DB] px-3 text-xs font-medium text-[#5A6960] hover:border-[#B91C1C]/40 hover:text-[#B91C1C] dark:border-[#24322B] dark:text-[#8E9F95] dark:hover:text-[#FCA5A5]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.resetAllPrefsBtn}</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#B91C1C] dark:text-[#FCA5A5]">
                    {t.resetAllPrefsConfirm}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetAllPreferences();
                      setConfirmReset(false);
                    }}
                    className="min-h-[34px] rounded-lg bg-[#B91C1C] px-3 text-xs font-semibold text-white hover:bg-[#991B1B]"
                  >
                    {t.confirmBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[34px] rounded-lg border border-[#DCE1DB] px-3 text-xs font-medium text-[#35443C] dark:border-[#24322B] dark:text-[#C5D1CA]"
                  >
                    {t.cancel}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
