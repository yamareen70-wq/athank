import type { AdhanToneId } from '../types/prayer';

export type ToneCategory = 'adhan' | 'tone';

export interface AdhanToneOption {
  id: Exclude<AdhanToneId, 'custom'>;
  category: ToneCategory;
  nameAr: string;
  nameEn: string;
  subtitleAr: string;
  subtitleEn: string;
}

export const ADHAN_TONES: AdhanToneOption[] = [
  // Adhan Calls (أصوات الأذان)
  {
    id: 'makkah_adhan',
    category: 'adhan',
    nameAr: 'أذان الحرم المكي (مقام حجاز)',
    nameEn: 'Makkah Adhan (Hijaz Maqam)',
    subtitleAr: 'نداء أذان مكي مهيب بامتداد صوتي متدرج على مقام الحجاز',
    subtitleEn: 'Majestic Makkah-inspired Adhan phrase in Hijaz maqam',
  },
  {
    id: 'madinah_adhan',
    category: 'adhan',
    nameAr: 'أذان المسجد النبوي (مقام بياتي)',
    nameEn: 'Madinah Adhan (Bayati Maqam)',
    subtitleAr: 'نداء مدني روحاني هادئ بنغمة مقام البياتي الدافئة',
    subtitleEn: 'Serene Madinah-inspired Adhan call in warm Bayati scale',
  },
  {
    id: 'aqsa_adhan',
    category: 'adhan',
    nameAr: 'أذان المسجد الأقصى (مقام صبا)',
    nameEn: 'Al-Aqsa Adhan (Saba Maqam)',
    subtitleAr: 'نداء مقدسي خاشع مستوحى من أذان الأقصى المبارك',
    subtitleEn: 'Reverent Jerusalem-inspired Adhan phrase in Saba mode',
  },
  {
    id: 'egypt_adhan',
    category: 'adhan',
    nameAr: 'الأذان المصري الكلاسيكي (مقام راست)',
    nameEn: 'Classic Egyptian Adhan (Rast)',
    subtitleAr: 'نداء كلاسيكي رصين مستوحى من مدرسة الأذان المصرية',
    subtitleEn: 'Classic resonant Adhan call inspired by Egyptian tradition',
  },
  {
    id: 'hijazi',
    category: 'adhan',
    nameAr: 'نداء حجازي هادئ',
    nameEn: 'Calm Hijazi Call',
    subtitleAr: 'نداء متدرج لطيف على مقام الحجاز لأوقات الصلاة اليومية',
    subtitleEn: 'Gentle melodic Hijaz-scale phrase for daily prayers',
  },

  // Alert Tones (نغمات التنبيه)
  {
    id: 'takbir',
    category: 'tone',
    nameAr: 'تكبيرة قصيرة (الله أكبر)',
    nameEn: 'Short Takbir Tone',
    subtitleAr: 'نغمة تكبير واضحة ومختصرة لبداية وقت الصلاة',
    subtitleEn: 'Crisp, brief Takbir-inspired cadence for prayer start',
  },
  {
    id: 'minaret',
    category: 'tone',
    nameAr: 'رنين المئذنة',
    nameEn: 'Minaret Chime',
    subtitleAr: 'تنبيه هارموني واضح ومتزن لأوقات الصلاة والإقامة',
    subtitleEn: 'Clear harmonic chime for prayer times and Iqamah',
  },
  {
    id: 'fajr_dawn',
    category: 'tone',
    nameAr: 'نغمة الفجر الصافية',
    nameEn: 'Clear Fajr Dawn Chime',
    subtitleAr: 'نغمة صافية متصاعدة مناسبة للاستيقاظ لصلاة الفجر وقيام الليل',
    subtitleEn: 'Pure ascending dawn chime suited for Fajr & Tahajjud',
  },
  {
    id: 'gentle',
    category: 'tone',
    nameAr: 'إشعار لطيف',
    nameEn: 'Gentle Reminder',
    subtitleAr: 'ثلاث نغمات ناعمة غير مزعجة للتنبيه السريع والأذكار',
    subtitleEn: 'Three soft tones for calm, unobtrusive reminders',
  },
];

export const ALL_VALID_TONE_IDS: AdhanToneId[] = [
  ...ADHAN_TONES.map((t) => t.id),
  'custom',
];

interface MelodyStep {
  freq: number;
  duration: number;
  delay: number;
  gain?: number;
}

const MELODIES: Record<Exclude<AdhanToneId, 'custom'>, MelodyStep[]> = {
  // Makkah Hijaz inspired resonant phrase
  makkah_adhan: [
    { freq: 261.63, duration: 0.7, delay: 0.0, gain: 0.24 },
    { freq: 277.18, duration: 0.55, delay: 0.68, gain: 0.25 },
    { freq: 329.63, duration: 0.95, delay: 1.22, gain: 0.28 },
    { freq: 349.23, duration: 1.25, delay: 2.15, gain: 0.3 },
    { freq: 392.0, duration: 0.85, delay: 3.4, gain: 0.27 },
    { freq: 349.23, duration: 0.65, delay: 4.25, gain: 0.25 },
    { freq: 329.63, duration: 0.7, delay: 4.9, gain: 0.24 },
    { freq: 277.18, duration: 0.55, delay: 5.6, gain: 0.22 },
    { freq: 261.63, duration: 1.35, delay: 6.15, gain: 0.25 },
  ],
  // Madinah Bayati inspired serene phrase
  madinah_adhan: [
    { freq: 293.66, duration: 0.8, delay: 0.0, gain: 0.23 },
    { freq: 320.0, duration: 0.6, delay: 0.78, gain: 0.25 },
    { freq: 349.23, duration: 1.0, delay: 1.38, gain: 0.27 },
    { freq: 392.0, duration: 1.2, delay: 2.38, gain: 0.28 },
    { freq: 349.23, duration: 0.75, delay: 3.6, gain: 0.24 },
    { freq: 320.0, duration: 0.65, delay: 4.35, gain: 0.22 },
    { freq: 293.66, duration: 1.3, delay: 5.0, gain: 0.24 },
  ],
  // Al-Aqsa Saba inspired reverent phrase
  aqsa_adhan: [
    { freq: 293.66, duration: 0.75, delay: 0.0, gain: 0.22 },
    { freq: 320.0, duration: 0.7, delay: 0.75, gain: 0.25 },
    { freq: 349.23, duration: 0.9, delay: 1.45, gain: 0.27 },
    { freq: 369.99, duration: 1.15, delay: 2.35, gain: 0.28 },
    { freq: 349.23, duration: 0.85, delay: 3.5, gain: 0.25 },
    { freq: 320.0, duration: 0.75, delay: 4.35, gain: 0.22 },
    { freq: 293.66, duration: 1.3, delay: 5.1, gain: 0.23 },
  ],
  // Classic Egyptian Rast inspired resonant phrase
  egypt_adhan: [
    { freq: 261.63, duration: 0.65, delay: 0.0, gain: 0.24 },
    { freq: 293.66, duration: 0.6, delay: 0.65, gain: 0.25 },
    { freq: 329.63, duration: 0.85, delay: 1.25, gain: 0.27 },
    { freq: 392.0, duration: 1.25, delay: 2.1, gain: 0.3 },
    { freq: 349.23, duration: 0.65, delay: 3.35, gain: 0.26 },
    { freq: 329.63, duration: 0.65, delay: 4.0, gain: 0.24 },
    { freq: 293.66, duration: 0.6, delay: 4.65, gain: 0.22 },
    { freq: 261.63, duration: 1.35, delay: 5.25, gain: 0.25 },
  ],
  // Hijaz maqam inspired ascending/descending serene phrase
  hijazi: [
    { freq: 293.66, duration: 0.75, delay: 0.0, gain: 0.22 },
    { freq: 311.13, duration: 0.55, delay: 0.72, gain: 0.24 },
    { freq: 369.99, duration: 0.9, delay: 1.25, gain: 0.26 },
    { freq: 392.0, duration: 1.15, delay: 2.15, gain: 0.28 },
    { freq: 369.99, duration: 0.65, delay: 3.35, gain: 0.23 },
    { freq: 311.13, duration: 0.6, delay: 4.0, gain: 0.21 },
    { freq: 293.66, duration: 1.25, delay: 4.6, gain: 0.24 },
  ],
  takbir: [
    { freq: 349.23, duration: 0.5, delay: 0.0, gain: 0.25 },
    { freq: 440.0, duration: 0.65, delay: 0.48, gain: 0.27 },
    { freq: 523.25, duration: 0.85, delay: 1.12, gain: 0.28 },
    { freq: 440.0, duration: 0.95, delay: 2.0, gain: 0.23 },
  ],
  minaret: [
    { freq: 440.0, duration: 0.6, delay: 0.0, gain: 0.22 },
    { freq: 554.37, duration: 0.6, delay: 0.55, gain: 0.24 },
    { freq: 659.25, duration: 0.9, delay: 1.1, gain: 0.25 },
    { freq: 440.0, duration: 1.1, delay: 2.05, gain: 0.2 },
  ],
  fajr_dawn: [
    { freq: 392.0, duration: 0.55, delay: 0.0, gain: 0.2 },
    { freq: 493.88, duration: 0.55, delay: 0.5, gain: 0.22 },
    { freq: 587.33, duration: 0.7, delay: 1.0, gain: 0.24 },
    { freq: 783.99, duration: 1.0, delay: 1.7, gain: 0.22 },
    { freq: 587.33, duration: 0.9, delay: 2.75, gain: 0.19 },
  ],
  gentle: [
    { freq: 523.25, duration: 0.45, delay: 0.0, gain: 0.18 },
    { freq: 659.25, duration: 0.5, delay: 0.42, gain: 0.2 },
    { freq: 783.99, duration: 0.85, delay: 0.88, gain: 0.2 },
  ],
};

// --- IndexedDB persistence for user-selected phone audio file ---
const AUDIO_DB_NAME = 'mawaqit_custom_audio_db';
const AUDIO_STORE_NAME = 'custom_tones';
const AUDIO_KEY = 'phone_tone';

interface StoredCustomAudio {
  name: string;
  type: string;
  data: ArrayBuffer;
}

function openAudioDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(AUDIO_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
          db.createObjectStore(AUDIO_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveCustomAudioFile(file: File): Promise<boolean> {
  const db = await openAudioDb();
  if (!db) return false;
  try {
    const buffer = await file.arrayBuffer();
    const record: StoredCustomAudio = {
      name: file.name,
      type: file.type || 'audio/mpeg',
      data: buffer,
    };
    return await new Promise<boolean>((resolve) => {
      const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
      tx.objectStore(AUDIO_STORE_NAME).put(record, AUDIO_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  } catch {
    db.close();
    return false;
  }
}

export async function loadCustomAudioBlob(): Promise<{ blob: Blob; name: string } | null> {
  const db = await openAudioDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(AUDIO_STORE_NAME, 'readonly');
      const req = tx.objectStore(AUDIO_STORE_NAME).get(AUDIO_KEY);
      req.onsuccess = () => {
        const result = req.result as StoredCustomAudio | undefined;
        db.close();
        if (!result || !(result.data instanceof ArrayBuffer)) {
          resolve(null);
          return;
        }
        resolve({
          blob: new Blob([result.data], { type: result.type || 'audio/mpeg' }),
          name: result.name,
        });
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function deleteCustomAudioFile(): Promise<boolean> {
  const db = await openAudioDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
      tx.objectStore(AUDIO_STORE_NAME).delete(AUDIO_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

class AdhanAudioController {
  private ctx: AudioContext | null = null;
  private activeNodes: AudioNode[] = [];
  private stopTimer: number | null = null;
  private activeHtmlAudio: HTMLAudioElement | null = null;
  private activeObjectUrl: string | null = null;
  private playSeq = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public stop(): void {
    this.playSeq += 1;
    if (this.stopTimer !== null) {
      window.clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.pause();
        this.activeHtmlAudio.currentTime = 0;
      } catch {
        // Ignore cleanup errors
      }
      this.activeHtmlAudio = null;
    }
    if (this.activeObjectUrl) {
      try {
        URL.revokeObjectURL(this.activeObjectUrl);
      } catch {
        // Ignore revoke errors
      }
      this.activeObjectUrl = null;
    }
    for (const node of this.activeNodes) {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    }
    this.activeNodes = [];
  }

  private playSynth(tone: Exclude<AdhanToneId, 'custom'>, volume: number, onEnded?: () => void): boolean {
    const ctx = this.ensureContext();
    if (!ctx) {
      onEnded?.();
      return false;
    }

    const masterGain = ctx.createGain();
    const clampedVol = Math.max(0.05, Math.min(1, volume));
    masterGain.gain.setValueAtTime(clampedVol, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.activeNodes.push(masterGain);

    const steps = MELODIES[tone] ?? MELODIES.hijazi;
    let totalDuration = 0;

    for (const step of steps) {
      const startTime = ctx.currentTime + step.delay;
      const endTime = startTime + step.duration;
      totalDuration = Math.max(totalDuration, step.delay + step.duration);

      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const stepGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(step.freq, startTime);

      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(step.freq * 2, startTime);

      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.18, startTime);

      const peak = step.gain ?? 0.22;
      stepGain.gain.setValueAtTime(0.0001, startTime);
      stepGain.gain.exponentialRampToValueAtTime(peak, startTime + 0.08);
      stepGain.gain.exponentialRampToValueAtTime(peak * 0.72, startTime + step.duration * 0.65);
      stepGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc.connect(stepGain);
      overtone.connect(overtoneGain);
      overtoneGain.connect(stepGain);
      stepGain.connect(masterGain);

      osc.start(startTime);
      overtone.start(startTime);
      osc.stop(endTime + 0.05);
      overtone.stop(endTime + 0.05);

      this.activeNodes.push(osc, overtone, overtoneGain, stepGain);
    }

    this.stopTimer = window.setTimeout(() => {
      this.stop();
      onEnded?.();
    }, Math.ceil((totalDuration + 0.15) * 1000));

    return true;
  }

  public play(tone: AdhanToneId, volume: number, onEnded?: () => void): boolean {
    this.stop();
    const seq = this.playSeq;

    if (tone === 'custom') {
      void loadCustomAudioBlob().then((loaded) => {
        if (seq !== this.playSeq) return;
        if (!loaded) {
          this.playSynth('hijazi', volume, onEnded);
          return;
        }
        try {
          const url = URL.createObjectURL(loaded.blob);
          const audio = new Audio(url);
          audio.volume = Math.max(0.05, Math.min(1, volume));
          this.activeHtmlAudio = audio;
          this.activeObjectUrl = url;
          audio.onended = () => {
            if (seq === this.playSeq) {
              this.stop();
              onEnded?.();
            }
          };
          audio.onerror = () => {
            if (seq === this.playSeq) {
              this.stop();
              this.playSynth('hijazi', volume, onEnded);
            }
          };
          const playPromise = audio.play();
          if (playPromise) {
            playPromise.catch(() => {
              if (seq === this.playSeq) {
                this.stop();
                onEnded?.();
              }
            });
          }
        } catch {
          this.playSynth('hijazi', volume, onEnded);
        }
      });
      return true;
    }

    return this.playSynth(tone, volume, onEnded);
  }
}

export const adhanAudio = new AdhanAudioController();

export function sendBrowserNotification(title: string, body: string): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, dir: 'rtl', lang: 'ar' });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
