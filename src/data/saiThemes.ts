/**
 * Authentic themes and color palettes extracted directly from Aefyr/SAI
 * Source: https://github.com/Aefyr/SAI
 *   - app/src/main/java/com/aefyr/sai/utils/Theme.java
 *   - app/src/main/res/values/colors.xml
 *   - app/src/main/res/values/styles.xml
 *   - app/src/main/res/values/strings.xml
 */

export type SaiThemeId =
  | 'sai'
  | 'ruby'
  | 'rena'
  | 'ukrrooter'
  | 'amoled'
  | 'pixel'
  | 'sai_fdroid'
  | 'dark'
  | 'gold'
  | 'rena_light'
  | 'mint'
  | 'fdroid_dark';

export interface SaiThemeDefinition {
  id: SaiThemeId;
  saiNumericId: number;
  nameEn: string;
  nameAr: string;
  isDark: boolean;
  /** Exact android:windowBackground / colorPrimary from SAI colors.xml */
  bg: string;
  /** Exact colorPrimaryLight (elevated cards & menus) from SAI colors.xml */
  surface: string;
  /** Secondary well/input background derived from bg/surface */
  surfaceAlt: string;
  /** Subtle divider / card border */
  border: string;
  /** Exact colorAccent from SAI colors.xml */
  accent: string;
  /** Hover variant for solid accent controls */
  accentHover: string;
  /** High-contrast accent text/icon color when rendered on `surface` */
  accentText: string;
  /** High-contrast foreground text color when rendered on solid `accent` */
  accentFg: string;
  /** Translucent accent tint for active badges/rows */
  accentSoft: string;
  /** Exact textColorPrimary from SAI colors.xml */
  textPrimary: string;
  /** Exact textColorSecondary from SAI colors.xml */
  textSecondary: string;
  /** Hero card gradient endpoints harmonious with the SAI theme */
  heroFrom: string;
  heroTo: string;
  /** Header & bottom navigation translucent backgrounds */
  headerBg: string;
  navBg: string;
}

export const SAI_THEMES: SaiThemeDefinition[] = [
  {
    id: 'sai',
    saiNumericId: 0,
    nameEn: 'SAI',
    nameAr: 'SAI (أزرق فاتح)',
    isDark: false,
    bg: '#F4F7FC',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF3FA',
    border: '#DCE5F2',
    accent: '#639EFF',
    accentHover: '#4B8BF5',
    accentText: '#2A67CC',
    accentFg: '#FFFFFF',
    accentSoft: 'rgba(99, 158, 255, 0.14)',
    textPrimary: '#444444',
    textSecondary: '#667085',
    heroFrom: '#2F6FE0',
    heroTo: '#1D4FA8',
    headerBg: 'rgba(255, 255, 255, 0.94)',
    navBg: 'rgba(255, 255, 255, 0.96)',
  },
  {
    id: 'pixel',
    saiNumericId: 5,
    nameEn: 'Pixel',
    nameAr: 'بيكسل (Pixel)',
    isDark: false,
    bg: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EDF2FB',
    border: '#DCE3EE',
    accent: '#448AFF',
    accentHover: '#2979FF',
    accentText: '#1A62E0',
    accentFg: '#FFFFFF',
    accentSoft: 'rgba(68, 138, 255, 0.14)',
    textPrimary: '#222222',
    textSecondary: '#5F6368',
    heroFrom: '#296CE0',
    heroTo: '#1748A8',
    headerBg: 'rgba(255, 255, 255, 0.94)',
    navBg: 'rgba(255, 255, 255, 0.96)',
  },
  {
    id: 'sai_fdroid',
    saiNumericId: 6,
    nameEn: 'SAI (F-Droid)',
    nameAr: 'SAI (إف-درويد)',
    isDark: false,
    bg: '#F4F8EF',
    surface: '#FFFFFF',
    surfaceAlt: '#ECF3E4',
    border: '#D9E5CC',
    accent: '#8BC34A',
    accentHover: '#7CB342',
    accentText: '#4B7719',
    accentFg: '#132404',
    accentSoft: 'rgba(139, 195, 74, 0.18)',
    textPrimary: '#444444',
    textSecondary: '#5F6B54',
    heroFrom: '#4A7B1B',
    heroTo: '#2E520E',
    headerBg: 'rgba(255, 255, 255, 0.94)',
    navBg: 'rgba(255, 255, 255, 0.96)',
  },
  {
    id: 'rena_light',
    saiNumericId: 9,
    nameEn: 'Rena Light',
    nameAr: 'رينا فاتح (Rena Light)',
    isDark: false,
    bg: '#FDF5F7',
    surface: '#FFFFFF',
    surfaceAlt: '#F9EAEF',
    border: '#EED6DE',
    accent: '#E52C5F',
    accentHover: '#C81E4D',
    accentText: '#C51D4B',
    accentFg: '#FFFFFF',
    accentSoft: 'rgba(229, 44, 95, 0.12)',
    textPrimary: '#444444',
    textSecondary: '#6E5B62',
    heroFrom: '#C81E4D',
    heroTo: '#881337',
    headerBg: 'rgba(255, 255, 255, 0.94)',
    navBg: 'rgba(255, 255, 255, 0.96)',
  },
  {
    id: 'ruby',
    saiNumericId: 1,
    nameEn: 'Ruby',
    nameAr: 'روبي (Ruby)',
    isDark: true,
    bg: '#343944',
    surface: '#3A404A',
    surfaceAlt: '#2D323C',
    border: '#4C5361',
    accent: '#FFBCBC',
    accentHover: '#FFA3A3',
    accentText: '#FFBCBC',
    accentFg: '#24181A',
    accentSoft: 'rgba(255, 188, 188, 0.16)',
    textPrimary: '#E5E5E5',
    textSecondary: '#C2C7D0',
    heroFrom: '#473B46',
    heroTo: '#2A2F38',
    headerBg: 'rgba(52, 57, 68, 0.94)',
    navBg: 'rgba(58, 64, 74, 0.96)',
  },
  {
    id: 'rena',
    saiNumericId: 2,
    nameEn: 'Rena',
    nameAr: 'رينا داكن (Rena)',
    isDark: true,
    bg: '#212735',
    surface: '#293042',
    surfaceAlt: '#1B202C',
    border: '#384158',
    accent: '#E52C5F',
    accentHover: '#F03D6E',
    accentText: '#FF6B93',
    accentFg: '#FFFFFF',
    accentSoft: 'rgba(229, 44, 95, 0.2)',
    textPrimary: '#F7F4F4',
    textSecondary: '#C9CACB',
    heroFrom: '#4A1E36',
    heroTo: '#1D2231',
    headerBg: 'rgba(33, 39, 53, 0.94)',
    navBg: 'rgba(41, 48, 66, 0.96)',
  },
  {
    id: 'dark',
    saiNumericId: 7,
    nameEn: 'Dark',
    nameAr: 'داكن (Dark)',
    isDark: true,
    bg: '#131313',
    surface: '#1A1A1A',
    surfaceAlt: '#0E0E0E',
    border: '#2C2C2C',
    accent: '#71AAEB',
    accentHover: '#89BAF0',
    accentText: '#71AAEB',
    accentFg: '#0A1929',
    accentSoft: 'rgba(113, 170, 235, 0.18)',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0E0E0',
    heroFrom: '#1C3552',
    heroTo: '#111924',
    headerBg: 'rgba(19, 19, 19, 0.94)',
    navBg: 'rgba(26, 26, 26, 0.96)',
  },
  {
    id: 'amoled',
    saiNumericId: 4,
    nameEn: 'Amoled',
    nameAr: 'أموليد أسود (Amoled)',
    isDark: true,
    bg: '#000000',
    surface: '#0D0D0D',
    surfaceAlt: '#151515',
    border: '#262626',
    accent: '#FFFFFF',
    accentHover: '#E5E5E5',
    accentText: '#FFFFFF',
    accentFg: '#000000',
    accentSoft: 'rgba(255, 255, 255, 0.14)',
    textPrimary: '#FFFFFF',
    textSecondary: '#CFCFCF',
    heroFrom: '#1B1B1B',
    heroTo: '#050505',
    headerBg: 'rgba(0, 0, 0, 0.95)',
    navBg: 'rgba(13, 13, 13, 0.97)',
  },
  {
    id: 'gold',
    saiNumericId: 8,
    nameEn: 'Gold',
    nameAr: 'ذهبي ملكي (Gold)',
    isDark: true,
    bg: '#000D26',
    surface: '#000F2E',
    surfaceAlt: '#00091C',
    border: '#172B54',
    accent: '#E9B115',
    accentHover: '#F5C02E',
    accentText: '#E9B115',
    accentFg: '#141000',
    accentSoft: 'rgba(233, 177, 21, 0.18)',
    textPrimary: '#E6E6E6',
    textSecondary: '#D9D9D9',
    heroFrom: '#0A2454',
    heroTo: '#000D26',
    headerBg: 'rgba(0, 13, 38, 0.94)',
    navBg: 'rgba(0, 15, 46, 0.96)',
  },
  {
    id: 'mint',
    saiNumericId: 10,
    nameEn: 'Mint',
    nameAr: 'نعناعي (Mint)',
    isDark: true,
    bg: '#141F33',
    surface: '#18243B',
    surfaceAlt: '#0F1829',
    border: '#283857',
    accent: '#86E2B3',
    accentHover: '#9FEBC4',
    accentText: '#86E2B3',
    accentFg: '#0D2118',
    accentSoft: 'rgba(134, 226, 179, 0.16)',
    textPrimary: '#CAD7E0',
    textSecondary: '#B3C3D0',
    heroFrom: '#1B3B45',
    heroTo: '#121D31',
    headerBg: 'rgba(20, 31, 51, 0.94)',
    navBg: 'rgba(24, 36, 59, 0.96)',
  },
  {
    id: 'fdroid_dark',
    saiNumericId: 11,
    nameEn: 'F-Droid Dark',
    nameAr: 'إف-درويد داكن (F-Droid Dark)',
    isDark: true,
    bg: '#1C1D21',
    surface: '#1F2024',
    surfaceAlt: '#15161A',
    border: '#31333B',
    accent: '#8BC34A',
    accentHover: '#9CCC65',
    accentText: '#9CCC65',
    accentFg: '#122105',
    accentSoft: 'rgba(139, 195, 74, 0.18)',
    textPrimary: '#EDEDED',
    textSecondary: '#CCCCCC',
    heroFrom: '#2C421C',
    heroTo: '#191B1F',
    headerBg: 'rgba(28, 29, 33, 0.94)',
    navBg: 'rgba(31, 32, 36, 0.96)',
  },
  {
    id: 'ukrrooter',
    saiNumericId: 3,
    nameEn: 'Ukrrooter',
    nameAr: 'أوكرروتر (Ukrrooter)',
    isDark: true,
    bg: '#9600FF',
    surface: '#7A00D1',
    surfaceAlt: '#6400AB',
    border: '#B84DFF',
    accent: '#00FF00',
    accentHover: '#33FF33',
    accentText: '#00FF00',
    accentFg: '#140024',
    accentSoft: 'rgba(0, 255, 0, 0.18)',
    textPrimary: '#00FF00',
    textSecondary: '#C8FFC8',
    heroFrom: '#5A009C',
    heroTo: '#3D006B',
    headerBg: 'rgba(150, 0, 255, 0.94)',
    navBg: 'rgba(122, 0, 209, 0.96)',
  },
];

export const DEFAULT_LIGHT_SAI_THEME_ID: SaiThemeId = 'sai';
export const DEFAULT_DARK_SAI_THEME_ID: SaiThemeId = 'mint';

export const SAI_THEME_IDS: SaiThemeId[] = SAI_THEMES.map((t) => t.id);

export function isValidSaiThemeId(val: unknown): val is SaiThemeId {
  return typeof val === 'string' && SAI_THEME_IDS.includes(val as SaiThemeId);
}

export function getSaiThemeById(id: SaiThemeId | string | undefined | null): SaiThemeDefinition {
  const found = SAI_THEMES.find((t) => t.id === id);
  return found ?? SAI_THEMES[0];
}

export function applySaiThemeToDocument(theme: SaiThemeDefinition): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-sai-theme', theme.id);
  if (theme.isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  root.style.setProperty('--sai-bg', theme.bg);
  root.style.setProperty('--sai-surface', theme.surface);
  root.style.setProperty('--sai-surface-alt', theme.surfaceAlt);
  root.style.setProperty('--sai-border', theme.border);
  root.style.setProperty('--sai-accent', theme.accent);
  root.style.setProperty('--sai-accent-hover', theme.accentHover);
  root.style.setProperty('--sai-accent-text', theme.accentText);
  root.style.setProperty('--sai-accent-fg', theme.accentFg);
  root.style.setProperty('--sai-accent-soft', theme.accentSoft);
  root.style.setProperty('--sai-text', theme.textPrimary);
  root.style.setProperty('--sai-text-muted', theme.textSecondary);
  root.style.setProperty('--sai-hero-from', theme.heroFrom);
  root.style.setProperty('--sai-hero-to', theme.heroTo);
  root.style.setProperty('--sai-header-bg', theme.headerBg);
  root.style.setProperty('--sai-nav-bg', theme.navBg);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme.isDark ? theme.bg : theme.accent);
  }
}
