import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import type { AppSettings } from '../types/prayer';
import { sanitizeSettings } from './storage';

export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'] as const;
export const BACKUP_FILE_NAME = 'mawaqit-settings-backup.json';

export interface DriveBackupMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export interface DriveSyncEnvelope {
  schemaVersion: 1;
  app: 'mawaqit';
  syncedAt: string;
  settings: AppSettings;
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// In-memory access token cache ONLY (never stored in localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

function ensureAuth(): { auth: Auth; provider: GoogleAuthProvider } {
  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  if (!firebaseAuth) {
    firebaseAuth = getAuth(firebaseApp);
  }
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
    for (const scope of DRIVE_SCOPES) {
      googleProvider.addScope(scope);
    }
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  }
  return { auth: firebaseAuth, provider: googleProvider };
}

/**
 * Subscribe to Firebase Auth state changes.
 * Clears cached in-memory token whenever user signs out or session lacks a fresh token.
 */
export function initDriveAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthSignedOut?: (user: User | null) => void
): () => void {
  try {
    const { auth } = ensureAuth();
    return onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          onAuthSuccess?.(user, cachedAccessToken);
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          onAuthSignedOut?.(user);
        }
      } else {
        cachedAccessToken = null;
        onAuthSignedOut?.(null);
      }
    });
  } catch {
    return () => {};
  }
}

/**
 * Must be invoked directly from a button click / user interaction.
 */
export async function signInWithGoogleDrive(): Promise<{
  user: User;
  accessToken: string;
}> {
  const { auth, provider } = ensureAuth();
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Google Drive access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export function getCachedDriveToken(): string | null {
  return cachedAccessToken;
}

export async function signOutGoogleDrive(): Promise<void> {
  cachedAccessToken = null;
  try {
    const { auth } = ensureAuth();
    await auth.signOut();
  } catch {
    // Safe fallback
  }
}

async function driveFetch(
  url: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('AUTH_EXPIRED');
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`Drive API error (${res.status}): ${bodyText || res.statusText}`);
  }
  return res;
}

/**
 * Looks up the app's existing backup file in Google Drive (created by this app).
 */
export async function getDriveBackupMetadata(
  accessToken: string
): Promise<DriveBackupMetadata | null> {
  const query = encodeURIComponent(
    `name = '${BACKUP_FILE_NAME}' and trashed = false`
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=1`;
  const res = await driveFetch(url, accessToken);
  const data = (await res.json()) as { files?: DriveBackupMetadata[] };
  return data.files && data.files.length > 0 ? data.files[0] : null;
}

/**
 * Creates or updates the settings backup JSON file in Google Drive.
 * Caller MUST confirm with the user before overwriting an existing backup file.
 */
export async function uploadSettingsToDrive(
  accessToken: string,
  settings: AppSettings,
  existingFileId?: string | null
): Promise<DriveBackupMetadata> {
  const envelope: DriveSyncEnvelope = {
    schemaVersion: 1,
    app: 'mawaqit',
    syncedAt: new Date().toISOString(),
    settings,
  };
  const jsonContent = JSON.stringify(envelope, null, 2);

  if (existingFileId) {
    const url = `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
      existingFileId
    )}?uploadType=media&fields=id,name,modifiedTime,size`;
    const res = await driveFetch(url, accessToken, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: jsonContent,
    });
    return (await res.json()) as DriveBackupMetadata;
  }

  const boundary = `mawaqit_sync_${Date.now()}`;
  const metadata = {
    name: BACKUP_FILE_NAME,
    mimeType: 'application/json',
    description: 'Mawaqit prayer times, alarms, calendar and Wear OS preferences backup',
  };
  const multipartBody = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    jsonContent,
    `--${boundary}--`,
  ].join('\r\n');

  const url =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size';
  const res = await driveFetch(url, accessToken, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });
  return (await res.json()) as DriveBackupMetadata;
}

/**
 * Downloads and sanitizes the settings backup from Google Drive.
 */
export async function downloadSettingsFromDrive(
  accessToken: string,
  fileId: string
): Promise<{ settings: AppSettings; syncedAt: string | null }> {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
    fileId
  )}?alt=media`;
  const res = await driveFetch(url, accessToken);
  const parsed = (await res.json()) as Partial<DriveSyncEnvelope> | Partial<AppSettings>;

  if (parsed && typeof parsed === 'object' && 'settings' in parsed && parsed.settings) {
    return {
      settings: sanitizeSettings(parsed.settings),
      syncedAt: typeof parsed.syncedAt === 'string' ? parsed.syncedAt : null,
    };
  }
  return {
    settings: sanitizeSettings(parsed as Partial<AppSettings>),
    syncedAt: null,
  };
}

/**
 * Deletes the app backup file from Google Drive.
 * Caller MUST show an explicit confirmation dialog first.
 */
export async function deleteDriveBackup(
  accessToken: string,
  fileId: string
): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`;
  await driveFetch(url, accessToken, { method: 'DELETE' });
}
