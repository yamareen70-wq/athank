import type {
  AlarmChallengeConfig,
  AlarmChallengeDifficulty,
  Language,
} from '../types/prayer';

export interface MathChallengeProblem {
  expression: string;
  answer: number;
}

export const DEFAULT_ALARM_CHALLENGE: AlarmChallengeConfig = {
  type: 'none',
  difficulty: 'easy',
  count: 2,
};

const TYPING_PHRASES_AR = [
  'أصبحنا وأصبح الملك لله',
  'الحمد لله الذي أحيانا بعد ما أماتنا',
  'لا إله إلا الله وحده لا شريك له',
  'سبحان الله وبحمده سبحان الله العظيم',
  'اللهم بك أصبحنا وبك أمسينا',
];

const TYPING_PHRASES_EN = [
  'I am awake and ready for prayer',
  'Praise be to Allah who gave us life',
  'Start this blessed day with remembrance',
  'Rise and shine with gratitude today',
  'Good morning I am fully awake now',
];

/**
 * Generates deterministic or randomized math problems for heavy-sleeper alarm dismissal.
 */
export function generateMathProblems(
  difficulty: AlarmChallengeDifficulty,
  count: number,
  rng: () => number = Math.random
): MathChallengeProblem[] {
  const safeCount = Math.max(1, Math.min(5, Math.round(count)));
  const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
  const problems: MathChallengeProblem[] = [];

  for (let i = 0; i < safeCount; i++) {
    if (difficulty === 'easy') {
      const a = randInt(4, 19);
      const b = randInt(3, 18);
      const isAdd = rng() >= 0.35;
      if (isAdd) {
        problems.push({ expression: `${a} + ${b}`, answer: a + b });
      } else {
        const hi = Math.max(a, b);
        const lo = Math.min(a, b);
        problems.push({ expression: `${hi} - ${lo}`, answer: hi - lo });
      }
    } else if (difficulty === 'medium') {
      const op = rng();
      if (op < 0.5) {
        const a = randInt(14, 48);
        const b = randInt(12, 39);
        problems.push({ expression: `${a} + ${b}`, answer: a + b });
      } else {
        const a = randInt(4, 12);
        const b = randInt(3, 9);
        const c = randInt(2, 15);
        problems.push({ expression: `${a} × ${b} + ${c}`, answer: a * b + c });
      }
    } else {
      const a = randInt(7, 16);
      const b = randInt(6, 14);
      const c = randInt(11, 35);
      const isAdd = rng() >= 0.4;
      if (isAdd) {
        problems.push({ expression: `${a} × ${b} + ${c}`, answer: a * b + c });
      } else {
        const product = a * b;
        const sub = Math.min(c, product - 5);
        problems.push({ expression: `${a} × ${b} - ${sub}`, answer: product - sub });
      }
    }
  }

  return problems;
}

export function validateMathAnswer(input: string, expected: number): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  // Normalize Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) to Western digits
  const normalized = trimmed.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  if (!/^-?\d+$/.test(normalized)) return false;
  return Number(normalized) === expected;
}

export function pickTypingPhrase(lang: Language, rng: () => number = Math.random): string {
  const list = lang === 'ar' ? TYPING_PHRASES_AR : TYPING_PHRASES_EN;
  const idx = Math.floor(rng() * list.length) % list.length;
  return list[idx];
}

export function normalizeChallengeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // strip Arabic diacritics
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

export function validateTypingAnswer(input: string, target: string): boolean {
  if (!input.trim()) return false;
  return normalizeChallengeText(input) === normalizeChallengeText(target);
}

/**
 * Generates a memory tile sequence on a 3x3 grid (indices 0..8).
 */
export function generateMemorySequence(
  difficulty: AlarmChallengeDifficulty,
  rng: () => number = Math.random
): number[] {
  const length = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    let next = Math.floor(rng() * 9);
    if (i > 0 && next === seq[i - 1]) {
      next = (next + 1) % 9;
    }
    seq.push(next);
  }
  return seq;
}

export function getTapBurstTarget(difficulty: AlarmChallengeDifficulty): number {
  if (difficulty === 'easy') return 15;
  if (difficulty === 'medium') return 25;
  return 40;
}

/**
 * Formats remaining countdown seconds as HH:MM:SS for the Timer view.
 */
export function formatTimerHMS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Formats elapsed milliseconds as MM:SS.cc (or HH:MM:SS.cc if >= 1 hour) for the Stopwatch view.
 */
export function formatStopwatchMs(elapsedMs: number): string {
  const safe = Math.max(0, Math.floor(elapsedMs));
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor((safe % 3_600_000) / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  const centis = Math.floor((safe % 1000) / 10);

  const core = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(
    centis
  ).padStart(2, '0')}`;
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${core}` : core;
}
