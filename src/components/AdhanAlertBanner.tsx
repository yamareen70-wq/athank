import { Volume2, VolumeX, X } from 'lucide-react';
import type { Language } from '../types/prayer';
import { T } from '../utils/i18n';

export interface ActiveAdhanAlert {
  id: string;
  prayerName: string;
  timeFormatted: string;
  message: string;
  isSimulation?: boolean;
}

interface AdhanAlertBannerProps {
  alert: ActiveAdhanAlert | null;
  language: Language;
  isPlayingAudio: boolean;
  onStopAudio: () => void;
  onDismiss: () => void;
}

export function AdhanAlertBanner({
  alert,
  language,
  isPlayingAudio,
  onStopAudio,
  onDismiss,
}: AdhanAlertBannerProps) {
  if (!alert) return null;
  const t = T[language];

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-[#0F5132]/20 bg-[#0F5132] text-white dark:border-[#6EE7B7]/20 dark:bg-[#144730]"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <Volume2 className="h-5 w-5 shrink-0 text-[#D9B872]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug">
              {alert.message} ·{' '}
              <span dir="ltr" className="font-mono tabular-nums">
                {alert.timeFormatted}
              </span>
            </p>
            {alert.isSimulation && (
              <p className="text-xs text-white/80">{t.simulationNote}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPlayingAudio && (
            <button
              type="button"
              onClick={onStopAudio}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
            >
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.stopAudio}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t.closeAlert}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
