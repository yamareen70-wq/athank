import type { CalculationMethodId, CityLocation } from '../types/prayer';
import { CITIES, getCountries as getCuratedCountries } from './cities';

export interface WorldCountrySummary {
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  defaultMethod: CalculationMethodId;
  timeZone: string;
}

export interface WorldStateSummary {
  code: string;
  nameAr: string;
  nameEn: string;
}

type CscModule = typeof import('country-state-city');

let cscModulePromise: Promise<CscModule> | null = null;
let cachedCountries: WorldCountrySummary[] | null = null;
let cachedAllCitiesCount = CITIES.length;

const COUNTRY_METHOD_MAP: Record<string, CalculationMethodId> = {
  SA: 'umm_al_qura',
  YE: 'umm_al_qura',
  JO: 'jordan',
  EG: 'egyptian',
  SD: 'egyptian',
  LY: 'egyptian',
  DZ: 'egyptian',
  AE: 'dubai',
  OM: 'dubai',
  KW: 'kuwait',
  QA: 'qatar',
  BH: 'gulf',
  TR: 'turkey',
  US: 'isna',
  CA: 'isna',
  FR: 'uoif',
  IR: 'tehran',
  RU: 'russia',
  SG: 'singapore',
  MY: 'singapore',
  ID: 'singapore',
  BN: 'singapore',
  PK: 'karachi',
  IN: 'karachi',
  BD: 'karachi',
  AF: 'karachi',
};

const CURATED_COUNTRY_AR = new Map<string, string>(
  getCuratedCountries().map((c) => [c.code, c.nameAr])
);

const CURATED_BY_COUNTRY = new Map<string, CityLocation[]>();
for (const city of CITIES) {
  if (!city.countryCode) continue;
  const list = CURATED_BY_COUNTRY.get(city.countryCode) ?? [];
  list.push(city);
  CURATED_BY_COUNTRY.set(city.countryCode, list);
}

let arRegionDisplay: Intl.DisplayNames | null = null;
try {
  if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
    arRegionDisplay = new Intl.DisplayNames(['ar'], { type: 'region' });
  }
} catch {
  arRegionDisplay = null;
}

export function getCountryNameAr(isoCode: string, fallbackEn: string): string {
  const curated = CURATED_COUNTRY_AR.get(isoCode);
  if (curated) return curated;
  try {
    const localized = arRegionDisplay?.of(isoCode);
    if (localized && localized !== isoCode) return localized;
  } catch {
    // Fallback to English name
  }
  return fallbackEn;
}

export function getDefaultMethodForCountry(isoCode: string): CalculationMethodId {
  return COUNTRY_METHOD_MAP[isoCode.toUpperCase()] ?? 'mwl';
}

function pickBestTimeZone(
  timezones: Array<{ zoneName: string; gmtOffset: number }> | undefined,
  lng: number
): string {
  if (!timezones || timezones.length === 0) return 'UTC';
  if (timezones.length === 1) return timezones[0].zoneName;

  const estimatedOffsetSec = (lng / 15) * 3600;
  let best = timezones[0];
  let bestDiff = Math.abs(best.gmtOffset - estimatedOffsetSec);
  for (let i = 1; i < timezones.length; i++) {
    const diff = Math.abs(timezones[i].gmtOffset - estimatedOffsetSec);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = timezones[i];
    }
  }
  return best.zoneName;
}

export async function loadCscModule(): Promise<CscModule> {
  if (!cscModulePromise) {
    cscModulePromise = import('country-state-city');
  }
  return cscModulePromise;
}

/**
 * Loads all ~250 countries in the world with Arabic + English names and flags.
 * Curated Arab/major countries stay cleanly searchable alongside every country globally.
 */
export async function loadWorldCountries(): Promise<WorldCountrySummary[]> {
  if (cachedCountries) return cachedCountries;
  const { Country } = await loadCscModule();
  const raw = Country.getAllCountries();
  const list: WorldCountrySummary[] = raw.map((c) => ({
    code: c.isoCode,
    nameAr: getCountryNameAr(c.isoCode, c.name),
    nameEn: c.name,
    flag: c.flag ?? '',
    defaultMethod: getDefaultMethodForCountry(c.isoCode),
    timeZone: c.timezones?.[0]?.zoneName ?? 'UTC',
  }));
  cachedCountries = list;
  return list;
}

export async function loadStatesForCountry(countryCode: string): Promise<WorldStateSummary[]> {
  if (!countryCode) return [];
  const { State } = await loadCscModule();
  const states = State.getStatesOfCountry(countryCode) ?? [];
  return states
    .map((s) => ({
      code: s.isoCode,
      nameAr: s.name,
      nameEn: s.name,
    }))
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn));
}

function normalizeSearchText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

/**
 * Searches or lists cities across ALL countries in the world (~150,000+ cities),
 * seamlessly prioritizing curated Arabic cities first so Arabic searches work instantly,
 * while also covering every city in every country worldwide.
 */
export async function searchWorldCities(params: {
  query?: string;
  countryCode?: string | null;
  stateCode?: string | null;
  limit?: number;
}): Promise<{ cities: CityLocation[]; totalMatched: number }> {
  const limit = params.limit ?? 80;
  const q = normalizeSearchText(params.query ?? '');
  const countryCode = params.countryCode || null;
  const stateCode = params.stateCode || null;

  const { Country, State, City } = await loadCscModule();

  const results: CityLocation[] = [];
  const seenKeys = new Set<string>();
  let totalMatched = 0;

  // 1. Check curated Arabic-named cities first when no stateCode filter is applied
  if (!stateCode) {
    for (const city of CITIES) {
      if (countryCode && city.countryCode !== countryCode) continue;
      if (q) {
        const matched =
          normalizeSearchText(city.nameAr).includes(q) ||
          city.nameEn.toLowerCase().includes(q) ||
          normalizeSearchText(city.countryAr).includes(q) ||
          (city.countryEn ?? '').toLowerCase().includes(q) ||
          normalizeSearchText(city.regionAr ?? '').includes(q) ||
          (city.regionEn ?? '').toLowerCase().includes(q);
        if (!matched) continue;
      }
      const dedupeKey = `${city.countryCode ?? ''}|${city.nameEn.toLowerCase()}`;
      seenKeys.add(dedupeKey);
      totalMatched += 1;
      if (results.length < limit) {
        results.push(city);
      }
    }
  }

  // Build helper maps for state & country metadata
  const countryLookup = new Map<
    string,
    {
      nameAr: string;
      nameEn: string;
      defaultMethod: CalculationMethodId;
      timezones?: Array<{ zoneName: string; gmtOffset: number }>;
    }
  >();

  const getCountryMeta = (code: string) => {
    let meta = countryLookup.get(code);
    if (!meta) {
      const c = Country.getCountryByCode(code);
      const nameEn = c?.name ?? code;
      meta = {
        nameAr: getCountryNameAr(code, nameEn),
        nameEn,
        defaultMethod: getDefaultMethodForCountry(code),
        timezones: c?.timezones,
      };
      countryLookup.set(code, meta);
    }
    return meta;
  };

  const stateNameCache = new Map<string, string>();
  const getStateName = (cCode: string, sCode: string) => {
    if (!sCode) return '';
    const k = `${cCode}|${sCode}`;
    const cached = stateNameCache.get(k);
    if (cached !== undefined) return cached;
    const st = State.getStateByCodeAndCountry(sCode, cCode);
    const name = st?.name ?? '';
    stateNameCache.set(k, name);
    return name;
  };

  // 2. Pull matching cities from global dataset
  if (countryCode) {
    const rawCities = stateCode
      ? City.getCitiesOfState(countryCode, stateCode) ?? []
      : City.getCitiesOfCountry(countryCode) ?? [];

    // Fallback: some small countries/territories have no separate city list in CSC; expose capital/country center
    if (rawCities.length === 0 && !stateCode) {
      const c = Country.getCountryByCode(countryCode);
      if (c) {
        const lat = Number(c.latitude);
        const lng = Number(c.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          const meta = getCountryMeta(countryCode);
          const key = `${countryCode}|${c.name.toLowerCase()}`;
          if (!seenKeys.has(key)) {
            const matched =
              !q ||
              meta.nameAr.toLowerCase().includes(q) ||
              meta.nameEn.toLowerCase().includes(q);
            if (matched) {
              totalMatched += 1;
              if (results.length < limit) {
                results.push({
                  id: `world-${countryCode}-capital`,
                  nameAr: meta.nameAr,
                  nameEn: meta.nameEn,
                  countryCode,
                  countryAr: meta.nameAr,
                  countryEn: meta.nameEn,
                  latitude: Number(lat.toFixed(4)),
                  longitude: Number(lng.toFixed(4)),
                  timeZone: pickBestTimeZone(meta.timezones, lng),
                  defaultMethod: meta.defaultMethod,
                });
              }
            }
          }
        }
      }
      return { cities: results, totalMatched };
    }

    const meta = getCountryMeta(countryCode);
    const orderedRaw = q
      ? [
          ...rawCities.filter((rc) => rc.name.toLowerCase() === q),
          ...rawCities.filter(
            (rc) => rc.name.toLowerCase() !== q && rc.name.toLowerCase().startsWith(q)
          ),
          ...rawCities.filter((rc) => !rc.name.toLowerCase().startsWith(q)),
        ]
      : rawCities;

    for (const rc of orderedRaw) {
      if (!rc.latitude || !rc.longitude) continue;
      const dedupeKey = `${rc.countryCode}|${rc.name.toLowerCase()}`;
      if (seenKeys.has(dedupeKey)) continue;

      const stateName = getStateName(rc.countryCode, rc.stateCode);
      if (q) {
        const matchCity = rc.name.toLowerCase().includes(q);
        const matchState = stateName.toLowerCase().includes(q);
        const matchCountry =
          normalizeSearchText(meta.nameAr).includes(q) || meta.nameEn.toLowerCase().includes(q);
        if (!matchCity && !matchState && !matchCountry) continue;
      }

      const lat = Number(rc.latitude);
      const lng = Number(rc.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

      seenKeys.add(dedupeKey);
      totalMatched += 1;
      if (results.length < limit) {
        results.push({
          id: `world-${rc.countryCode}-${rc.stateCode || '0'}-${rc.name}`
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-'),
          nameAr: rc.name,
          nameEn: rc.name,
          countryCode: rc.countryCode,
          countryAr: meta.nameAr,
          countryEn: meta.nameEn,
          regionAr: stateName || undefined,
          regionEn: stateName || undefined,
          latitude: Number(lat.toFixed(4)),
          longitude: Number(lng.toFixed(4)),
          timeZone: pickBestTimeZone(meta.timezones, lng),
          defaultMethod: meta.defaultMethod,
        });
      }
    }
    return { cities: results, totalMatched };
  }

  // 3. Global search across all countries when query is entered without a country filter
  if (q.length >= 2) {
    // Also check if query matches any country name (Arabic or English)
    const allCountries = await loadWorldCountries();
    const matchedCountryCodes = new Set<string>(
      allCountries
        .filter(
          (c) =>
            normalizeSearchText(c.nameAr).includes(q) || c.nameEn.toLowerCase().includes(q)
        )
        .map((c) => c.code)
    );

    const allRaw = City.getAllCities();
    cachedAllCitiesCount = allRaw.length;

    // Exact prefix matches first, then substring matches
    const prefixMatches: typeof allRaw = [];
    const subMatches: typeof allRaw = [];

    for (let i = 0; i < allRaw.length; i++) {
      const rc = allRaw[i];
      const lower = rc.name.toLowerCase();
      if (lower.startsWith(q)) {
        prefixMatches.push(rc);
      } else if (lower.includes(q) || matchedCountryCodes.has(rc.countryCode)) {
        subMatches.push(rc);
      }
    }

    const ordered = prefixMatches.concat(subMatches);
    for (let i = 0; i < ordered.length; i++) {
      const rc = ordered[i];
      if (!rc.latitude || !rc.longitude) continue;
      const dedupeKey = `${rc.countryCode}|${rc.name.toLowerCase()}`;
      if (seenKeys.has(dedupeKey)) continue;

      const lat = Number(rc.latitude);
      const lng = Number(rc.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

      seenKeys.add(dedupeKey);
      totalMatched += 1;

      if (results.length < limit) {
        const meta = getCountryMeta(rc.countryCode);
        const stateName = getStateName(rc.countryCode, rc.stateCode);
        results.push({
          id: `world-${rc.countryCode}-${rc.stateCode || '0'}-${rc.name}`
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-'),
          nameAr: rc.name,
          nameEn: rc.name,
          countryCode: rc.countryCode,
          countryAr: meta.nameAr,
          countryEn: meta.nameEn,
          regionAr: stateName || undefined,
          regionEn: stateName || undefined,
          latitude: Number(lat.toFixed(4)),
          longitude: Number(lng.toFixed(4)),
          timeZone: pickBestTimeZone(meta.timezones, lng),
          defaultMethod: meta.defaultMethod,
        });
      }
    }
  }

  return { cities: results, totalMatched };
}

export async function getWorldDatabaseStats(): Promise<{
  countryCount: number;
  cityCount: number;
}> {
  const countries = await loadWorldCountries();
  if (cachedAllCitiesCount <= CITIES.length) {
    const { City } = await loadCscModule();
    cachedAllCitiesCount = City.getAllCities().length;
  }
  return {
    countryCount: countries.length,
    cityCount: cachedAllCitiesCount,
  };
}
