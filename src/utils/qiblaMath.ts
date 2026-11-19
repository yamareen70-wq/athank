export const KAABA_COORDS = {
  latitude: 21.422487,
  longitude: 39.826206,
} as const;

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const EARTH_RADIUS_KM = 6371.0088;

export function normalizeAngle(degrees: number): number {
  const mod = degrees % 360;
  return mod < 0 ? mod + 360 : mod;
}

/**
 * Calculates the great-circle initial bearing (azimuth) from the given coordinates
 * to the Kaaba in Makkah, measured clockwise from True North (0° to 360°).
 */
export function calculateQiblaBearing(latitude: number, longitude: number): number {
  const lat1 = latitude * DEG_TO_RAD;
  const lat2 = KAABA_COORDS.latitude * DEG_TO_RAD;
  const deltaLng = (KAABA_COORDS.longitude - longitude) * DEG_TO_RAD;

  const y = Math.sin(deltaLng);
  const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(deltaLng);

  if (Math.abs(x) < 1e-12 && Math.abs(y) < 1e-12) {
    return 0;
  }

  return normalizeAngle(Math.atan2(y, x) * RAD_TO_DEG);
}

/**
 * Calculates great-circle distance in kilometers to the Kaaba using Haversine formula.
 */
export function calculateDistanceToKaabaKm(latitude: number, longitude: number): number {
  const lat1 = latitude * DEG_TO_RAD;
  const lat2 = KAABA_COORDS.latitude * DEG_TO_RAD;
  const dLat = (KAABA_COORDS.latitude - latitude) * DEG_TO_RAD;
  const dLng = (KAABA_COORDS.longitude - longitude) * DEG_TO_RAD;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return EARTH_RADIUS_KM * c;
}

/**
 * Returns the shortest signed angular difference in degrees (-180..+180)
 * needed to turn from current deviceHeading toward qiblaBearing.
 * Positive means turn right (clockwise); negative means turn left (counter-clockwise).
 */
export function calculateRelativeTurnDegrees(
  qiblaBearing: number,
  deviceHeading: number
): number {
  const diff = normalizeAngle(qiblaBearing - deviceHeading);
  return diff > 180 ? diff - 360 : diff;
}

export function isAlignedToQibla(
  qiblaBearing: number,
  deviceHeading: number,
  toleranceDegrees = 5
): boolean {
  return Math.abs(calculateRelativeTurnDegrees(qiblaBearing, deviceHeading)) <= toleranceDegrees;
}

export function getArabicCardinalDirection(degrees: number): string {
  return getCardinalDirection(degrees, 'ar');
}

export function getCardinalDirection(degrees: number, lang: 'ar' | 'en' = 'ar'): string {
  const angle = normalizeAngle(degrees);
  const directionsAr = [
    'الشمال',
    'الشمال الشرقي',
    'الشرق',
    'الجنوب الشرقي',
    'الجنوب',
    'الجنوب الغربي',
    'الغرب',
    'الشمال الغربي',
  ];
  const directionsEn = [
    'North',
    'Northeast',
    'East',
    'Southeast',
    'South',
    'Southwest',
    'West',
    'Northwest',
  ];
  const index = Math.round(angle / 45) % 8;
  return lang === 'ar' ? directionsAr[index] : directionsEn[index];
}

export function getAlignmentGuidanceAr(
  qiblaBearing: number,
  deviceHeading: number,
  toleranceDegrees = 5
): { aligned: boolean; label: string; deltaDegrees: number } {
  return getAlignmentGuidance(qiblaBearing, deviceHeading, 'ar', toleranceDegrees);
}

export function getAlignmentGuidance(
  qiblaBearing: number,
  deviceHeading: number,
  lang: 'ar' | 'en' = 'ar',
  toleranceDegrees = 5
): { aligned: boolean; label: string; deltaDegrees: number } {
  const delta = calculateRelativeTurnDegrees(qiblaBearing, deviceHeading);
  const absDelta = Math.round(Math.abs(delta));

  if (Math.abs(delta) <= toleranceDegrees) {
    return {
      aligned: true,
      label: lang === 'ar' ? 'أنت متجه نحو القبلة بدقة' : 'Aligned accurately toward Qibla',
      deltaDegrees: 0,
    };
  }

  if (delta > 0) {
    return {
      aligned: false,
      label:
        lang === 'ar' ? `استدر يميناً بمقدار ${absDelta}°` : `Turn right by ${absDelta}°`,
      deltaDegrees: delta,
    };
  }

  return {
    aligned: false,
    label:
      lang === 'ar' ? `استدر يساراً بمقدار ${absDelta}°` : `Turn left by ${absDelta}°`,
    deltaDegrees: delta,
  };
}
