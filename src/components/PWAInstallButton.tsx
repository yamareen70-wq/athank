import { useState } from 'react';
import { CheckCircle2, Download, Share, WifiOff } from 'lucide-react';
import type { Language } from '../types/prayer';
import { T } from '../utils/i18n';
import { useOnlineStatus, usePWAInstall } from '../utils/systemServices';

interface PWAInstallButtonProps {
  language: Language;
  variant?: 'primary' | 'subtle';
}

export function PWAInstallButton({ language, variant = 'primary' }: PWAInstallButtonProps) {
  const t = T[language];
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return (
      <span className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#0F5132]/25 bg-[#0F5132]/10 px-3.5 py-2 text-xs font-semibold text-[#0F5132] dark:border-[#6EE7B7]/25 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t.pwaInstalledBadge}</span>
      </span>
    );
  }

  const baseClass =
    variant === 'primary'
      ? 'inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#0F5132] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#0B3D25] whitespace-nowrap dark:bg-[#196B45] dark:hover:bg-[#1F8053]'
      : 'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[#DCE1DB] bg-white px-3.5 py-2 text-xs font-semibold text-[#121816] transition-colors hover:bg-[#F3F5F2] whitespace-nowrap dark:border-[#24322B] dark:bg-[#141E19] dark:text-[#ECF1EE] dark:hover:bg-[#1B2621]';

  if (isInstallable) {
    return (
      <button type="button" onClick={install} className={baseClass}>
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t.pwaInstallBtn}</span>
      </button>
    );
  }

  // Fallback for iOS Safari & desktop browsers when beforeinstallprompt hasn't fired yet
  return (
    <>
      <button type="button" onClick={() => setShowGuide(true)} className={baseClass}>
        {isIOS ? (
          <Share className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span>{isIOS ? t.pwaInstallIOSBtn : t.pwaInstallBtn}</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E3E7E2] bg-white p-6 shadow-xl dark:border-[#1E2A24] dark:bg-[#121916]">
            <h3
              id="pwa-install-guide-title"
              className="text-base font-bold text-[#121816] dark:text-[#ECF1EE]"
            >
              {t.pwaIOSModalTitle}
            </h3>
            <div className="mt-3 space-y-2 text-xs sm:text-sm leading-relaxed text-[#47564E] dark:text-[#A3B3AA]">
              {isIOS ? (
                <>
                  <p>{t.pwaIOSStep1}</p>
                  <p>{t.pwaIOSStep2}</p>
                  <p>{t.pwaIOSStep3}</p>
                </>
              ) : (
                <>
                  <p>
                    {language === 'ar'
                      ? '1. افتح قائمة المتصفح (⋮ في Chrome / Edge) في أعلى الشاشة.'
                      : '1. Open your browser menu (⋮ in Chrome or Edge).'}
                  </p>
                  <p>
                    {language === 'ar'
                      ? '2. اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية» (Install / Add to Home Screen).'
                      : '2. Select "Install app" or "Add to Home Screen".'}
                  </p>
                  <p>
                    {language === 'ar'
                      ? '3. سيظهر تطبيق «مواقيت» مع اختصار الودجت مباشرة على شاشتك الرئيسية ويعمل حتى بدون إنترنت.'
                      : '3. Mawaqit and its widget shortcut will appear on your Home Screen and work offline.'}
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 h-10 w-full rounded-xl bg-[#0F5132] text-sm font-semibold text-white hover:bg-[#0B3D25] dark:bg-[#196B45]"
            >
              {t.closeAlert}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator({ language }: { language: Language }) {
  const isOnline = useOnlineStatus();
  const t = T[language];

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 right-4 z-40 mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl bg-[#9A7B3E] px-4 py-2.5 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{t.offlineBanner}</span>
    </div>
  );
}
