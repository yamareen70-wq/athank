import { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  Brain,
  CheckCircle2,
  Hand,
  Keyboard,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type {
  AlarmChallengeConfig,
  CustomPrayerAlarm,
  Language,
} from '../types/prayer';
import {
  generateMathProblems,
  generateMemorySequence,
  getTapBurstTarget,
  pickTypingPhrase,
  validateMathAnswer,
  validateTypingAnswer,
} from '../utils/alarmChallenges';
import { T } from '../utils/i18n';

export interface ActiveChallengeSession {
  id: string;
  alarm: CustomPrayerAlarm;
  timeFormatted: string;
  isSimulation?: boolean;
}

interface AlarmChallengeModalProps {
  session: ActiveChallengeSession | null;
  language: Language;
  onSolved: (session: ActiveChallengeSession) => void;
}

export function AlarmChallengeModal({
  session,
  language,
  onSolved,
}: AlarmChallengeModalProps) {
  const t = T[language];
  const challenge: AlarmChallengeConfig = session?.alarm.challenge ?? {
    type: 'math',
    difficulty: 'easy',
    count: 2,
  };

  // Math state
  const mathProblems = useMemo(
    () =>
      session && challenge.type === 'math'
        ? generateMathProblems(challenge.difficulty, challenge.count)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.id, challenge.type, challenge.difficulty, challenge.count]
  );
  const [mathIndex, setMathIndex] = useState(0);
  const [mathInput, setMathInput] = useState('');
  const [mathError, setMathError] = useState(false);

  // Typing state
  const typingTarget = useMemo(
    () => (session && challenge.type === 'typing' ? pickTypingPhrase(language) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.id, challenge.type, language]
  );
  const [typingInput, setTypingInput] = useState('');
  const [typingError, setTypingError] = useState(false);

  // Memory state
  const memorySequence = useMemo(
    () =>
      session && challenge.type === 'memory'
        ? generateMemorySequence(challenge.difficulty)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.id, challenge.type, challenge.difficulty]
  );
  const [memoryPlayStep, setMemoryPlayStep] = useState<number>(-1);
  const [memoryShowing, setMemoryShowing] = useState<boolean>(false);
  const [memoryUserStep, setMemoryUserStep] = useState<number>(0);
  const [memoryError, setMemoryError] = useState<boolean>(false);
  const [memoryReplayNonce, setMemoryReplayNonce] = useState<number>(0);

  // Tap burst state
  const tapTarget = getTapBurstTarget(challenge.difficulty);
  const [tapCount, setTapCount] = useState(0);

  // Reset challenge internal states whenever session changes
  useEffect(() => {
    setMathIndex(0);
    setMathInput('');
    setMathError(false);
    setTypingInput('');
    setTypingError(false);
    setMemoryUserStep(0);
    setMemoryError(false);
    setTapCount(0);
    setMemoryReplayNonce((n) => n + 1);
  }, [session?.id]);

  // Animate memory sequence playback
  useEffect(() => {
    if (!session || challenge.type !== 'memory' || memorySequence.length === 0) return;
    setMemoryShowing(true);
    setMemoryUserStep(0);
    setMemoryPlayStep(-1);

    const timers: number[] = [];
    memorySequence.forEach((tileIdx, i) => {
      timers.push(
        window.setTimeout(() => {
          setMemoryPlayStep(tileIdx);
        }, 450 + i * 650)
      );
      timers.push(
        window.setTimeout(() => {
          setMemoryPlayStep(-1);
        }, 900 + i * 650)
      );
    });
    timers.push(
      window.setTimeout(() => {
        setMemoryShowing(false);
        setMemoryPlayStep(-1);
      }, 600 + memorySequence.length * 650)
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [session, challenge.type, memorySequence, memoryReplayNonce]);

  if (!session) return null;

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const current = mathProblems[mathIndex];
    if (!current) return;
    if (validateMathAnswer(mathInput, current.answer)) {
      setMathError(false);
      setMathInput('');
      if (mathIndex + 1 >= mathProblems.length) {
        onSolved(session);
      } else {
        setMathIndex((i) => i + 1);
      }
    } else {
      setMathError(true);
    }
  };

  const handleTypingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateTypingAnswer(typingInput, typingTarget)) {
      setTypingError(false);
      onSolved(session);
    } else {
      setTypingError(true);
    }
  };

  const handleMemoryTileClick = (tileIdx: number) => {
    if (memoryShowing) return;
    if (memorySequence[memoryUserStep] === tileIdx) {
      setMemoryError(false);
      const nextStep = memoryUserStep + 1;
      if (nextStep >= memorySequence.length) {
        onSolved(session);
      } else {
        setMemoryUserStep(nextStep);
      }
    } else {
      setMemoryError(true);
      setMemoryUserStep(0);
      setMemoryReplayNonce((n) => n + 1);
    }
  };

  const handleTapClick = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= tapTarget) {
      onSolved(session);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-challenge-title"
      data-testid="alarm-challenge-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06120D]/90 p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-md rounded-3xl border border-[#D9B872]/40 bg-white p-6 sm:p-7 shadow-2xl space-y-5 dark:border-[#D9B872]/30 dark:bg-[#121916]">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F5132]/12 text-[#0F5132] dark:bg-[#6EE7B7]/15 dark:text-[#6EE7B7]">
            <BellRing className="h-6 w-6 animate-bounce" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold text-[#9A7B3E] dark:text-[#D9B872]">
            {t.challengeModalTitle}
          </p>
          <h2
            id="alarm-challenge-title"
            className="text-xl font-bold text-[#121816] dark:text-[#ECF1EE]"
          >
            {session.alarm.title}
          </h2>
          <p dir="ltr" className="font-mono text-sm font-semibold tabular-nums text-[#5A6960] dark:text-[#8E9F95]">
            {session.timeFormatted}
          </p>
        </div>

        {/* Challenge Body: MATH */}
        {challenge.type === 'math' && mathProblems[mathIndex] && (
          <form onSubmit={handleMathSubmit} className="space-y-4">
            <div className="rounded-2xl border border-[#E3E7E2] bg-[#F8F9F7] p-5 text-center dark:border-[#24322B] dark:bg-[#0D1310]">
              <p className="text-xs font-medium text-[#5A6960] dark:text-[#8E9F95]">
                {t.challengeMathPrompt(mathIndex + 1, mathProblems.length)}
              </p>
              <p
                dir="ltr"
                data-testid="math-challenge-expression"
                className="mt-2 font-mono text-3xl font-bold tracking-wider tabular-nums text-[#0F5132] dark:text-[#6EE7B7]"
              >
                {mathProblems[mathIndex].expression} = ?
              </p>
            </div>

            <div>
              <label htmlFor="challenge-math-input" className="sr-only">
                {t.challengeMathInputPlaceholder}
              </label>
              <input
                id="challenge-math-input"
                data-testid="math-challenge-input"
                type="text"
                inputMode="numeric"
                autoFocus
                value={mathInput}
                onChange={(e) => {
                  setMathInput(e.target.value);
                  setMathError(false);
                }}
                placeholder={t.challengeMathInputPlaceholder}
                className="h-12 w-full rounded-xl border border-[#DCE1DB] bg-white px-4 text-center font-mono text-lg font-bold tabular-nums text-[#121816] focus:border-[#0F5132] focus:outline-none focus:ring-2 focus:ring-[#0F5132]/20 dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
              />
            </div>

            {mathError && (
              <p role="alert" className="text-center text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                {t.challengeWrongAnswer}
              </p>
            )}

            <button
              type="submit"
              data-testid="challenge-submit-btn"
              className="h-12 w-full rounded-xl bg-[#0F5132] text-sm font-semibold text-white transition-colors hover:bg-[#0B3D25] dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
            >
              {t.challengeSubmitAnswer}
            </button>
          </form>
        )}

        {/* Challenge Body: TYPING */}
        {challenge.type === 'typing' && (
          <form onSubmit={handleTypingSubmit} className="space-y-4">
            <div className="rounded-2xl border border-[#E3E7E2] bg-[#F8F9F7] p-4 space-y-2 dark:border-[#24322B] dark:bg-[#0D1310]">
              <p className="flex items-center gap-1.5 text-xs font-medium text-[#5A6960] dark:text-[#8E9F95]">
                <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.challengeTypingPrompt}</span>
              </p>
              <p
                data-testid="typing-challenge-target"
                className="select-none text-base font-bold text-[#0F5132] dark:text-[#6EE7B7]"
              >
                {typingTarget}
              </p>
            </div>

            <input
              data-testid="typing-challenge-input"
              type="text"
              autoFocus
              value={typingInput}
              onChange={(e) => {
                setTypingInput(e.target.value);
                setTypingError(false);
              }}
              placeholder={t.challengeTypingPlaceholder}
              className="h-12 w-full rounded-xl border border-[#DCE1DB] bg-white px-4 text-sm font-medium text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#24322B] dark:bg-[#141D19] dark:text-[#ECF1EE]"
            />

            {typingError && (
              <p role="alert" className="text-center text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                {t.challengeWrongAnswer}
              </p>
            )}

            <button
              type="submit"
              data-testid="challenge-submit-btn"
              className="h-12 w-full rounded-xl bg-[#0F5132] text-sm font-semibold text-white hover:bg-[#0B3D25] dark:bg-[#196B45]"
            >
              {t.challengeSubmitAnswer}
            </button>
          </form>
        )}

        {/* Challenge Body: MEMORY GRID */}
        {challenge.type === 'memory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-medium text-[#5A6960] dark:text-[#8E9F95]">
              <span className="flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
                {memoryShowing
                  ? t.challengeMemoryWatch
                  : t.challengeMemoryRepeat(memoryUserStep, memorySequence.length)}
              </span>
              {!memoryShowing && (
                <button
                  type="button"
                  onClick={() => setMemoryReplayNonce((n) => n + 1)}
                  className="inline-flex items-center gap-1 text-[#0F5132] hover:underline dark:text-[#6EE7B7]"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  <span>{t.challengeMemoryReplay}</span>
                </button>
              )}
            </div>

            <div className="mx-auto grid max-w-[230px] grid-cols-3 gap-2.5">
              {Array.from({ length: 9 }).map((_, idx) => {
                const isLit = memoryPlayStep === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={memoryShowing}
                    onClick={() => handleMemoryTileClick(idx)}
                    aria-label={`Tile ${idx + 1}`}
                    className={`h-16 rounded-2xl border-2 font-mono text-sm font-bold transition-all ${
                      isLit
                        ? 'scale-95 border-[#D9B872] bg-[#0F5132] text-white shadow-lg dark:bg-[#6EE7B7] dark:text-[#06120D]'
                        : 'border-[#DCE1DB] bg-[#F8F9F7] text-[#5A6960] hover:border-[#0F5132] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#8E9F95] dark:hover:border-[#6EE7B7]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {memoryError && (
              <p role="alert" className="text-center text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                {t.challengeMemoryWrong}
              </p>
            )}
          </div>
        )}

        {/* Challenge Body: TAP BURST */}
        {challenge.type === 'tap_burst' && (
          <div className="space-y-4 text-center">
            <p className="text-sm font-medium text-[#5A6960] dark:text-[#9AA9A1]">
              {t.challengeTapPrompt(Math.max(0, tapTarget - tapCount))}
            </p>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E8ECE7] dark:bg-[#1E2A24]">
              <div
                className="h-full rounded-full bg-[#0F5132] transition-[width] duration-100 dark:bg-[#6EE7B7]"
                style={{ width: `${Math.min(100, (tapCount / tapTarget) * 100)}%` }}
              />
            </div>
            <button
              type="button"
              data-testid="tap-burst-btn"
              onClick={handleTapClick}
              className="mx-auto flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-full bg-[#0F5132] text-white shadow-lg active:scale-95 transition-transform hover:bg-[#0B3D25] dark:bg-[#196B45]"
            >
              <Hand className="h-7 w-7" aria-hidden="true" />
              <span className="text-xs font-bold">{t.challengeTapBtn}</span>
              <span className="font-mono text-xs tabular-nums opacity-85">
                {tapCount}/{tapTarget}
              </span>
            </button>
          </div>
        )}

        {session.alarm.wakeUpCheckEnabled && (
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#9A7B3E] dark:text-[#D9B872]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.wakeUpCheckBadge(session.alarm.wakeUpCheckDelayMinutes ?? 5)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

interface WakeUpCheckModalProps {
  alarm: CustomPrayerAlarm | null;
  remainingSeconds: number;
  language: Language;
  onConfirmAwake: () => void;
}

export function WakeUpCheckModal({
  alarm,
  remainingSeconds,
  language,
  onConfirmAwake,
}: WakeUpCheckModalProps) {
  if (!alarm) return null;
  const t = T[language];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wakeup-check-title"
      data-testid="wakeup-check-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06120D]/85 p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-sm rounded-3xl border border-[#6EE7B7]/40 bg-white p-6 text-center shadow-2xl space-y-5 dark:border-[#6EE7B7]/30 dark:bg-[#121916]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9A7B3E]/15 text-[#9A7B3E] dark:bg-[#D9B872]/15 dark:text-[#D9B872]">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#0F5132] dark:text-[#6EE7B7]">
            {t.wakeUpModalTitle} · {alarm.title}
          </p>
          <h2
            id="wakeup-check-title"
            className="text-2xl font-bold text-[#121816] dark:text-[#ECF1EE]"
          >
            {t.wakeUpModalQuestion}
          </h2>
          <p className="text-xs leading-relaxed text-[#5A6960] dark:text-[#8E9F95]">
            {t.wakeUpModalHint}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F8F9F7] py-3 dark:bg-[#0D1310]">
          <span
            dir="ltr"
            data-testid="wakeup-check-countdown"
            className="font-mono text-3xl font-bold tabular-nums text-[#B91C1C] dark:text-[#FCA5A5]"
          >
            00:{String(Math.max(0, remainingSeconds)).padStart(2, '0')}
          </span>
        </div>

        <button
          type="button"
          data-testid="wakeup-confirm-awake-btn"
          onClick={onConfirmAwake}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F5132] text-sm font-semibold text-white transition-colors hover:bg-[#0B3D25] dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
        >
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <span>{t.wakeUpConfirmBtn}</span>
        </button>
      </div>
    </div>
  );
}
