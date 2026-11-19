import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DARK_SAI_THEME_ID,
  DEFAULT_LIGHT_SAI_THEME_ID,
  getSaiThemeById,
  isValidSaiThemeId,
  SAI_THEMES,
} from './saiThemes';

describe('Aefyr/SAI Theme Registry', () => {
  it('contains all 12 authentic themes from Aefyr/SAI', () => {
    assert.equal(SAI_THEMES.length, 12);
    const ids = new Set(SAI_THEMES.map((t) => t.id));
    assert.equal(ids.size, 12);
    for (const expected of [
      'sai',
      'ruby',
      'rena',
      'ukrrooter',
      'amoled',
      'pixel',
      'sai_fdroid',
      'dark',
      'gold',
      'rena_light',
      'mint',
      'fdroid_dark',
    ]) {
      assert.ok(ids.has(expected as never), `Missing SAI theme: ${expected}`);
    }
  });

  it('preserves authentic hex color values from Aefyr/SAI colors.xml', () => {
    assert.equal(getSaiThemeById('sai').accent, '#639EFF');
    assert.equal(getSaiThemeById('ruby').bg, '#343944');
    assert.equal(getSaiThemeById('ruby').accent, '#FFBCBC');
    assert.equal(getSaiThemeById('rena').bg, '#212735');
    assert.equal(getSaiThemeById('rena').accent, '#E52C5F');
    assert.equal(getSaiThemeById('amoled').bg, '#000000');
    assert.equal(getSaiThemeById('amoled').accent, '#FFFFFF');
    assert.equal(getSaiThemeById('gold').bg, '#000D26');
    assert.equal(getSaiThemeById('gold').accent, '#E9B115');
    assert.equal(getSaiThemeById('mint').bg, '#141F33');
    assert.equal(getSaiThemeById('mint').accent, '#86E2B3');
    assert.equal(getSaiThemeById('fdroid_dark').bg, '#1C1D21');
    assert.equal(getSaiThemeById('fdroid_dark').accent, '#8BC34A');
    assert.equal(getSaiThemeById('pixel').accent, '#448AFF');
    assert.equal(getSaiThemeById('ukrrooter').bg, '#9600FF');
    assert.equal(getSaiThemeById('ukrrooter').accent, '#00FF00');
  });

  it('validates theme IDs and falls back safely for unknown IDs', () => {
    assert.equal(isValidSaiThemeId(DEFAULT_LIGHT_SAI_THEME_ID), true);
    assert.equal(isValidSaiThemeId(DEFAULT_DARK_SAI_THEME_ID), true);
    assert.equal(isValidSaiThemeId('nonexistent_theme'), false);
    assert.equal(getSaiThemeById('nonexistent_theme').id, 'sai');
  });

  it('provides both light and dark themes with valid hex colors', () => {
    const hexRe = /^#[0-9A-Fa-f]{6}$/;
    const lights = SAI_THEMES.filter((t) => !t.isDark);
    const darks = SAI_THEMES.filter((t) => t.isDark);
    assert.ok(lights.length >= 4);
    assert.ok(darks.length >= 8);
    for (const theme of SAI_THEMES) {
      assert.match(theme.bg, hexRe);
      assert.match(theme.surface, hexRe);
      assert.match(theme.accent, hexRe);
      assert.match(theme.accentFg, hexRe);
      assert.match(theme.textPrimary, hexRe);
    }
  });
});
