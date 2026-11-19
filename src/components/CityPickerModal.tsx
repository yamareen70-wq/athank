import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Globe, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { CITIES, findNearestCity } from '../data/cities';
import {
  getWorldDatabaseStats,
  loadStatesForCountry,
  loadWorldCountries,
  searchWorldCities,
  type WorldCountrySummary,
  type WorldStateSummary,
} from '../data/worldCities';
import type { CityLocation, Language } from '../types/prayer';
import { T } from '../utils/i18n';

interface CityPickerModalProps {
  isOpen: boolean;
  language: Language;
  currentCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  onClose: () => void;
}

const INITIAL_LIMIT = 80;

export function CityPickerModal({
  isOpen,
  language,
  currentCity,
  onSelectCity,
  onClose,
}: CityPickerModalProps) {
  const t = T[language];
  const [query, setQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>(currentCity.countryCode ?? '');
  const [selectedState, setSelectedState] = useState<string>('');
  const [resultLimit, setResultLimit] = useState<number>(INITIAL_LIMIT);

  const [countries, setCountries] = useState<WorldCountrySummary[]>([]);
  const [states, setStates] = useState<WorldStateSummary[]>([]);
  const [cities, setCities] = useState<CityLocation[]>(CITIES);
  const [totalMatched, setTotalMatched] = useState<number>(CITIES.length);
  const [stats, setStats] = useState<{ countryCount: number; cityCount: number } | null>(null);
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showCustomCoords, setShowCustomCoords] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedCountry(currentCity.countryCode ?? '');
    setSelectedState('');
    setResultLimit(INITIAL_LIMIT);
    setGeoError(null);
    setCustomError(null);
    setShowCustomCoords(false);
    const timer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Lazy-load all ~250 countries when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    (async () => {
      try {
        const [worldCountries, dbStats] = await Promise.all([
          loadWorldCountries(),
          getWorldDatabaseStats(),
        ]);
        if (!active) return;
        setCountries(worldCountries);
        setStats(dbStats);
      } catch {
        // Fallback silently to curated cities
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Load states/regions whenever selected country changes
  useEffect(() => {
    if (!isOpen || !selectedCountry) {
      setStates([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const list = await loadStatesForCountry(selectedCountry);
        if (active) setStates(list);
      } catch {
        if (active) setStates([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen, selectedCountry]);

  // Search / filter global cities asynchronously with debouncing for typing
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const delay = query.trim() ? 140 : 0;
    const timer = window.setTimeout(async () => {
      setIsLoadingCities(true);
      try {
        const res = await searchWorldCities({
          query,
          countryCode: query.trim() ? selectedCountry || null : selectedCountry || null,
          stateCode: query.trim() ? null : selectedState || null,
          limit: resultLimit,
        });
        if (active) {
          setCities(res.cities);
          setTotalMatched(res.totalMatched);
        }
      } catch {
        // Keep current list on failure
      } finally {
        if (active) setIsLoadingCities(false);
      }
    }, delay);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, query, selectedCountry, selectedState, resultLimit]);

  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) =>
      language === 'ar'
        ? a.nameAr.localeCompare(b.nameAr, 'ar')
        : a.nameEn.localeCompare(b.nameEn, 'en')
    );
  }, [countries, language]);

  if (!isOpen) return null;

  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    setSelectedState('');
    setResultLimit(INITIAL_LIMIT);
  };

  const handleDetectGPS = () => {
    setGeoError(null);
    if (!('geolocation' in navigator)) {
      setGeoError(
        language === 'ar'
          ? 'المتصفح الحالي لا يدعم تحديد الموقع الجغرافي تلقائياً.'
          : 'Geolocation is not supported by your browser.'
      );
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lng = Number(pos.coords.longitude.toFixed(4));
        const nearest = findNearestCity(lat, lng);
        const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || nearest.timeZone;

        const detectedCity: CityLocation = {
          id: `gps-${lat}-${lng}`,
          nameAr: `موقعي الحالي (${nearest.nameAr})`,
          nameEn: `My Location (${nearest.nameEn})`,
          countryCode: nearest.countryCode,
          countryAr: nearest.countryAr,
          countryEn: nearest.countryEn,
          regionAr: nearest.regionAr,
          regionEn: nearest.regionEn,
          latitude: lat,
          longitude: lng,
          timeZone: userTz,
          defaultMethod: nearest.defaultMethod,
          isCustom: true,
        };
        setGeoLoading(false);
        onSelectCity(detectedCity);
        onClose();
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            language === 'ar'
              ? 'تم رفض إذن الموقع. يمكنك اختيار دولتك ومنطقتك من القائمة أدناه.'
              : 'Location permission denied. Please choose your country and region below.'
          );
        } else {
          setGeoError(
            language === 'ar'
              ? 'تعذر تحديد الموقع حالياً. يرجى اختيار مدينتك يدوياً.'
              : 'Unable to detect location right now. Please select a city manually.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);
    const lat = Number(customLat);
    const lng = Number(customLng);
    if (
      !customLat.trim() ||
      !customLng.trim() ||
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setCustomError(
        language === 'ar'
          ? 'يرجى إدخال خط عرض صحيح (-90 إلى 90) وخط طول صحيح (-180 إلى 180).'
          : 'Please enter a valid latitude (-90 to 90) and longitude (-180 to 180).'
      );
      return;
    }

    const nearest = findNearestCity(lat, lng);
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || nearest.timeZone;
    const label = customName.trim() || (language === 'ar' ? 'موقع مخصص' : 'Custom Location');

    onSelectCity({
      id: `custom-${lat}-${lng}`,
      nameAr: label,
      nameEn: label,
      countryAr: language === 'ar' ? 'إحداثيات مخصصة' : 'Custom Coordinates',
      countryEn: 'Custom Coordinates',
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lng.toFixed(4)),
      timeZone: userTz,
      defaultMethod: nearest.defaultMethod,
      isCustom: true,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="city-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[#E3E7E2] bg-white shadow-xl sm:rounded-2xl dark:border-[#1E2A24] dark:bg-[#121916]">
        <div className="flex items-center justify-between border-b border-[#E8ECE7] px-5 py-4 dark:border-[#1E2A24]">
          <div>
            <h2
              id="city-modal-title"
              className="text-base sm:text-lg font-semibold text-[#121816] dark:text-[#ECF1EE]"
            >
              {t.cityModalTitle}
            </h2>
            {stats && (
              <p
                data-testid="world-cities-stats"
                className="mt-0.5 text-[11px] font-medium text-[#0F5132] dark:text-[#6EE7B7]"
              >
                {t.worldCitiesStats(stats.countryCount, stats.cityCount)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeAlert}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#526058] transition-colors hover:bg-[#F0F2EE] hover:text-[#121816] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] dark:text-[#98A89F] dark:hover:bg-[#1B2520] dark:hover:text-[#ECF1EE]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 border-b border-[#E8ECE7] p-5 dark:border-[#1E2A24]">
          {/* Search Input */}
          <div className="relative">
            <Search
              className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7A71] ${
                language === 'ar' ? 'right-3.5' : 'left-3.5'
              }`}
              aria-hidden="true"
            />
            <label htmlFor="city-search-input" className="sr-only">
              {t.cityModalTitle}
            </label>
            <input
              ref={searchRef}
              id="city-search-input"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setResultLimit(INITIAL_LIMIT);
              }}
              placeholder={t.citySearchPlaceholder}
              className={`h-11 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] text-sm text-[#121816] placeholder:text-[#78877E] focus:border-[#0F5132] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F5132]/20 dark:border-[#25332C] dark:bg-[#0D1310] dark:text-[#ECF1EE] dark:placeholder:text-[#6E8076] dark:focus:border-[#6EE7B7] ${
                language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'
              }`}
            />
          </div>

          {/* All World Countries & States/Regions Drill-down */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="country-filter-select"
                className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5A6960] dark:text-[#8E9F95]"
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {t.selectCountryLabel}
                  {sortedCountries.length > 0 ? ` (${sortedCountries.length})` : ''}
                </span>
              </label>
              <select
                id="country-filter-select"
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] px-3 text-xs sm:text-sm text-[#121816] focus:border-[#0F5132] focus:bg-white focus:outline-none dark:border-[#25332C] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
              >
                <option value="">{t.allCountriesOption}</option>
                {sortedCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag ? `${c.flag} ` : ''}
                    {language === 'ar' ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="region-filter-select"
                className="mb-1 block text-xs font-medium text-[#5A6960] dark:text-[#8E9F95]"
              >
                {t.selectRegionLabel}
                {states.length > 0 ? ` (${states.length})` : ''}
              </label>
              <select
                id="region-filter-select"
                value={selectedState}
                disabled={!selectedCountry || states.length === 0}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setResultLimit(INITIAL_LIMIT);
                }}
                className="h-10 w-full rounded-xl border border-[#DCE1DB] bg-[#F8F9F7] px-3 text-xs sm:text-sm text-[#121816] focus:border-[#0F5132] focus:bg-white focus:outline-none disabled:opacity-50 dark:border-[#25332C] dark:bg-[#0D1310] dark:text-[#ECF1EE]"
              >
                <option value="">{t.allRegionsOption}</option>
                {states.map((st) => (
                  <option key={st.code} value={st.code}>
                    {language === 'ar' ? st.nameAr : st.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GPS & Custom Coords Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={geoLoading}
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg border border-[#0F5132]/25 bg-[#0F5132]/8 px-4 py-2 text-xs sm:text-sm font-medium text-[#0F5132] transition-colors hover:bg-[#0F5132]/15 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] whitespace-nowrap dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/10 dark:text-[#6EE7B7] dark:hover:bg-[#6EE7B7]/20"
            >
              <LocateFixed className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{geoLoading ? t.detectingGPS : t.detectGPS}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomCoords((prev) => !prev)}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#DCE1DB] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#47564E] transition-colors hover:bg-[#F3F5F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] whitespace-nowrap dark:border-[#25332C] dark:text-[#A3B3AA] dark:hover:bg-[#1B2520]"
            >
              {showCustomCoords ? t.hideCoords : t.customCoords}
            </button>
          </div>

          {geoError && (
            <p role="alert" className="text-xs text-[#B91C1C] dark:text-[#FCA5A5]">
              {geoError}
            </p>
          )}

          {showCustomCoords && (
            <form
              onSubmit={handleCustomSubmit}
              className="space-y-3 rounded-xl border border-[#E3E7E2] bg-[#F8F9F7] p-3.5 dark:border-[#223029] dark:bg-[#0D1310]"
            >
              <div>
                <label
                  htmlFor="custom-city-name"
                  className="mb-1 block text-xs font-medium text-[#47564E] dark:text-[#9AA9A1]"
                >
                  {t.customLocationName}
                </label>
                <input
                  id="custom-city-name"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#DCE1DB] bg-white px-3 text-sm text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#25332C] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="custom-lat"
                    className="mb-1 block text-xs font-medium text-[#47564E] dark:text-[#9AA9A1]"
                  >
                    {t.latitudeLabel}
                  </label>
                  <input
                    id="custom-lat"
                    type="number"
                    step="any"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="24.7136"
                    className="h-10 w-full rounded-lg border border-[#DCE1DB] bg-white px-3 font-mono text-sm tabular-nums text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#25332C] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="custom-lng"
                    className="mb-1 block text-xs font-medium text-[#47564E] dark:text-[#9AA9A1]"
                  >
                    {t.longitudeLabel}
                  </label>
                  <input
                    id="custom-lng"
                    type="number"
                    step="any"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    placeholder="46.6753"
                    className="h-10 w-full rounded-lg border border-[#DCE1DB] bg-white px-3 font-mono text-sm tabular-nums text-[#121816] focus:border-[#0F5132] focus:outline-none dark:border-[#25332C] dark:bg-[#141D19] dark:text-[#ECF1EE]"
                  />
                </div>
              </div>
              {customError && (
                <p role="alert" className="text-xs text-[#B91C1C] dark:text-[#FCA5A5]">
                  {customError}
                </p>
              )}
              <button
                type="submit"
                className="h-10 w-full rounded-lg bg-[#0F5132] text-sm font-medium text-white transition-colors hover:bg-[#0B3D25] dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
              >
                {t.applyCoords}
              </button>
            </form>
          )}
        </div>

        {/* Filtered Global City List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#EFF2EE] dark:divide-[#1C2621]">
          {isLoadingCities && cities.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-[#5A6960] dark:text-[#8E9F95]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{t.loadingCitiesLabel}</span>
            </div>
          ) : cities.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-[#47564E] dark:text-[#9AA9A1]">
                {t.noCitiesFound(query)}
              </p>
              <p className="mt-1 text-xs text-[#6B7A71] dark:text-[#7B8B82]">{t.noCitiesHint}</p>
            </div>
          ) : (
            <>
              {cities.map((city) => {
                const isSelected = city.id === currentCity.id;
                const regionText = language === 'ar' ? city.regionAr : city.regionEn;
                const countryText =
                  language === 'ar' ? city.countryAr : (city.countryEn ?? city.countryAr);
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => {
                      onSelectCity(city);
                      onClose();
                    }}
                    className={`flex min-h-[58px] w-full items-center justify-between px-5 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F5132] ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    } ${
                      isSelected
                        ? 'bg-[#0F5132]/8 dark:bg-[#6EE7B7]/10'
                        : 'hover:bg-[#F7F8F6] dark:hover:bg-[#17211C]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MapPin
                        className={`h-4 w-4 shrink-0 ${
                          isSelected
                            ? 'text-[#0F5132] dark:text-[#6EE7B7]'
                            : 'text-[#7B8A81] dark:text-[#6A7B71]'
                        }`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                          {language === 'ar' ? city.nameAr : city.nameEn}
                        </p>
                        <p className="truncate text-xs text-[#64746B] dark:text-[#8E9F95]">
                          {regionText ? `${regionText} · ${countryText}` : countryText}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        dir="ltr"
                        className="font-mono text-xs tabular-nums text-[#78877E] dark:text-[#7D8F85]"
                      >
                        {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                      </span>
                      {isSelected && (
                        <Check
                          className="h-4 w-4 text-[#0F5132] dark:text-[#6EE7B7]"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </button>
                );
              })}

              {totalMatched > cities.length && (
                <div className="flex flex-col items-center gap-2 px-5 py-4 text-center">
                  <p className="text-xs text-[#64746B] dark:text-[#8E9F95]">
                    {t.showingPartialCities(cities.length, totalMatched)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setResultLimit((prev) => prev + 100)}
                    className="min-h-[36px] rounded-lg border border-[#0F5132]/30 bg-[#0F5132]/8 px-4 text-xs font-semibold text-[#0F5132] hover:bg-[#0F5132]/15 dark:border-[#6EE7B7]/30 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]"
                  >
                    {t.loadMoreCities}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
