import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Compass, MapPin, Navigation, RotateCcw } from 'lucide-react';
import type { CityLocation, Language } from '../types/prayer';
import {
  calculateDistanceToKaabaKm,
  calculateQiblaBearing,
  getAlignmentGuidance,
  getCardinalDirection,
  normalizeAngle,
} from '../utils/qiblaMath';
import { T } from '../utils/i18n';

interface QiblaCompassViewProps {
  city: CityLocation;
  language: Language;
  onOpenCityPicker: () => void;
}

interface CompassOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

export function QiblaCompassView({ city, language, onOpenCityPicker }: QiblaCompassViewProps) {
  const t = T[language];
  const cityName = language === 'ar' ? city.nameAr : city.nameEn;
  const qiblaBearing = calculateQiblaBearing(city.latitude, city.longitude);
  const distanceKm = Math.round(calculateDistanceToKaabaKm(city.latitude, city.longitude));
  const cardinalLabel = getCardinalDirection(qiblaBearing, language);

  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [sensorActive, setSensorActive] = useState<boolean>(false);
  const [sensorStatusKey, setSensorStatusKey] = useState<
    'default' | 'unsupported' | 'live' | 'denied' | 'requested'
  >('default');

  const handleOrientation = useCallback((event: Event) => {
    const e = event as CompassOrientationEvent;
    let heading: number | null = null;
    if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
      heading = e.webkitCompassHeading;
    } else if (typeof e.alpha === 'number' && !Number.isNaN(e.alpha)) {
      heading = normalizeAngle(360 - e.alpha);
    }

    if (heading !== null) {
      setDeviceHeading(Math.round(normalizeAngle(heading)));
      setSensorActive(true);
      setSensorStatusKey('live');
    }
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [handleOrientation]);

  const enableDeviceCompass = async () => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setSensorStatusKey('unsupported');
      return;
    }

    try {
      const DeviceOrientationCtor = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DeviceOrientationCtor.requestPermission === 'function') {
        const permission = await DeviceOrientationCtor.requestPermission();
        if (permission !== 'granted') {
          setSensorStatusKey('denied');
          return;
        }
      }

      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
      setSensorStatusKey('requested');
    } catch {
      setSensorStatusKey('denied');
    }
  };

  const sensorMessage =
    sensorStatusKey === 'live'
      ? t.sensorLive
      : sensorStatusKey === 'unsupported'
        ? t.sensorUnsupported
        : sensorStatusKey === 'denied'
          ? t.sensorDenied
          : sensorStatusKey === 'requested'
            ? t.sensorRequested
            : t.sensorDefaultMsg;

  const guidance = getAlignmentGuidance(qiblaBearing, deviceHeading, language, 5);
  const dialRotation = -deviceHeading;
  const ticks = Array.from({ length: 36 }, (_, idx) => idx * 10);

  const cardinals =
    language === 'ar'
      ? { n: 'ش', e: 'ق', s: 'ج', w: 'غ' }
      : { n: 'N', e: 'E', s: 'S', w: 'W' };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#121816] dark:text-[#ECF1EE]">
            {t.qiblaTitle}
          </h1>
          <p className="mt-1 text-sm text-[#5A6960] dark:text-[#8E9F95]">
            {t.qiblaSubtitle(cityName)}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCityPicker}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#DCE1DB] bg-white px-4 py-2 text-sm font-medium text-[#121816] transition-colors hover:bg-[#F3F5F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] whitespace-nowrap dark:border-[#24322B] dark:bg-[#121916] dark:text-[#ECF1EE] dark:hover:bg-[#1A241F]"
        >
          <MapPin className="h-4 w-4 text-[#0F5132] dark:text-[#6EE7B7]" aria-hidden="true" />
          <span>{t.changeLocationBtn(cityName)}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <section
          aria-label={t.qiblaTitle}
          className="flex flex-col items-center rounded-2xl border border-[#E3E7E2] bg-white p-6 sm:p-8 lg:col-span-7 dark:border-[#1E2A24] dark:bg-[#121916]"
        >
          <div
            data-testid="qibla-alignment-status"
            data-aligned={guidance.aligned ? 'true' : 'false'}
            className={`mb-6 flex w-full max-w-md items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
              guidance.aligned
                ? 'border-[#0F5132]/30 bg-[#0F5132]/10 text-[#0F5132] dark:border-[#6EE7B7]/35 dark:bg-[#6EE7B7]/12 dark:text-[#6EE7B7]'
                : 'border-[#E3E7E2] bg-[#F8F9F7] text-[#35443C] dark:border-[#24322B] dark:bg-[#0D1310] dark:text-[#C5D1CA]'
            }`}
          >
            {guidance.aligned ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <Navigation className="h-4 w-4 shrink-0 text-[#9A7B3E]" aria-hidden="true" />
            )}
            <span>{guidance.label}</span>
          </div>

          <div className="relative flex items-center justify-center py-2">
            <div
              aria-hidden="true"
              className={`absolute -top-1 z-20 h-4 w-1 rounded-full transition-colors ${
                guidance.aligned ? 'bg-[#0F5132] dark:bg-[#6EE7B7]' : 'bg-[#9A7B3E]'
              }`}
            />

            <div className="relative h-[290px] w-[290px] sm:h-[340px] sm:w-[340px]">
              <svg
                viewBox="0 0 320 320"
                role="img"
                aria-label={`${t.qiblaAngle}: ${Math.round(qiblaBearing)}° ${cardinalLabel}`}
                className="h-full w-full select-none"
              >
                <circle
                  cx="160"
                  cy="160"
                  r="148"
                  className={`fill-[#FAFBF9] transition-colors duration-200 dark:fill-[#0D1411] ${
                    guidance.aligned
                      ? 'stroke-[#0F5132] dark:stroke-[#6EE7B7]'
                      : 'stroke-[#D8DFD8] dark:stroke-[#24332C]'
                  }`}
                  strokeWidth={guidance.aligned ? '3' : '1.5'}
                />
                <circle
                  cx="160"
                  cy="160"
                  r="116"
                  fill="none"
                  className="stroke-[#EAECE8] dark:stroke-[#1E2A24]"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                />

                <g
                  style={{
                    transformOrigin: '160px 160px',
                    transform: `rotate(${dialRotation}deg)`,
                    transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {ticks.map((deg) => {
                    const isMajor = deg % 90 === 0;
                    const isMedium = deg % 30 === 0 && !isMajor;
                    const rOuter = 144;
                    const rInner = isMajor ? 131 : isMedium ? 135 : 139;
                    const rad = ((deg - 90) * Math.PI) / 180;
                    const x1 = 160 + rOuter * Math.cos(rad);
                    const y1 = 160 + rOuter * Math.sin(rad);
                    const x2 = 160 + rInner * Math.cos(rad);
                    const y2 = 160 + rInner * Math.sin(rad);
                    return (
                      <line
                        key={deg}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        strokeWidth={isMajor ? 2 : 1}
                        className={
                          deg === 0
                            ? 'stroke-[#B91C1C] dark:stroke-[#F87171]'
                            : isMajor
                              ? 'stroke-[#47564E] dark:stroke-[#8E9F95]'
                              : 'stroke-[#C3CCC5] dark:stroke-[#304038]'
                        }
                      />
                    );
                  })}

                  <text
                    x="160"
                    y="47"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-[#B91C1C] text-[14px] font-bold dark:fill-[#F87171]"
                  >
                    {cardinals.n}
                  </text>
                  <text
                    x="270"
                    y="160"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-[#526058] text-[14px] font-semibold dark:fill-[#98A89F]"
                  >
                    {cardinals.e}
                  </text>
                  <text
                    x="160"
                    y="271"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-[#526058] text-[14px] font-semibold dark:fill-[#98A89F]"
                  >
                    {cardinals.s}
                  </text>
                  <text
                    x="50"
                    y="160"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-[#526058] text-[14px] font-semibold dark:fill-[#98A89F]"
                  >
                    {cardinals.w}
                  </text>

                  <g
                    style={{
                      transformOrigin: '160px 160px',
                      transform: `rotate(${qiblaBearing}deg)`,
                    }}
                  >
                    <line
                      x1="160"
                      y1="160"
                      x2="160"
                      y2="72"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="stroke-[#0F5132] dark:stroke-[#6EE7B7]"
                    />
                    <polygon
                      points="160,57 152,75 168,75"
                      className="fill-[#0F5132] dark:fill-[#6EE7B7]"
                    />
                    <g transform="translate(149, 29)">
                      <rect
                        x="0"
                        y="0"
                        width="22"
                        height="22"
                        rx="4"
                        className="fill-[#141A17] stroke-[#D9B872]"
                        strokeWidth="1.5"
                      />
                      <line x1="2" y1="6.5" x2="20" y2="6.5" stroke="#D9B872" strokeWidth="2.2" />
                    </g>
                    <line
                      x1="160"
                      y1="160"
                      x2="160"
                      y2="205"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="stroke-[#9A7B3E]/70"
                    />
                  </g>
                </g>

                <circle
                  cx="160"
                  cy="160"
                  r="8"
                  className="fill-white stroke-[#0F5132] dark:fill-[#121916] dark:stroke-[#6EE7B7]"
                  strokeWidth="2.5"
                />
                <circle cx="160" cy="160" r="3" className="fill-[#9A7B3E]" />
              </svg>
            </div>
          </div>

          <div className="mt-6 w-full max-w-md space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="manual-heading-slider"
                  className="font-medium text-[#47564E] dark:text-[#A3B3AA]"
                >
                  {t.manualRotateLabel}
                </label>
                <span className="font-mono font-semibold tabular-nums text-[#121816] dark:text-[#ECF1EE]">
                  {deviceHeading}°
                </span>
              </div>
              <input
                id="manual-heading-slider"
                type="range"
                min={0}
                max={359}
                value={deviceHeading}
                onChange={(e) => {
                  setSensorActive(false);
                  setDeviceHeading(Number(e.target.value));
                }}
                className="h-2 w-full cursor-pointer accent-[#0F5132] dark:accent-[#6EE7B7]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={enableDeviceCompass}
                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F5132] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0B3D25] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] whitespace-nowrap dark:bg-[#196B45] dark:hover:bg-[#1E7E52]"
              >
                <Compass className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{sensorActive ? t.sensorActive : t.enableSensor}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSensorActive(false);
                  setDeviceHeading(Math.round(qiblaBearing));
                }}
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-[#DCE1DB] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#35443C] transition-colors hover:bg-[#F3F5F2] whitespace-nowrap dark:border-[#24322B] dark:text-[#C5D1CA] dark:hover:bg-[#1B2520]"
              >
                <span>{t.alignToQibla}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSensorActive(false);
                  setDeviceHeading(0);
                }}
                aria-label={t.resetNorth}
                className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#DCE1DB] text-[#526058] transition-colors hover:bg-[#F3F5F2] dark:border-[#24322B] dark:text-[#98A89F] dark:hover:bg-[#1B2520]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-center text-xs text-[#64746B] dark:text-[#8E9F95]">{sensorMessage}</p>
          </div>
        </section>

        <aside className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-[#E3E7E2] bg-white p-6 dark:border-[#1E2A24] dark:bg-[#121916]">
            <h2 className="text-base font-bold text-[#121816] dark:text-[#ECF1EE]">
              {t.qiblaDataTitle}
            </h2>

            <dl className="mt-4 divide-y divide-[#EFF2EE] dark:divide-[#1C2621]">
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-[#5A6960] dark:text-[#8E9F95]">{t.qiblaAngle}</dt>
                <dd
                  data-testid="qibla-bearing-value"
                  className="font-mono text-base font-semibold tabular-nums text-[#0F5132] dark:text-[#6EE7B7]"
                >
                  {qiblaBearing.toFixed(1)}°
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-[#5A6960] dark:text-[#8E9F95]">{t.geoDirection}</dt>
                <dd className="text-sm font-semibold text-[#121816] dark:text-[#ECF1EE]">
                  {cardinalLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-[#5A6960] dark:text-[#8E9F95]">{t.distanceLabel}</dt>
                <dd className="font-mono text-sm font-semibold tabular-nums text-[#121816] dark:text-[#ECF1EE]">
                  {distanceKm.toLocaleString('en-US')} {t.km}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-sm text-[#5A6960] dark:text-[#8E9F95]">{t.coordsLabel}</dt>
                <dd
                  dir="ltr"
                  className="font-mono text-xs sm:text-sm tabular-nums text-[#47564E] dark:text-[#A3B3AA]"
                >
                  {city.latitude.toFixed(4)}°, {city.longitude.toFixed(4)}°
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-[#E3E7E2] bg-white p-6 dark:border-[#1E2A24] dark:bg-[#121916]">
            <h2 className="text-base font-bold text-[#121816] dark:text-[#ECF1EE]">
              {t.compassTipsTitle}
            </h2>
            <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-[#4E5E55] dark:text-[#98A89F]">
              {t.compassTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
