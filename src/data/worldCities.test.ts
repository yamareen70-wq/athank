import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDefaultMethodForCountry,
  getWorldDatabaseStats,
  loadStatesForCountry,
  loadWorldCountries,
  searchWorldCities,
} from './worldCities';

test('loadWorldCountries exposes all ~250 countries with Arabic and English names', async () => {
  const countries = await loadWorldCountries();
  assert.ok(countries.length >= 240, `Expected >=240 world countries, got ${countries.length}`);
  assert.ok(countries.some((c) => c.code === 'JP'));
  assert.ok(countries.some((c) => c.code === 'BR'));
  assert.ok(countries.some((c) => c.code === 'JO'));

  const stats = await getWorldDatabaseStats();
  assert.ok(stats.countryCount >= 240);
  assert.ok(stats.cityCount >= 100_000, `Expected >=100k global cities, got ${stats.cityCount}`);
});

test('searchWorldCities finds global cities across all continents and filters by country/state', async () => {
  // Search Tokyo in Japan
  const tokyo = await searchWorldCities({ query: 'Tokyo', countryCode: 'JP', limit: 20 });
  assert.ok(tokyo.cities.some((c) => c.nameEn === 'Tokyo' && c.countryCode === 'JP'));
  assert.equal(tokyo.cities[0].timeZone, 'Asia/Tokyo');

  // Search Berlin globally without selecting a country first
  const berlin = await searchWorldCities({ query: 'Berlin', limit: 20 });
  assert.ok(berlin.cities.some((c) => c.nameEn === 'Berlin' && c.countryCode === 'DE'));

  // Curated Arabic search still works seamlessly
  const amman = await searchWorldCities({ query: 'عمان', countryCode: 'JO', limit: 20 });
  assert.ok(amman.cities.some((c) => c.id === 'amman' && c.defaultMethod === 'jordan'));

  // Country states/provinces load cleanly
  const usStates = await loadStatesForCountry('US');
  assert.ok(usStates.length >= 50);

  assert.equal(getDefaultMethodForCountry('JO'), 'jordan');
  assert.equal(getDefaultMethodForCountry('SA'), 'umm_al_qura');
  assert.equal(getDefaultMethodForCountry('US'), 'isna');
});
