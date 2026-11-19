import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatStopwatchMs,
  formatTimerHMS,
  generateMathProblems,
  generateMemorySequence,
  getTapBurstTarget,
  normalizeChallengeText,
  pickTypingPhrase,
  validateMathAnswer,
  validateTypingAnswer,
} from './alarmChallenges';

test('generateMathProblems generates exact count and mathematically correct answers across difficulties', () => {
  const fixedRng = () => 0.42;
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const problems = generateMathProblems(difficulty, 3, fixedRng);
    assert.equal(problems.length, 3);
    for (const p of problems) {
      assert.ok(p.expression.length > 0);
      assert.ok(Number.isFinite(p.answer));
      assert.equal(validateMathAnswer(String(p.answer), p.answer), true);
    }
  }

  // Clamps count to 1..5
  assert.equal(generateMathProblems('easy', 0, fixedRng).length, 1);
  assert.equal(generateMathProblems('easy', 99, fixedRng).length, 5);
});

test('validateMathAnswer accepts Western and Arabic-Indic digits and rejects invalid strings', () => {
  assert.equal(validateMathAnswer('42', 42), true);
  assert.equal(validateMathAnswer('  ٤٢  ', 42), true);
  assert.equal(validateMathAnswer('١٠٥', 105), true);
  assert.equal(validateMathAnswer('41', 42), false);
  assert.equal(validateMathAnswer('abc', 42), false);
  assert.equal(validateMathAnswer('', 42), false);
});

test('validateTypingAnswer normalizes Arabic diacritics, hamzas, and whitespace', () => {
  const arTarget = 'أصبحنا وأصبح الملك لله';
  assert.equal(validateTypingAnswer('اصبحنا واصبح الملك لله', arTarget), true);
  assert.equal(validateTypingAnswer('  أَصْبَحْنَا   وَأَصْبَحَ الْمُلْكُ لِلَّهِ ', arTarget), true);
  assert.equal(validateTypingAnswer('صباح الخير', arTarget), false);

  const enTarget = pickTypingPhrase('en', () => 0);
  assert.equal(validateTypingAnswer(enTarget.toUpperCase(), enTarget), true);
  assert.equal(normalizeChallengeText('  HELLO   World '), 'hello world');
});

test('generateMemorySequence avoids consecutive duplicates and scales by difficulty', () => {
  const easy = generateMemorySequence('easy', () => 0.5);
  const medium = generateMemorySequence('medium', () => 0.5);
  const hard = generateMemorySequence('hard', () => 0.5);

  assert.equal(easy.length, 4);
  assert.equal(medium.length, 5);
  assert.equal(hard.length, 6);

  for (const seq of [easy, medium, hard]) {
    for (let i = 0; i < seq.length; i++) {
      assert.ok(seq[i] >= 0 && seq[i] <= 8);
      if (i > 0) {
        assert.notEqual(seq[i], seq[i - 1]);
      }
    }
  }
});

test('getTapBurstTarget scales monotonically across difficulties', () => {
  assert.ok(getTapBurstTarget('easy') < getTapBurstTarget('medium'));
  assert.ok(getTapBurstTarget('medium') < getTapBurstTarget('hard'));
});

test('formatTimerHMS and formatStopwatchMs format times accurately', () => {
  assert.equal(formatTimerHMS(0), '00:00:00');
  assert.equal(formatTimerHMS(65), '00:01:05');
  assert.equal(formatTimerHMS(3661), '01:01:01');
  assert.equal(formatTimerHMS(-10), '00:00:00');

  assert.equal(formatStopwatchMs(0), '00:00.00');
  assert.equal(formatStopwatchMs(12540), '00:12.54');
  assert.equal(formatStopwatchMs(3_661_230), '01:01:01.23');
});
