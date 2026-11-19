import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceToKaabaKm,
  calculateQiblaBearing,
  calculateRelativeTurnDegrees,
  getAlignmentGuidanceAr,
  getArabicCardinalDirection,
  isAlignedToQibla,
} from './qiblaMath';

test('calculates accurate Qibla bearings for major world cities', () => {
  // Riyadh -> WSW (~244.5 deg)
  const riyadh = calculateQiblaBearing(24.7136, 46.6753);
  assert.ok(riyadh >= 243 && riyadh <= 246, `Expected Riyadh bearing ~244.5°, got ${riyadh}`);

  // Cairo -> SE (~136 deg)
  const cairo = calculateQiblaBearing(30.0444, 31.2357);
  assert.ok(cairo >= 134 && cairo <= 138, `Expected Cairo bearing ~136°, got ${cairo}`);

  // New York -> NE (~58.5 deg)
  const ny = calculateQiblaBearing(40.7128, -74.006);
  assert.ok(ny >= 57 && ny <= 60, `Expected New York bearing ~58.5°, got ${ny}`);

  // London -> ESE (~119 deg)
  const london = calculateQiblaBearing(51.5072, -0.1276);
  assert.ok(london >= 117 && london <= 121, `Expected London bearing ~119°, got ${london}`);

  // Jakarta -> WNW (~295 deg)
  const jakarta = calculateQiblaBearing(-6.2088, 106.8456);
  assert.ok(jakarta >= 293 && jakarta <= 297, `Expected Jakarta bearing ~295°, got ${jakarta}`);
});

test('calculates accurate Haversine distance to the Kaaba', () => {
  const riyadhDist = calculateDistanceToKaabaKm(24.7136, 46.6753);
  assert.ok(riyadhDist >= 780 && riyadhDist <= 805, `Expected Riyadh distance ~792km, got ${riyadhDist}`);

  const cairoDist = calculateDistanceToKaabaKm(30.0444, 31.2357);
  assert.ok(cairoDist >= 1270 && cairoDist <= 1300, `Expected Cairo distance ~1285km, got ${cairoDist}`);
});

test('handles 0/360 degree wraparound for Qibla alignment', () => {
  assert.equal(isAlignedToQibla(2, 359, 5), true);
  assert.equal(isAlignedToQibla(358, 1, 5), true);
  assert.equal(isAlignedToQibla(136, 132, 5), true);
  assert.equal(isAlignedToQibla(136, 120, 5), false);

  assert.equal(calculateRelativeTurnDegrees(10, 350), 20);
  assert.equal(calculateRelativeTurnDegrees(350, 10), -20);
});

test('returns localized Arabic guidance and cardinal directions', () => {
  assert.equal(getArabicCardinalDirection(0), 'الشمال');
  assert.equal(getArabicCardinalDirection(136), 'الجنوب الشرقي');
  assert.equal(getArabicCardinalDirection(245), 'الجنوب الغربي');

  const aligned = getAlignmentGuidanceAr(245, 244);
  assert.equal(aligned.aligned, true);
  assert.match(aligned.label, /نحو القبلة/);

  const turnRight = getAlignmentGuidanceAr(150, 120);
  assert.equal(turnRight.aligned, false);
  assert.match(turnRight.label, /يميناً/);

  const turnLeft = getAlignmentGuidanceAr(100, 130);
  assert.equal(turnLeft.aligned, false);
  assert.match(turnLeft.label, /يساراً/);
});
