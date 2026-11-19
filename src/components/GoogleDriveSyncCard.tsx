import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudDownload,
  CloudUpload,
  LogOut,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { AppSettings, Language } from '../types/prayer';
import { T } from '../utils/i18n';
import {
  deleteDriveBackup,
  downloadSettingsFromDrive,
  getCachedDriveToken,
  getDriveBackupMetadata,
  initDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  uploadSettingsToDrive,
  type DriveBackupMetadata,
} from '../utils/googleDriveSync';

type PendingConfirmAction = 'overwrite' | 'restore' | 'delete' | null;

interface GoogleDriveSyncCardProps {
  settings: AppSettings;
  language: Language;
  onRestoreSettings: (restored: AppSettings) => void;
}

export function GoogleDriveSyncCard({
  settings,
  language,
  onRestoreSettings,
}: GoogleDriveSyncCardProps) {
  const t = T[language];
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getCachedDriveToken());
  const [backupMeta, setBackupMeta] = useState<DriveBackupMetadata | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction>(null);

  const fetchMetadata = async (token: string) => {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      const meta = await getDriveBackupMetadata(token);
      setBackupMeta(meta);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'AUTH_EXPIRED') {
        setAccessToken(null);
        setErrorMessage(t.driveAuthExpired);
      } else {
        setErrorMessage(msg || 'Drive error');
      }
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
      },
      (signedOutUser) => {
        setUser(signedOutUser);
        setAccessToken(null);
        setBackupMeta(null);
      }
    );
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const result = await signInWithGoogleDrive();
      setUser(result.user);
      setAccessToken(result.accessToken);
      await fetchMetadata(result.accessToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMessage(
          language === 'ar'
            ? 'تعذّر تسجيل الدخول بحساب Google حالياً. يرجى المحاولة مجدداً.'
            : 'Unable to sign in with Google right now. Please try again.'
        );
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogleDrive();
    setUser(null);
    setAccessToken(null);
    setBackupMeta(null);
    setStatusMessage(null);
    setErrorMessage(null);
    setPendingConfirm(null);
  };

  const executeUpload = async () => {
    if (!accessToken) {
      setErrorMessage(t.driveAuthExpired);
      return;
    }
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const savedMeta = await uploadSettingsToDrive(accessToken, settings, backupMeta?.id);
      setBackupMeta(savedMeta);
      setStatusMessage(t.driveSyncSuccess);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'AUTH_EXPIRED') {
        setAccessToken(null);
        setErrorMessage(t.driveAuthExpired);
      } else {
        setErrorMessage(msg || 'Sync failed');
      }
    } finally {
      setIsBusy(false);
      setPendingConfirm(null);
    }
  };

  const handleRequestUpload = () => {
    if (backupMeta) {
      // Mandatory explicit confirmation before overwriting existing Google Drive file
      setPendingConfirm('overwrite');
    } else {
      void executeUpload();
    }
  };

  const executeRestore = async () => {
    if (!accessToken || !backupMeta) return;
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const { settings: restored } = await downloadSettingsFromDrive(accessToken, backupMeta.id);
      onRestoreSettings(restored);
      setStatusMessage(t.driveRestoreSuccess);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'AUTH_EXPIRED') {
        setAccessToken(null);
        setErrorMessage(t.driveAuthExpired);
      } else {
        setErrorMessage(msg || 'Restore failed');
      }
    } finally {
      setIsBusy(false);
      setPendingConfirm(null);
    }
  };

  const executeDelete = async () => {
    if (!accessToken || !backupMeta) return;
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await deleteDriveBackup(accessToken, backupMeta.id);
      setBackupMeta(null);
      setStatusMessage(t.driveDeleteSuccess);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'AUTH_EXPIRED') {
        setAccessToken(null);
        setErrorMessage(t.driveAuthExpired);
      } else {
        setErrorMessage(msg || 'Delete failed');
      }
    } finally {
      setIsBusy(false);
      setPendingConfirm(null);
    }
  };

  const formattedModified = backupMeta?.modifiedTime
    ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(backupMeta.modifiedTime))
    : null;

  return (
    <section
      data-testid="google-drive-sync-section"
      className="rounded-2xl border border-[#E3E7E2] bg-white p-6 sm:p-8 space-y-5 dark:border-[#1E2A24] dark:bg-[#121916]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#121816] dark:text-[#ECF1EE]">
            <Cloud className="h-5 w-5 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
            <span>{t.driveSyncTitle}</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#5A6960] dark:text-[#8E9F95]">
            {t.driveSyncSubtitle}
          </p>
        </div>

        {accessToken && user && (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#DCE1DB] px-3 text-xs font-medium text-[#526058] hover:bg-[#F3F5F2] whitespace-nowrap dark:border-[#24322B] dark:text-[#98A89F] dark:hover:bg-[#1B2520]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.driveSignOutBtn}</span>
          </button>
        )}
      </div>

      {!accessToken ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-[#E8ECE7] bg-[#F8FAF8] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#223029] dark:bg-[#0E1512]">
          <p className="text-xs leading-relaxed text-[#526058] dark:text-[#9AA9A1]">
            {language === 'ar'
              ? 'سجّل الدخول بحساب Google الخاص بك لحفظ نسخة احتياطية من مواقيتك ومنبهاتك ومهامك في Google Drive.'
              : 'Sign in with your Google account to save and restore your prayer settings, alarms, and tasks via Google Drive.'}
          </p>
          {/* Official-style Sign in with Google button */}
          <button
            type="button"
            data-testid="google-drive-signin-btn"
            disabled={isSigningIn}
            onClick={() => void handleSignIn()}
            className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-3 rounded-lg border border-[#747775] bg-white px-4 py-2 text-sm font-medium text-[#1F1F1F] shadow-xs transition-colors hover:bg-[#F7F8F8] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] whitespace-nowrap dark:border-[#8E918F] dark:bg-[#131314] dark:text-[#E3E3E3] dark:hover:bg-[#1F2022]"
          >
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            <span>{isSigningIn ? t.driveSigningIn : t.driveSignInBtn}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Account & Backup Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8ECE7] bg-[#F8FAF8] px-4 py-3 dark:border-[#223029] dark:bg-[#0E1512]">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs text-[#5A6960] dark:text-[#8E9F95]">
                {t.driveConnectedAs}{' '}
                <span className="font-semibold text-[#121816] dark:text-[#ECF1EE]">
                  {user?.email || user?.displayName}
                </span>
              </p>
              <p className="text-xs text-[#64746B] dark:text-[#8E9F95]">
                {formattedModified ? (
                  <>
                    {t.driveLastBackup}{' '}
                    <span className="font-semibold text-[#0F5132] dark:text-[#6EE7B7]">
                      {formattedModified}
                    </span>
                  </>
                ) : (
                  t.driveNoBackupYet
                )}
              </p>
            </div>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => void fetchMetadata(accessToken)}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[#DCE1DB] bg-white px-3 text-xs font-medium text-[#35443C] hover:bg-[#F3F5F2] disabled:opacity-50 dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#C5D1CA]"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isBusy ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{t.driveRefreshBtn}</span>
            </button>
          </div>

          {/* Sync Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isBusy}
              onClick={handleRequestUpload}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0F5132] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#0B3D25] disabled:opacity-50 dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
            >
              <CloudUpload className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.driveUploadBtn}</span>
            </button>

            <button
              type="button"
              disabled={isBusy || !backupMeta}
              onClick={() => setPendingConfirm('restore')}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#0F5132]/30 bg-[#0F5132]/8 px-4 py-2 text-xs sm:text-sm font-semibold text-[#0F5132] hover:bg-[#0F5132]/15 disabled:opacity-45 dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]"
            >
              <CloudDownload className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.driveRestoreBtn}</span>
            </button>

            {backupMeta && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setPendingConfirm('delete')}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#B91C1C]/25 bg-[#FEF2F2] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#991B1B] hover:bg-[#FEE2E2] disabled:opacity-50 dark:border-[#FCA5A5]/25 dark:bg-[#3B1818] dark:text-[#FCA5A5]"
              >
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t.driveDeleteBtn}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {statusMessage && (
        <p
          role="status"
          className="flex items-center gap-2 text-xs font-semibold text-[#0F5132] dark:text-[#6EE7B7]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{statusMessage}</span>
        </p>
      )}

      {errorMessage && (
        <p role="alert" className="text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
          {errorMessage}
        </p>
      )}

      {/* Mandatory Explicit User Confirmation Modal for Overwrite / Restore / Delete */}
      {pendingConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drive-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isBusy) setPendingConfirm(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#DCE1DB] bg-white p-6 shadow-xl space-y-4 dark:border-[#24322B] dark:bg-[#121916]">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  pendingConfirm === 'delete'
                    ? 'text-[#B91C1C] dark:text-[#FCA5A5]'
                    : 'text-[#9A7B3E] dark:text-[#D9B872]'
                }`}
                aria-hidden="true"
              />
              <div>
                <h3
                  id="drive-confirm-title"
                  className="text-base font-bold text-[#121816] dark:text-[#ECF1EE]"
                >
                  {pendingConfirm === 'overwrite'
                    ? t.driveConfirmOverwriteTitle
                    : pendingConfirm === 'restore'
                      ? t.driveConfirmRestoreTitle
                      : t.driveConfirmDeleteTitle}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#5A6960] dark:text-[#9AA9A1]">
                  {pendingConfirm === 'overwrite'
                    ? t.driveConfirmOverwriteDesc
                    : pendingConfirm === 'restore'
                      ? t.driveConfirmRestoreDesc
                      : t.driveConfirmDeleteDesc}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setPendingConfirm(null)}
                className="min-h-[40px] rounded-xl border border-[#DCE1DB] px-4 text-sm font-medium text-[#526058] hover:bg-[#F3F5F2] dark:border-[#24322B] dark:text-[#98A89F] dark:hover:bg-[#1B2520]"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  if (pendingConfirm === 'overwrite') void executeUpload();
                  else if (pendingConfirm === 'restore') void executeRestore();
                  else if (pendingConfirm === 'delete') void executeDelete();
                }}
                className={`min-h-[40px] rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50 ${
                  pendingConfirm === 'delete'
                    ? 'bg-[#B91C1C] hover:bg-[#991B1B]'
                    : 'bg-[#0F5132] hover:bg-[#0B3D25] dark:bg-[#196B45] dark:hover:bg-[#1E7E52]'
                }`}
              >
                {t.confirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
