import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHijriMonthGrid,
  getHijriMonthLength,
  getLeadingEmptyCells,
  getNextRamadanYear,
  getOccasionForHijriDate,
  getOrderedWeekdayIndices,
  getUpcomingIslamicOccasions,
  gregorianToHijri,
  hijriToGregorian,
  isRamadanLastTenOddNight,
  shiftHijriMonth,
} from './hijriCalendar';

test('gregorianToHijri and hijriToGregorian round-trip cleanly', () => {
  const sampleDates = [
    { year: 2026, month: 11, day: 19 },
    { year: 2026, month: 2, day: 18 },
    { year: 2025, month: 3, day: 30 },
    { year: 2027, month: 1, day: 1 },
  ];

  for (const g of sampleDates) {
    const h = gregorianToHijri(g.year, g.month, g.day, 0);
    assert.ok(h.year >= 1446 && h.year <= 1449);
    assert.ok(h.month >= 1 && h.month <= 12);
    assert.ok(h.day >= 1 && h.day <= 30);

    const roundTrip = hijriToGregorian(h.year, h.month, h.day, 0);
    assert.deepEqual(roundTrip, g);
  }
});

test('hijriAdjustment shifts the Hijri date by the exact day offset', () => {
  const base = gregorianToHijri(2026, 11, 19, 0);
  const plus1 = gregorianToHijri(2026, 11, 19, 1);
  const minus1 = gregorianToHijri(2026, 11, 19, -1);

  assert.equal(plus1.day - base.day, 1);
  assert.equal(base.day - minus1.day, 1);
});

test('buildHijriMonthGrid produces 29 or 30 sequential days with occasions', () => {
  const ramadanLength = getHijriMonthLength(1448, 9);
  assert.ok(ramadanLength === 29 || ramadanLength === 30);

  const grid = buildHijriMonthGrid({
    hijriYear: 1448,
    hijriMonth: 9,
    hijriAdjustment: 0,
    todayGregorian: { year: 2026, month: 11, day: 19 },
  });

  assert.equal(grid.length, ramadanLength);
  assert.equal(grid[0].hijri.day, 1);
  assert.equal(grid[0].occasion?.nameEn, 'First Day of Ramadan');
  assert.equal(grid[grid.length - 1].hijri.day, ramadanLength);

  assert.equal(getOccasionForHijriDate(10, 1)?.nameAr, 'عيد الفطر المبارك');
  assert.equal(getOccasionForHijriDate(12, 10)?.nameEn, 'Eid al-Adha');
});

test('shiftHijriMonth wraps years cleanly forward and backward', () => {
  assert.deepEqual(shiftHijriMonth(1448, 12, 1), { year: 1449, month: 1 });
  assert.deepEqual(shiftHijriMonth(1448, 1, -1), { year: 1447, month: 12 });
});

test('getUpcomingIslamicOccasions returns strictly sorted future events with non-negative daysUntil', () => {
  const upcoming = getUpcomingIslamicOccasions({ year: 2026, month: 11, day: 19 }, 0, 6);
  assert.equal(upcoming.length, 6);
  for (let i = 0; i < upcoming.length; i++) {
    assert.ok(upcoming[i].daysUntil >= 0);
    if (i > 0) {
      assert.ok(upcoming[i].daysUntil >= upcoming[i - 1].daysUntil);
    }
  }
});

test('Ramadan helpers identify next Ramadan year and last-10 odd nights accurately', () => {
  assert.equal(getNextRamadanYear({ year: 1448, month: 6, day: 10 }), 1448);
  assert.equal(getNextRamadanYear({ year: 1448, month: 9, day: 15 }), 1448);
  assert.equal(getNextRamadanYear({ year: 1448, month: 10, day: 1 }), 1449);

  assert.equal(isRamadanLastTenOddNight(9, 21), true);
  assert.equal(isRamadanLastTenOddNight(9, 27), true);
  assert.equal(isRamadanLastTenOddNight(9, 22), false);
  assert.equal(isRamadanLastTenOddNight(8, 27), false);
});

test('getOrderedWeekdayIndices and getLeadingEmptyCells adapt grid to any First Day of the Week', () => {
  assert.deepEqual(getOrderedWeekdayIndices(6), [6, 0, 1, 2, 3, 4, 5]); // Saturday start
  assert.deepEqual(getOrderedWeekdayIndices(0), [0, 1, 2, 3, 4, 5, 6]); // Sunday start
  assert.deepEqual(getOrderedWeekdayIndices(1), [1, 2, 3, 4, 5, 6, 0]); // Monday start

  // If the 1st of the month is Sunday (0):
  assert.equal(getLeadingEmptyCells(0, 6), 1); // Saturday start -> 1 blank cell before Sunday
  assert.equal(getLeadingEmptyCells(0, 0), 0); // Sunday start -> 0 blank cells
  assert.equal(getLeadingEmptyCells(0, 1), 6); // Monday start -> 6 blank cells before Sunday
});
